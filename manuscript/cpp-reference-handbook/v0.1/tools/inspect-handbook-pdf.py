"""Inspect a rendered handbook PDF and produce contact sheets from Poppler PNGs.
Uses only existing bundled dependencies; never installs software.
"""
import json
import re
import sys
from pathlib import Path
import pdfplumber
from pypdf import PdfReader
from PIL import Image, ImageDraw

edition = Path(__file__).resolve().parents[1]
pdf_path = edition / "output/pdf/Cpp-Reference-Handbook-v0.1.pdf"
qa = edition / "qa/fullbook"
qa.mkdir(parents=True, exist_ok=True)
reader = PdfReader(pdf_path)
pages = []
outside = []
replacement = []
chapters = {}
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""
        pages.append({"page": index, "characters": len(text),
                      "body_characters": len("".join(c["text"] for c in page.chars
                          if 45 < c["top"] < page.height - 45)),
                      "starts": text.splitlines()[:4], "ends": text.splitlines()[-3:]})
        if "\ufffd" in text:
            replacement.append(index)
        for char in page.chars:
            # Headers/footers intentionally use the outer margin; all glyphs must still remain on paper.
            if char["x0"] < 35 or char["x1"] > page.width-35 or char["top"] < 10 or char["bottom"] > page.height-10:
                outside.append({"page":index,"text":char["text"],"box":[char["x0"],char["top"],char["x1"],char["bottom"]]})
        for match in re.finditer(r"第(\d{1,2})章",text):
            number = int(match.group(1))
            chapters.setdefault(number,[]).append(index)
report = {"pdf":pdf_path.name,"pages":len(reader.pages),"chapter_numbers":sorted(chapters),
          "chapter_pages":chapters,"replacement_character_pages":replacement,
          "outside_page_bounds":outside[:50],"outside_page_bounds_count":len(outside),
          "page_text":pages}
report["needs_sparse_page_review"] = [p["page"] for p in pages
                                     if p["body_characters"] < 170 and p["page"] > 3]
(qa/"pdf-inspection.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
if len(sys.argv)>1 and sys.argv[1] == "--sheets":
    images = sorted((p for p in qa.glob("page-*.png")
                     if int(p.stem.split("-")[-1]) <= len(reader.pages)),
                    key=lambda p:int(p.stem.split("-")[-1]))
    if len(images) != len(reader.pages):
        raise RuntimeError("Render every PDF page first with pdftoppm.")
    cell_w, cell_h, batch = 300, 451, 12
    for start in range(0,len(images),batch):
        sheet=Image.new("RGB",(cell_w*4,cell_h*3),"#dce3eb")
        draw=ImageDraw.Draw(sheet)
        for offset,image_path in enumerate(images[start:start+batch]):
            with Image.open(image_path) as img:
                img.thumbnail((cell_w-12,cell_h-28))
                x=(offset%4)*cell_w+6
                y=(offset//4)*cell_h+22
                sheet.paste(img,(x,y))
                draw.text((x,y-17),f"Page {start+offset+1}",fill="#172b43")
        sheet.save(qa/f"contact-{start//batch+1:02}.png")
print(json.dumps({k:v for k,v in report.items() if k not in ("page_text","chapter_pages","outside_page_bounds")},ensure_ascii=False,indent=2))
expected_count = json.loads((edition / 'catalog.json').read_text(encoding='utf8'))['chapterCount']
if outside or replacement or sorted(chapters) != list(range(1,expected_count+1)):
    sys.exit(1)
