import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {loadModel,headings,resolveFragment} from './document-model.mjs';

const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [packageRoot,executablePath,...options]=process.argv.slice(2);
const selection=options.find(a=>a.startsWith('--chapters='));
const python=options.find(a=>a.startsWith('--python='))?.slice(9)||'python';
if(options.some(a=>!a.startsWith('--chapters=')&&!a.startsWith('--python=')))throw new Error('Unknown build option');
if(!packageRoot||!executablePath)throw new Error('Usage: node tools/build-handbook.mjs EXISTING_NODE_MODULES EXISTING_BROWSER_EXE [--chapters=R04,R17,...] [--python=EXISTING_PYTHON_WITH_PYPDF]. Full builds resolve PDF index pages. No software is installed.');
const require=createRequire(path.join(packageRoot,'package.json'));
const {marked}=await import(pathToFileURL(require.resolve('marked')).href);
const {chromium}=require('playwright');
const {catalog,chapters:allChapters}=await loadModel(edition);
const requested=selection?.startsWith('--chapters=')?selection.slice(11).split(','):null;
const chapters=requested?allChapters.filter(c=>requested.includes(c.id)):allChapters;
if(requested&&chapters.length!==requested.length)throw new Error('Unknown selected chapter');
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
marked.use({renderer:{html({text}){return /^<!-- source: examples\/[\w./-]+ -->$/.test(text.trim())?'':escape(text);}}});
const fileModels=new Map(allChapters.map(c=>[path.resolve(edition,c.source),c]));
for(const [relative,id] of [['reading-guide.zh-CN.md','reading-guide'],['appendices.zh-CN.md','appendices']]){
 const text=await fs.readFile(path.join(edition,relative),'utf8');
 fileModels.set(path.resolve(edition,relative),{id,source:relative,text,headings:headings(text,id)});
}
const includedIds=new Set(chapters.map(c=>c.id));
if(!requested){includedIds.add('reading-guide');includedIds.add('appendices');}
const manifest=[], usedResources=new Set();
async function render(model){
 const source=model.text,file=path.resolve(edition,model.source);
 if(/TODO|待补充|空正文占位/.test(source))throw new Error('Unfinished source: '+model.source);
 manifest.push({file:model.source,sha256:createHash('sha256').update(source).digest('hex')});
 let html=marked.parse(source,{gfm:true}),headingIndex=0;
 html=html.replace(/<h([123])>([\s\S]*?)<\/h\1>/g,(_,level,label)=>{
  const h=model.headings[headingIndex++];
  if(!h||Number(level)!==h.level)throw new Error('Heading mismatch: '+model.source);
  return '<h'+level+' id="'+h.anchor+'">'+label+'</h'+level+'>';
 });
 if(headingIndex!==model.headings.length)throw new Error('Missing rendered headings: '+model.source);
 for(const match of [...html.matchAll(/src="([^"]+)"/g)]){
  const resource=path.resolve(path.dirname(file),match[1]);
  if(!resource.startsWith(path.join(edition,'resources')+path.sep)||!resource.endsWith('.svg'))throw new Error('Invalid resource '+match[1]);
  const svg=await fs.readFile(resource,'utf8');
  if(!/<title\b[^>]*>[\s\S]*?<\/title>/.test(svg)||!/<desc\b[^>]*>[\s\S]*?<\/desc>/.test(svg)||/<script|<foreignObject|\bon\w+=|href="https?:/i.test(svg))throw new Error('SVG must be static with title/desc: '+resource);
  usedResources.add(resource);html=html.replace(match[0],'src="data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+'"');
 }
 for(const match of [...html.matchAll(/href="([^"]+)"/g)]){
  const href=match[1];if(/^(https?:|mailto:)/.test(href))continue;
  const [relative,fragment]=href.split('#');
  const target=relative?path.resolve(path.dirname(file),decodeURIComponent(relative)):file;
  if(!target.startsWith(edition+path.sep))throw new Error('Link escapes edition: '+href);
  await fs.access(target);const targetModel=fileModels.get(target);
  let replacement;
  if(targetModel){const anchor=resolveFragment(targetModel,fragment);replacement=includedIds.has(targetModel.id)?'#'+anchor:pathToFileURL(target).href+(fragment?'#'+fragment:'');}
  else replacement=pathToFileURL(target).href+(fragment?'#'+fragment:'');
  html=html.replace(match[0],'href="'+escape(replacement)+'"');
 }
 html=html.replace(/<p><strong>(声明摘要|独立片段|承接上文|执行路径示意)<\/strong>。<\/p>/g,'<p class="excerpt-label"><strong>$1</strong></p>');
 html=html.replace(/<p>(<img[\s\S]*?)<\/p>\s*<p>(图(?:\s*\d+[-－]\d+|：|:)[\s\S]*?)<\/p>/g,'<figure>$1<figcaption>$2</figcaption></figure>')
  .replace(/<p>(<img[^>]+>)<\/p>/g,'<figure>$1</figure>')
  .replace(/<table>([\s\S]*?)<\/table>/g,(_,contents)=>{
   const rows=(contents.match(/<tr>/g)||[]).length-1;
   return '<div class="table-wrap'+(rows<=6?' compact-table':'')+'"><table>'+contents+'</table></div>';
  })
  .replace(/<pre>(<code[\s\S]*?<\/code>)<\/pre>/g,(_,code)=>'<pre'+(code.split('\n').length>28?' class="long-code"':'')+'>'+code+'</pre>');
 const entries=model.headings.filter(h=>h.level===2);
 if(model.number)html=html.replace(/<\/h1>/,'</h1><div class="chapter-toc" aria-label="本章条目">'+entries.map(h=>'<a href="#'+h.anchor+'">'+escape(h.title)+'</a>').join('')+'</div>');
 return html;
}
const css=await fs.readFile(path.join(edition,'tools/handbook.css'),'utf8');
const sidebar=(requested?'':'<a href="#reading-guide">阅读路径</a>')+chapters.map(c=>'<details><summary><a href="#'+c.id+'">'+c.number+' '+escape(c.title)+'</a></summary><div>'+c.headings.filter(h=>h.level===2).map(h=>'<a href="#'+h.anchor+'">'+escape(h.title)+'</a>').join('')+'</div></details>').join('')+(requested?'':'<a href="#appendices">附录与索引</a>');
const toc=catalog.parts.map(p=>'<section><h2>'+escape(p.title)+'</h2><ol>'+chapters.filter(c=>c.part===p.title).map(c=>'<li><a href="#'+c.id+'">第'+c.number+'章 '+escape(c.title)+'</a></li>').join('')+'</ol></section>').join('');
let body='';
if(!requested)body+='<article id="reading-guide">'+await render(fileModels.get(path.resolve(edition,'reading-guide.zh-CN.md')))+'</article>';
for(const c of chapters)body+='<article id="'+c.id+'" class="chapter"><p class="edition-label">'+escape(c.part)+' · 第'+c.number+'章</p>'+await render(c)+'</article>';
if(!requested)body+='<article id="appendices" class="chapter">'+await render(fileModels.get(path.resolve(edition,'appendices.zh-CN.md')))+'</article>';
const html='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(catalog.title)+'</title><style>'+css+'</style></head><body><div class="layout"><nav aria-label="全书目录"><p>C++ 参考手册</p>'+sidebar+'</nav><main><section class="cover"><p class="edition-label">REFERENCE HANDBOOK · v0.2 · 对象条目版</p><h1>'+escape(catalog.title)+'</h1><p class="subtitle">语言 · 标准库 · 并发 · 系统 · 网络 · 工程</p><p>'+catalog.parts.length+' 篇 · '+chapters.length+' 章 · 基础操作 / 机制解释 / 进阶后查</p><p>C++17 核心，C++20/23 扩展分别标注<br>静态核对与制品检查范围见 BUILD-NOTES.md</p></section><section class="contents"><h1>目录</h1>'+toc+'</section>'+body+'</main></div></body></html>';
const output=path.join(edition,'output/pdf'),qa=path.join(edition,'qa/fullbook');await fs.mkdir(output,{recursive:true});await fs.mkdir(qa,{recursive:true});
const basename=requested?(chapters.length===1&&chapters[0].id==='R13'?'R13-sequence-containers-review':'Handbook-template-samples'):'Cpp-Reference-Handbook-v0.2';
const htmlPath=path.join(output,basename+'.html'),pdfPath=path.join(output,basename+'.pdf');await fs.writeFile(htmlPath,html,'utf8');
const browser=await chromium.launch({executablePath,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1320,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 // Bare stable source IDs remain useful in diagrams and concise cross-references.
 await page.evaluate((chapterNumbers)=>{const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('a,code,pre,h1,h2,h3,script,style')&&/\bR\d\d\b|图\s*\d{1,2}[-－]\d+/.test(n.textContent))nodes.push(n);}
  for(const n of nodes){const f=document.createDocumentFragment();for(const t of n.textContent.split(/\b(R\d\d)\b/)){if(/^R\d\d$/.test(t)&&document.getElementById(t)){const a=document.createElement('a');a.href='#'+t;a.textContent='第'+chapterNumbers[t]+'章';f.append(a);}else f.append(document.createTextNode(t.replace(/图\s*(\d{1,2})([-－]\d+)/g,(match,num,suffix)=>{const reader=chapterNumbers['R'+num.padStart(2,'0')];return reader?'图'+reader+suffix:match;})));}n.replaceWith(f);}
  for(const a of document.querySelectorAll('main a')){const id=a.textContent.trim();if(/^R\d\d$/.test(id)&&chapterNumbers[id])a.textContent='第'+chapterNumbers[id]+'章';}
 },Object.fromEntries(allChapters.map(c=>[c.id,c.number])));
 await fs.writeFile(htmlPath,await page.content(),'utf8');await page.emulateMedia({media:'print'});
 const layout=await page.evaluate(()=>{const b=document.querySelector('main').getBoundingClientRect();const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return{
  chapters:document.querySelectorAll('article.chapter[id^="R"]').length,
  images:[...document.images].map(i=>({alt:i.alt,loaded:i.complete&&i.naturalWidth>0})),
  clipping:[...document.querySelectorAll('table,pre,figure,h1,h2,h3')].filter(e=>{const r=e.getBoundingClientRect();return r.right>b.right+1||r.left<b.left-1;}).map(e=>e.tagName+': '+e.textContent.trim().slice(0,70)),
  brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')),
  duplicateIds:ids.filter((id,index)=>ids.indexOf(id)!==index)};});
 if(errors.length||layout.clipping.length||layout.brokenAnchors.length||layout.duplicateIds.length||layout.images.some(i=>!i.loaded))throw new Error(JSON.stringify({errors,layout}));
 const printPdf=()=>page.pdf({path:pdfPath,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,outline:true,tagged:true,
  headerTemplate:'<div style="font-family:Arial,sans-serif;font-size:8px;color:#60738a;margin:0 15mm;">C++ REFERENCE HANDBOOK · v0.2</div>',
  footerTemplate:'<div style="font-family:Arial,sans-serif;font-size:9px;color:#60738a;width:100%;text-align:right;margin:0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
 await printPdf();
 let indexPages={},pdfPasses=1;
 if(!requested){
  const anchors=await page.evaluate(()=>[...new Set([...document.querySelectorAll('#appendices a[href^="#"],.contents a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)))]);
  const readPages=()=>{
   const child=spawnSync(python,[path.join(edition,'tools/pdf-index-pages.py'),pdfPath],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
   if(child.error||child.status!==0)throw new Error('PDF page resolver failed: '+(child.error?.message||child.stderr));
   const destinations=JSON.parse(child.stdout),result={};
   for(const anchor of anchors){if(!Number.isInteger(destinations[anchor]))throw new Error('Missing PDF index destination: '+anchor);result[anchor]=destinations[anchor];}
   return result;
  };
  indexPages=readPages();
  let stable=false;
  for(let attempt=0;attempt<3;attempt++){
   await page.evaluate(pages=>{
    for(const a of document.querySelectorAll('#appendices a[href^="#"],.contents a[href^="#"]')){
     let number=a.querySelector('.pdf-page');
     if(!number){number=document.createElement('span');number.className='pdf-page';a.append(number);}
     const value=pages[a.getAttribute('href').slice(1)];number.textContent='〔'+value+'〕';number.setAttribute('aria-label','PDF 第'+value+'页');
    }
   },indexPages);
   await printPdf();pdfPasses++;
   const actual=readPages();
   if(JSON.stringify(actual)===JSON.stringify(indexPages)){stable=true;break;}
   indexPages=actual;
  }
  if(!stable)throw new Error('PDF index pagination did not converge');
  await fs.writeFile(htmlPath,await page.content(),'utf8');
 }
 await fs.writeFile(path.join(qa,basename+'-build.json'),JSON.stringify({chapters:chapters.map(c=>({id:c.id,number:c.number,source:c.source})),diagrams:usedResources.size,layout,indexPages,pdfPasses,files:manifest},null,2));
 console.log(JSON.stringify({htmlPath,pdfPath,chapters:chapters.length,diagrams:usedResources.size}));
}finally{await browser.close();}
