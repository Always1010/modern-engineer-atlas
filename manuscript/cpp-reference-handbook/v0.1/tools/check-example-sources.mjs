import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const chapters=await fs.readdir(path.join(edition,'chapters'));
const examples=(await fs.readdir(path.join(edition,'examples'))).filter(f=>f.endsWith('.cpp')).sort();
const normalize=s=>s.replaceAll('\r','').trimEnd()+'\n';
const results=[];
for(const example of examples) {
 const id=example.slice(0,3).toUpperCase();
 const chapter=chapters.find(f=>f.startsWith(id+'-'));
 if(!chapter)throw new Error('No chapter for '+example);
 const source=normalize(await fs.readFile(path.join(edition,'examples',example),'utf8'));
 const markdown=normalize(await fs.readFile(path.join(edition,'chapters',chapter),'utf8'));
 const blocks=[...markdown.matchAll(/\x60\x60\x60cpp\n([\s\S]*?)\x60\x60\x60/g)].map(m=>normalize(m[1]));
 if(id==='R13') {
  const regions=[...source.matchAll(/\/\/ BEGIN (.*?)\n([\s\S]*?)\/\/ END \1/g)];
  if(regions.length!==8)throw new Error('Expected 8 R13 snippet regions.');
  for(const [,label,code] of regions) {
   if(!blocks.some(block=>normalize(code.replace(/^ {4}/gm,''))===block))throw new Error('R13 snippet differs: '+label);
  }
  results.push({chapter:id,source:example,sha256:createHash('sha256').update(source).digest('hex'),matchedSnippetRegions:regions.length});
 } else {
  if(blocks.filter(block=>block===source).length!==1)throw new Error('Source differs from chapter: '+example);
  results.push({chapter:id,source:example,sha256:createHash('sha256').update(source).digest('hex'),matchedCompletePrograms:1});
 }
}
const buildChapter=normalize(await fs.readFile(path.join(edition,'chapters',chapters.find(f=>f.startsWith('R30-'))),'utf8'));
const buildBlocks=[...buildChapter.matchAll(/\x60\x60\x60(?:cpp|cmake)\n([\s\S]*?)\x60\x60\x60/g)].map(m=>normalize(m[1]));
for(const file of ['metric.h','metric.cpp','main.cpp','CMakeLists.txt']) {
 const code=normalize(await fs.readFile(path.join(edition,'examples/r30-project',file),'utf8'));
 if(!buildBlocks.includes(code))throw new Error('R30 project differs: '+file);
}
const excerpts=[];
for (const chapter of chapters) {
 const markdown=normalize(await fs.readFile(path.join(edition,'chapters',chapter),'utf8'));
 for (const match of markdown.matchAll(/<!-- source: (examples\/[\w./-]+) -->\s*\x60\x60\x60(?:cpp|cmake)\n([\s\S]*?)\x60\x60\x60/g)) {
  const target=path.resolve(edition,match[1]);
  if (!target.startsWith(path.join(edition,'examples')+path.sep)) throw new Error('Source excerpt escapes examples.');
  const source=normalize(await fs.readFile(target,'utf8'));
  if (!source.includes(normalize(match[2]))) throw new Error('Source excerpt differs: '+match[1]);
  excerpts.push({chapter:chapter.slice(0,3),source:match[1],sha256:createHash('sha256').update(source).digest('hex')});
 }
}
const projects=[];
for (const item of await fs.readdir(path.join(edition,'examples'),{withFileTypes:true})) {
 if (!item.isDirectory()) continue;
 const folder=path.join(edition,'examples',item.name);
 const names=await fs.readdir(folder);
 if (!names.includes('CMakeLists.txt')) continue;
 const files=[];
 for (const name of names.filter(name=>name==='CMakeLists.txt'||/\.(cpp|h|hpp)$/.test(name)).sort()) {
  const source=normalize(await fs.readFile(path.join(folder,name),'utf8'));
  files.push({name,sha256:createHash('sha256').update(source).digest('hex')});
 }
 projects.push({source:'examples/'+item.name,files,
  correspondence:item.name==='r30-project'?'complete-markdown-blocks':'marked-interface-excerpt',
  execution:'Recorded separately in BUILD-NOTES; this checker does not run programs.'});
}
const report={standalonePrograms:results.length,multiFileProjects:projects.length,projects,results,excerpts};
const qa=path.join(edition,'qa/fullbook');
await fs.mkdir(qa,{recursive:true});
await fs.writeFile(path.join(qa,'source-example-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
