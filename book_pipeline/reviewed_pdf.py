from pathlib import Path
from lxml import html as LH
import re, html, json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle, XPreformatted, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab import rl_config
rl_config.useA85=False
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT,TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import reportlab.lib.textsplit as _ts
import reportlab.platypus.paragraph as _pp
_ts.ALL_CANNOT_START += '，；：？！％…》〉”’'
_pp.ALL_CANNOT_START = _ts.ALL_CANNOT_START
import argparse
P=argparse.ArgumentParser(description='Render the reviewed complete-book layout.')
P.add_argument('--input',type=Path,required=True,help='Prepared source directory')
P.add_argument('--output',type=Path,required=True)
P.add_argument('--version',required=True)
P.add_argument('--date',required=True,help='Publication build date; source verification date is preserved')
A=P.parse_args();W=A.input.resolve();OUT=A.output.resolve();OUT.parent.mkdir(parents=True,exist_ok=True)
COVER=json.loads((W/'cover-metadata.json').read_text())
TITLE=COVER['title'];EDITION_LABEL=COVER['edition_label'];SOURCE_DATE=COVER['source_verified_date'];SOURCE_LABEL=COVER['source_verified_label']
for style in ['Regular','Bold']:
 pdfmetrics.registerFont(TTFont('Atlas'+style,str(W/('AtlasSans-'+style+'.ttf'))))
