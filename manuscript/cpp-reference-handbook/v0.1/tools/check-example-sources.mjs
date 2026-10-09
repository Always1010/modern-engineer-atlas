import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=(await fs.readdir(path.join(edition,'chapters'))).filter(f=>f.endsWith('.md'));
const documents=await Promise.all(files.map(async file=>({file,text:(await fs.readFile(path.join(edition,'chapters',file),'utf8')).replaceAll('\r','')})));
const normalize=s=>s.replaceAll('\r','').trim()+'\n';
const results=[],excerpts=[];
for(const doc of documents){
 for(const m of doc.text.matchAll(/<!-- source: (examples\/[\w./-]+) -->\s*```(?:cpp|cmake)\n([\s\S]*?)```/g)){
  const target=path.resolve(edition,m[1]);
  if(!target.startsWith(path.join(edition,'examples')+path.sep))throw new Error('Excerpt escapes examples');
  const source=normalize(await fs.readFile(target,'utf8'));
  if(!source.includes(normalize(m[2])))throw new Error('Source excerpt differs: '+doc.file+' => '+m[1]);
  excerpts.push({chapter:doc.file,source:m[1]});
 }
}
for(const file of (await fs.readdir(path.join(edition,'examples'))).filter(f=>f.endsWith('.cpp'))){
 const source=normalize(await fs.readFile(path.join(edition,'examples',file),'utf8'));
 const linked=documents.filter(d=>d.text.includes('../examples/'+file));
 if(!linked.length)throw new Error('Unreferenced standalone example: '+file);
 const full=linked.some(d=>[...d.text.matchAll(/```cpp\n([\s\S]*?)```/g)].some(m=>normalize(m[1])===source));
 results.push({source:file,chapters:linked.map(d=>d.file),correspondence:full?'complete-block':'linked-companion-source'});
}
const projects=[];
for(const item of await fs.readdir(path.join(edition,'examples'),{withFileTypes:true})){
 if(!item.isDirectory())continue;const names=await fs.readdir(path.join(edition,'examples',item.name));
 if(!names.includes('CMakeLists.txt'))continue;
 if(!documents.some(d=>d.text.includes('../examples/'+item.name+'/')))throw new Error('Unreferenced project: '+item.name);
 projects.push(item.name);
}
const report={standalonePrograms:results.length,projects,excerpts,results,execution:'This checker validates references and marked excerpts; it does not compile or run programs.'};
await fs.mkdir(path.join(edition,'qa/fullbook'),{recursive:true});
await fs.writeFile(path.join(edition,'qa/fullbook/source-example-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({standalonePrograms:results.length,projects:projects.length,excerpts:excerpts.length}));
