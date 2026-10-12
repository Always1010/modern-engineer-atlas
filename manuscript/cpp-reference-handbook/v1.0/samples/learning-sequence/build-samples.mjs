// Render only this review draft; use the handbook's shared model, CSS and typography.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {headings, resolveFragment} from '../../tools/document-model.mjs';
import {applyTypography} from '../../tools/handbook-typography.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const edition = path.resolve(root, '../..');
const [packageRoot, browserExe] = process.argv.slice(2);
if (!packageRoot || !browserExe) throw new Error('Pass existing Node package directory and Chromium executable; no dependencies are installed.');
const require = createRequire(path.join(packageRoot, 'package.json'));
const {marked} = await import(pathToFileURL(require.resolve('marked')).href);
const {chromium} = require('playwright');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
marked.use({renderer: {html({text}) { return escape(text); }}});
const sourceFiles = ['01-initialization-deduction.zh-CN.md', '02-lifetime-raii.zh-CN.md', '03-containers-iterators.zh-CN.md'];
const manifest = [];
const models = [];
for (const [i, file] of sourceFiles.entries()) {
  const text = await fs.readFile(path.join(root, file), 'utf8');
  const id = 'S0' + (i + 1); let topic = 0;
  const hs = headings(text, id).map(h => ({...h, displayNumber: h.level === 1 ? '1.' + (i + 1) : h.level === 2 ? '1.' + (i + 1) + '.' + (++topic) : null}));
  models.push({id, file, text, headings: hs, title: hs[0].title});
  manifest.push({file, sha256: createHash('sha256').update(text).digest('hex')});
}
const byFile = new Map(models.map(m => [path.resolve(root, m.file), m]));
async function render(model) {
  let html = marked.parse(model.text, {gfm: true}); let hi = 0, ci = 0;
  const blocks = [...model.text.replaceAll('\r', '').matchAll(/^```([^\n]*)\n([\s\S]*?)^```/gm)];
  html = html.replace(/<pre><code(?: class="[^"]*")?>[\s\S]*?<\/code><\/pre>/g, () => {
    const block = blocks[ci++]; if (!block) throw new Error('Unexpected code block');
    return '<pre><code class="language-' + escape(block[1].trim()) + '">' + escape(block[2]) + '</code></pre>';
  });
  if (ci !== blocks.length) throw new Error('Code count mismatch');
  html = html.replace(/<h([123])>([\s\S]*?)<\/h\1>/g, (_, level, label) => {
    const h = model.headings[hi++];
    if (!h || h.level !== Number(level)) throw new Error('Heading mismatch');
    const number = h.displayNumber ? '<span class="' + (level === '1' ? 'section-number' : 'topic-number') + '">' + h.displayNumber + '</span>' : '';
    return '<h' + (Number(level) + 1) + ' id="' + h.anchor + '">' + number + '<span>' + label + '</span></h' + (Number(level) + 1) + '>';
  });
  if (hi !== model.headings.length) throw new Error('Missing heading');
  for (const match of [...html.matchAll(/src="([^"]+)"/g)]) {
    const resource = path.resolve(root, match[1]);
    if (!resource.startsWith(path.join(root, 'resources') + path.sep) || !resource.endsWith('.svg')) throw new Error('Invalid image');
    const svg = await fs.readFile(resource, 'utf8');
    if (!/<title\b[^>]*>[\s\S]*?<\/title>/.test(svg) || !/<desc\b[^>]*>[\s\S]*?<\/desc>/.test(svg) || /<script|<foreignObject|\bon\w+=|href="https?:/i.test(svg)) throw new Error('Non-static SVG');
    manifest.push({file: match[1], sha256: createHash('sha256').update(svg).digest('hex')});
    html = html.replace(match[0], 'src="data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') + '"');
  }
  for (const match of [...html.matchAll(/href="([^"]+)"/g)]) {
    const [relative, fragment] = match[1].split('#');
    const target = byFile.get(path.resolve(root, relative || model.file));
    if (!target) throw new Error('Unexpected draft link: ' + match[1]);
    html = html.replace(match[0], 'href="#' + resolveFragment(target, fragment) + '"');
  }
  html = html.replace(/<p>(<img[^>]+>)<\/p>\s*<p>(图：[\s\S]*?)<\/p>/g, '<figure>$1<figcaption>$2</figcaption></figure>');
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (_, body) => '<div class="table-wrap' + ((body.match(/<tr>/g) || []).length <= 7 ? ' compact-table' : '') + '"><table>' + body + '</table></div>');
  const toc = model.headings.filter(h => h.level === 2).map(h => '<a href="#' + h.anchor + '">' + h.displayNumber + ' ' + escape(h.title) + '</a>').join('');
  return html.replace(/<\/h2>/, '</h2><div class="section-toc" aria-label="本组内容">' + toc + '</div>');
}
const css = await fs.readFile(path.join(edition, 'tools/handbook.css'), 'utf8');
for (const file of ['tools/handbook.css', 'tools/handbook-typography.mjs', 'tools/document-model.mjs']) {
  const text = await fs.readFile(path.join(edition, file), 'utf8');
  manifest.push({editionFile: file, sha256: createHash('sha256').update(text).digest('hex')});
}
const links = models.map(m => '<a href="#' + m.id + '"><span class="map-number">' + m.headings[0].displayNumber + '</span><span class="map-title">' + escape(m.title) + '</span></a>').join('');
let body = '<section class="chapter-opener" id="chapter-1"><span class="chapter-number" aria-hidden="true">01</span><h1 class="chapter-heading"><span class="chapter-label">第1章</span><span class="chapter-name">基础概念的衔接样稿</span></h1><p class="chapter-deck">从整数初值，到对象清理，再到序列位置。三组样稿用于评审学习顺序与解释深度；本稿编号独立于正式手册，按各组列明的先修阅读。</p><div class="chapter-map">' + links + '</div></section>';
for (const model of models) body += '<article class="book-section" id="' + model.id + '">' + await render(model) + '</article>';
const nav = models.map(m => '<details open><summary><a href="#' + m.id + '">' + escape(m.title) + '</a></summary><div>' + m.headings.filter(h => h.level === 2).map(h => '<a href="#' + h.anchor + '">' + h.displayNumber + ' ' + escape(h.title) + '</a>').join('') + '</div></details>').join('');
const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>基础概念的衔接样稿</title><style>' + css + '</style></head><body><div class="layout"><nav aria-label="样稿目录"><p>衔接样稿</p>' + nav + '</nav><main>' + body + '</main></div></body></html>';
const output = path.join(edition, 'output/pdf'), qa = path.join(edition, 'qa/learning-sequence');
await fs.mkdir(output, {recursive: true}); await fs.mkdir(qa, {recursive: true});
const htmlPath = path.join(output, 'Handbook-learning-sequence-samples.html');
const pdfPath = path.join(output, 'Handbook-learning-sequence-samples.pdf');
await fs.writeFile(htmlPath, html, 'utf8');
const browser = await chromium.launch({executablePath: browserExe, headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1320, height: 1050}});
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(htmlPath).href); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(applyTypography, {});
  const expectedCodes = models.flatMap(m => [...m.text.replaceAll('\r', '').matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map(x => x[1]));
  const actualCodes = await page.locator('pre code').allTextContents();
  if (JSON.stringify(expectedCodes) !== JSON.stringify(actualCodes)) throw new Error('Rendered code differs from draft');
  async function inspect() {
    return page.evaluate(() => {
      const main = document.querySelector('main').getBoundingClientRect();
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      return {brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.getAttribute('href').slice(1))).map(a => a.getAttribute('href')),
        duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
        brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.alt),
        clipping: [...document.querySelectorAll('h1,h2,h3,h4,figure,pre,.table-wrap')].filter(e => {const r = e.getBoundingClientRect(); return r.left < main.left - 1 || r.right > main.right + 1;}).map(e => e.tagName + ': ' + e.textContent.slice(0, 55)),
        documentOverflow: document.documentElement.scrollWidth > innerWidth,
        tableBodyBold: document.querySelectorAll('tbody strong').length,
        tableBodyWeights: [...new Set([...document.querySelectorAll('tbody td,tbody code,tbody .prose-english')].map(e => getComputedStyle(e).fontWeight))],
        numberStyleMismatch: [...document.querySelectorAll('.section-number,.topic-number')].filter(e => {const a=getComputedStyle(e), b=getComputedStyle(e.parentElement); return a.fontFamily!==b.fontFamily || a.fontSize!==b.fontSize || a.fontWeight!==b.fontWeight;}).map(e => e.textContent)};
    });
  }
  const desktop = await inspect();
  await page.setViewportSize({width: 390, height: 844}); const mobile = await inspect();
  await page.screenshot({path: path.join(qa, 'mobile.png'), fullPage: false});
  await page.setViewportSize({width: 1320, height: 1050}); await page.emulateMedia({media: 'print'}); const print = await inspect();
  for (const [kind, result] of Object.entries({desktop, mobile, print})) {
    if (errors.length || result.brokenAnchors.length || result.duplicateIds.length || result.brokenImages.length || result.clipping.length || result.documentOverflow || result.tableBodyBold || result.tableBodyWeights.some(w => w !== '400') || result.numberStyleMismatch.length) throw new Error(JSON.stringify({kind, result, errors}));
  }
  await fs.writeFile(htmlPath, await page.content(), 'utf8');
  await page.pdf({path: pdfPath, format: 'A4', preferCSSPageSize: true, printBackground: true, outline: true, tagged: true, displayHeaderFooter: true,
    headerTemplate: '<div style="font-family:Arial,sans-serif;font-size:8px;color:#60738a;margin:0 15mm;">C++ HANDBOOK · LEARNING SEQUENCE REVIEW</div>',
    footerTemplate: '<div style="font-family:Arial,sans-serif;font-size:9px;color:#60738a;width:100%;text-align:right;margin:0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
  const result = {date: '2026-10-10', groups: models.length, headings: models.reduce((n,m)=>n+m.headings.length,0), codeBlocks: actualCodes.length, images: manifest.filter(m=>m.file?.endsWith('.svg')).length, desktop, mobile, print, errors, manifest};
  await fs.writeFile(path.join(qa, 'render-checks.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({htmlPath, pdfPath, groups: result.groups, codeBlocks: result.codeBlocks, images: result.images}));
} finally { await browser.close(); }
