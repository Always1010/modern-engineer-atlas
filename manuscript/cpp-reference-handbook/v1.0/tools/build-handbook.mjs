import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {loadModel,headings,resolveFragment} from './document-model.mjs';
import {applyTypography} from './handbook-typography.mjs';

const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [packageRoot,executablePath,...options]=process.argv.slice(2);
const selection=options.find(a=>a.startsWith('--chapters='));
const python=options.find(a=>a.startsWith('--python='))?.slice(9)||'python';
if(options.some(a=>!a.startsWith('--chapters=')&&!a.startsWith('--python=')&&!a.startsWith('--output=')))throw new Error('Unknown build option');
if(!packageRoot||!executablePath)throw new Error('Usage: node tools/build-handbook.mjs EXISTING_NODE_MODULES EXISTING_BROWSER_EXE [--chapters=R04,R17,...] [--python=EXISTING_PYTHON_WITH_PYPDF]. Full builds resolve PDF index pages. No software is installed.');
const require=createRequire(path.join(packageRoot,'package.json'));
const {marked}=await import(pathToFileURL(require.resolve('marked')).href);
const {chromium}=require('playwright');
const {catalog,groups,chapters:allChapters}=await loadModel(edition);
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
 // Preserve all example whitespace, including the empty HTTP header terminator.
 const blocks=[...source.replaceAll('\r','').matchAll(/^```([^\n]*)\n([\s\S]*?)^```/gm)];let codeIndex=0;
 html=html.replace(/<pre><code(?: class="[^"]*")?>[\s\S]*?<\/code><\/pre>/g,()=>{
  const block=blocks[codeIndex++];if(!block)throw new Error('Unexpected rendered code block');
  const language=block[1].trim().split(/\s+/)[0];
  return '<pre><code'+(language?' class="language-'+escape(language)+'"':'')+'>'+escape(block[2])+'</code></pre>';
 });
 if(codeIndex!==blocks.length)throw new Error('Missing code block: '+model.source);
 html=html.replace(/<h([123])>([\s\S]*?)<\/h\1>/g,(_,level,label)=>{
  const h=model.headings[headingIndex++];
  if(!h||Number(level)!==h.level)throw new Error('Heading mismatch: '+model.source);
  const number=h.displayNumber?'<span class="'+(level==='1'?'section-number':'topic-number')+'">'+h.displayNumber+'</span>':'';
  // A source H1 is a section, and its H2 topics are subsections in the book outline.
  const renderedLevel=model.number?Number(level)+1:Number(level);
  return '<h'+renderedLevel+' id="'+h.anchor+'">'+number+'<span>'+label+'</span></h'+renderedLevel+'>';
 });
 if(headingIndex!==model.headings.length)throw new Error('Missing rendered headings: '+model.source);
 for(const match of [...html.matchAll(/src="([^"]+)"/g)]){
  const resource=path.resolve(path.dirname(file),match[1]);
  if(!resource.startsWith(path.join(edition,'resources')+path.sep)||!resource.endsWith('.svg'))throw new Error('Invalid resource '+match[1]);
  const svg=await fs.readFile(resource,'utf8');
  if(!/<title\b[^>]*>[\s\S]*?<\/title>/.test(svg)||!/<desc\b[^>]*>[\s\S]*?<\/desc>/.test(svg)||/<script|<foreignObject|\bon\w+=|href="https?:/i.test(svg))throw new Error('SVG must be static with title/desc: '+resource);
  if(!usedResources.has(resource))manifest.push({file:path.relative(edition,resource).split(path.sep).join('/'),sha256:createHash('sha256').update(svg).digest('hex')});
  usedResources.add(resource);html=html.replace(match[0],'src="data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+'"');
 }
 for(const match of [...html.matchAll(/href="([^"]+)"/g)]){
  const href=match[1];if(/^(https?:|mailto:)/.test(href))continue;
  const [relative,fragment]=href.split('#');
  const target=relative?path.resolve(path.dirname(file),decodeURIComponent(relative)):file;
  if(!target.startsWith(edition+path.sep))throw new Error('Link escapes edition: '+href);
  await fs.access(target);const targetModel=fileModels.get(target);
  let replacement;
  if(target===path.join(edition,'TOC.md'))replacement='#contents';
  else if(targetModel){const anchor=resolveFragment(targetModel,fragment);replacement=includedIds.has(targetModel.id)?'#'+anchor:pathToFileURL(target).href+(fragment?'#'+fragment:'');}
  else replacement=pathToFileURL(target).href+(fragment?'#'+fragment:'');
  html=html.replace(match[0],'href="'+escape(replacement)+'"');
 }
 html=html.replace(/<p>(?:<strong>)?(C\+\+(?:11|14|17|20|23|26))(?:<\/strong>)?([。:：]|\s)/g,'<p><span class="version-chip">$1</span> ');
 html=html.replace(/<p>(<img[\s\S]*?)<\/p>\s*<p>(图(?:\s*\d+[-－]\d+|：|:)[\s\S]*?)<\/p>/g,'<figure>$1<figcaption>$2</figcaption></figure>')
  .replace(/<p>(<img[^>]+>)<\/p>/g,'<figure>$1</figure>')
  .replace(/<table>([\s\S]*?)<\/table>/g,(_,contents)=>{
   const rows=(contents.match(/<tr>/g)||[]).length-1;
   return '<div class="table-wrap'+(/<th>标准基线<\/th>/.test(contents)?' version-table':'')+(rows<=6?' compact-table':'')+'"><table>'+contents+'</table></div>';
  })
  .replace(/<pre>(<code[\s\S]*?<\/code>)<\/pre>/g,(_,code)=>'<pre'+(code.split('\n').length>28?' class="long-code"':'')+'>'+code+'</pre>');
 const entries=model.headings.filter(h=>h.level===2);
 if(model.number&&entries.length){
  const final=entries.at(-1),start=html.indexOf('<h3 id="'+final.anchor+'">');
  if(start<0)throw new Error('Missing final topic: '+model.source);
  const closing=html.slice(start),text=closing.replace(/<[^>]+>/g,'').trim();
  // Keep a short closing topic with its complete explanation and companion link.
  if(text.length<=420&&!/<pre\b|<table\b|<figure\b/.test(closing))
   html=html.slice(0,start)+'<section class="section-closing">'+closing+'</section>';
 }
 if(model.number)html=html.replace(/<\/h2>/,'</h2><div class="section-toc" aria-label="本节条目">'+entries.map(h=>'<a href="#'+h.anchor+'">'+h.displayNumber+' '+escape(h.title)+'</a>').join('')+'</div>');
 return html;
}
const css=await fs.readFile(path.join(edition,'tools/handbook.css'),'utf8');
for(const file of ['catalog.json','tools/handbook.css','tools/handbook-typography.mjs','tools/build-handbook.mjs','tools/document-model.mjs']){
 const input=await fs.readFile(path.join(edition,file),'utf8');manifest.push({file,sha256:createHash('sha256').update(input).digest('hex')});
}
const activeGroups=groups.filter(g=>chapters.some(c=>c.chapterNumber===g.number));
const chapterLink=g=>'<a href="#chapter-'+g.number+'">第'+g.number+'章 '+escape(g.title)+'</a>';
const sidebar=(requested?'':'<a href="#reading-guide">阅读路径</a>')+activeGroups.map(g=>'<details open><summary>'+chapterLink(g)+'</summary><div>'+chapters.filter(c=>c.chapterNumber===g.number).map(c=>'<details><summary><a href="#'+c.id+'">'+c.number+' '+escape(c.title)+'</a></summary><div>'+c.headings.filter(h=>h.level===2).map(h=>'<a href="#'+h.anchor+'">'+h.displayNumber+' '+escape(h.title)+'</a>').join('')+'</div></details>').join('')+'</div></details>').join('')+(requested?'':'<a href="#appendices">附录与索引</a>');
const toc=activeGroups.map(g=>'<section><p class="contents-heading">'+chapterLink(g)+'</p><ol>'+chapters.filter(c=>c.chapterNumber===g.number).map(c=>'<li><a href="#'+c.id+'">'+c.number+' '+escape(c.title)+'</a></li>').join('')+'</ol></section>').join('');
const decks=['从源文件、类型与初始化出发，理解表达式、引用和函数如何共同构成程序。','沿着对象的建立、转移与销毁，理解资源所有权、模板和异常安全。','从数据的表示、存储与访问出发，查阅标准库接口及其适用条件。','从线程与共享状态出发，理解锁、原子操作和异步任务的协作关系。','沿着指令、地址空间与输入输出，理解程序运行所依赖的系统机制。','从协议分层到消息收发，理解连接、字节流与服务通信。','从构建产物到运行现场，组织调试、测量与性能调查。'];
const opener=g=>'<section id="chapter-'+g.number+'" class="chapter-opener"><span class="chapter-number" aria-hidden="true">'+String(g.number).padStart(2,'0')+'</span><h1 class="chapter-heading"><span class="chapter-label">第'+g.number+'章</span> <span class="chapter-name">'+escape(g.title)+'</span></h1><p class="chapter-deck">'+decks[g.number-1]+'</p><div class="chapter-map" aria-label="本章各节">'+chapters.filter(c=>c.chapterNumber===g.number).map(c=>'<a href="#'+c.id+'"><span class="map-number">'+c.number+'</span><span class="map-title">'+escape(c.title)+'</span></a>').join('')+'</div></section>';
let body='';
if(!requested)body+='<article id="reading-guide">'+await render(fileModels.get(path.resolve(edition,'reading-guide.zh-CN.md')))+'</article>';
for(const g of activeGroups){body+=opener(g);for(const c of chapters.filter(c=>c.chapterNumber===g.number))body+='<article id="'+c.id+'" class="book-section" data-number="'+c.number+'"><p class="section-kicker">第'+c.chapterNumber+'章 · '+escape(c.chapterTitle)+'</p>'+await render(c)+'</article>';}
if(!requested)body+='<article id="appendices" class="appendices">'+await render(fileModels.get(path.resolve(edition,'appendices.zh-CN.md')))+'</article>';
const html='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(catalog.title)+'</title><style>'+css+'</style></head><body><div class="layout"><nav aria-label="全书目录"><p>C++ 参考手册</p>'+sidebar+'</nav><main><section class="cover"><p class="edition-label">REFERENCE HANDBOOK · v1.0</p><h1>'+escape(catalog.title)+'</h1><p class="subtitle">语言 · 标准库 · 并发 · 系统 · 网络 · 工程</p><p>'+activeGroups.length+' 章 · '+chapters.length+' 节</p><p>C++17 核心，C++20/23 扩展分别标注</p></section><section id="contents" class="contents"><h1>目录</h1>'+toc+'</section>'+body+'</main></div></body></html>';
const output=path.join(edition,'output/pdf'),qa=path.join(edition,'qa/learning-revision/render-build');await fs.mkdir(output,{recursive:true});await fs.mkdir(qa,{recursive:true});
const basename=options.find(a=>a.startsWith('--output='))?.slice(9)||(requested?(chapters.length===1&&chapters[0].id==='R13'?'R13-sequence-containers-review':'Handbook-template-samples'):'Cpp-Reference-Handbook-v1.0');
const htmlPath=path.join(output,basename+'.html'),pdfPath=path.join(output,basename+'.pdf');await fs.writeFile(htmlPath,html,'utf8');
const browser=await chromium.launch({executablePath,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1320,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(applyTypography,Object.fromEntries(allChapters.map(c=>[c.id,c.number])));
 await fs.writeFile(htmlPath,await page.content(),'utf8');await page.emulateMedia({media:'print'});
 const layout=await page.evaluate(()=>{const b=document.querySelector('main').getBoundingClientRect();const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return{
  chapters:document.querySelectorAll('article.book-section').length,
  images:[...document.images].map(i=>({alt:i.alt,loaded:i.complete&&i.naturalWidth>0})),
  tableBodyBold:document.querySelectorAll('tbody strong').length,
  tableBodyWeights:[...new Set([...document.querySelectorAll('tbody td,tbody td code,tbody td .prose-english')].map(e=>getComputedStyle(e).fontWeight))],
  tableBodyColors:[...new Set([...document.querySelectorAll('tbody td,tbody td code,tbody td .prose-english')].map(e=>getComputedStyle(e).color))],
  numberStyleMismatch:[...document.querySelectorAll('.section-number,.topic-number')].filter(e=>{
   const a=getComputedStyle(e),b=getComputedStyle(e.parentElement);return a.fontSize!==b.fontSize||a.fontFamily!==b.fontFamily||a.fontWeight!==b.fontWeight;
  }).map(e=>e.textContent),
  clipping:[...document.querySelectorAll('table,pre,figure,h1,h2,h3,h4')].filter(e=>{const r=e.getBoundingClientRect();return r.right>b.right+1||r.left<b.left-1;}).map(e=>e.tagName+': '+e.textContent.trim().slice(0,70)),
  brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')),
  duplicateIds:ids.filter((id,index)=>ids.indexOf(id)!==index)};});
 if(errors.length||layout.clipping.length||layout.brokenAnchors.length||layout.duplicateIds.length||layout.images.some(i=>!i.loaded)||layout.tableBodyBold||layout.tableBodyWeights.some(w=>w!=='400')||layout.tableBodyColors.length!==1||layout.numberStyleMismatch.length)throw new Error(JSON.stringify({errors,layout}));
 const printPdf=()=>page.pdf({path:pdfPath,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,outline:true,tagged:true,
  headerTemplate:'<div style="font-family:Arial,sans-serif;font-size:8px;color:#60738a;margin:0 15mm;">C++ REFERENCE HANDBOOK · v1.0</div>',
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
 await fs.writeFile(path.join(qa,basename+'-build.json'),JSON.stringify({chapters:chapters.map(c=>({id:c.id,number:c.number,chapterNumber:c.chapterNumber,source:c.source})),diagrams:usedResources.size,layout,indexPages,pdfPasses,files:manifest},null,2));
 console.log(JSON.stringify({htmlPath,pdfPath,chapters:chapters.length,diagrams:usedResources.size}));
}finally{await browser.close();}
