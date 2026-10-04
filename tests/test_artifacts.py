"""Run after a build to demonstrate fail-closed checks on damaged real artifacts."""
from pathlib import Path
import tempfile
import os
import unittest
import zipfile
from lxml import html as LH, etree
from validate_artifacts import check_epub
from book_pipeline.manuscript import DEFAULT_SOURCE

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / os.environ.get('BOOK_TEST_BUILD', 'build')
EPUB = ROOT / os.environ.get('BOOK_TEST_EPUB', 'dist/modern-engineer-atlas-1.0.0.epub')


@unittest.skipUnless(EPUB.exists() and (BUILD / 'chapters.html').exists(), 'Run after a local build (set BOOK_TEST_EPUB for another version)')
class ArtifactMutationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'mutated.epub'

    def check_mutation(self, mutate, message):
        with zipfile.ZipFile(EPUB) as original, zipfile.ZipFile(self.path, 'w') as output:
            for info in original.infolist():
                output.writestr(info, mutate(info.filename, original.read(info.filename)))
        with self.assertRaisesRegex(ValueError, message):
            check_epub(self.path, LH.parse(str(BUILD / 'chapters.html')), BUILD, DEFAULT_SOURCE)

    def test_changed_prose_is_rejected(self):
        def mutate(name, data):
            if name.endswith('.xhtml') and b'id="chapter-c01"' in data:
                doc = etree.fromstring(data)
                chapter = doc.xpath('//*[@id="chapter-c01"]')[0]
                paragraph = chapter.xpath('.//*[local-name()="p"]')[0]
                paragraph.text = (paragraph.text or '') + 'ARTIFACT_PROSE_MUTATION'
                return etree.tostring(doc, encoding='UTF-8', xml_declaration=True)
            return data
        self.check_mutation(mutate, 'changed or truncated chapter prose')

    def test_replaced_photo_is_rejected(self):
        self.check_mutation(lambda name, data: data + b'changed' if name.endswith('.jpg') else data, 'photographs changed')

    def test_incorrect_svg_property_is_rejected(self):
        self.check_mutation(lambda name, data: data.replace(b'properties="svg"', b'properties=""', 1) if name.endswith('.opf') else data, 'Incorrect SVG OPF property')


if __name__ == '__main__':
    unittest.main()
