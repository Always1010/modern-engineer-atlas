import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadModel,headings,resolveFragment} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {catalog,chapters}=await loadModel(edition);
const selectedArgs=process.argv.filter(a=>a.startsWith('--chapters=')||a.startsWith('--documents='));
const selection=selectedArgs.length?selectedArgs.flatMap(a=>a.slice(a.indexOf('=')+1).split(',')):null;
const files=new Map(chapters.map(c=>[path.resolve(edition,c.source),c]));
for(const [name,id] of [['reading-guide.zh-CN.md','reading-guide'],['appendices.zh-CN.md','appendices'],['TOC.md','toc']]){
 const text=await fs.readFile(path.join(edition,name),'utf8');files.set(path.resolve(edition,name),{id,source:name,text,headings:headings(text,id)});
}
for(const name of ['README.md','BUILD-NOTES.md','SAMPLE-NOTES.md','REVIEW-REPORT.zh-CN.md','EDITORIAL-SPEC.md']){
 const text=await fs.readFile(path.join(edition,name),'utf8');files.set(path.resolve(edition,name),{id:name,source:name,text,headings:headings(text,name)});
}
if(selection?.some(id=>![...files.values()].some(model=>model.id===id)))throw new Error('Unknown selected document');
let localLinks=0,tables=0;
for(const [file,model] of files){
 if(selection&&!selection.includes(model.id))continue;
 const hs=model.headings;
 if(hs.filter(h=>h.level===1).length!==1)throw new Error('Expected one H1: '+model.source);
 if(!selection&&model.number&&JSON.stringify(model.anchors)!==JSON.stringify(hs.filter(h=>h.level>1).map(({level,title,anchor})=>({level,title,anchor}))))throw new Error('Catalog headings differ: '+model.source);
 const prose=model.text.replace(/```[\s\S]*?```/g,'').replace(/`[^`\n]*`/g,'');
 for(const match of prose.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)\)/g)){
  const link=match[1].replace(/^<|>$/g,'');if(/^(https?:|mailto:)/.test(link))continue;
  const [relative,fragment]=link.split('#'),target=relative?path.resolve(path.dirname(file),decodeURIComponent(relative)):file;
  // Generated reading artifacts are optional in a fresh source checkout.
  if(target.startsWith(path.join(edition,'output')+path.sep)&&!process.argv.includes('--artifacts'))continue;
  await fs.access(target);if(files.has(target))resolveFragment(files.get(target),fragment);localLinks++;
 }
 let fenced=false,columns=0;
 for(const line of model.text.replaceAll('\r','').split('\n')){
  if(/^```/.test(line)){fenced=!fenced;columns=0;continue;}if(fenced)continue;
  if(line.startsWith('|')){const count=line.split(/(?<!\\)\|/).length-2;if(!columns){columns=count;tables++;}else if(count!==columns)throw new Error('Table column mismatch: '+model.source+' => '+line);}
  else columns=0;
 }
}
const migration=catalog.provenance;
if(migration&&!selection){
 const sourceIds=migration.chapters.map(c=>c.id);
 if(sourceIds.length!==32||new Set(sourceIds).size!==32)throw new Error('Expected 32 source chapter mappings');
 let sectionCount=0,tableCount=0;
 for(const c of migration.chapters){sectionCount+=c.sections.length;tableCount+=c.tables.length;
  for(const item of [...c.sections,...c.tables]){
   if(!item.reason||!item.action||!item.targets?.length)throw new Error('Incomplete migration: '+c.id);
   for(const t of item.targets){const destination=chapters.find(c=>c.id===t.chapter);if(!destination||!destination.headings.some(h=>h.title===t.heading))throw new Error('Invalid migration target: '+c.id+' => '+JSON.stringify(t));}
  }
 }
 if(sectionCount!==183||tableCount!==87)throw new Error('Source mapping count mismatch');
 console.log(JSON.stringify({sourceChapters:sourceIds.length,mappedSections:sectionCount,mappedTables:tableCount}));
}
const checked=selection?chapters.filter(c=>selection.includes(c.id)):chapters;
console.log(JSON.stringify({chapters:checked.length,entries:checked.reduce((n,c)=>n+c.headings.filter(h=>h.level===2).length,0),localLinks,tables,execution:'Static documents, metadata and references only; no C++ programs are compiled or run.'}));
