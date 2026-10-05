import json
from pathlib import Path
import shutil
import tempfile
import unittest

from book_pipeline.edition import edition_profile
from book_pipeline.assembly import assemble_markdown, read_sections, source_snapshot
from book_pipeline.manuscript import DEFAULT_SOURCE, BOOK_NAME, code_blocks, validate_source


class CompleteSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / 'source'
        shutil.copytree(DEFAULT_SOURCE, self.source)
        self.profile = edition_profile(self.source)
        self.baseline_fences = sum(len(code_blocks(p.read_text(encoding='utf-8'))) for p in (self.source / 'chapters').glob('*.md'))

    def test_complete_source_has_real_coverage(self):
        report = validate_source(self.source)
        self.assertEqual((report['chapter_count'], report['topics'], report['figures'], report['code_fences']), (58, 232, self.profile['figures'], self.baseline_fences))
        self.assertTrue(all(chapter['characters'] >= 12000 for chapter in report['chapters']))
        self.assertTrue(report['chapter_sources_authoritative'])
        self.assertFalse((self.source / BOOK_NAME).exists())
        self.assertFalse((Path(__file__).resolve().parents[1] / 'book_pipeline/edition-lock.json').exists())

    def test_catalog_only_cannot_pass(self):
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        chapter.write_text('# 第一章 目录\n\n' + '\n'.join(f'## 1.{i} 仅有标题' for i in range(1, 5)), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'truncated or outline-only'):
            validate_source(self.source)

    def test_missing_chapter_fails(self):
        next((self.source / 'chapters').glob('C58*.md')).unlink()
        with self.assertRaisesRegex(ValueError, '58 separate chapter'):
            validate_source(self.source)

    def test_chapter_prose_edit_succeeds_without_a_lock_or_merged_source(self):
        before = validate_source(self.source)
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        original = chapter.read_text(encoding='utf-8')
        marker = 'Canonical chapter prose maintenance sentinel'
        edited = original + '\n\n' + marker + '\n'
        chapter.write_text(edited, encoding='utf-8')
        after = validate_source(self.source)
        self.assertNotEqual(before['manuscript_sha256'], after['manuscript_sha256'])
        self.assertNotEqual(before['chapters'][0]['sha256'], after['chapters'][0]['sha256'])
        self.assertIn(marker, assemble_markdown(self.source))
        self.assertFalse((self.source / BOOK_NAME).exists())

    def test_existing_code_edit_succeeds_and_is_preserved(self):
        chapter = next(p for p in sorted((self.source / 'chapters').glob('*.md')) if code_blocks(p.read_text(encoding='utf-8')))
        original = chapter.read_text(encoding='utf-8')
        block = code_blocks(original)[0]
        edited = original.replace(block, '// chapter-maintenance example\n' + block, 1)
        chapter.write_text(edited, encoding='utf-8')
        report = validate_source(self.source)
        self.assertEqual(report['code_fences'], self.baseline_fences)
        section = next(s for s in read_sections(self.source) if s['identity'] == 'chapter-' + chapter.name[:3].lower())
        self.assertEqual(code_blocks(edited), code_blocks(section['text']))
        self.assertIn('// chapter-maintenance example\n' + block, assemble_markdown(self.source))

    def test_added_code_fence_updates_coverage_and_preserves_relative_paths(self):
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        extra = '\n\n````text\n## untouched heading\n../resources/example.svg\n[S1]: https://example.invalid/code-only\n```\n~~~~\n````\n'
        chapter.write_text(chapter.read_text(encoding='utf-8') + extra, encoding='utf-8')
        report = validate_source(self.source)
        self.assertEqual(report['code_fences'], self.baseline_fences + 1)
        self.assertIn(code_blocks(extra)[0], code_blocks(assemble_markdown(self.source)))
        self.assertIn(extra.strip(), assemble_markdown(self.source))

    def test_fenced_markdown_is_not_counted_as_topics_or_figures(self):
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        extra = '\n\n````markdown\n## 1.1 This is example code\n![example](../resources/not-a-real-image.svg)\n````\n'
        chapter.write_text(chapter.read_text(encoding='utf-8') + extra, encoding='utf-8')
        report = validate_source(self.source)
        self.assertEqual((report['topics'], report['figures'], report['code_fences']), (232, self.profile['figures'], self.baseline_fences + 1))
        self.assertIn(extra.strip(), assemble_markdown(self.source))

    def test_external_figure_cannot_bypass_asset_manifest(self):
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        chapter.write_text(chapter.read_text() + '\n\n![Undeclared figure](https://example.invalid/figure.jpg)\n')
        with self.assertRaisesRegex(ValueError, 'declared local resource'):
            validate_source(self.source)

    def test_validation_does_not_change_any_source_file(self):
        before = source_snapshot(self.source)
        validate_source(self.source)
        self.assertEqual(source_snapshot(self.source), before)

    def test_changed_asset_fails(self):
        asset = self.source / json.loads((self.source / 'asset-manifest.json').read_text())[0]['file']
        asset.write_text(asset.read_text() + '\n')
        with self.assertRaisesRegex(ValueError, 'Asset missing or modified'):
            validate_source(self.source)

    def test_missing_asset_fails(self):
        next((self.source / 'resources').glob('*.jpg')).unlink()
        with self.assertRaisesRegex(ValueError, 'Asset missing or modified'):
            validate_source(self.source)

    def test_invalid_version_cannot_start_build(self):
        from build_book import build_book
        with self.assertRaisesRegex(ValueError, 'Unsafe version'):
            build_book(self.source, Path(self.temp.name) / 'build', Path(self.temp.name) / 'dist', '../escape', '2026-10-04')
        self.assertFalse((Path(self.temp.name) / 'build').exists())

    def test_invalid_date_cannot_start_build(self):
        from build_book import build_book
        with self.assertRaises(ValueError):
            build_book(self.source, Path(self.temp.name) / 'build', Path(self.temp.name) / 'dist', '1.0.0', '2026-99-99')
        self.assertFalse((Path(self.temp.name) / 'build').exists())

    def test_fences_preserve_code(self):
        self.assertEqual(code_blocks('```cpp\nint x = 1;\n```\n~~~text\n## untouched\n~~~'), ['int x = 1;', '## untouched'])
        with self.assertRaisesRegex(ValueError, 'Unclosed'):
            code_blocks('```cpp\nincomplete')


if __name__ == '__main__':
    unittest.main()
