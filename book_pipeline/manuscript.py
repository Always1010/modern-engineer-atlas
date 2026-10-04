"""Read and prove complete-edition coverage, never infer it from a catalog."""
from pathlib import Path
import hashlib
import json
import re

DEFAULT_SOURCE = Path(__file__).resolve().parents[1] / 'manuscript/complete-edition/v1.0'
BOOK_NAME = 'Modern-Engineer-Atlas-Complete-v1.0.zh-CN.md'
ANCHOR = re.compile(r'^<a id="([^"]+)"></a>\s*\n', re.M)
CHAPTER_IDS = [f'C{i:02}' for i in range(1, 59)]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def ref_inline(text):
    """Resolve chapter-scoped references without touching code fences."""
    refs = dict(re.findall(r'^\[([^\]]+)\]:\s*(\S+)\s*$', text, re.M))
    out, fence = [], False
    for line in text.splitlines():
        if re.match(r'^\s*(```|~~~)', line):
            fence = not fence
            out.append(line)
            continue
        if not fence:
            if re.match(r'^\[[^\]]+\]:\s*\S+\s*$', line):
                continue
            line = re.sub(r'\[((?:\[[^\[\]]*\]|[^\[\]])+)\]\[([^\]]*)\]', lambda m: '[' + m[1] + '](<' + refs[m[2] or m[1]] + '>)' if (m[2] or m[1]) in refs else m[0], line)
            line = re.sub(r'(?<!\[)\[([^\[\]]+)\](?![\[(\]])', lambda m: '[' + m[1] + '](<' + refs[m[1]] + '>)' if m[1] in refs else m[0], line)
        out.append(line)
    return '\n'.join(out) + '\n'


def unshift(text, levels):
    out, fence = [], False
    for line in text.splitlines():
        if re.match(r'^\s*(```|~~~)', line):
            fence = not fence
        if not fence and re.match(r'^#{' + str(levels + 1) + ',' + str(levels + 3) + r'} ', line):
            line = line[levels:]
        out.append(line)
    return '\n'.join(out).strip()


def code_blocks(text):
    blocks, current, marker = [], [], None
    for line in text.splitlines():
        opening = re.match(r'^\s*(`{3,}|~{3,})(.*)$', line)
        if marker is None:
            if opening:
                marker = opening[1]
                current = []
        elif re.match(r'^\s*' + re.escape(marker[0]) + '{' + str(len(marker)) + r',}\s*$', line):
            blocks.append('\n'.join(current))
            marker = None
        else:
            current.append(line)
    require(marker is None, 'Unclosed code fence')
    return blocks


def read_sections(source):
    from .assembly import read_sections as read_ordered_sections
    return read_ordered_sections(source)


def validate_source(source):
    source = Path(source).resolve()
    require(source.is_dir(), f'Missing complete manuscript directory: {source}')
    from .assembly import assemble_markdown, source_snapshot, normalize_chapter, prose_lines
    sections = read_sections(source)
    require(len(sections) == 76, 'Expected 76 complete-book sections')
    identities = [s['identity'] for s in sections]
    require(len(set(identities)) == len(identities), 'Duplicate book section')
    require([s['identity'] for s in sections if s['kind'] == 'chapter'] == ['chapter-' + c.lower() for c in CHAPTER_IDS], 'Expected the real 58 chapters in order')
    require(sum(s['kind'] == 'part' for s in sections) == 13, 'Expected 13 parts')
    require(set(identities) >= {'reading-guide', 'glossary', 'photo-credits', 'edition-notes', 'font-licenses'}, 'Missing front/back matter or licenses')
    files = sorted((source / 'chapters').glob('*.md'))
    require([f.name[:3] for f in files] == CHAPTER_IDS, 'Expected exactly 58 separate chapter files')
    chapters, images, fences, topics = [], [], [], []
    by_id = {s['identity']: s for s in sections}
    for number, file in enumerate(files, 1):
        raw = file.read_text(encoding='utf-8')
        require(len(raw) >= 12000, f'{file.name}: truncated or outline-only chapter')
        normalized = normalize_chapter(raw)
        combined = by_id['chapter-' + file.name[:3].lower()]['text']
        require(normalized == combined, f'{file.name}: combined manuscript differs from canonical chapter')
        prose = '\n'.join(line for line, outside in prose_lines(raw) if outside)
        section_topics = re.findall(r'^## (\d+\.\d+)\s+(.+)$', prose, re.M)
        require([x[0] for x in section_topics] == [f'{number}.{i}' for i in range(1, 5)], f'{file.name}: missing or extra numbered topics')
        topic_bodies = re.split(r'^## \d+\.\d+\s+.+$', prose, flags=re.M)[1:]
        require(all(len(t.strip()) >= 1000 for t in topic_bodies), f'{file.name}: topic lacks substantive prose')
        topics.extend(f'{file.name[:3]}:{t[0]}' for t in section_topics)
        blocks = code_blocks(raw)
        require(blocks == code_blocks(combined), f'{file.name}: changed code fence')
        fences.extend(blocks)
        chapter_images = re.findall(r'!\[([^\]]*)\]\((\.\./resources/[^)]+)\)', prose)
        require(chapter_images and all(alt.strip() for alt, _ in chapter_images), f'{file.name}: missing figure or alt text')
        images.extend(rel[3:] for _, rel in chapter_images)
        chapters.append({'chapter_id': file.name[:3], 'file': str(file.relative_to(source)), 'title': raw.splitlines()[0][2:], 'characters': len(raw), 'sha256': sha256(file), 'topics': [x[0] for x in section_topics], 'code_fences': len(blocks), 'images': len(chapter_images)})
    require(len(topics) == 232 and len(set(topics)) == 232, 'Expected 232 substantive topics')
    assets = json.loads((source / 'asset-manifest.json').read_text())
    require(len(assets) == 164 and len(images) == 164 and len(set(images)) == 164, 'Expected all 164 unique figures')
    require(set(images) == {a['file'] for a in assets}, 'Figure references differ from asset manifest')
    require(sum(a['kind'] == 'diagram' for a in assets) == 154, 'Expected 154 SVG diagrams')
    require(sum(a['kind'] == 'photograph' for a in assets) == 10, 'Expected 10 photographs')
    for asset in assets:
        file = source / asset['file']
        require(file.is_file() and sha256(file) == asset['sha256'], f'Asset missing or modified: {asset["file"]}')
    photos = json.loads((source / 'photo-license-manifest.json').read_text())
    require(len(photos) == 10, 'Missing photograph credits')
    require((source / 'FONT-LICENSES.txt').stat().st_size > 6000, 'Missing complete font licenses')
    generated = assemble_markdown(source)
    return {'chapters': chapters, 'chapter_count': 58, 'parts': 13, 'topics': 232, 'figures': 164, 'diagrams': 154, 'photos': 10, 'code_fences': len(fences), 'manuscript_sha256': hashlib.sha256(generated.encode('utf-8')).hexdigest(), 'chapter_sources_authoritative': True, 'asset_hashes_valid': True, 'source_files': len(source_snapshot(source))}
