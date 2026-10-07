import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const edition = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = process.argv[2];
if (!packageRoot) throw new Error('Pass an existing Node package directory as argument 1; this script does not install dependencies.');
const packageRequire = createRequire(path.join(packageRoot, 'package.json'));
const markedEntry = packageRequire.resolve('marked');
const { marked } = await import(pathToFileURL(markedEntry).href);
const { chromium } = packageRequire('playwright');
const source = await fs.readFile(path.join(edition, 'chapters/R13-sequence-containers.zh-CN.md'), 'utf8');
let body = marked.parse(source, { gfm: true });
const headings = [];
body = body.replace(/<h2>(.*?)<\/h2>/g, (match, label) => {
  const id = 'section-' + (headings.length + 1);
  headings.push({ id, label });
  return '<h2 id="' + id + '">' + label + '</h2>';
});
for (const match of [...body.matchAll(/src="(\.\.\/resources\/[^"]+\.svg)"/g)]) {
  const resource = path.resolve(edition, 'chapters', match[1]);
  if (!resource.startsWith(path.join(edition, 'resources') + path.sep)) throw new Error('Invalid resource path');
  const svg = await fs.readFile(resource, 'utf8');
  const image = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  body = body.replace(match[0], 'src="' + image + '"');
}
body = body.replace(/<p>(<img[\s\S]*?)<\/p>\s*<p>(图13-[\s\S]*?)<\/p>/g,
  '<figure>$1<figcaption>$2</figcaption></figure>');
