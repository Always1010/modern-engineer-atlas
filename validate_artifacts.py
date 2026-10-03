import argparse
import csv
import hashlib
import json
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ElementTree
from pathlib import Path

import fitz


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def sha256(path):
    digest=hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda:handle.read(1024*1024),b''): digest.update(chunk)
    return digest.hexdigest()


def main():
    parser=argparse.ArgumentParser(description='Validate manuscript coverage and generated PDF/EPUB structure.')
    parser.add_argument('--manuscript',type=Path,required=True)
    parser.add_argument('--catalog',type=Path,default=Path('planning/catalog-data.json'))
    parser.add_argument('--epub',type=Path,required=True)
    parser.add_argument('--pdf',type=Path,required=True)
    parser.add_argument('--checksums',type=Path)
    args=parser.parse_args(); root=Path(__file__).resolve().parent
    paths={name:(value if value.is_absolute() else root/value) for name,value in vars(args).items() if isinstance(value,Path)}
    manuscript=paths['manuscript']; catalog=paths['catalog']; epub=paths['epub']; pdf=paths['pdf']
    for label,path in [('manuscript',manuscript),('catalog',catalog),('EPUB',epub),('PDF',pdf)]:
        require(path.is_file() and path.stat().st_size>0,f'{label} missing or empty: {path}')
    source=manuscript.read_text(encoding='utf-8')
    data=json.loads(catalog.read_text(encoding='utf-8'))
    ids={chapter[0] for _,_,chapters in data for chapter in chapters}
    sections={f'{chapter[0]}.{index:02}' for _,_,chapters in data for chapter in chapters for index in range(1,len(chapter[-2].split('；'))+1)}
    nodes=ids|sections
    require(all(node in source for node in nodes),'manuscript chapter/section coverage failed')
    for row in csv.DictReader((root/'planning/dependency-edges.csv').open(encoding='utf-8')):
        require(row['from'] in nodes and row['to'] in nodes,f"invalid dependency edge: {row}")
    for image in re.findall(r'!\[[^\]]*\]\(([^)]+)\)',source):
        require((root/image).is_file(),f'missing manuscript image: {image}')

    with zipfile.ZipFile(epub) as archive:
        names=archive.namelist()
        require(names and names[0]=='mimetype' and archive.read('mimetype')==b'application/epub+zip','EPUB mimetype is invalid')
        require(archive.getinfo('mimetype').compress_type==zipfile.ZIP_STORED,'EPUB mimetype is compressed')
        container=ElementTree.fromstring(archive.read('META-INF/container.xml'))
        rootfile=next(node.attrib['full-path'] for node in container.iter() if node.tag.endswith('rootfile'))
        opf=ElementTree.fromstring(archive.read(rootfile)); ns={'o':'http://www.idpf.org/2007/opf'}
        manifest={node.attrib['id']:node.attrib for node in opf.findall('o:manifest/o:item',ns)}
        spine=opf.findall('o:spine/o:itemref',ns)
        require(spine and all(node.attrib['idref'] in manifest for node in spine),'EPUB spine references missing manifest item')
        require(any('nav' in item.get('properties','') for item in manifest.values()),'EPUB navigation document missing')
        for item in manifest.values():
            target=posixpath.normpath(posixpath.join(posixpath.dirname(rootfile),item['href'].split('#',1)[0]))
            require(target in names,f'EPUB manifest target missing: {target}')
        epub_text='\n'.join(' '.join(ElementTree.fromstring(archive.read(name)).itertext()) for name in names if name.endswith('.xhtml'))
        require(all(node in epub_text for node in nodes),'EPUB chapter/section coverage failed')

    document=fitz.open(pdf); pdf_text='\n'.join(page.get_text() for page in document)
    require(len(document)>0 and all(node in pdf_text for node in nodes),'PDF chapter/section coverage failed')
    if args.checksums:
        checksum_path=paths['checksums']; expected={}
        for line in checksum_path.read_text(encoding='utf-8').splitlines():
            digest,name=line.split('  ',1); expected[name]=digest
        for path in (epub,pdf): require(expected.get(path.name)==sha256(path),f'checksum mismatch: {path.name}')
    print(json.dumps({'parts':len(data),'chapters':len(ids),'sections':len(sections),'pdf_pages':len(document),'epub_structural_checks':'pass','chapter_and_section_coverage':'pass','md_image_paths':'pass','file_integrity':'pass' if args.checksums else 'not requested','epubcheck':'run by workflow'},ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
