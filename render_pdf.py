from pathlib import Path
import re,html
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Image,PageBreak,KeepTogether
from reportlab.lib.pagesizes import letter
p=Path(__file__).resolve().parent
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
base=dict(fontName='STSong-Light',wordWrap='CJK',textColor=colors.HexColor('#17212a'))
styles={
'body':ParagraphStyle('body',fontSize=10.5,leading=16,spaceAfter=6,**base),
'meta':ParagraphStyle('meta',fontSize=9.3,leading=14,spaceAfter=5,**base),
'cell':ParagraphStyle('cell',fontSize=9,leading=13,spaceAfter=0,**base),
'h1':ParagraphStyle('h1',fontSize=21,leading=28,spaceBefore=20,spaceAfter=14,keepWithNext=True,**base),
'h2':ParagraphStyle('h2',fontSize=16,leading=23,spaceBefore=18,spaceAfter=10,keepWithNext=True,**base),
'h3':ParagraphStyle('h3',fontSize=13,leading=19,spaceBefore=13,spaceAfter=7,keepWithNext=True,**base),
'h4':ParagraphStyle('h4',fontSize=12,leading=18,spaceBefore=12,spaceAfter=6,keepWithNext=True,**base),
'bullet':ParagraphStyle('bullet',fontSize=10.3,leading=15.5,leftIndent=10,firstLineIndent=-8,spaceAfter=4,**base)}
def inline(t):
 t=html.escape(t)
 t=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',lambda m:'<link href="'+m[2]+'" color="#174f72">'+m[1]+'</link>',t)
 t=re.sub(r'`([^`]+)`',r'\1',t)
 return t
story=[];lines=(p/'Modern-Engineering-Book-Plan-V1.zh-CN.md').read_text().splitlines();i=0;heads=[]
while i<len(lines):
 line=lines[i];i+=1
 if not line.strip():continue
 if line.startswith('|'):
  rows=[line]
  while i<len(lines) and lines[i].startswith('|'):rows.append(lines[i]);i+=1
  parsed=[]
  for row in rows:
   cols=[v.strip() for v in row.strip('|').split('|')]
   if all(re.fullmatch('[-: ]+',v) for v in cols):continue
   parsed.append([Paragraph(inline(v),styles['cell']) for v in cols])
  n=len(parsed[0]);width=516
  widths={4:[85,180,105,146],5:[85,125,100,140,66],6:[43,100,93,100,130,50]}.get(n,[width/n]*n)
  tab=Table(parsed,colWidths=widths,repeatRows=1,hAlign='LEFT')
  tab.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.45,colors.HexColor('#d9d9d9')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e2eaf0')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f8fa')]),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
  story.extend([tab,Spacer(1,9)]);continue
 m=re.match(r'!\[(.*?)\]\((.*?)\)',line)
 if m:
  img=Image(str(p/m[2]),width=510,height=387.6);story.extend([img,Spacer(1,7)]);continue
 m=re.match(r'^(#{1,4}) (.*)',line)
 if m:
  lev=len(m[1]);text=m[2]
  para=Paragraph(inline(text),styles[f'h{lev}']);para.bookmark='section'+str(len(heads));para.outlinelevel=min(lev-1,2);para.outlinetext=text;heads.append(text);story.append(para);continue
 style='body'
 if line.startswith('- '):line='- '+line[2:];style='bullet'
 elif line.startswith('适读：') or line.startswith('配图重点：'):style='meta'
 story.append(Paragraph(inline(line),styles[style]))
grouped=[]; j=0
while j<len(story):
 item=story[j]
 is_part=hasattr(item,'outlinetext') and re.match(r'P[0-9]{2} ',item.outlinetext)
 is_ch=hasattr(item,'outlinetext') and re.match(r'C[0-9]{2} ',item.outlinetext)
 if is_part or is_ch:
  group=[item]; j+=1
  if is_part and j<len(story) and hasattr(story[j],'outlinetext'):
   group.append(story[j]);j+=1
  while j<len(story) and not hasattr(story[j],'outlinetext'):
   group.append(story[j]);j+=1
  grouped.append(KeepTogether(group))
 elif isinstance(item,Image):
  group=[item];j+=1
  while j<len(story) and isinstance(story[j],Spacer):group.append(story[j]);j+=1
  if j<len(story) and isinstance(story[j],Paragraph):group.append(story[j]);j+=1
  grouped.append(KeepTogether(group))
 else:grouped.append(item);j+=1
story=grouped
class Doc(SimpleDocTemplate):
 def afterFlowable(self,flowable):
  if hasattr(flowable,'bookmark'):
   self.canv.bookmarkPage(flowable.bookmark)
   level=flowable.outlinelevel
   last=getattr(self,'lastlevel',-1)
   level=min(level,last+1)
   self.canv.addOutlineEntry(flowable.outlinetext,flowable.bookmark,level,closed=True)
   self.lastlevel=level

def footer(c,doc):
 c.setFont('STSong-Light',8);c.setFillColor(colors.HexColor('#657584'))
 c.drawString(48,24,'现代 C++ 与软件工程师面试指南  |  第一阶段规划 V1  |  2026-10-03')
 c.drawRightString(564,24,str(doc.page))
Doc(str(p/'exports/Modern-Engineering-Book-Plan-V1.zh-CN.pdf'),pagesize=letter,rightMargin=48,leftMargin=48,topMargin=42,bottomMargin=42,title='现代 C++ 与软件工程师面试指南 第一阶段研究与规划 V1',author='').build(story,onFirstPage=footer,onLaterPages=footer)
print('PDF ready')
