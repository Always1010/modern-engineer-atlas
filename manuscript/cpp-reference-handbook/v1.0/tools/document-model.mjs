import fs from 'node:fs/promises';
import path from 'node:path';

export const plain = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*]/g, '').replace(/<[^>]*>/g, '').trim();
export const slug = text => plain(text).replace(/^\d+(?:\.\d+)*[\s、.]+/, '').toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-');

export function headings(source, id) {
  const result = [], used = new Map();
  let fenced = false;
  for (const line of source.replaceAll('\r', '').split('\n')) {
    if (/^```/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = line.match(/^(#{1,3}) (.+)$/);
    if (!match) continue;
    const base = slug(match[2]) || 'entry';
    const occurrence = (used.get(base) || 0) + 1;
    used.set(base, occurrence);
    const key = base + (occurrence > 1 ? '-'+occurrence : '');
    result.push({level:match[1].length, title:match[2].trim(), slug:key, anchor:id+'-'+key});
  }
  if (fenced) throw new Error('Unclosed code fence: '+id);
  return result;
}

export async function loadModel(edition) {
  const catalog = JSON.parse(await fs.readFile(path.join(edition, 'catalog.json'), 'utf8'));
  const chapters = [];
  const groups = chapterGroups(catalog);
  for (const [groupIndex,group] of groups.entries()) for (const [sectionIndex,chapter] of group.sections.entries()) {
    const source = await fs.readFile(path.join(edition, chapter.source), 'utf8');
    const number = (groupIndex+1)+'.'+(sectionIndex+1);
    let topic = 0;
    const hs = headings(source,chapter.id).map(h=>({...h,displayNumber:h.level===1?number:h.level===2?number+'.'+(++topic):null}));
    chapters.push({...chapter, chapterNumber:groupIndex+1, sectionNumber:sectionIndex+1,
      chapterTitle:group.title, number, ordinal:chapters.length+1, text:source, headings:hs});
  }
  if (chapters.length !== (catalog.sectionCount||catalog.chapterCount) || new Set(chapters.map(c=>c.id)).size !== chapters.length)
    throw new Error('Catalog chapter count/identity mismatch');
  return {catalog,groups,chapters};
}

// Stable source IDs are independent of the reader's chapter/section numbering.
export function chapterGroups(catalog) {
  return catalog.chapters || catalog.parts.map((p,index)=>({number:index+1,
    title:p.title.replace(/^第.+?篇\s*/,''),sections:p.chapters}));
}

export function resolveFragment(model, fragment) {
  if (!fragment) return model.id;
  const decoded = decodeURIComponent(fragment);
  const entry = model.headings.find(h => h.anchor === decoded || h.slug === decoded || h.slug === slug(decoded) || h.title === decoded);
  if (!entry) throw new Error('Unknown entry anchor: '+model.id+'#'+decoded);
  return entry.anchor;
}
