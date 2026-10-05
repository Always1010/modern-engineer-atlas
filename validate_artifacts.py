"""Fail closed unless the real complete manuscript survives both publication formats."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import unquote, urlsplit
import zipfile

import fitz
from lxml import etree, html as LH
from book_pipeline.assembly import assemble_markdown, source_snapshot, cover_metadata
from book_pipeline.manuscript import DEFAULT_SOURCE, require, validate_source
from checksums import verify_checksums
from book_pipeline.edition import edition_profile, prepared_profile, checked_diagram_exports


def compact(text):
    return re.sub(r'\s+', '', text)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check_epub(path, tree, directory, source):
    profile = edition_profile(source)
    require(prepared_profile(directory) == profile, 'Prepared edition profile differs from source edition')
    fallback_names = set(profile['epub_png_fallbacks'])
    with zipfile.ZipFile(path) as archive:
        require(archive.testzip() is None, 'Broken EPUB ZIP CRC')
        names = archive.namelist()
        require(len(names) == len(set(names)), 'Duplicate EPUB entries')
        require(names[0] == 'mimetype' and archive.infolist()[0].compress_type == zipfile.ZIP_STORED, 'EPUB mimetype must be first and uncompressed')
        require(archive.read('mimetype') == b'application/epub+zip', 'Wrong EPUB mimetype')
        container = etree.fromstring(archive.read('META-INF/container.xml'))
        opfpath = container.xpath('//*[local-name()="rootfile"]/@full-path')[0]
        opf = etree.fromstring(archive.read(opfpath))
        opfdir = posixpath.dirname(opfpath)
        manifest = opf.xpath('//*[local-name()="manifest"]/*')
        items = {item.get('id'): item for item in manifest}
        require(len(items) == len(manifest), 'Duplicate OPF manifest IDs')
        spine = opf.xpath('//*[local-name()="spine"]/*/@idref')
        require(len(spine) >= 58 and all(i in items for i in spine), 'EPUB spine is incomplete')
        docs, ids = {}, {}
        for name in names:
            if name.endswith(('.xhtml', '.html', '.opf', '.ncx', '.xml', '.svg')):
                doc = etree.fromstring(archive.read(name))
                docids = doc.xpath('//@id')
                require(len(docids) == len(set(docids)), f'Duplicate IDs: {name}')
                docs[name], ids[name] = doc, set(docids)
        for name, doc in docs.items():
            for href in doc.xpath('//@href|//@src|//@*[local-name()="href"]'):
                parsed = urlsplit(href)
                if parsed.scheme or href.startswith('//'):
                    continue
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(parsed.path))) if parsed.path else name
                require(target in names, f'Missing EPUB resource: {name}: {href}')
                if parsed.fragment and target in ids:
                    require(unquote(parsed.fragment) in ids[target], f'Broken EPUB fragment: {name}: {href}')
        for name in names:
            if name.endswith('.css'):
                for href in re.findall(r'url\([\'\"]?([^\)\'\"]+)', archive.read(name).decode()):
                    require(':' in href or posixpath.normpath(posixpath.join(posixpath.dirname(name), href)) in names, f'Missing CSS font/resource: {href}')
        chapter_docs = {}
        chapter_paths = {}
        for name, doc in docs.items():
            if not name.endswith('.xhtml') or name.endswith('nav.xhtml'):
                continue
            for chapter in doc.xpath('//*[@id]'):
                identity = chapter.get('id')
                if re.fullmatch(r'chapter-c\d{2}', identity):
                    require(identity not in chapter_docs, f'Duplicate EPUB chapter: {identity}')
                    chapter_docs[identity] = chapter
                    chapter_paths[identity] = name
        require(len(chapter_docs) == 58, 'EPUB missing complete chapter bodies')
        # Compare every maintained body section, including front/back matter and part introductions.
        canonical = {a.get('data-identity'): a for a in tree.xpath('//article[@data-identity]')}
        # EPUB splitting can spread front/back sections over several spine documents.
        # Read text in spine order and switch ownership at each canonical section anchor.
        actual_sections, seen_sections, active = {}, set(), None
        def collect(node):
            nonlocal active
            identity = node.get('id')
            if identity in canonical:
                require(identity not in seen_sections, 'Duplicate EPUB book section')
                seen_sections.add(identity)
                active = identity
                actual_sections[identity] = []
            if active is not None and node.text:
                actual_sections[active].append(node.text)
            for child in node:
                collect(child)
                if active is not None and child.tail:
                    actual_sections[active].append(child.tail)
        for item_id in spine:
            name = posixpath.normpath(opfdir + '/' + items[item_id].get('href'))
            if name.endswith('.xhtml') and name in docs:
                for body in docs[name].xpath('//*[local-name()="body"]'):
                    collect(body)
        require(set(actual_sections) == set(canonical), 'EPUB missing complete book sections')
        for identity, expected in canonical.items():
            message = 'EPUB changed or truncated chapter prose' if identity.startswith('chapter-') else 'EPUB changed book section prose'
            require(compact(expected.text_content()) == compact(''.join(actual_sections[identity])), f'{message}: {identity}')
        title = opf.xpath('//*[local-name()="metadata"]/*[local-name()="title"]/text()')
        require(title and title[0] == cover_metadata(source)['title'], 'EPUB title differs from current title page')
        code_count = 0
        for chapter in tree.xpath('//article[@data-kind="chapter"]'):
            identity = chapter.get('data-identity')
            actual = chapter_docs[identity]
            require(compact(chapter.text_content()) == compact(''.join(actual.itertext())), f'EPUB changed or truncated chapter prose: {identity}')
            expected_code = [''.join(pre.itertext()).rstrip('\n') for pre in chapter.xpath('.//pre')]
            actual_code = [''.join(pre.itertext()).rstrip('\n') for pre in actual.xpath('.//*[local-name()="pre"]')]
            require(expected_code == actual_code, f'EPUB changed technical code: {identity}')
            code_count += len(actual_code)
        media = Counter(item.get('media-type') for item in manifest)
        expected_media = Counter({'image/svg+xml': profile['diagrams'] - len(fallback_names), 'image/png': len(fallback_names), 'image/jpeg': profile['photos']})
        require(Counter({kind: count for kind, count in media.items() if kind.startswith('image/')}) == expected_media, f'Incorrect EPUB figure formats: {media}')
        expected_photos = Counter(digest(p.read_bytes()) for p in (source / 'resources').glob('*.jpg'))
        actual_photos = Counter(digest(archive.read(posixpath.normpath(opfdir + '/' + item.get('href')))) for item in manifest if item.get('media-type') == 'image/jpeg')
        require(actual_photos == expected_photos, 'EPUB photographs changed')
        expected_vectors = {digest(p.read_bytes()) for p in (directory / 'diagram-svg').glob('*.svg')}
        expected_pngs = {digest(p.read_bytes()) for p in (directory / 'figures').glob('*.png')}
        figure_count = 0
        for name, doc in docs.items():
            if name.endswith('.xhtml') and not name.endswith('nav.xhtml'):
                imgs = doc.xpath('//*[local-name()="img"]')
                require(all(img.get('alt', '').strip() for img in imgs), f'Missing EPUB image alt: {name}')
                figure_count += len(imgs)
        require(figure_count == profile['figures'], f'EPUB image placements missing: {figure_count}')
        # Compare each placement in chapter order, including its alt text and exact exported bytes.
        for chapter in tree.xpath('//article[@data-kind="chapter"]'):
            identity = chapter.get('data-identity')
            expected_placements = []
            for img in chapter.xpath('.//img'):
                relative = Path(img.get('src'))
                if relative.suffix == '.svg':
                    relative = Path('figures') / (relative.stem + '.png') if relative.name in fallback_names else Path('diagram-svg') / relative.name
                expected_placements.append((img.get('alt'), digest((directory / relative).read_bytes())))
            actual_placements = []
            for img in chapter_docs[identity].xpath('.//*[local-name()="img"]'):
                resource = posixpath.normpath(posixpath.join(posixpath.dirname(chapter_paths[identity]), unquote(img.get('src'))))
                actual_placements.append((img.get('alt'), digest(archive.read(resource))))
            require(actual_placements == expected_placements, f'EPUB changed figure placement, alt text or bytes: {identity}')
        for item in manifest:
            name = posixpath.normpath(opfdir + '/' + item.get('href'))
            media_type = item.get('media-type')
            if media_type == 'image/svg+xml':
                require(digest(archive.read(name)) in expected_vectors, 'Unexpected SVG diagram bytes')
                require(not docs[name].xpath('//*[local-name()="text" or local-name()="script" or local-name()="image"]'), 'SVG must be outlined and self-contained')
            elif media_type == 'image/png':
                require(digest(archive.read(name)) in expected_pngs, 'Unexpected PNG fallback bytes')
            elif media_type == 'application/xhtml+xml':
                vector = any(h.lower().split('#')[0].endswith('.svg') for h in docs[name].xpath('//@src|//@href')) or bool(docs[name].xpath('//*[local-name()="svg"]'))
                require(('svg' in item.get('properties', '').split()) == vector, f'Incorrect SVG OPF property: {name}')
        fonts = [name for name in names if name.endswith('.ttf')]
        require(len(fonts) == 4, 'Missing embedded font family')
        body_text = compact(''.join(''.join(doc.itertext()) for name, doc in docs.items() if name.endswith('.xhtml')))
        for credit in ['SIL OPEN FONT LICENSE', 'DejaVu', '图片来源与许可', '字体版权与许可']:
            require(compact(credit) in body_text, f'Missing EPUB license/credit: {credit}')
        navs = [item for item in manifest if 'nav' in item.get('properties', '').split()]
        require(len(navs) == 1, 'Missing unique EPUB navigation')
        nav = docs[posixpath.normpath(opfdir + '/' + navs[0].get('href'))]
        navpath = posixpath.normpath(opfdir + '/' + navs[0].get('href'))
        navlinks = nav.xpath('//@href')
        require(all(any(posixpath.normpath(posixpath.join(posixpath.dirname(navpath), urlsplit(h).path)) == chapter_paths[identity] and urlsplit(h).fragment in ('', identity) for h in navlinks) for identity in chapter_docs), 'Incomplete chapter navigation')
        require(code_count == len(tree.xpath('//article[@data-kind=\"chapter\"]//pre')), 'EPUB missing code fences')
        return {'sections_with_exact_prose': len(canonical), 'chapters_with_exact_prose': 58, 'topics': 232, 'exact_code_fences': code_count, 'figure_placements': figure_count, 'ordered_figure_placements_valid': True, 'svg': expected_media['image/svg+xml'], 'png_fallbacks': len(fallback_names), 'byte_identical_photos': profile['photos'], 'embedded_fonts': 4, 'spine_documents': len(spine), 'links_and_xml_valid': True, 'epubcheck': 'not run by this validator; separate CI gate required'}


def check_pdf(path, tree, source):
    profile = edition_profile(source)
    with fitz.open(path) as document:
        require(not document.is_encrypted and len(document) >= 700, 'PDF truncated or outline-only')
        toc = document.get_toc()
        chapters = tree.xpath('//article[@data-kind="chapter"]')
        alltext = compact(''.join(page.get_text(clip=fitz.Rect(45, 45, 550, 793)) for page in document))
        require(len(alltext) >= 700000, f'PDF lacks substantive text: {len(alltext)}')
        require('\ufffd' not in alltext, 'PDF has Unicode replacement characters')
        topics = 0
        for chapter in chapters:
            title = chapter.find('h1').text_content()
            entries = [entry for entry in toc if compact(entry[1]) == compact(title)]
            require(len(entries) == 1, f'Missing or duplicate PDF chapter bookmark: {title}')
            # Check every numbered topic and substantial prose at both chapter ends.
            for heading in chapter.xpath('./h2'):
                if re.match(r'^\d+\.\d+\s', heading.text_content()):
                    require(compact(heading.text_content()) in alltext, f'Missing PDF topic: {heading.text_content()}')
                    topics += 1
            paragraphs = [p.text_content() for p in chapter.xpath('./p') if len(compact(p.text_content())) >= 100]
            for sample in [paragraphs[0], paragraphs[-1]]:
                require(compact(sample)[:100] in alltext, f'Missing PDF body prose: {title}')
        require(topics == 232, 'PDF missing numbered topics')
        paragraphs = [element for element in tree.xpath('//article//p | //article//li[not(.//li)] | //article/h1 | //article/h2 | //article/h3') if len(compact(element.text_content())) >= 20]
        require(all(compact(element.text_content()) in alltext for element in paragraphs), 'PDF changed or omitted a complete source paragraph')
        require(compact(cover_metadata(source)['title']) in compact(document[0].get_text()), 'PDF title differs from current title page')
        code = [compact(''.join(element.itertext())) for element in tree.xpath('//pre')]
        require(all(block in alltext for block in code), 'PDF changed or omitted technical code')
        for page in document:
            for block in page.get_text('dict')['blocks']:
                if block['type'] != 0:
                    continue
                for line in block['lines']:
                    for span in line['spans']:
                        x0, y0, x1, y1 = span['bbox']
                        require(x0 >= 47 and x1 <= 550 and y0 >= 14 and y1 <= 825, f'PDF text outside the reviewed bounds on page {page.number + 1}')
        badlinks = [(i + 1, link) for i, page in enumerate(document) for link in page.get_links() if link['kind'] == fitz.LINK_GOTO and not 0 <= link.get('page', -1) < len(document)]
        require(not badlinks, f'Invalid PDF internal links: {badlinks[:3]}')
        require(all(len(page.get_text().strip()) >= 5 for page in document), 'Empty PDF page')
        photos = {image[0] for page in document for image in page.get_images(full=True)}
        require(len(photos) == profile['photos'], 'PDF photograph count differs from edition profile')
        expected = Counter(digest(p.read_bytes()) for p in (source / 'resources').glob('*.jpg'))
        actual = Counter(digest(document.xref_stream_raw(xref)) for xref in photos)
        require(expected == actual, 'PDF photograph bytes changed')
        vectors = [xref for xref in range(1, document.xref_length()) if document.xref_get_key(xref, 'AtlasVectorSource')[0] == 'string']
        expected_vector_names = Counter(p.stem for p in (source / 'resources').glob('*.svg'))
        actual_vector_names = Counter(document.xref_get_key(xref, 'AtlasVectorSource')[1] for xref in vectors)
        require(len(vectors) == profile['diagrams'] and actual_vector_names == expected_vector_names, 'PDF missing or duplicated vector diagrams')
        for credit in ['SIL OPEN FONT LICENSE', 'DejaVu', '图片来源与许可', '字体版权与许可']:
            require(compact(credit) in alltext, f'Missing PDF license/credit: {credit}')
        return {'pages': len(document), 'chapters': 58, 'topics': topics, 'substantive_extracted_characters': len(alltext), 'complete_source_paragraphs': len(paragraphs), 'exact_code_fences': len(code), 'text_bounds_valid': True, 'bookmarks': len(toc), 'outlined_diagrams': len(vectors), 'byte_identical_photos': len(photos), 'internal_links_valid': True, 'empty_pages': 0}


def validate(source, directory, pdf, epub, checksums=None):
    source_report = validate_source(source)
    require(prepared_profile(directory) == source_report['edition_profile'], 'Prepared edition profile differs from source edition')
    require((directory / 'book.md').read_text(encoding='utf-8') == assemble_markdown(source), 'Prepared manuscript differs from current chapter sources')
    require(json.loads((directory / 'cover-metadata.json').read_text()) == cover_metadata(source), 'Prepared cover metadata is stale')
    prepared = json.loads((directory / 'source-validation.json').read_text())
    require(prepared.get('input_snapshot') == source_snapshot(source), 'Prepared input snapshot is stale')
    require(prepared.get('prepared_html_sha256') == digest((directory / 'chapters.html').read_bytes()), 'Prepared HTML differs from validated assembly')
    from build_source import render_sections
    require((directory / 'chapters.html').read_text(encoding='utf-8') == render_sections(source), 'Prepared HTML differs from current chapter sources')
    for asset in json.loads((source / 'asset-manifest.json').read_text()):
        require(digest((directory / asset['file']).read_bytes()) == asset['sha256'], f'Prepared resource differs from source: {asset["file"]}')
    checked_diagram_exports(source, directory)
    tree = LH.parse(str(directory / 'chapters.html'))
    require(len(tree.xpath('//article[@data-kind="chapter"]')) == 58, 'Prepared HTML missing chapters')
    report = {'source': {key: value for key, value in source_report.items() if key != 'chapters'}, 'pdf': check_pdf(pdf, tree, source), 'epub': check_epub(epub, tree, directory, source)}
    if checksums:
        verify_checksums(checksums)
        report['checksums_verified'] = True
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--build-dir', type=Path, default=Path('build'))
    parser.add_argument('--pdf', type=Path, required=True)
    parser.add_argument('--epub', type=Path, required=True)
    parser.add_argument('--checksums', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    report = validate(args.source, args.build_dir, args.pdf, args.epub, args.checksums)
    payload = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(payload)
    print(payload)


if __name__ == '__main__':
    main()
