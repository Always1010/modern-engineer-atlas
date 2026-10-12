// Editorial/static checks only: no C++ compiler or example execution.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadModel,headings} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {catalog,groups,chapters}=await loadModel(edition);
const baselineArg=process.argv.find(a=>a.startsWith('--baseline='));
const baseline=baselineArg?JSON.parse(await fs.readFile(path.resolve(edition,baselineArg.slice(11)),'utf8')):null;
const normalize=s=>s.replaceAll('\r','');
const fences=s=>[...normalize(s).matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)].map(m=>m[0]);
const figures=s=>[...s.matchAll(/!\[[^\]]*\]\([^)]+\)/g)].map(m=>m[0]);
const errors=[],emphasis=[],references=[];
for(const c of chapters){
 const text=normalize(c.text),outside=text.replace(/^```[^\n]*\n[\s\S]*?^```/gm,'');
 if(/基础操作|机制解释|进阶后查/.test(outside))errors.push(c.id+': obsolete content label');
 if(/^\s*(?:\*\*)?(?:独立片段|声明摘要|承接上文|执行路径示意)(?:\*\*)?[。.:：]?\s*$/m.test(outside))errors.push(c.id+': obsolete code label');
 for(const m of outside.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)){
  if(!(catalog.readingLinks||[]).some(r=>r.chapter===c.id&&r.label===m[1]&&r.url===m[2]&&r.purpose))errors.push(c.id+': unapproved external reference in reading text');
 }
 let row=0;
 for(const line of outside.split('\n')){
  if(line.startsWith('|')){row++;if(row>2&&line.includes('**'))errors.push(c.id+': bold table body');}
  else row=0;
 }
 let heading='';
 for(const line of outside.split('\n')){
  if(/^#{1,3} /.test(line))heading=line.replace(/^#+ /,'');
  if(!line.startsWith('|'))for(const m of line.matchAll(/\*\*([^*]+)\*\*/g))emphasis.push({chapter:c.id,heading,text:m[1],context:line});
 }
 const ledger=JSON.parse(await fs.readFile(path.join(edition,'sources',c.id+'.references.json'),'utf8'));
 if(ledger.chapter!==c.id||ledger.source!==c.source)errors.push(c.id+': reference source identity mismatch');
 const names=new Set(headings(text,c.id).map(h=>h.title));
 for(const r of ledger.references){if(!names.has(r.heading)||!/^https?:\/\//.test(r.url))errors.push(c.id+': invalid reference record');}
 references.push({chapter:c.id,count:ledger.references.length});
 if(baseline){
  const old=baseline.chapters.find(b=>b.file===c.source);
  if(!old)throw new Error('Missing baseline: '+c.id);
  if(JSON.stringify(fences(text))!==JSON.stringify(old.fences.map(normalize)))errors.push(c.id+': code fence changed');
  if(JSON.stringify([...text.matchAll(/^#{1,3} .+/gm)].map(m=>m[0]))!==JSON.stringify(old.headings))errors.push(c.id+': heading changed');
  if(JSON.stringify(figures(text))!==JSON.stringify(old.figures))errors.push(c.id+': figure reference changed');
  const original=old.externalLinks.map(([label,url])=>label+'\u0000'+url).sort();
  const retained=ledger.references.map(r=>r.label+'\u0000'+r.url).sort();
  if(JSON.stringify(original)!==JSON.stringify(retained))errors.push(c.id+': source references missing or changed');
 }
}
if(catalog.chapterCount!==groups.length||catalog.sectionCount!==chapters.length)errors.push('catalog hierarchy counts differ');
const qa=path.join(edition,process.argv.find(a=>a.startsWith('--qa='))?.slice(5)||'qa/learning-revision');await fs.mkdir(qa,{recursive:true});
await fs.writeFile(path.join(qa,'emphasis-inventory.json'),JSON.stringify(emphasis,null,2));
const report={chapters:groups.length,sections:chapters.length,topics:chapters.reduce((n,c)=>n+c.headings.filter(h=>h.level===2).length,0),
 codeBlocks:chapters.reduce((n,c)=>n+fences(c.text).length,0),referenceCount:references.reduce((n,c)=>n+c.count,0),
 emphasisCount:emphasis.length,baselineCompared:Boolean(baseline),errors};
await fs.writeFile(path.join(qa,'style-check.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
