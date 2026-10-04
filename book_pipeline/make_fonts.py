from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
import argparse
P=argparse.ArgumentParser(description='Build licensed, renamed CJK font subsets from system Noto fonts.')
P.add_argument('--directory',type=Path,required=True)
P.add_argument('--font-dir',type=Path,default=Path('/usr/share/fonts/opentype/noto'))
A=P.parse_args();work=A.directory.resolve()
chars=(work/'cover-metadata.json').read_text()+(work/'chapters.html').read_text()+Path(__file__).with_name('reviewed_pdf.py').read_text()+''.join(chr(i) for i in range(32,127))+'0123456789'
for style in ['Regular','Bold']:
 f=TTFont(A.font_dir/('NotoSansCJK-'+style+'.ttc'),fontNumber=2)
 original_names={n: f['name'].getDebugName(n) for n in [0,13,14]};options=subset.Options();options.notdef_glyph=True;options.notdef_outline=True
 s=subset.Subsetter(options=options);s.populate(text=chars);s.subset(f)
 order=f.getGlyphOrder(); gs=f.getGlyphSet(); glyfs={}
 for name in order:
  pen=TTGlyphPen(gs);gs[name].draw(Cu2QuPen(pen,1.0,reverse_direction=True));glyfs[name]=pen.glyph()
 fb=FontBuilder(f['head'].unitsPerEm,isTTF=True)
 fb.setupGlyphOrder(order);fb.setupCharacterMap(f.getBestCmap());fb.setupGlyf(glyfs)
 fb.setupHorizontalMetrics(f['hmtx'].metrics);fb.setupHorizontalHeader(ascent=f['hhea'].ascent,descent=f['hhea'].descent)
 fb.setupNameTable({'familyName':'Atlas Sans '+style,'styleName':style,'uniqueFontIdentifier':'AtlasSans'+style,'fullName':'Atlas Sans '+style,'psName':'AtlasSans'+style,'copyright':original_names[0],'licenseDescription':original_names[13],'licenseInfoURL':original_names[14]})
 fb.setupOS2(sTypoAscender=f['OS/2'].sTypoAscender,sTypoDescender=f['OS/2'].sTypoDescender,usWinAscent=f['OS/2'].usWinAscent,usWinDescent=f['OS/2'].usWinDescent)
 fb.setupPost();fb.setupMaxp();fb.save(work/('AtlasSans-'+style+'.ttf'))
 print(style,len(order),'glyphs')

import shutil
for name in ['DejaVuSans.ttf','DejaVuSansMono.ttf']:
 shutil.copy2(Path('/usr/share/fonts/truetype/dejavu')/name,work/name)
