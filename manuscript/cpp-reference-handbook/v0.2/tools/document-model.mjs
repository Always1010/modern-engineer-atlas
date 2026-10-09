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
  for (const part of catalog.parts) for (const chapter of part.chapters) {
    const source = await fs.readFile(path.join(edition, chapter.source), 'utf8');
    chapters.push({...chapter, part:part.title, number:chapters.length+1, text:source, headings:headings(source,chapter.id)});
  }
  if (chapters.length !== catalog.chapterCount || new Set(chapters.map(c=>c.id)).size !== chapters.length)
    throw new Error('Catalog chapter count/identity mismatch');
  return {catalog,chapters};
}

export function resolveFragment(model, fragment) {
  if (!fragment) return model.id;
  const decoded = decodeURIComponent(fragment);
  const entry = model.headings.find(h => h.anchor === decoded || h.slug === decoded || h.slug === slug(decoded) || h.title === decoded);
  if (!entry) throw new Error('Unknown entry anchor: '+model.id+'#'+decoded);
  return entry.anchor;
}