pdfmetrics.registerFontFamily('AtlasRegular',normal='AtlasRegular',bold='AtlasBold',italic='AtlasRegular',boldItalic='AtlasBold')
pdfmetrics.registerFont(TTFont('Symbols',str(W/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Code',str(W/'DejaVuSansMono.ttf')))
BLACK=colors.HexColor('#000000'); GRAY=colors.HexColor('#627080'); BLUE=colors.HexColor('#245471')
styles={
'p':ParagraphStyle('body',fontName='AtlasRegular',fontSize=10.5,leading=18.2,textColor=BLACK,spaceAfter=8,wordWrap='CJK',splitLongWords=True,allowWidows=0,allowOrphans=0),
'h1':ParagraphStyle('h1',fontName='AtlasBold',fontSize=21,leading=31,spaceAfter=16,keepWithNext=True,wordWrap='CJK'),
'h2':ParagraphStyle('h2',fontName='AtlasBold',fontSize=14,leading=21,spaceBefore=17,spaceAfter=9,keepWithNext=True,wordWrap='CJK'),
'h3':ParagraphStyle('h3',fontName='AtlasBold',fontSize=11.8,leading=19,spaceBefore=10,spaceAfter=7,keepWithNext=True,wordWrap='CJK'),
'caption':ParagraphStyle('caption',fontName='AtlasRegular',fontSize=8.7,leading=14.3,textColor=GRAY,spaceAfter=12,wordWrap='CJK'),
'li':ParagraphStyle('list',fontName='AtlasRegular',fontSize=10.3,leading=17.8,textColor=BLACK,spaceAfter=6,leftIndent=13,firstLineIndent=0,bulletIndent=1,wordWrap='CJK',allowWidows=0,allowOrphans=0),
'cell':ParagraphStyle('cell',fontName='AtlasRegular',fontSize=9,leading=14.8,textColor=BLACK,wordWrap='CJK'),
'code':ParagraphStyle('code',fontName='Code',fontSize=7.8,leading=12,spaceBefore=6,spaceAfter=10,leftIndent=9,rightIndent=9,borderPadding=9,backColor=colors.HexColor('#f3f5f7')),
}
styles['source']=ParagraphStyle('source',parent=styles['p'],fontSize=9.2,leading=15.6,spaceAfter=7)
styles['source_li']=ParagraphStyle('source_li',parent=styles['li'],fontSize=9.2,leading=15.6,spaceAfter=5)
heading_data=[]
class Doc(SimpleDocTemplate):
 def beforeDocument(self):
  self.page_titles={h['page']:h['part'] for h in heading_data if h.get('part')}
  heading_data.clear();self.current_part=EDITION_LABEL+' · v'+A.version
 def afterFlowable(self,f):
  if getattr(f,'heading_id',None):
   self.canv.bookmarkPage(f.heading_id)
   self.canv.addOutlineEntry(f.getPlainText(),f.heading_id,f.heading_level-1,False)
   heading_data.append({'text':f.getPlainText(),'page':self.page,'level':f.heading_level,'id':f.heading_id,'part':getattr(f,'part_title',None)})
   if getattr(f,'toc_level',None) is not None:self.notify('TOCEntry',(f.toc_level,f.getPlainText(),self.page,f.heading_id))
   if getattr(f,'part_title',None):self.current_part=f.part_title

def footer(c,d):
 c.saveState(); c.setFont('AtlasRegular',8);c.setFillColor(GRAY)
 if d.page>1:
  c.drawString(57,812,TITLE)
  c.drawRightString(A4[0]-57,812,d.page_titles.get(d.page,d.current_part))
 c.setFont('AtlasRegular',7.5);c.drawString(57,29,'资料核验日期 '+SOURCE_DATE+' · '+EDITION_LABEL);c.drawRightString(A4[0]-57,29,str(d.page));c.restoreState()

def text_markup(text,code=False):
 out=[]
 for ch in text:
  char=html.escape(ch)
  if ord(ch) not in pdfmetrics.getFont('AtlasRegular').face.charToGlyph and ord(ch) in pdfmetrics.getFont('Symbols').face.charToGlyph:
   char='<font name="Symbols">'+char+'</font>'
  elif code and ord(ch)<127:
   char='<font name="Code" size="8.5">'+char+'</font>'
  out.append(char)
 return ''.join(out)

def inline(e):
 out=text_markup(e.text or '')
 for child in e:
  val=inline(child);tag=child.tag
  if tag in ('strong','b'): val='<b>'+val+'</b>'
  elif tag in ('em','i'): val='<i>'+val+'</i>'
  elif tag=='code':val=text_markup(child.text_content(),True)
  elif tag=='a':
   href=child.attrib.get('href','')
   if href:val='<a href="'+html.escape(href,quote=True)+'" color="#245471">'+val+'</a>'
  elif tag=='br':val='<br/>'
  out+=val+text_markup(child.tail or '')
 # Keep short source references with the closing words of the same sentence.
 out=re.sub(r'([^<>]{3,8})(<a href="[^"]+" color="#245471">S\d+</a>)$',r'<nobr>\1\2</nobr>',out)
 if e.tag=='p' and ('对区组设计与随机化的讨论' in e.text_content() or '取得与过期判断作为一个原子操作完成' in e.text_content() or 'Unicode 标量值则排除了代理码点' in e.text_content()):
  out=out.replace('<nobr>','<br/><nobr>')
 return out

def code_markup(text):
 result=[]
 for line in text.rstrip('\n').split('\n'):
  # Keep all source characters; only split visually if a source line exceeds the text width.
  out=[]; cur='';width=0
  for ch in line:
   fn='AtlasRegular' if ord(ch)>127 else 'Code'
   cw=pdfmetrics.stringWidth(ch,fn,7.8)
   if width+cw>457 and cur:
    out.append(cur);cur='';width=0
   cur+=ch;width+=cw
  out.append(cur)
  for segment in out:
   escaped=html.escape(segment)
   escaped=re.sub(r'([^\x00-\x7f]+)',r'<font name="AtlasRegular">\1</font>',escaped)
   result.append(escaped)
 return '\n'.join(result)

def blocks(nodes):
 result=[]
 source_section=False
 for e in nodes:
  if not isinstance(e.tag,str):continue
  tag=e.tag
  if tag in ['h1','h2','h3']:
   if tag=='h2' and e.text_content() in ['来源与阅读边界','资料与适用范围','参考资料','本章资料与核验范围']: source_section=True
   p=Paragraph(inline(e),styles[tag]);p.heading_id=e.attrib['id'];p.heading_level=int(tag[1]);result.append(p)
  elif tag=='p':
   images=e.findall('img')
   if images:
    for img in images:
     file=(W/img.attrib['src']) if Path(img.attrib['src']).suffix.lower() in ['.jpg','.jpeg'] else W/'figures'/(Path(img.attrib['src']).stem+'.png')
     iw,ih=ImageReader(str(file)).getSize();width=min(481,430*iw/ih);height=width*ih/iw
     f=Image(str(file),width=width,height=height);f.hAlign='CENTER';f.keepWithNext=True
     gap=Spacer(1,6);gap.keepWithNext=True
     result.extend([Spacer(1,5),f,gap])
   else:
    p=Paragraph(inline(e),styles['caption' if 'caption' in e.attrib.get('class','') else ('source' if source_section else 'p')])
    if e.text_content().rstrip().endswith('：') or (len(e)==1 and e[0].tag=='strong' and not (e[0].tail or '').strip()): p.keepWithNext=True
    result.append(p)
  elif tag=='pre':
   pre=XPreformatted(code_markup(''.join(e.itertext())),ParagraphStyle('long-code',parent=styles['code'],leading=11) if len(''.join(e.itertext()).splitlines()) > 28 else styles['code'])
   if result and isinstance(result[-1],Paragraph) and (getattr(result[-1], 'heading_id', None) or result[-1].getPlainText().rstrip().endswith('：')) and len(''.join(e.itertext()).splitlines()) <= 28:
    intro=result.pop(); result.append(KeepTogether([intro,pre]))
   else: result.append(pre if len(''.join(e.itertext()).splitlines()) > 28 else KeepTogether([pre]))
  elif tag in ['ul','ol']:
   for i,li in enumerate(e.findall('li'),int(e.attrib.get('start','1'))):
    vals=li.findall('p')
    if vals:
     for k,p in enumerate(vals):result.append(Paragraph(inline(p),styles['source_li' if source_section else 'li'],bulletText=(f'{i}.' if tag=='ol' else '•') if k==0 else None))
    else:result.append(Paragraph(inline(li),styles['source_li' if source_section else 'li'],bulletText=f'{i}.' if tag=='ol' else '•'))
  elif tag=='table':
   rows=[]
   for tr in e.findall('.//tr'):
    row=[]
    for c in tr:
     content=inline(c)
     if c.tag=='th':content='<b>'+content+'</b>'
     row.append(Paragraph(content,styles['cell']))
    rows.append(row)
   
   first=' '.join(c.getPlainText() for c in rows[0])
   widths=[481/len(rows[0])]*len(rows[0])
   table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
   table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#d9d9d9')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6edf3')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f8fa')]),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
   result.extend([Spacer(1,5),table,Spacer(1,12)])
  elif tag=='blockquote':
   result.extend(blocks(list(e)))
  elif tag=='hr':result.append(Spacer(1,8))
  else:
   raise ValueError('Unexpected block '+tag)
 return result
coverstyle=ParagraphStyle('cover',parent=styles['h1'],fontSize=29,leading=44,spaceAfter=17)
small=ParagraphStyle('small',parent=styles['p'],fontSize=9,leading=16,textColor=GRAY)
linkstyle=ParagraphStyle('link',parent=styles['p'],fontSize=12.8,leading=23,spaceAfter=12)
story=[Spacer(1,34),Paragraph('MODERN ENGINEER ATLAS',small),Spacer(1,32),Paragraph(('现代软件工程师<br/>能力地图' if TITLE=='现代软件工程师能力地图' else html.escape(TITLE)),ParagraphStyle('whole-cover',parent=coverstyle,fontSize=34,leading=52)),Spacer(1,17),Paragraph('从计算基础到系统、机器人与 AI 工程',styles['h2']),Paragraph('十三篇 · 五十八章 · 二百三十二个主题',styles['p']),Spacer(1,34),Paragraph(EDITION_LABEL+' · v'+A.version,styles['h2']),Paragraph(html.escape(SOURCE_LABEL),small),Spacer(1,27),Paragraph('以 C++20 为主要技术基线，分清语言保证、实现条件与实验证据。<br/>用工程故障、原创图解与真实硬件照片连接知识、岗位和面试追问。',styles['p']),Spacer(1,32),Paragraph('代码与构造案例未经编译、运行或实物测试；适用版本及证据边界见各章。',small)]
story.append(PageBreak())
toc_title=Paragraph('目录',styles['h1']);toc_title.heading_id='contents';toc_title.heading_level=1;story.append(toc_title)
story.append(Paragraph('点击篇章名称或页码可以跳转。PDF书签另含各节及分节。',small))
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc-part',fontName='AtlasBold',fontSize=11,leading=19,spaceBefore=9,spaceAfter=5,leftIndent=0,firstLineIndent=0,wordWrap='CJK'),ParagraphStyle('toc-chapter',fontName='AtlasRegular',fontSize=10.1,leading=17.5,spaceBefore=1,spaceAfter=3,leftIndent=16,firstLineIndent=0,wordWrap='CJK')]
toc.dotsMinLevel=0;story.append(toc)
tree=LH.parse(str(W/'chapters.html'))
for article in tree.findall('.//article'):
 kind=article.get('data-kind');identity=article.get('data-identity');part=article.get('data-part')
 story.append(PageBreak())
 flows=blocks(list(article))
 for f in flows:
  if getattr(f,'heading_id',None):
   original=f.heading_level
   if kind=='chapter':f.heading_level=original+1
   if original==1:
    f.toc_level=1 if kind=='chapter' else 0
    if kind in ['part','front','back']:f.part_title=f.getPlainText()
    elif part:f.part_title=part
  if kind=='part' and isinstance(f,Paragraph) and getattr(f,'heading_level',None)==1:
   f.style=ParagraphStyle('part-title',parent=styles['h1'],fontSize=25,leading=39,spaceBefore=90,spaceAfter=32)
 story.extend(flows)
doc=Doc(str(OUT),pagesize=A4,leftMargin=57,rightMargin=57,topMargin=61,bottomMargin=51,title=TITLE+' 完整书稿 v'+A.version,author='',subject='十三篇 五十八章 计算基础 C++ 系统工程 机器人 人工智能 · 构建 '+A.date,pageCompression=1)
doc.multiBuild(story,onFirstPage=footer,onLaterPages=footer)
# Preserve supplementary-plane characters in extraction and accessibility maps.
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DecodedStreamObject,NameObject
reader=PdfReader(str(OUT));writer=PdfWriter();writer.clone_document_from_reader(reader)
seen=set()
for pg in writer.pages:
 for ref in pg['/Resources'].get('/Font',{}).values():
  font=ref.get_object()
  if id(font) in seen:continue
  seen.add(id(font))
  cmap=font.get('/ToUnicode')
  if cmap:
   raw=cmap.get_object().get_data().decode('latin1')
   fixed=re.sub(r'<([0-9A-Fa-f]{5,6})>',lambda m:'<'+chr(int(m[1],16)).encode('utf-16-be').hex().upper()+'>',raw)
   if fixed!=raw:
    stream=DecodedStreamObject();stream.set_data(fixed.encode('latin1'));font[NameObject('/ToUnicode')]=writer._add_object(stream)
tmp=OUT.with_suffix('.tmp.pdf')
with tmp.open('wb') as f:writer.write(f)
tmp.replace(OUT)
(W/'heading-pages.json').write_text(json.dumps(heading_data,ensure_ascii=False,indent=2))
print(OUT);print('headings',len(heading_data));print('pages',doc.page)
