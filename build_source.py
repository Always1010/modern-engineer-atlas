"""Assemble reviewed 58-chapter source into the exact publication HTML structure."""
import argparse
import json
from pathlib import Path
import re
import shutil
import hashlib
from html import escape
import subprocess
from lxml import html as LH
from book_pipeline.assembly import assemble_markdown, source_snapshot, cover_metadata
from book_pipeline.manuscript import DEFAULT_SOURCE, BOOK_NAME, read_sections, validate_source, require


def render_sections(source):
    articles = []
    for section in read_sections(source):
        rendered = subprocess.check_output(['pandoc', '-f', 'markdown-implicit_figures', '-t', 'html5', '--no-highlight'], input=section['text'] + '\n', text=True)
        doc = LH.fragment_fromstring(rendered, create_parent='article')
        identity = section['identity']
        doc.set('data-kind', section['kind'])
        doc.set('data-identity', identity)
        if section['part']:
            doc.set('data-part', section['part'])
        ids = {}
        for element in doc.xpath('.//*[@id]'):
            old = element.get('id')
            new = identity + '-' + old
            ids[old] = new
            element.set('id', new)
        first = doc.find('h1')
        if first is not None:
            old_prefixed = first.get('id')
            for old, new in list(ids.items()):
                if new == old_prefixed:
                    ids[old] = identity
            first.set('id', identity)
        for element in doc.xpath('.//a[@href]'):
            href = element.get('href')
            if href.startswith('#') and href[1:] in ids:
                element.set('href', '#' + ids[href[1:]])
        for element in doc.xpath('.//p'):
            if re.match(r'^图\s*\d+-', element.text_content()):
                element.set('class', 'caption')
        articles.append(LH.tostring(doc, encoding='unicode'))
    full = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + escape(cover_metadata(source)['title']) + '</title></head><body>' + ''.join(articles) + '</body></html>'
    doc = LH.fromstring(full)
    ids = doc.xpath('//@id')
    require(len(ids) == len(set(ids)), 'Duplicate generated anchors')
    require(all(h[1:] in ids for h in doc.xpath('//a/@href') if h.startswith('#')), 'Broken manuscript fragment')
    return full


def build(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    require(output != source and source not in output.parents and output not in source.parents, 'Build output must not modify the source bundle')
    report = validate_source(source)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'edition-profile.json').write_text(json.dumps(report['edition_profile'], ensure_ascii=False, indent=2) + '\n')
    shutil.copytree(source / 'resources', output / 'resources', dirs_exist_ok=True)
    for name in ['FONT-LICENSES.txt', 'photo-license-manifest.json', 'asset-manifest.json']:
        shutil.copy2(source / name, output / name)
    (output / 'cover-metadata.json').write_text(json.dumps(cover_metadata(source), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    markdown = assemble_markdown(source)
    (output / 'book.md').write_text(markdown, encoding='utf-8')
    full = render_sections(source)
    (output / 'chapters.html').write_text(full, encoding='utf-8')
    report['input_snapshot'] = source_snapshot(source)
    report['prepared_html_sha256'] = hashlib.sha256(full.encode('utf-8')).hexdigest()
    (output / 'source-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Validated and assembled {report["chapter_count"]} chapters, {report["topics"]} topics, {report["figures"]} figures, {report["code_fences"]} code fences')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=DEFAULT_SOURCE, help='Complete edition source directory')
    parser.add_argument('--output-dir', type=Path, default=Path('build'))
    args = parser.parse_args()
    build(args.input.resolve(), args.output_dir.resolve())


if __name__ == '__main__':
    main()
