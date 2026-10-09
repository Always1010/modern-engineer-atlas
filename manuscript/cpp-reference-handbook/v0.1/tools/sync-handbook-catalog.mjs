import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {headings,plain} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalogPath=path.join(edition,'catalog.json');
const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8'));
const files=(await fs.readdir(path.join(edition,'chapters'))).filter(f=>/^R\d\d-.*\.zh-CN\.md$/.test(f));
const splits=[['R18','R33','数值、随机数与位工具'],['R19','R34','流与文件读写'],['R34','R35','文件系统']];
for(const [after,id,title] of splits){
 if(catalog.parts.some(p=>p.chapters.some(c=>c.id===id)))continue;
 const source=files.find(f=>f.startsWith(id+'-'));if(!source)throw new Error('Missing split source: '+id);
 const part=catalog.parts.find(p=>p.chapters.some(c=>c.id===after));
 part.chapters.splice(part.chapters.findIndex(c=>c.id===after)+1,0,{id,title,source:'chapters/'+source,reading:'LOOKUP'});
}
let number=0;
for(const part of catalog.parts)for(const c of part.chapters){
 const file=files.find(f=>f.startsWith(c.id+'-'));if(!file)throw new Error('Missing source: '+c.id);
 c.source='chapters/'+file;const text=await fs.readFile(path.join(edition,c.source),'utf8');const hs=headings(text,c.id);
 if(hs.filter(h=>h.level===1).length!==1)throw new Error('Exactly one H1 required: '+file);
 c.title=plain(hs[0].title).replace(/^第\d+章\s*/, '');c.number=++number;
 delete c.sections;delete c.entries;delete c.subentries;
 c.anchors=hs.filter(h=>h.level>1).map(({level,title,anchor})=>({level,title,anchor}));
}
catalog.chapterCount=number;catalog.status='object-reference-revision';catalog.revisionDate='2026-10-09';
catalog.languageBaseline=['C++17'];catalog.extensionVersions=['C++20','C++23'];delete catalog.approvedSampleChapter;
const migrationArgument=process.argv.find(a=>a.startsWith('--migration='));
if(migrationArgument){
 const baseline=JSON.parse(await fs.readFile(path.join(edition,'qa/restructure/baseline.json'),'utf8'));
 const migrated=[];
 for(const name of migrationArgument.slice(12).split(',')){
  const ledger=JSON.parse(await fs.readFile(path.resolve(edition,name),'utf8'));migrated.push(...ledger.chapters);
 }
 if(migrated.length!==32||new Set(migrated.map(c=>c.id)).size!==32)throw new Error('Expected all 32 source migrations');
 for(const c of baseline.chapters){
  const m=migrated.find(m=>m.id===c.id);
  if(JSON.stringify(m.sections.map(s=>s.oldHeading).sort())!==JSON.stringify(c.sections.slice().sort()))throw new Error('Source sections omitted: '+c.id);
  if(JSON.stringify(m.tables.map(t=>t.index).sort((a,b)=>a-b))!==JSON.stringify(c.tables.map((_,i)=>i+1)))throw new Error('Source tables omitted: '+c.id);
 }
 const oldResources=[...new Set(baseline.chapters.flatMap(c=>c.figures).map(f=>path.posix.normalize('chapters/'+f)))].sort();
 const newResources=new Set();
 for(const c of catalog.parts.flatMap(p=>p.chapters)){
  const text=await fs.readFile(path.join(edition,c.source),'utf8');
  for(const match of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g))newResources.add(path.posix.normalize('chapters/'+match[1]));
 }
 catalog.provenance={baselineCommit:baseline.baseline,chapters:migrated.sort((a,b)=>a.id.localeCompare(b.id)),
  resources:oldResources.map(source=>({source,action:newResources.has(source)?'保留或修订':'删除',reason:newResources.has(source)?'仍由当前正文引用；图内容以对应机制为准':'不再适用于当前条目，清理无引用图源'}))};
}
await fs.writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
let toc='# 正文目录\n\n目录由 catalog 与实际标题同步，章序按阅读顺序排列；R 编号用于来源追踪。\n';
for(const p of catalog.parts){toc+='\n## '+p.title+'\n\n';for(const c of p.chapters){toc+='### 第'+c.number+'章 '+c.title+'\n\n';for(const h of c.anchors.filter(h=>h.level===2))toc+='- ['+h.title+']('+c.source+'#'+h.anchor+')\n';}}
toc+='\n- [使用指南](reading-guide.zh-CN.md)\n- [附录与索引](appendices.zh-CN.md)\n';
await fs.writeFile(path.join(edition,'TOC.md'),toc);
console.log(JSON.stringify({chapters:number,entries:catalog.parts.flatMap(p=>p.chapters).reduce((n,c)=>n+c.anchors.filter(h=>h.level===2).length,0)}));
