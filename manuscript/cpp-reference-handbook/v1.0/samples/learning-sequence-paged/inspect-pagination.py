"""Validate actual section starts and font embedding in the final review PDF."""
import json
import re
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

edition = Path(__file__).resolve().parents[2]
pdf_path = edition / 'output/pdf/Handbook-learning-sequence-paged.pdf'
qa = edition / 'qa/learning-sequence-paged'
sections, topics, fonts = [], [], {}
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, 1):
        body = [c for c in page.chars if 45 < c['top'] < page.height - 45]
        assert body, f'Blank page: {index}'
        first_top = min(c['top'] for c in body)
        for word in page.extract_words(extra_attrs=['size'], keep_blank_chars=True):
            text = word['text'].strip()
            item = {'heading': text, 'page': index, 'top': round(word['top'], 2),
                    'at_page_start': abs(word['top'] - first_top) < 2}
            if re.match(r'^1\.[123](?:\s|$)', text) and word['size'] > 20:
                sections.append(item)
            if re.match(r'^1\.[123]\.\d+(?:\s|$)', text) and 12 < word['size'] < 16:
                topics.append(item)
reader = PdfReader(pdf_path)
for page in reader.pages:
    for ref in page['/Resources'].get('/Font', {}).values():
        font = ref.get_object()
        name = str(font.get('/BaseFont', 'unknown'))
        embedded = []
        for desc in font.get('/DescendantFonts', [font]):
            descriptor = desc.get_object().get('/FontDescriptor')
            embedded.append(bool(descriptor and any(k in descriptor.get_object()
                            for k in ('/FontFile', '/FontFile2', '/FontFile3'))))
        fonts[name] = {'name': name, 'embedded': all(embedded)}
result = {'pages': len(reader.pages), 'section_starts': sections, 'topics': topics,
          'topics_not_at_page_start': sum(not t['at_page_start'] for t in topics),
          'embedded_fonts': all(f['embedded'] for f in fonts.values()), 'font_count': len(fonts)}
assert len(sections) == 3 and all(s['at_page_start'] for s in sections), sections
assert len(topics) == 30 and result['topics_not_at_page_start'] > 0
assert result['embedded_fonts']
(qa / 'pagination-review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in result.items() if k != 'topics'}, ensure_ascii=False))
