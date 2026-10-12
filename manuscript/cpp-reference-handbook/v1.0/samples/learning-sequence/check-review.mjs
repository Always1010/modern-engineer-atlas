import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {headings, loadModel, resolveFragment} from '../../tools/document-model.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)), edition=path.resolve(root,'../..'), qa=path.join(edition,'qa/learning-sequence');
const readJSON=async file=>JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseline=await readJSON(path.join(root,'source-baseline.json'));
for (const file of baseline.files) if (hash(await fs.readFile(path.join(edition,file.path)))!==file.sha256) throw new Error('Source changed: '+file.path);
const model=await loadModel(edition);
const audit=await readJSON(path.join(root,'dependency-audit.json'));
if (JSON.stringify(model.chapters.map(c=>c.id))!==JSON.stringify(audit.coverage.map(c=>c.id)) || audit.coverage.length!==35) throw new Error('Audit coverage mismatch');
for (const finding of audit.findings) {
  for (const loc of [finding.location,...finding.targets]) {
    const text=await fs.readFile(path.join(edition,loc.source),'utf8');
    const entries=headings(text,loc.sourceId); const heading=entries.find(h=>h.title===loc.heading && h.slug===loc.fragment);
    if (!heading || text.replaceAll('\r','').split('\n')[loc.headingLine-1]!=='#'.repeat(heading.level)+' '+loc.heading) throw new Error('Stale heading: '+finding.id);
    if (loc.evidence && !text.replaceAll('\r','').split('\n')[loc.line-1]?.includes(loc.evidence)) throw new Error('Stale evidence: '+finding.id);
  }
}
const migration=await readJSON(path.join(root,'migration-inventory.json'));
const ids=new Set(migration.records.map(r=>r.sourceId));
const expected=model.chapters.filter(c=>ids.has(c.id)).flatMap(c=>c.headings.filter(h=>h.level>1).map(h=>c.id+'#'+h.slug));
const actual=migration.records.map(r=>r.sourceId+'#'+r.fragment);
if (ids.size!==10 || JSON.stringify(expected)!==JSON.stringify(actual) || new Set(actual).size!==147) throw new Error('Migration coverage mismatch');
const render=await readJSON(path.join(qa,'render-checks.json'));
for (const entry of render.manifest) {
  const file=entry.editionFile?path.join(edition,entry.editionFile):path.join(root,entry.file);
  if (hash(await fs.readFile(file))!==entry.sha256) throw new Error('Reading edition stale: '+file);
}
const markdownFiles=(await fs.readdir(root)).filter(f=>f.endsWith('.md')); let localLinks=0, fragments=0;
const resultPath=path.join(qa,'review-checks.json'), deferredTargets=[];
const markdownCache=new Map();
for (const name of markdownFiles) {
  const text=await fs.readFile(path.join(root,name),'utf8');
  // Code excerpts are data, not Markdown links.
  const prose=text.replace(/^```[^\n]*\n[\s\S]*?^```/gm,'').replace(/`[^`\n]+`/g,'');
  for (const match of prose.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const url=match[1]; if (/^(https?:|data:|mailto:)/.test(url)) continue;
    const [relative,fragment]=url.split('#'); const target=path.resolve(root,decodeURIComponent(relative||name));
    if (target===resultPath) deferredTargets.push(target); else await fs.access(target);
    localLinks++;
    if (fragment) {
      if (!target.endsWith('.md')) throw new Error('Unexpected fragment '+url);
      let parsed=markdownCache.get(target);
      if (!parsed) { parsed={headings:headings(await fs.readFile(target,'utf8'),'review')}; markdownCache.set(target,parsed); }
      resolveFragment(parsed,fragment); fragments++;
    }
  }
}
const references=await readJSON(path.join(root,'references.json'));
if(references.edition!=='C++17'||references.references.some(r=>!r.url.startsWith('https://timsong-cpp.github.io/cppwp/n4659/'))) throw new Error('Reference version mismatch');
const inspection=await readJSON(path.join(qa,'pdf-inspection.json'));
if(inspection.pages!==16||inspection.outside_page_bounds_count||inspection.replacement_character_pages.length||inspection.needs_sparse_page_review.length) throw new Error('PDF check failed');
const fonts=await readJSON(path.join(qa,'pdf-fonts.json'));
if(fonts.unembedded.length) throw new Error('Unembedded font');
const result={date:'2026-10-10',unchangedReviewedFiles:baseline.files.length,coveredSections:audit.coverage.length,findings:audit.findings.length,statusCounts:audit.statusCounts,retainedSections:ids.size,retainedTopics:actual.length,checkedMarkdownFiles:markdownFiles.length,localLinks,fragments,sourceAndRenderHashesMatch:true,references:references.references.length,pdfPages:inspection.pages,pdfSHA256:hash(await fs.readFile(path.join(edition,'output/pdf/Handbook-learning-sequence-samples.pdf'))),htmlSHA256:hash(await fs.readFile(path.join(edition,'output/pdf/Handbook-learning-sequence-samples.html')))};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
for (const target of deferredTargets) await fs.access(target);
console.log(JSON.stringify(result));
