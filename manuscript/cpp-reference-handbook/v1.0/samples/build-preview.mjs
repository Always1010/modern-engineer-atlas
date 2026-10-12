import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {headings,loadModel,resolveFragment,chapterGroups} from '../tools/document-model.mjs';

const sampleDir=path.dirname(fileURLToPath(import.meta.url)), edition=path.dirname(sampleDir);
const [packageRoot,browserExe]=process.argv.slice(2);
if(!packageRoot||!browserExe) throw new Error('Usage: node samples/build-preview.mjs EXISTING_NODE_MODULES EXISTING_BROWSER_EXE');
const require=createRequire(path.join(packageRoot,'package.json'));
const {marked}=await import(pathToFileURL(require.resolve('marked')).href);
const {chromium}=require('playwright');
const sourcePath=path.join(sampleDir,'R03-initialization-deduction.preview.zh-CN.md');
const source=await fs.readFile(sourcePath,'utf8');
const original=await fs.readFile(path.join(edition,'chapters/R03-initialization-deduction.zh-CN.md'),'utf8');
const fences=s=>[...s.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m=>m[1].replaceAll('\r',''));
if(JSON.stringify(fences(source))!==JSON.stringify(fences(original))) throw new Error('Code examples changed');
const hs=headings(source,'R03');
if(JSON.stringify(hs)!==JSON.stringify(headings(original,'R03'))) throw new Error('Chapter headings changed');
if(/基础操作|独立片段|https?:\/\//.test(source)) throw new Error('Redundant label or inline external reference remains');
const {catalog,chapters}=await loadModel(edition);
const partIndex=chapterGroups(catalog).map(g=>({...g,chapters:g.sections})).findIndex(p=>p.chapters.some(c=>c.id==='R03'));
const part=chapterGroups(catalog).map(g=>({...g,chapters:g.sections}))[partIndex], chapterNumber=partIndex+1;
const chapterTitle=part.title.replace(/^第.+?篇\s*/, '');
const sectionNumber=chapterNumber+'.'+(part.chapters.findIndex(c=>c.id==='R03')+1);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let html=marked.parse(source),i=0;
let topic=0;
html=html.replace(/<h([123])>([\s\S]*?)<\/h\1>/g,(_,level,title)=>{
 const label=level==='1'?'<span class="section-number">'+sectionNumber+'</span>'+title:level==='2'?'<span class="topic-number">'+sectionNumber+'.'+(++topic)+'</span><span>'+title+'</span>':title;
 return `<h${level} id="${hs[i++].anchor}">${label}</h${level}>`;
});
html=html.replace(/<p><strong>(独立片段|声明摘要|承接上文|执行路径示意)<\/strong>。<\/p>/g,'<p class="excerpt-label">$1</p>');
html=html.replace(/<strong>C\+\+20<\/strong>。/g,'<span class="version-chip">C++20</span>');
html=html.replace(/<table>([\s\S]*?)<\/table>/g,'<div class="table-wrap"><table>$1</table></div>');
html=html.replace(/<p>(<img[^>]+>)<\/p>\s*<p>(图：[\s\S]*?)<\/p>/g,'<figure>$1<figcaption>$2</figcaption></figure>');
for(const m of [...html.matchAll(/src="([^"]+)"/g)]) {
 const target=path.resolve(sampleDir,m[1]),svg=await fs.readFile(target,'utf8');
 html=html.replace(m[0],'src="data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+'"');
}
const fullHtml=path.join(edition,'output/pdf/Cpp-Reference-Handbook-v0.2.html');
await fs.access(fullHtml);
for(const m of [...html.matchAll(/href="([^"]+)"/g)]) {
 const href=m[1]; if(/^https?:/.test(href)) continue;
 const [relative,fragment]=href.split('#'),target=path.resolve(sampleDir,decodeURIComponent(relative));
 await fs.access(target);
 const model=chapters.find(c=>path.resolve(edition,c.source)===target);
 if(fragment && model) resolveFragment(model,fragment);
 const replacement=model?pathToFileURL(fullHtml).href+'#'+resolveFragment(model,fragment):pathToFileURL(target).href;
 html=html.replace(m[0],'href="'+escape(replacement)+'"');
}
const css=await fs.readFile(path.join(edition,'tools/handbook.css'),'utf8')+'\n'+await fs.readFile(path.join(sampleDir,'preview.css'),'utf8');
const nav='<p class="nav-chapter">第 '+chapterNumber+' 章 · '+escape(chapterTitle)+'</p><p class="nav-title">'+sectionNumber+' 初始化与类型推导</p>'+hs.filter(h=>h.level===2).map((h,n)=>'<a href="#'+h.anchor+'"><span>'+sectionNumber+'.'+(n+1)+'</span>'+escape(h.title)+'</a>').join('');
const chapterMap=part.chapters.map((c,n)=>'<a class="'+(c.id==='R03'?'selected':'')+'" href="'+(c.id==='R03'?'#R03':escape(pathToFileURL(fullHtml).href+'#'+c.id))+'"><span class="map-number">'+chapterNumber+'.'+(n+1)+'</span><span class="map-title">'+escape(c.title)+'</span></a>').join('');
const opener='<section class="chapter-opener"><span class="chapter-number" aria-hidden="true">'+String(chapterNumber).padStart(2,'0')+'</span><p class="chapter-label">第 '+chapterNumber+' 章</p><h1 class="chapter-name">'+escape(chapterTitle)+'</h1><p class="chapter-deck">从源文件、类型与初始化出发，理解表达式、引用和函数如何共同构成程序。</p><div class="chapter-map" aria-label="本章各节">'+chapterMap+'</div></section>';
const output=path.join(edition,'output/pdf'),qa=path.join(edition,'qa/layout-preview');
await fs.mkdir(output,{recursive:true}); await fs.mkdir(qa,{recursive:true});
const htmlPath=path.join(output,'R03-layout-preview.html'),pdfPath=path.join(output,'R03-layout-preview.pdf');
const doc='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>1.3 初始化与类型推导 · 样章</title><style>'+css+'</style></head><body><div class="running-header"><span>C++ 图解参考手册</span><span>第 '+chapterNumber+' 章 · '+escape(chapterTitle)+' / '+sectionNumber+' 初始化与类型推导</span></div><div class="layout"><nav aria-label="本节目录">'+nav+'</nav><main>'+opener+'<p class="section-kicker">第 '+chapterNumber+' 章 / '+escape(chapterTitle)+'</p><article id="R03">'+html+'</article><p class="sample-note">C++ 与计算机基础图解参考手册 · 样章 · 2026-10-10</p></main></div></body></html>';
await fs.writeFile(htmlPath,doc,'utf8');
const browser=await chromium.launch({executablePath:browserExe,headless:true});
try {
 const page=await browser.newPage({viewport:{width:1320,height:1050}});
 await page.goto(pathToFileURL(htmlPath).href); await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{
  const article=document.querySelector('article');
  // Small, lossless C++ token colouring; text is left unchanged.
  const keywords=new Set('auto bool char class const consteval constexpr constinit decltype double explicit float int long namespace new nullptr private public return short signed static struct template typename unsigned using void volatile'.split(' '));
  for(const code of article.querySelectorAll('pre code')) {
   const source=code.textContent, fragment=document.createDocumentFragment();
   const pattern=/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g;
   let end=0;
   for(const token of source.matchAll(pattern)) {
    fragment.append(document.createTextNode(source.slice(end,token.index)));
    let type=token[0].startsWith('//')||token[0].startsWith('/*')?'comment':/^["']/.test(token[0])?'string':/^\d/.test(token[0])?'number':keywords.has(token[0])?'keyword':null;
    if(type){const span=document.createElement('span');span.className='syntax-'+type;span.textContent=token[0];fragment.append(span);}else fragment.append(document.createTextNode(token[0]));
    end=token.index+token[0].length;
   }
   fragment.append(document.createTextNode(source.slice(end))); code.replaceChildren(fragment);
   if(code.textContent!==source) throw new Error('Token colouring changed code text');
  }
  article.querySelector('h1').nextElementSibling.classList.add('chapter-intro');
  const version=article.querySelector('.chapter-intro').nextElementSibling;
  const meta=document.createElement('div'); meta.className='chapter-meta'; version.before(meta); meta.append(version);
  for(const h of [...article.querySelectorAll('h2')]) {
   const group=document.createElement('div'); group.className='section-opening'; h.before(group); group.append(h);
   let next=group.nextElementSibling;
   if(next?.tagName==='P') { group.append(next); next=group.nextElementSibling; }
   if(next?.classList.contains('excerpt-label')) { group.append(next); next=group.nextElementSibling; }
   if(next?.tagName==='PRE'||next?.classList.contains('table-wrap')) group.append(next);
  }
 });
 await fs.writeFile(htmlPath,await page.content(),'utf8');
 const check=async()=>page.evaluate(()=>{
  const box=document.querySelector('main').getBoundingClientRect();
  return {clipping:[...document.querySelectorAll('pre,table,figure')].filter(e=>{const r=e.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1;}).map(e=>e.tagName),brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),codeBlocks:document.querySelectorAll('pre').length};
 });
 const screen=await check(); await page.screenshot({path:path.join(qa,'screen.png'),fullPage:false});
 await page.locator('#R03').scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(qa,'screen-section.png'),fullPage:false});
 await page.emulateMedia({media:'print'}); const print=await check();
 if(screen.clipping.length||print.clipping.length||screen.brokenAnchors.length||!screen.images) throw new Error(JSON.stringify({screen,print}));
 await page.pdf({path:pdfPath,format:'A4',preferCSSPageSize:true,printBackground:true,tagged:true,outline:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="font-family:Microsoft YaHei,sans-serif;font-size:9px;color:#6b797f;width:100%;display:flex;justify-content:space-between;margin:0 18mm;"><span>第 '+chapterNumber+' 章 · '+escape(chapterTitle)+'</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
 await fs.writeFile(path.join(qa,'html-check.json'),JSON.stringify({screen,print,codeExamplesUnchanged:true,headingsUnchanged:true},null,2));
 console.log(JSON.stringify({htmlPath,pdfPath,screen,print},null,2));
} finally { await browser.close(); }
