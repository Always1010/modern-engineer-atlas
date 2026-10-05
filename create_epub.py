"""Create a reflowable EPUB from the same local chapter snapshot as the PDF."""
from pathlib import Path
from lxml import html as LH
import argparse,subprocess,shutil,re,json,zipfile,unicodedata
from fontTools.ttLib import TTFont
from book_pipeline.edition import prepared_profile
from lxml import etree
P=argparse.ArgumentParser(description=__doc__)
P.add_argument('--input',type=Path,required=True,help='Prepared build directory')
P.add_argument('--output',type=Path,required=True)
P.add_argument('--version',required=True)
P.add_argument('--date',required=True,help='Publication build date; source verification date is preserved')
P.add_argument('--css',type=Path,default=Path(__file__).parent/'assets/epub.css')
A=P.parse_args();W=A.input.resolve();A.output=A.output.resolve();A.output.parent.mkdir(parents=True,exist_ok=True)
COVER=json.loads((W/'cover-metadata.json').read_text())
# Reviewed fallback names come from the validated source edition profile.
SAFE_PNG=set(prepared_profile(W)['epub_png_fallbacks'])
tree=LH.parse(str(W/'chapters.html'))
for article in tree.findall('.//article'):
 chapter=article.get('data-kind')=='chapter'
 if chapter:
  for h in article.xpath('.//h1|.//h2|.//h3'):h.tag='h'+str(int(h.tag[1])+1)
 for im in article.xpath('.//img'):
  stem=Path(im.get('src')).stem
  if Path(im.get('src')).suffix.lower()=='.svg':im.set('src',('figures/'+stem+'.png') if stem+'.svg' in SAFE_PNG else ('diagram-svg/'+stem+'.svg'))
  im.set('style','max-width:100%;height:auto;')
 for p in article.xpath('.//p[@class="caption"]'):p.set('style','font-size:0.85em;')
(W/'epub-input.html').write_text(LH.tostring(tree,encoding='unicode',doctype='<!DOCTYPE html>'))
shutil.copy2(A.css,W/'book.css')
cmd=['pandoc',str(W/'epub-input.html'),'-f','html','-t','epub3','-o',str(A.output),'--toc','--no-highlight','--toc-depth=3','--split-level=2','--resource-path='+str(W),'--css='+str(W/'book.css'),'-M','title='+COVER['title'],'-M','subtitle='+COVER['edition_label']+' · v'+A.version,'-M','lang=zh-CN','-M','toc-title=目录','-M','date='+A.date,'--epub-title-page=true']
for f in ['AtlasSans-Regular.ttf','AtlasSans-Bold.ttf','DejaVuSans.ttf','DejaVuSansMono.ttf']:cmd+=['--epub-embed-font='+str(W/f)]
subprocess.run(cmd,check=True)
epub=A.output
# Use the reader-facing Chinese navigation title; retain the EPUB navigation structure.
tmp=epub.with_suffix('.tmp.epub')
atlas_cmap=TTFont(W/'AtlasSans-Regular.ttf').getBestCmap()
symbol_cmap=TTFont(W/'DejaVuSans.ttf').getBestCmap()
def wrap_symbols(doc):
 slots=[(e,attribute) for e in doc.iter() if isinstance(e.tag,str) and e.tag.rsplit('}',1)[-1] not in ['style','script'] for attribute in ['text','tail'] if getattr(e,attribute,None)]
 for e,attribute in slots:
  original=getattr(e,attribute);clusters=[]
  for ch in original:
   is_script=ch in '¹²³ʰᴺᵀᵢᵣᵧⱼ' or 0x2070<=ord(ch)<=0x209F
   prior=clusters[-1][-1] if clusters else ''
   joins=bool(prior) and ((prior.isascii() and prior.isalnum()) or 0x0370<=ord(prior)<=0x03FF or prior in '¹²³ʰᴺᵀᵢᵣᵧⱼ' or 0x2070<=ord(prior)<=0x209F)
   if clusters and (unicodedata.combining(ch) or (is_script and joins)):clusters[-1]+=ch
   else:clusters.append(ch)
  groups=[]
  for cluster in clusters:
   special=any((ord(c) not in atlas_cmap or c in '¹²³' or 0x2070<=ord(c)<=0x209F) and ord(c) in symbol_cmap for c in cluster)
   if groups and groups[-1][0]==special:groups[-1][1]+=cluster
   else:groups.append([special,cluster])
  if not any(g[0] for g in groups):continue
  if attribute=='text':parent=e;index=0;setattr(e,attribute,'');anchor=None
  else:
   parent=e.getparent()
   if parent is None:continue
   index=parent.index(e)+1;setattr(e,attribute,'');anchor=e
  for special,txt in groups:
   if special:
    span=etree.Element('{http://www.w3.org/1999/xhtml}span',{'class':'symbol'});span.text=txt;parent.insert(index,span);index+=1;anchor=span
   elif anchor is None:parent.text=(parent.text or '')+txt
   else:anchor.tail=(anchor.tail or '')+txt
 return doc
import posixpath
with zipfile.ZipFile(epub) as zin:
 data={info.filename:zin.read(info.filename) for info in zin.infolist()}
 opf=etree.fromstring(data['EPUB/content.opf'])
 for item in opf.xpath('//*[local-name()="manifest"]/*'):
  if item.get('media-type')=='application/xhtml+xml':
   name=posixpath.normpath('EPUB/'+item.get('href'))
   doc=etree.fromstring(data[name])
   vector=any(x.lower().split('#')[0].endswith('.svg') for x in doc.xpath('//@src|//@href')) or bool(doc.xpath('//*[local-name()="svg"]'))
   props=[x for x in item.get('properties','').split() if x!='svg']
   if vector:props.append('svg')
   if props:item.set('properties',' '.join(props))
   elif 'properties' in item.attrib:del item.attrib['properties']
 data['EPUB/content.opf']=etree.tostring(opf,encoding='UTF-8',xml_declaration=True)
 with zipfile.ZipFile(tmp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as zout:
  for info in zin.infolist():
   content=data[info.filename]
   if info.filename.endswith('.xhtml'):
    doc=etree.fromstring(content)
    if info.filename.endswith('/nav.xhtml'):
     for el in doc.xpath('//*[@id="toc-title"]'):el.text='目录'
    before=''.join(doc.itertext());doc=wrap_symbols(doc);assert ''.join(doc.itertext())==before
    content=etree.tostring(doc,encoding='UTF-8',xml_declaration=True,doctype='<!DOCTYPE html>')
   info.compress_type=zipfile.ZIP_STORED if info.filename=='mimetype' else zipfile.ZIP_DEFLATED
   zout.writestr(info,content,compresslevel=9)
tmp.replace(epub)
print(epub)
