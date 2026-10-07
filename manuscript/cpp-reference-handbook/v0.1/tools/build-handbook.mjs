import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const edition = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [packageRoot, executablePath] = process.argv.slice(2);
if (!packageRoot || !executablePath)
  throw new Error('Usage: node tools/build-handbook.mjs EXISTING_NODE_MODULES EXISTING_BROWSER_EXE. No software is installed.');
const require = createRequire(path.join(packageRoot, 'package.json'));
const { marked } = await import(pathToFileURL(require.resolve('marked')).href);
const { chromium } = require('playwright');
const catalog = JSON.parse(await fs.readFile(path.join(edition, 'catalog.json'), 'utf8'));
const chapterFiles = await fs.readdir(path.join(edition, 'chapters'));
const chapters = catalog.parts.flatMap((part, pi) => part.chapters.map(chapter => ({...chapter, part:part.title, partIndex:pi})));
const expectedChapters = catalog.chapterCount;
if (!Number.isInteger(expectedChapters) || chapters.length !== expectedChapters ||
    new Set(chapters.map(c => c.id)).size !== expectedChapters ||
    chapters.some((c,index) => c.id !== 'R'+String(index+1).padStart(2,'0')))
  throw new Error('Catalog must contain the declared number of unique, sequential chapters.');
