import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadModel,headings} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {catalog,chapters}=await loadModel(edition);
const ledger=JSON.parse(await fs.readFile(path.join(edition,'learning-revision-migration.json'),'utf8'));
const errors=[];
if(catalog.version!=='1.0'||catalog.artifacts.pdf!=='output/pdf/Cpp-Reference-Handbook-v1.0.pdf')errors.push('Release version/artifacts differ');
if(ledger.sections!==35||ledger.originalTopics!==478||ledger.mappings.length!==478)errors.push('Original coverage count differs');
const keys=ledger.mappings.map(m=>m.sourceId+'|'+m.oldLevel+'|'+m.oldHeading);
if(new Set(keys).size!==keys.length)errors.push('Duplicate original topic');
for(const row of ledger.mappings){
 if(!row.reason||!row.action||!row.targets.length)errors.push('Incomplete old topic '+row.sourceId+' '+row.oldHeading);
 for(const target of row.targets)if(!chapters.find(c=>c.id===target.chapter)?.headings.some(h=>h.title===target.heading))errors.push('Missing topic destination '+JSON.stringify(target));
}
const orders=[['R01','R02','R03','R04','R06','R05'],['R07','R09','R08','R10','R11'],['R12','R13','R15','R16','R14','R17','R18','R33','R19','R34','R35']];
for(const [i,order] of orders.entries())if(JSON.stringify(chapters.filter(c=>c.chapterNumber===i+1).map(c=>c.id))!==JSON.stringify(order))errors.push('Learning order differs: chapter '+(i+1));
const before=(id,a,b)=>{const hs=chapters.find(c=>c.id===id).headings.map(h=>h.title);if(hs.indexOf(a)<0||hs.indexOf(b)<0||hs.indexOf(a)>=hs.indexOf(b))errors.push('Learning dependency differs: '+id+' '+a+' -> '+b);};
before('R07','构造函数与成员初始化','析构函数');
before('R07','构造函数与成员初始化','运算符重载与 friend');
before('R07','组合与继承','构造与销毁顺序');
before('R09','unique_ptr 构造与访问','切片、克隆与外部表示');
before('R09','unique_ptr 转移、reset 与 release','拥有资源的 lambda 捕获');
before('R09','unique_ptr 数组与删除器','资源拥有者作为成员');
before('R10','函数模板','转发引用与引用折叠');
before('R10','constexpr、consteval 与 constinit','模板参数类别');
before('R10','decltype 与 decltype(auto) 的完整推导','std::forward');
before('R10','std::move 的声明形状','std::forward');
before('R10','参数包与折叠表达式','std::invoke 的成员指针与转发接口');
before('R11','异常安全保证','noexcept 与 move_if_noexcept');
before('R13','迭代器、begin 与 end','vector 的区间构造与拷贝构造');
before('R13','vector 的失效与异常保证','暂存与强保证提交');
before('R17','std::tuple','结构化绑定');
// The live local baseline is optional after a fresh checkout; the tracked topic
// ledger is sufficient for rebuilding. When present, verify immutable examples,
// old diagram availability, and preservation of all source-label/URL pairs.
let baselineCompared=false,examples=0,sourcePairs=0;
const baselinePath=path.join(edition,'qa/learning-revision/baseline/inventory.json');
const baseline=await fs.readFile(baselinePath,'utf8').then(JSON.parse).catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
if(baseline){
 baselineCompared=true;
 for(const file of baseline.files.filter(f=>f.path.startsWith('examples/'))){
  const bytes=await fs.readFile(path.join(edition,file.path));examples++;
  if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)errors.push('Companion example changed: '+file.path);
 }
 const references=new Set();
 for(const c of chapters){const doc=JSON.parse(await fs.readFile(path.join(edition,'sources',c.id+'.references.json'),'utf8'));for(const r of doc.references)references.add(r.label+'|'+r.url);}
 for(const file of baseline.files.filter(f=>/^sources\/R\d+\.references\.json$/.test(f.path))){
  const doc=JSON.parse(await fs.readFile(path.join(edition,'qa/learning-revision/baseline/files',file.path),'utf8'));
  for(const r of doc.references){sourcePairs++;if(!references.has(r.label+'|'+r.url))errors.push('Original source record lost: '+r.label+' '+r.url);}
 }
 for(const c of baseline.chapters)for(const figure of c.figures||[]){
  const ref=figure.match(/\]\(([^)]+)\)/)?.[1]||figure;
  const resource=path.resolve(edition,'chapters',ref);await fs.access(resource);
  if(!chapters.some(c=>c.text.includes(ref)))errors.push('Original diagram no longer referenced: '+ref);
 }
}
const report={version:catalog.version,chapters:catalog.chapterCount,sections:chapters.length,originalTopics:ledger.mappings.length,
 splitTopics:ledger.mappings.filter(m=>m.targets.length>1).length,movedTopics:ledger.mappings.filter(m=>m.action==='迁移').length,
 currentTopics:chapters.reduce((n,c)=>n+c.headings.filter(h=>h.level>1).length,0),baselineCompared,immutableExamples:examples,originalSourceRecords:sourcePairs,errors,
 execution:'Static Markdown, JSON, SVG and source-file reads only; no C++ compilation or execution.'};
const qa=path.join(edition,'qa/learning-revision');await fs.mkdir(qa,{recursive:true});await fs.writeFile(path.join(qa,'revision-check.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
