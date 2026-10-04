"""Chapter-authoritative assembly. Combined Markdown is always generated output."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
from .manuscript import require, CHAPTER_IDS


def prose_lines(text):
    marker = None
    for line in text.splitlines():
        if marker:
            yield line, False
            if re.fullmatch(r'\s*' + re.escape(marker[0]) + '{' + str(marker[1]) + r',}\s*', line):
                marker = None
        else:
            match = re.match(r'^\s*(`{3,}|~{3,})(.*)$', line)
            if match:
                marker = (match[1][0], len(match[1]))
            yield line, not bool(match)
    require(marker is None, 'Unclosed code fence')


def normalize_chapter(text):
    lines = list(prose_lines(text))
    refs = {}
    for line, prose in lines:
        match = re.fullmatch(r'\[([^\]]+)\]:\s*(\S+)\s*', line) if prose else None
        if match:
            refs[match[1]] = match[2]
    out = []
    for line, prose in lines:
        if prose:
            if re.fullmatch(r'\[[^\]]+\]:\s*\S+\s*', line):
                continue
            line = re.sub(r'\[((?:\[[^\[\]]*\]|[^\[\]])+)\]\[([^\]]*)\]', lambda m: '[' + m[1] + '](<' + refs[m[2] or m[1]] + '>)' if (m[2] or m[1]) in refs else m[0], line)
            line = re.sub(r'(?<!\[)\[([^\[\]]+)\](?![\[(\]])', lambda m: '[' + m[1] + '](<' + refs[m[1]] + '>)' if m[1] in refs else m[0], line)
            line = line.replace('../resources/', 'resources/')
        out.append(line)
    return '\n'.join(out).strip()


def shift(text, levels):
    out = []
    for line, prose in prose_lines(text):
        match = re.match(r'^(#{1,6}) ', line) if prose else None
        if match:
            require(len(match[1]) + levels <= 6, 'Heading nesting exceeds Markdown range')
            line = '#' * levels + line
        out.append(line)
    return '\n'.join(out).strip()


def source_file(source, relative):
    require(isinstance(relative, str) and relative, 'Missing source path')
    path = PurePosixPath(relative)
    require(not path.is_absolute() and '..' not in path.parts and '\\' not in relative, f'Unsafe source path: {relative}')
    target = (source / relative).resolve()
    require(target.is_relative_to(source.resolve()), f'Unsafe source path: {relative}')
    require(target.is_file(), f'Missing source file: {relative}')
    return target


def load_order(source):
    source = Path(source).resolve()
    order = json.loads(source_file(source, 'book-order.json').read_text(encoding='utf-8'))
    require(order.get('schema_version') == 1, 'Unsupported book order schema')
    entries = order.get('sections', [])
    require(len(entries) == 76, 'Expected 76 complete-book sections')
    ids = [e['id'] for e in entries]
    require(len(ids) == len(set(ids)), 'Duplicate book section')
    require([e['id'] for e in entries if e['kind'] == 'chapter'] == ['chapter-' + c.lower() for c in CHAPTER_IDS], 'Expected the real 58 chapters in order')
    require([e['id'] for e in entries if e['kind'] == 'part'] == [f'part-p{i:02}' for i in range(1, 14)], 'Expected 13 parts in order')
    require(ids[0] == 'reading-guide' and ids[-4:] == ['glossary', 'photo-credits', 'edition-notes', 'font-licenses'], 'Missing or out-of-order front/back matter')
    require(entries[0]['kind'] == 'front' and all(e['kind'] == 'back' for e in entries[-4:]), 'Incorrect front/back matter kind')
    files = [e['file'] for e in entries if e['kind'] != 'part']
    require(len(files) == len(set(files)), 'Duplicate source file in order')
    chapter_paths = [e['file'] for e in entries if e['kind'] == 'chapter']
    actual = sorted(str(p.relative_to(source)) for p in (source / 'chapters').glob('*.md'))
    require(chapter_paths == actual and [Path(p).name[:3] for p in actual] == CHAPTER_IDS, 'Expected exactly 58 separate chapter files in order')
    for e in entries:
        if e['kind'] == 'part':
            require(isinstance(e.get('title'), str) and e['title'].strip() and '\n' not in e['title'], 'Invalid part title')
        else:
            source_file(source, e['file'])
            if e['kind'] == 'chapter':
                require(e['id'] == 'chapter-' + Path(e['file']).name[:3].lower(), 'Chapter identity/file mismatch')
    source_file(source, order['cover_file'])
    return order


def read_sections(source):
    source = Path(source).resolve()
    order = load_order(source)
    sections, part = [], None
    for index, entry in enumerate(order['sections']):
        kind = entry['kind']
        if kind == 'part':
            titles = []
            for following in order['sections'][index + 1:]:
                if following['kind'] != 'chapter':
                    break
                title = source_file(source, following['file']).read_text(encoding='utf-8').splitlines()[0]
                require(title.startswith('# '), 'Chapter needs a top-level title')
                titles.append(title[2:])
            require(titles, 'Part has no chapters')
            text = '# ' + entry['title'] + '\n\n' + '\n'.join('- ' + title for title in titles)
            part = entry['title']
        else:
            text = source_file(source, entry['file']).read_text(encoding='utf-8').strip()
            require(text.startswith('# '), f'Section needs a top-level title: {entry["file"]}')
            if kind == 'chapter':
                require(part is not None, 'Chapter appears before a part')
                text = normalize_chapter(text)
        sections.append({'identity': entry['id'], 'kind': kind, 'text': text, 'part': part if kind == 'chapter' else None, 'toc_title': entry.get('toc_title', text.splitlines()[0][2:])})
    return sections


def assemble_markdown(source):
    source = Path(source).resolve()
    order = load_order(source)
    sections = read_sections(source)
    cover = source_file(source, order['cover_file']).read_text(encoding='utf-8').rstrip()
    toc = '\n'.join(('  ' if s['kind'] == 'chapter' else '') + '- [' + s['toc_title'] + '](#' + s['identity'] + ')' for s in sections)
    body = ['<a id="' + s['identity'] + '"></a>\n\n' + shift(s['text'], 2 if s['kind'] == 'chapter' else 1) for s in sections]
    return cover + '\n\n\n## ' + order.get('toc_title', '目录') + '\n\n' + toc + '\n\n\n' + '\n\n\n'.join(body) + '\n'


def source_snapshot(source):
    source = Path(source).resolve()
    return {str(p.relative_to(source)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(source.rglob('*')) if p.is_file()}


def cover_metadata(source):
    source = Path(source).resolve()
    order = load_order(source)
    blocks = source_file(source, order['cover_file']).read_text(encoding='utf-8').strip().split('\n\n')
    require(len(blocks) == 3 and blocks[0].startswith('# '), 'Title page needs title, edition label and source verification date')
    edition = re.fullmatch(r'(.+?)\s*·\s*v([A-Za-z0-9._-]+)', blocks[1])
    verified = re.fullmatch(r'资料核验日期：(\d{4})年(\d{1,2})月(\d{1,2})日', blocks[2])
    require(edition is not None and verified is not None, 'Invalid title-page edition or source verification date')
    from datetime import date
    source_date = date(*map(int, verified.groups())).isoformat()
    return {'title': blocks[0][2:], 'edition_label': edition[1], 'source_version': edition[2], 'source_verified_date': source_date, 'source_verified_label': blocks[2]}
