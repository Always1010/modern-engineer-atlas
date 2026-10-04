"""Optional full-format regression; enabled after the clean publication build."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
import fitz
from lxml import etree
from build_source import build
from book_pipeline.assembly import source_snapshot
from book_pipeline.manuscript import DEFAULT_SOURCE, code_blocks
from validate_artifacts import compact, validate

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / os.environ.get('BOOK_TEST_BUILD', 'build')
ENABLED = os.environ.get('BOOK_TEST_EXPORT_PROPAGATION') == '1'


@unittest.skipUnless(ENABLED and (BUILD / 'diagram-svg').exists(), 'Enable BOOK_TEST_EXPORT_PROPAGATION=1 after a clean build')
class ChapterExportPropagationTests(unittest.TestCase):
    def test_one_chapter_edit_reaches_markdown_pdf_and_epub(self):
        original_snapshot = source_snapshot(DEFAULT_SOURCE)
        with tempfile.TemporaryDirectory(prefix='chapter-edit-regression-') as temp:
            root = Path(temp)
            source, directory = root / 'source', root / 'build'
            shutil.copytree(DEFAULT_SOURCE, source)
            chapter = next((source / 'chapters').glob('C01*.md'))
            prose_marker = 'CHAPTERPROSEEDIT20261004'
            code_marker = 'CHAPTERCODEEDIT20261004'
            front_marker = 'FRONTMATTEREDIT20261004'
            back_marker = 'BACKMATTEREDIT20261004'
            title_marker = '现代软件工程师能力地图验证'
            chapter.write_text(chapter.read_text() + '\n\n' + prose_marker + '\n\n```text\n' + code_marker + '\n```\n')
            for filename, marker in [('front-matter/reading-guide.md', front_marker), ('back-matter/edition-notes.md', back_marker)]:
                path = source / filename
                path.write_text(path.read_text() + '\n\n' + marker + '\n')
            title = source / 'front-matter/title-page.md'
            title.write_text(title.read_text().replace('# 现代软件工程师能力地图', '# ' + title_marker, 1))
            report = build(source, directory)
            baseline_fences = sum(len(code_blocks(p.read_text())) for p in (DEFAULT_SOURCE / 'chapters').glob('*.md'))
            self.assertEqual(report['code_fences'], baseline_fences + 1)
            # Reuse only unchanged diagram exports; no prebuilt book is copied.
            for name in ['figures', 'diagram-pdf', 'diagram-svg']:
                shutil.copytree(BUILD / name, directory / name)
            subprocess.run([sys.executable, str(ROOT / 'book_pipeline/make_fonts.py'), '--directory', str(directory)], check=True)
            pdf, epub = root / 'changed.pdf', root / 'changed.epub'
            for script, target in [('render_pdf.py', pdf), ('create_epub.py', epub)]:
                subprocess.run([sys.executable, str(ROOT / script), '--input', str(directory), '--output', str(target), '--version', 'propagation-test', '--date', '2026-10-04'], check=True)
            result = validate(source, directory, pdf, epub)
            markdown = (directory / 'book.md').read_text()
            with fitz.open(pdf) as doc:
                pdf_text = compact(''.join(page.get_text() for page in doc))
            with zipfile.ZipFile(epub) as archive:
                epub_text = compact(''.join(''.join(etree.fromstring(archive.read(name)).itertext()) for name in archive.namelist() if name.endswith('.xhtml')))
            for marker in [prose_marker, code_marker, front_marker, back_marker, title_marker]:
                self.assertIn(marker, markdown)
                self.assertIn(compact(marker), pdf_text)
                self.assertIn(compact(marker), epub_text)
            self.assertEqual(source_snapshot(DEFAULT_SOURCE), original_snapshot)
            evidence = {'status': 'passed', 'canonical_sources_unchanged': True, 'chapter_prose_and_code_propagate': True, 'front_back_matter_and_cover_propagate': True, 'formats': ['Markdown', 'PDF', 'EPUB'], 'baseline_code_fences': baseline_fences, 'mutated_code_fences': report['code_fences'], 'validated_mutated_sections': result['epub']['sections_with_exact_prose']}
            (BUILD / 'chapter-edit-regression.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
