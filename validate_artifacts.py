from pathlib import Path
import json,re,csv,zipfile,posixpath,xml.etree.ElementTree as E
import fitz
p=Path(__file__).resolve().parent;s=(p/'Modern-Engineering-Book-Plan-V1.zh-CN.md').read_text()
d=json.loads((p/'planning/catalog-data.json').read_text());ids={c[0] for _,_,cs in d for c in cs};sec={f'{c[0]}.{i:02}' for _,_,cs in d for c in cs for i in range(1,5)}
assert len(ids)==58 and len(sec)==232
for row in csv.DictReader((p/'planning/dependency-edges.csv').open()):
 assert row['from'] in ids|sec,row
 assert row['to'] in ids|sec,row
for im in re.findall(r'!\[[^\]]*\]\(([^)]+)\)',s):assert (p/im).exists()
fn=p/'exports/Modern-Engineering-Book-Plan-V1.zh-CN.epub'
with zipfile.ZipFile(fn) as z:
 assert z.namelist()[0]=='mimetype' and z.read('mimetype')==b'application/epub+zip'
 assert z.getinfo('mimetype').compress_type==0
 cont=E.fromstring(z.read('META-INF/container.xml'));opfpath=next(x.attrib['full-path'] for x in cont.iter() if x.tag.endswith('rootfile'))
 opf=E.fromstring(z.read(opfpath));ns={'o':'http://www.idpf.org/2007/opf','d':'http://purl.org/dc/elements/1.1/'}
 manifest={x.attrib['id']:x.attrib for x in opf.findall('o:manifest/o:item',ns)}
 for x in opf.findall('o:spine/o:itemref',ns):assert x.attrib['idref'] in manifest
 assert any('nav' in x.get('properties','') for x in manifest.values())
 for x in manifest.values(): assert posixpath.normpath(posixpath.join(posixpath.dirname(opfpath),x['href'])) in z.namelist()
 texts=[]
 for n in z.namelist():
  if n.endswith('.xhtml'):
   root=E.fromstring(z.read(n));texts.append(' '.join(root.itertext()))
 joined='\n'.join(texts)
 for c in ids|sec:assert c in joined,c
pdf=fitz.open(p/'exports/Modern-Engineering-Book-Plan-V1.zh-CN.pdf');tx='\n'.join(x.get_text() for x in pdf)
for c in ids|sec:assert c in tx,c
print(json.dumps({'parts':len(d),'chapters':len(ids),'sections':len(sec),'pdf_pages':len(pdf),'epub_structural_checks':'pass','chapter_and_section_coverage':'pass','md_image_paths':'pass','device_reader_test':'not performed','full_epubcheck':'not installed'},ensure_ascii=False,indent=2))
