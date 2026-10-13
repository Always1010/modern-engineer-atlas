"""Publication failure gates: portability, corruption and provenance."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
import sys

from pypdf import PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, FloatObject, NameObject, TextStringObject, DecodedStreamObject
from release_lib import digest, names, source_url, local_target
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pdf_fonts import embedded_font

spec = importlib.util.spec_from_file_location("verify_release", Path(__file__).with_name("verify-release.py"))
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class PublicationGates(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name) / "relocated"
        self.directory.mkdir()
        self.version = "1.0.0"
        self.repository = "owner/books"
        self.commit = "a" * 40
        self.ref = "cpp-handbook-v1.0.0"
        self.assets = names(self.version)
        self.root = "Cpp-Reference-Handbook-v1.0.0/"
        self.source = b"// static companion; never executed\n"
        uri = source_url(self.repository, self.ref, "examples/sample.cpp")
        writer = PdfWriter()
        page = writer.add_blank_page(width=595, height=842)
        writer.add_named_destination("contents", 0)
        writer.add_outline_item("Contents", 0)
        writer.add_annotation(0, DictionaryObject({
            NameObject("/Type"): NameObject("/Annot"), NameObject("/Subtype"): NameObject("/Link"),
            NameObject("/Rect"): ArrayObject([FloatObject(n) for n in (10, 10, 100, 30)]),
            NameObject("/A"): DictionaryObject({NameObject("/S"): NameObject("/URI"), NameObject("/URI"): TextStringObject(uri)})}))
        writer.write(self.directory / self.assets[0])
        (self.directory / self.assets[1]).write_text(f'<h1 id="contents">Contents</h1><a href="#contents">Contents</a><a href="{uri}">Source</a>', encoding="utf-8")
        self.info = {"release_version": self.version, "repository": self.repository, "source_commit": self.commit,
                     "source_ref": self.ref, "checks": {"cpp_examples_executed": False,
                     "pdf_page_content_unchanged": True, "pdf_navigation_unchanged": True},
                     "companion_files_sha256": {"examples/sample.cpp": digest(self.source)},
                     "font_licenses_sha256": {"licenses/OFL.txt": digest(b"font license")}}
        info = json.dumps(self.info).encode()
        (self.directory / "build-info.json").write_bytes(info)
        with zipfile.ZipFile(self.directory / self.assets[2], "w") as archive:
            for name, data in {"handbook.html": b'<h1 id="contents">Contents</h1><a href="#contents">Contents</a><a href="examples/sample.cpp">Source</a>',
                               "handbook.pdf": (self.directory / self.assets[0]).read_bytes(), "README.md": b"readme",
                               "build-info.json": info, "examples/sample.cpp": self.source, "licenses/OFL.txt": b"font license"}.items():
                archive.writestr(self.root + name, data)
        self.rehash()

    def rehash(self):
        (self.directory / "SHA256SUMS.txt").write_text("".join(digest((self.directory / name).read_bytes()) + "  " + name + "\n" for name in self.assets[:-1]), encoding="utf-8")

    def verify(self, commit=None):
        return verifier.verify(self.directory, self.version, self.repository, commit or self.commit, self.ref)

    def test_bundle_is_portable_after_relocation(self):
        self.assertEqual(self.verify()["checksums"], "passed")

    def test_corrupted_asset_is_rejected(self):
        with (self.directory / self.assets[0]).open("ab") as file:
            file.write(b"changed")
        with self.assertRaisesRegex(ValueError, "Checksum mismatch"):
            self.verify()

    def test_wrong_source_commit_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "provenance"):
            self.verify(commit="b" * 40)

    def test_archive_traversal_is_rejected_even_with_valid_checksums(self):
        with zipfile.ZipFile(self.directory / self.assets[2], "a") as archive:
            archive.writestr(self.root + "../other-book.pdf", b"wrong book")
        self.rehash()
        with self.assertRaisesRegex(ValueError, "Unsafe archive"):
            self.verify()

    def test_machine_local_link_cannot_escape_the_edition(self):
        with self.assertRaises(ValueError):
            local_target("file:///C:/repo/manuscript/cpp-reference-handbook/v1.0/examples/../../secrets.txt")

    def test_source_link_to_a_different_ref_is_rejected(self):
        html = (self.directory / self.assets[1]).read_text()
        (self.directory / self.assets[1]).write_text(html.replace(self.ref, "main"))
        self.rehash()
        with self.assertRaisesRegex(ValueError, "release ref"):
            self.verify()


class FontEmbeddingGates(unittest.TestCase):
    def test_type3_glyph_programs_are_embedded(self):
        glyph = DecodedStreamObject()
        glyph.set_data(b"500 0 d0 0 0 10 10 re f")
        font = DictionaryObject({NameObject('/Subtype'): NameObject('/Type3'),
                                 NameObject('/CharProcs'): DictionaryObject({NameObject('/g1'): glyph})})
        self.assertTrue(embedded_font(font))

    def test_missing_type3_glyph_programs_are_rejected(self):
        font = DictionaryObject({NameObject('/Subtype'): NameObject('/Type3'),
                                 NameObject('/CharProcs'): DictionaryObject({NameObject('/g1'): NameObject('/missing')})})
        self.assertFalse(embedded_font(font))

    def test_unembedded_truetype_is_rejected(self):
        font = DictionaryObject({NameObject('/Subtype'): NameObject('/TrueType')})
        self.assertFalse(embedded_font(font))


if __name__ == "__main__":
    unittest.main()
