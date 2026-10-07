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
 const markdown=await fs.readFile(path.join(edition,'chapters',chapter),'utf8');
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
const chapter28=await fs.readFile(path.join(edition,'chapters',chapters.find(f=>f.startsWith('R28-'))),'utf8');
const blocks28=[...chapter28.matchAll(/\x60\x60\x60(?:cpp|cmake)\n([\s\S]*?)\x60\x60\x60/g)].map(m=>normalize(m[1]));
for(const file of ['metric.h','metric.cpp','main.cpp','CMakeLists.txt']) {
 const code=normalize(await fs.readFile(path.join(edition,'examples/r28-project',file),'utf8'));
 if(!blocks28.includes(code))throw new Error('R28 project differs: '+file);
}
const report={standalonePrograms:results.length,multiFileProject:1,filesInProject:4,results};
const qa=path.join(edition,'qa/fullbook');
await fs.mkdir(qa,{recursive:true});
await fs.writeFile(path.join(qa,'source-example-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