const manifest = [];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"','&quot;');
// Manuscripts are Markdown, not trusted raw HTML; literal header/type names must stay visible.
marked.use({renderer:{html({text}) {
  if (/^<!-- source: examples\/[\w./-]+ -->$/.test(text.trim())) return '';
  return escape(text);
}}});
let diagrams = 0;
async function renderFile(relative, id) {
  const file = path.join(edition, relative);
  const source = await fs.readFile(file, 'utf8');
  if (/TODO|待补充|正文尚未|空正文占位/.test(source)) throw new Error('Unfinished source: ' + relative);
  manifest.push({file:relative, sha256:createHash('sha256').update(source).digest('hex'),
    cjkCharacters:(source.match(/[\u3400-\u9fff]/g)||[]).length,
    tables:(source.match(/^\| ?---/gm)||[]).length,
    codeBlocks:(source.match(/^\x60\x60\x60/gm)||[]).length/2});
  let html = marked.parse(source, {gfm:true});
  let count = 0;
  html = html.replace(/<h([123])>([\s\S]*?)<\/h\1>/g, (_, level, label) =>
    '<h'+level+' id="'+(level === '1' ? id+'-title' : id+'-s'+(++count))+'">'+label+'</h'+level+'>');
  for (const match of [...html.matchAll(/src="([^"]+)"/g)]) {
    const resource = path.resolve(path.dirname(file), match[1]);
    if (!resource.startsWith(path.join(edition, 'resources') + path.sep) || !resource.endsWith('.svg'))
      throw new Error('Unapproved resource '+match[1]);
    const svg = await fs.readFile(resource, 'utf8');
    if (!/<title\b[^>]*>[\s\S]*?<\/title>/.test(svg) || !/<desc\b[^>]*>[\s\S]*?<\/desc>/.test(svg) ||
        /<script|<foreignObject|\bon\w+=|href="https?:/i.test(svg))
      throw new Error('SVG needs title/desc and must be static: '+resource);
    manifest.push({file:path.relative(edition,resource).replaceAll(path.sep,'/'),sha256:createHash('sha256').update(svg).digest('hex')});
    diagrams++;
    html = html.replace(match[0], 'src="data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+'"');
  }
  for (const match of [...html.matchAll(/href="([^"]+)"/g)]) {
    const href = match[1];
    if (/^(https?:|#|mailto:)/.test(href)) continue;
    const target = path.resolve(path.dirname(file), href.split('#')[0]);
    if (!target.startsWith(edition+path.sep)) throw new Error('Link escapes edition: '+href);
    await fs.access(target);
    const chapter = path.basename(target).match(/^(R\d\d)-.*\.md$/);
    const replacement = chapter ? '#'+chapter[1] :
      target.endsWith('reading-guide.zh-CN.md') ? '#reading-guide' :
      target.endsWith('appendices.zh-CN.md') ? '#appendices' : pathToFileURL(target).href;
    html = html.replace(match[0], 'href="'+replacement+'"');
  }
  html = html.replace(/<p>(<img[\s\S]*?)<\/p>\s*<p>(图\s*\d+[-－]\d+[\s\S]*?)<\/p>/g,
    '<figure>$1<figcaption>$2</figcaption></figure>');
  html = html.replace(/<p>(<img[^>]+>)<\/p>/g,'<figure>$1</figure>');
  html = html.replace(/<table>/g,'<div class="table-wrap"><table>').replace(/<\/table>/g,'</table></div>');
  html = html.replace(/<pre>(<code[\s\S]*?<\/code>)<\/pre>/g, (_, code) =>
    '<pre'+(code.split('\n').length > 50 ? ' class="long-code"' : '')+'>'+code+'</pre>');
  return html;
}
const guide = await renderFile('reading-guide.zh-CN.md','reading-guide');
let body = '<article id="reading-guide">'+guide+'</article>';
for (const chapter of chapters) {
  const files = chapterFiles.filter(file => file.startsWith(chapter.id+'-') && file.endsWith('.zh-CN.md'));
  if (files.length !== 1) throw new Error('Expected exactly one source for '+chapter.id);
  chapter.source = 'chapters/'+files[0];
  body += '<article id="'+chapter.id+'" class="chapter"><p class="edition-label">'+escape(chapter.part)+'</p>'+
    await renderFile(chapter.source,chapter.id)+'</article>';
}
body += '<article id="appendices" class="chapter">'+await renderFile('appendices.zh-CN.md','appendices')+'</article>';
const sampleRenderer = await fs.readFile(path.join(edition,'tools/render-r13-review.mjs'),'utf8');
const sampleCSS = sampleRenderer.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if (!sampleCSS) throw new Error('Approved sample stylesheet not found.');
const toc = catalog.parts.map(part => '<section><h2>'+escape(part.title)+'</h2><ol>'+
  part.chapters.map(c=>'<li><a href="#'+c.id+'">'+c.id+' '+escape(c.title)+'</a></li>').join('')+'</ol></section>').join('');
const sidebar = '<a href="#reading-guide">使用与入门路径</a>'+chapters.map(c=>'<a href="#'+c.id+'">'+c.id+' '+escape(c.title)+'</a>').join('')+
  '<a href="#appendices">附录与索引</a>';
const css = sampleCSS + '\n'+[
'nav { max-height:calc(100vh - 48px); overflow:auto; }',
'nav a { padding:4px 0; font-size:12px; }',
'article { padding-bottom:20px; }',
'.cover { padding:65px 0 90px; }',
'.cover h1 { max-width:700px; font-size:36px; line-height:1.45; }',
'.cover .subtitle { color:var(--muted); font-size:19px; }',
'.cover .scope { margin-top:45px; border-top:2px solid var(--line); padding-top:20px; }',
'.contents { margin-bottom:50px; }',
'.contents h2 { margin:18px 0 6px; font-size:16px; }',
'.contents ol { list-style:none; padding:0; margin:0; }',
'.contents li { margin:4px 0; font-size:13px; }',
'.contents a { text-decoration:none; }',
'@media print {',
' .cover { height:238mm; padding-top:40mm; break-after:page; }',
' .cover h1 { font-size:28pt; } .cover .subtitle { font-size:13pt; }',
' .cover .scope { font-size:10pt; }',
' .contents { break-after:page; margin:0; }',
' .contents section { break-inside:avoid; }',
' .contents h2 { font-size:11pt; margin:12px 0 4px; padding-bottom:4px; }',
' .contents li { font-size:9pt; margin:2px 0; line-height:1.4; }',
' article.chapter { break-before:page; } article { padding-bottom:0; }',
' #reading-guide { font-size:9.4pt; line-height:1.5; }',
' #reading-guide table { font-size:8.4pt; } #reading-guide th,#reading-guide td { padding:4px 5px; }',
// Dense lookup chapters had only a closing paragraph on an extra page; keep type size, trim spacing.
' #R07 p,#R09 p,#R12 p,#R18 p { margin:6px 0; } #R07 h2,#R09 h2,#R12 h2,#R18 h2 { margin:17px 0 9px; }',
' #R07 figure,#R09 figure,#R12 figure,#R18 figure { margin:11px 0; } #R07 .table-wrap,#R09 .table-wrap,#R12 .table-wrap,#R18 .table-wrap { margin:9px 0; }',
' pre.long-code { break-inside:auto; }',
' h1 { break-after:avoid; } ul,ol { padding-left:20px; }',
' li { orphans:2; widows:2; }',
'}'].join('\n');
const html = '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
  '<title>'+escape(catalog.title)+'</title><style>'+css+'</style></head><body><div class="layout">'+
  '<nav aria-label="全书目录"><p>C++ 图解参考手册</p>'+sidebar+'</nav><main>'+
  '<section class="cover"><p class="edition-label">REFERENCE HANDBOOK · v0.1 · 完整首稿</p>'+
  '<h1>C++ 与计算机基础<br>图解参考手册</h1><p class="subtitle">语言规则 · 标准库与数据结构 · 并发 · 系统 · 网络 · 排障</p>'+
  '<p class="scope">'+catalog.parts.length+' 篇 · '+chapters.length+' 章 · 6 类速查索引<br>核心完整例子 C++17；C++20/23 扩展分层标注<br>规则、接口、机制图与实际工作中的错误边界</p>'+
  '<p>修订资料核验：'+escape(catalog.revisionDate)+'<br>示例验证与重建条件见版本目录中的 BUILD-NOTES.md</p></section>'+
  '<section class="contents"><h1>目录</h1><p><a href="#reading-guide">使用这本手册与快速阅读路径</a></p>'+toc+
  '<p><a href="#appendices">附录 A–F：语法、符号、容器算法、故障、术语、命令</a></p></section>'+body+'</main></div></body></html>';
const output = path.join(edition,'output/pdf');
const qa = path.join(edition,'qa/fullbook');
await fs.mkdir(output,{recursive:true});
await fs.mkdir(qa,{recursive:true});
const htmlPath = path.join(output,'Cpp-Reference-Handbook-v0.1.html');
const pdfPath = path.join(output,'Cpp-Reference-Handbook-v0.1.pdf');
await fs.writeFile(htmlPath,html,'utf8');
const browser = await chromium.launch({executablePath,headless:true});
try {
  const page = await browser.newPage({viewport:{width:1320,height:1050},deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  // Link text chapter references, never rewriting code, existing links or headings.
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('a,code,pre,h1,h2,h3,nav,script,style') && /\bR\d\d\b/.test(node.textContent)) nodes.push(node);
    }
    for (const node of nodes) {
      const fragment=document.createDocumentFragment();
      const parts=node.textContent.split(/\b(R\d\d)\b/);
      for(const part of parts) {
        if(/^R\d\d$/.test(part) && document.getElementById(part)) {
          const a=document.createElement('a'); a.href='#'+part; a.textContent=part; fragment.append(a);
        } else fragment.append(document.createTextNode(part));
      }
      node.replaceWith(fragment);
    }
  });
  await fs.writeFile(htmlPath,await page.content(),'utf8');
  await page.emulateMedia({media:'print'});
  const layout = await page.evaluate(()=>{
    const main=document.querySelector('main'), bounds=main.getBoundingClientRect();
    return {
      chapters:document.querySelectorAll('article.chapter[id^="R"]').length,
      images:[...document.images].map(img=>({alt:img.alt,loaded:img.complete && img.naturalWidth>0})),
      clipping:[...document.querySelectorAll('table,pre,figure,h1,h2,h3')].filter(el=>{
        const r=el.getBoundingClientRect();return r.right>bounds.right+1||r.left<bounds.left-1;
      }).map(el=>el.tagName+': '+el.textContent.trim().slice(0,80)),
      brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href'))
    };
  });
  if(errors.length || layout.clipping.length || layout.brokenAnchors.length || layout.images.some(img=>!img.loaded))
    throw new Error(JSON.stringify({errors,layout}));
  await page.pdf({path:pdfPath,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,
    headerTemplate:'<div style="font-family:Arial,sans-serif;font-size:8px;color:#60738a;width:100%;margin:0 15mm;">C++ & COMPUTER FUNDAMENTALS / REFERENCE HANDBOOK v0.1</div>',
    footerTemplate:'<div style="font-family:Arial,sans-serif;font-size:9px;color:#60738a;width:100%;text-align:right;margin:0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    outline:true,tagged:true});
  const uniqueManifest=[...new Map(manifest.map(entry=>[entry.file,entry])).values()];
  await fs.writeFile(path.join(qa,'build-report.json'),JSON.stringify({chapters:chapters.map(c=>({id:c.id,source:c.source})),diagrams,layout,files:uniqueManifest},null,2),'utf8');
  console.log(JSON.stringify({htmlPath,pdfPath,chapters:chapters.length,diagrams,files:uniqueManifest.length},null,2));
} finally {await browser.close();}