body = body.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>第13章 顺序容器 审阅样章</title>
<style>
:root { color-scheme: light; --ink:#172b43; --muted:#53667a; --accent:#285a91; --line:#d8e2ec; --paper:#fff; }
* { box-sizing:border-box; }
body { margin:0; color:var(--ink); background:#eef2f6; font-family:"Microsoft YaHei","Noto Sans CJK SC",sans-serif; font-size:15px; line-height:1.78; }
.layout { display:grid; grid-template-columns:210px minmax(0,920px); gap:28px; max-width:1220px; margin:36px auto; padding:0 24px; align-items:start; }
nav { position:sticky; top:24px; font-size:13px; }
nav p { color:var(--muted); margin:0 0 12px; }
nav a { display:block; padding:7px 0; color:var(--muted); text-decoration:none; }
nav a:hover { color:var(--accent); text-decoration:underline; }
main { background:var(--paper); padding:40px 48px; min-width:0; }
.edition-label { margin:0 0 8px; color:var(--accent); font-size:12px; letter-spacing:.04em; }
h1 { font-size:30px; line-height:1.3; margin:0 0 22px; font-weight:650; }
h2 { margin:34px 0 14px; font-size:21px; line-height:1.4; padding-bottom:7px; border-bottom:1px solid var(--line); scroll-margin-top:24px; }
h3 { margin:23px 0 10px; font-size:17px; line-height:1.4; }
p { margin:11px 0; }
a { color:var(--accent); text-underline-offset:3px; }
code { font-family:Consolas,"Microsoft YaHei",monospace; font-size:.91em; overflow-wrap:anywhere; }
p code, td code { color:#183f68; }
pre { margin:14px 0; padding:13px 16px; background:#f2f5f9; border-left:3px solid #93b2d4; overflow:auto; line-height:1.6; }
pre code { white-space:pre; overflow-wrap:normal; }
.table-wrap { overflow-x:auto; margin:16px 0; }
table { border-collapse:collapse; width:100%; font-size:12.5px; line-height:1.55; }
th { background:#edf3f9; text-align:left; font-weight:600; }
th,td { border-bottom:1px solid var(--line); padding:9px 8px; vertical-align:top; }
figure { margin:22px 0; }
figure img { display:block; width:100%; height:auto; }
figcaption { color:var(--muted); font-size:12px; line-height:1.6; margin:7px 0 0; }
.review-note { margin-top:28px; padding-top:12px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
@media(max-width:1000px) { .layout{display:block;max-width:920px;margin:16px auto;padding:0 12px} nav{position:static;margin-bottom:18px} nav a{display:inline-block;margin-right:18px} main{padding:28px} }
@media(max-width:540px) { body{font-size:14px} main{padding:22px 16px} h1{font-size:25px} h2{font-size:19px} table{min-width:600px} figure{overflow-x:auto} figure img{min-width:600px} }
@page { size:A4; margin:17mm 15mm 17mm; }
@media print {
 body { background:white; font-size:10pt; line-height:1.62; }
 .layout { display:block; margin:0; padding:0; max-width:none; }
 nav { display:none; }
 main { margin:0; padding:0; }
 .edition-label { font-size:8pt; margin-bottom:5px; }
 h1 { font-size:23pt; margin-bottom:14px; }
 h2 { font-size:14pt; margin:19px 0 10px; break-after:avoid; }
 h3 { font-size:11pt; margin:16px 0 8px; break-after:avoid; }
 p { margin:8px 0; orphans:3; widows:3; }
 table { font-size:8.8pt; line-height:1.45; }
 th,td { padding:5px 6px; }
 tr { break-inside:avoid; }
 thead { display:table-header-group; }
 .table-wrap { overflow:visible; margin:11px 0; }
 pre { padding:9px 11px; margin:10px 0; overflow:visible; break-inside:avoid; font-size:8.6pt; line-height:1.45; }
 pre code { white-space:pre-wrap; overflow-wrap:anywhere; }
 figure { break-inside:avoid; margin:13px 0; }
 figure img { min-width:0; }
 figcaption { font-size:8pt; line-height:1.4; margin-top:5px; }
 a { color:#285a91; text-decoration:none; }
 .review-note { font-size:8pt; break-inside:avoid; }
}
</style>
</head>
<body>
<div class="layout">
<nav aria-label="本章目录"><p>第三篇 标准库与数据结构</p>${headings.map(h => '<a href="#' + h.id + '">' + h.label + '</a>').join('')}</nav>
<main><p class="edition-label">C++ 与计算机基础图解参考手册 · 第三篇 · 审阅样章</p>${body}
<p class="review-note">审阅版 · 核心示例 C++17，erase_if 标记 C++20 · 技术资料核验日期 2026-10-07</p>
</main>
</div>
</body></html>`;
const outputDirectory = path.join(edition, 'output/pdf');
const qaDirectory = path.join(edition, 'qa/r13');
await fs.mkdir(outputDirectory, { recursive:true });
await fs.mkdir(qaDirectory, { recursive:true });
const htmlPath = path.join(outputDirectory, 'R13-sequence-containers-review.html');
const pdfPath = path.join(outputDirectory, 'R13-sequence-containers-review.pdf');
await fs.writeFile(htmlPath, html, 'utf8');
const executablePath = process.argv[3];
if (!executablePath) throw new Error('Pass an existing browser executable as argument 2; this script does not install a browser.');
const browser = await chromium.launch({ executablePath, headless:true });
try {
 const page = await browser.newPage({ viewport:{ width:1280, height:1000 }, deviceScaleFactor:1.4 });
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto(pathToFileURL(htmlPath).href, { waitUntil:'load' });
 await page.evaluate(() => document.fonts.ready);
 const layout = await page.evaluate(() => {
  const images = [...document.images].map(img => ({ alt:img.alt, loaded:img.complete && img.naturalWidth > 0 }));
  const clipping = [...document.querySelectorAll('table,pre,figure,h1,h2,h3')].filter(el => {
    const parent = el.closest('main'), r = el.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    return r.right > pr.right + 1 || r.left < pr.left - 1;
  }).map(el => el.tagName + ': ' + el.textContent.trim().slice(0,70));
  return { images, clipping, headings:document.querySelectorAll('h2').length };
 });
 if (errors.length || layout.clipping.length || layout.images.some(img => !img.loaded)) throw new Error(JSON.stringify({ errors, layout }));
 await page.screenshot({ path:path.join(qaDirectory, 'review-top.png'), fullPage:false });
 await page.emulateMedia({ media:'print' });
 await page.pdf({
  path:pdfPath, format:'A4', preferCSSPageSize:true, printBackground:true, displayHeaderFooter:true,
  headerTemplate:'<div style="font-family:Arial,sans-serif;font-size:8px;color:#60738a;width:100%;margin:0 15mm;">C++ REFERENCE HANDBOOK / SEQUENCE CONTAINERS</div>',
  footerTemplate:'<div style="font-family:Arial,sans-serif;font-size:9px;color:#60738a;width:100%;text-align:right;margin:0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
 });
 console.log(JSON.stringify({ htmlPath,pdfPath,layout },null,2));
} finally {
 await browser.close();
}
