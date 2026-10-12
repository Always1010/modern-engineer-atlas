"""Check chapter/section new pages and flowing subsections in the final PDF."""
import json
from pathlib import Path
from urllib.parse import unquote
import pdfplumber
from pypdf import PdfReader

edition = Path(__file__).resolve().parents[1]
pdf_path = edition / "output/pdf/Cpp-Reference-Handbook-v1.0.pdf"
reader = PdfReader(pdf_path)
catalog = json.loads((edition / "catalog.json").read_text(encoding="utf-8"))
destinations = {unquote(str(name).removeprefix("/")): dest
                for name, dest in reader.named_destinations.items()}
sections = [section for group in catalog["chapters"] for section in group["sections"]]
errors, section_pages, chapter_pages, topics = [], [], [], []
with pdfplumber.open(pdf_path) as pdf:
    for group in catalog["chapters"]:
        dest = destinations["chapter-" + str(group["number"])]
        index = reader.get_destination_page_number(dest)
        if abs(float(dest.top) - float(reader.pages[index].mediabox.height)) > 2:
            errors.append("Chapter does not begin at new page: " + str(group["number"]))
        chapter_pages.append({"chapter": group["number"], "page": index + 1})
    for section in sections:
        dest = destinations[section["id"]]
        index = reader.get_destination_page_number(dest)
        page = pdf.pages[index]
        large = [char for char in page.chars if char["size"] > 20 and char["top"] > 45]
        line_top = min(c["top"] for c in large)
        first = "".join(c["text"] for c in large if abs(c["top"] - line_top) < 1)
        if not first.startswith(section["number"]) or line_top > 80:
            errors.append("Section title not first body heading: " + section["id"])
        if abs(float(dest.top) - page.height) > 2:
            errors.append("Section does not begin at new page: " + section["id"])
        section_pages.append({"id": section["id"], "number": section["number"],
                              "page": index + 1, "title_top_pt": round(line_top, 2)})
        for anchor in section["anchors"]:
            if anchor["level"] != 2:
                continue
            dest = destinations[anchor["anchor"]]
            target = reader.get_destination_page_number(dest)
            top = float(reader.pages[target].mediabox.height) - float(dest.top)
            topics.append({"anchor": anchor["anchor"], "page": target + 1,
                           "top_pt": round(top, 2), "flows_in_page": top > 100})
    cover = pdf.pages[0].extract_text()
    if "v1.0" not in cover:
        errors.append("Cover version missing")
    if "v0.2" in cover:
        errors.append("Stale cover version")
if len({r["page"] for r in section_pages + chapter_pages}) != 42:
    errors.append("Chapter/section start pages overlap")
if not any(t["flows_in_page"] for t in topics):
    errors.append("No flowing subsection found")
fonts = {}
for page in reader.pages:
    for font_ref in page["/Resources"].get("/Font", {}).values():
        font = font_ref.get_object()
        for actual in font.get("/DescendantFonts", [font]):
            actual = actual.get_object()
            name = str(actual.get("/BaseFont", font.get("/BaseFont")))
            descriptor = actual.get("/FontDescriptor")
            embedded = bool(descriptor and any(k in descriptor.get_object()
                            for k in ["/FontFile", "/FontFile2", "/FontFile3"]))
            fonts[name] = embedded
if not fonts or not all(fonts.values()):
    errors.append("Unembedded font")
report = {"version": "1.0", "pages": len(reader.pages), "chapter_starts": chapter_pages,
          "section_starts": section_pages, "checked_subsections": len(topics),
          "flowing_subsections": sum(t["flows_in_page"] for t in topics),
          "embedded_fonts": fonts, "topic_positions": topics, "errors": errors}
qa = edition / "qa/learning-revision"
(qa / "pagination-check.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({k: v for k, v in report.items()
                  if k not in ["topic_positions", "embedded_fonts", "chapter_starts", "section_starts"]}
                 | {"embedded_font_count": len(fonts), "chapter_count": len(chapter_pages),
                    "section_count": len(section_pages)}, ensure_ascii=False))
if errors:
    raise SystemExit(1)
