"""Fast regression checks for editable, chapter-authoritative publication inputs."""
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from lxml import html as LH

from book_pipeline.assembly import assemble_markdown, normalize_chapter, read_sections, source_snapshot
from book_pipeline.manuscript import BOOK_NAME, DEFAULT_SOURCE, code_blocks


class ChapterAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / 'source'
        shutil.copytree(DEFAULT_SOURCE, self.source)
        self.order_file = self.source / 'book-order.json'
        self.order = json.loads(self.order_file.read_text(encoding='utf-8'))

    def save_order(self):
        self.order_file.write_text(json.dumps(self.order, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    def test_assembly_is_deterministic_without_a_merged_file(self):
        self.assertFalse((self.source / BOOK_NAME).exists())
        before = source_snapshot(self.source)
        first = assemble_markdown(self.source)
        self.assertEqual(first, assemble_markdown(self.source))
        sections = read_sections(self.source)
        self.assertEqual([s['identity'] for s in sections], [s['id'] for s in self.order['sections']])
        for section in sections:
            self.assertEqual(first.count('<a id="' + section['identity'] + '"></a>'), 1)
        self.assertEqual(code_blocks(first), [block for section in sections for block in code_blocks(section['text'])])
        self.assertEqual(source_snapshot(self.source), before)

    def test_obsolete_merged_file_cannot_override_chapter_text(self):
        obsolete = self.source / BOOK_NAME
        obsolete.write_text('OBSOLETE_MERGED_SOURCE_SENTINEL', encoding='utf-8')
        assembled = assemble_markdown(self.source)
        self.assertNotIn('OBSOLETE_MERGED_SOURCE_SENTINEL', assembled)
        title = next((self.source / 'chapters').glob('C01*.md')).read_text(encoding='utf-8').splitlines()[0][2:]
        self.assertIn('### ' + title, assembled)

    def test_changed_chapter_title_updates_part_list_and_toc(self):
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        old = chapter.read_text(encoding='utf-8').splitlines()[0][2:]
        title = old + '（修订）'
        chapter.write_text(chapter.read_text(encoding='utf-8').replace('# ' + old, '# ' + title, 1), encoding='utf-8')
        sections = read_sections(self.source)
        part = next(s for s in sections if s['identity'] == 'part-p01')
        self.assertIn('- ' + title, part['text'])
        self.assertIn('  - [' + title + '](#chapter-c01)', assemble_markdown(self.source))
        self.assertNotIn('- [' + old + '](#chapter-c01)', assemble_markdown(self.source))

    def test_separate_front_and_back_matter_are_authoritative(self):
        for entry in [self.order['sections'][0], self.order['sections'][-4]]:
            path = self.source / entry['file']
            marker = 'Maintained separately: ' + entry['id']
            path.write_text(path.read_text(encoding='utf-8') + '\n\n' + marker + '\n', encoding='utf-8')
            self.assertIn(marker, assemble_markdown(self.source))

    def test_missing_order_entry_fails(self):
        self.order['sections'].pop(2)
        self.save_order()
        with self.assertRaisesRegex(ValueError, '76 complete-book sections'):
            assemble_markdown(self.source)

    def test_duplicate_chapter_entry_fails(self):
        self.order['sections'][3] = dict(self.order['sections'][2])
        self.save_order()
        with self.assertRaisesRegex(ValueError, 'Duplicate book section'):
            assemble_markdown(self.source)

    def test_duplicate_source_path_fails(self):
        self.order['sections'][3]['file'] = self.order['sections'][2]['file']
        self.save_order()
        with self.assertRaisesRegex(ValueError, 'Duplicate source file'):
            assemble_markdown(self.source)

    def test_out_of_order_chapters_fail(self):
        self.order['sections'][2], self.order['sections'][3] = self.order['sections'][3], self.order['sections'][2]
        self.save_order()
        with self.assertRaisesRegex(ValueError, '58 chapters in order'):
            assemble_markdown(self.source)

    def test_unlisted_extra_chapter_fails(self):
        (self.source / 'chapters/C59-unlisted.md').write_text('# Unlisted chapter\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '58 separate chapter files'):
            assemble_markdown(self.source)

    def test_missing_front_matter_fails(self):
        (self.source / self.order['sections'][0]['file']).unlink()
        with self.assertRaisesRegex(ValueError, 'Missing source file'):
            assemble_markdown(self.source)

    def test_unsafe_manifest_paths_fail(self):
        for unsafe in ['../outside.md', '/tmp/outside.md', r'front-matter\outside.md']:
            with self.subTest(path=unsafe):
                self.order['cover_file'] = unsafe
                self.save_order()
                with self.assertRaisesRegex(ValueError, 'Unsafe source path'):
                    assemble_markdown(self.source)

    def test_symlink_cannot_escape_source_root(self):
        outside = Path(self.temp.name) / 'outside.md'
        outside.write_text('# Outside\n', encoding='utf-8')
        (self.source / 'front-matter/escape.md').symlink_to(outside)
        self.order['cover_file'] = 'front-matter/escape.md'
        self.save_order()
        with self.assertRaisesRegex(ValueError, 'Unsafe source path'):
            assemble_markdown(self.source)

    def test_normalization_preserves_fence_contents_and_scopes_references(self):
        code = '## leave this heading\n../resources/literal.svg\n[S1]: https://example.invalid/inside\n[S1]\n```\n~~~~'
        raw = '# Chapter\n\n[S1]\n\n[S1]: https://example.invalid/outside\n\n````text\n' + code + '\n````\n\n![Figure](../resources/figure.svg)\n'
        normalized = normalize_chapter(raw)
        self.assertEqual(code_blocks(normalized), [code])
        self.assertIn('[S1](<https://example.invalid/outside>)', normalized)
        self.assertIn('![Figure](resources/figure.svg)', normalized)
        other = normalize_chapter('# Other\n\n[S1]\n\n[S1]: https://example.invalid/other\n')
        self.assertIn('[S1](<https://example.invalid/other>)', other)

    def test_unclosed_fence_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unclosed code fence'):
            normalize_chapter('# Chapter\n\n````text\n```\n')

    def test_assembly_rejects_output_inside_or_above_source(self):
        from build_source import build
        before = source_snapshot(self.source)
        for output in [self.source, self.source / 'build', self.source.parent]:
            with self.subTest(output=output):
                with self.assertRaisesRegex(ValueError, 'must not modify the source bundle'):
                    build(self.source, output)
        self.assertEqual(source_snapshot(self.source), before)

    @unittest.skipUnless(shutil.which('pandoc'), 'Pandoc is needed for the single HTML assembly smoke test')
    def test_html_build_uses_edited_sources_and_rejects_stale_prepared_files(self):
        from build_source import build
        from validate_artifacts import validate
        chapter = next((self.source / 'chapters').glob('C01*.md'))
        marker = 'Chapter-authoritative HTML propagation sentinel'
        example = 'const char* path = "../resources/literal.svg";'
        baseline_fences = sum(len(code_blocks(p.read_text(encoding='utf-8'))) for p in (self.source / 'chapters').glob('*.md'))
        chapter.write_text(chapter.read_text(encoding='utf-8') + '\n\n' + marker + '\n\n```cpp\n' + example + '\n```\n', encoding='utf-8')
        before = source_snapshot(self.source)
        output = Path(self.temp.name) / 'build'
        report = build(self.source, output)
        self.assertEqual(source_snapshot(self.source), before)
        self.assertEqual(report['input_snapshot'], before)
        self.assertEqual(report['code_fences'], baseline_fences + 1)
        self.assertEqual((output / 'book.md').read_text(encoding='utf-8'), assemble_markdown(self.source))
        html_bytes = (output / 'chapters.html').read_bytes()
        self.assertEqual(report['prepared_html_sha256'], hashlib.sha256(html_bytes).hexdigest())
        tree = LH.fromstring(html_bytes)
        article = tree.xpath('//article[@data-identity="chapter-c01"]')[0]
        self.assertIn(marker, article.text_content())
        self.assertIn(example, [''.join(pre.itertext()).rstrip('\n') for pre in article.xpath('.//pre')])
        # These checks fail before opening artifacts or rendering HTML a second time.
        missing_pdf, missing_epub = output / 'not-built.pdf', output / 'not-built.epub'
        (output / 'chapters.html').write_bytes(html_bytes + b'\n<!-- stale -->')
        with self.assertRaisesRegex(ValueError, 'Prepared HTML differs from validated assembly'):
            validate(self.source, output, missing_pdf, missing_epub)
        (output / 'chapters.html').write_bytes(html_bytes)
        chapter.write_text(chapter.read_text(encoding='utf-8') + '\nNew canonical prose after build\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Prepared manuscript differs from current chapter sources'):
            validate(self.source, output, missing_pdf, missing_epub)
        (output / 'book.md').write_text(assemble_markdown(self.source), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Prepared input snapshot is stale'):
            validate(self.source, output, missing_pdf, missing_epub)


if __name__ == '__main__':
    unittest.main()
