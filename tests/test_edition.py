"""Edition upgrades retain strict asset identity, placement and attribution gates."""
import json
import hashlib
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from book_pipeline.edition import checked_diagram_exports, checked_assets, edition_profile, prepared_profile, profile_for_version
from book_pipeline.manuscript import DEFAULT_SOURCE


class EditionAssetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / 'source'
        shutil.copytree(DEFAULT_SOURCE, self.source)
        self.profile = edition_profile(self.source)
        self.assets = self.read('asset-manifest.json')
        self.placements = [{'chapter': a['chapter'], 'file': a['file'], 'alt': 'Reviewed figure'} for a in self.assets]

    def read(self, name):
        return json.loads((self.source / name).read_text())

    def write(self, name, value):
        (self.source / name).write_text(json.dumps(value, ensure_ascii=False))

    def check(self):
        return checked_assets(self.source, self.placements, self.profile)

    def export_fixture(self):
        directory = Path(self.temp.name) / 'exports'
        for subdir in ['figures', 'diagram-pdf', 'diagram-svg']:
            (directory / subdir).mkdir(parents=True)
        entries = []
        for asset in self.assets:
            if asset['kind'] != 'diagram':
                continue
            name = Path(asset['file'])
            entry = {'file': name.name, 'source_sha256': asset['sha256']}
            for kind, subdir in [('png', 'figures'), ('pdf', 'diagram-pdf'), ('svg', 'diagram-svg')]:
                data = (name.stem + ':' + kind).encode()
                (directory / subdir / (name.stem + '.' + kind)).write_bytes(data)
                entry[kind + '_sha256'] = hashlib.sha256(data).hexdigest()
            entries.append(entry)
        (directory / 'diagram-export.json').write_text(json.dumps({'schema_version': 1, 'diagrams': entries}))
        return directory

    def test_export_bytes_cannot_drift_from_recorded_hash(self):
        directory = self.export_fixture()
        checked_diagram_exports(self.source, directory)
        first = next((directory / 'diagram-svg').glob('*.svg'))
        first.write_bytes(first.read_bytes() + b'changed')
        with self.assertRaisesRegex(ValueError, 'Diagram export hash differs: svg'):
            checked_diagram_exports(self.source, directory)

    def test_stale_source_export_is_rejected(self):
        directory = self.export_fixture()
        first = next((self.source / 'resources').glob('*.svg'))
        first.write_bytes(first.read_bytes() + b'changed')
        with self.assertRaisesRegex(ValueError, 'Diagram export hash differs: source'):
            checked_diagram_exports(self.source, directory)

    def test_extra_generated_figure_is_rejected(self):
        directory = self.export_fixture()
        (directory / 'figures/stale.png').write_bytes(b'stale')
        with self.assertRaisesRegex(ValueError, 'Unexpected diagram export files'):
            checked_diagram_exports(self.source, directory)

    def test_both_reviewed_editions_have_explicit_counts(self):
        old, current = profile_for_version('1.0'), profile_for_version('1.1.0')
        self.assertEqual((old['figures'], old['diagrams'], old['photos']), (164, 154, 10))
        self.assertEqual((current['figures'], current['diagrams'], current['photos']), (169, 158, 11))
        self.assertEqual(current['epub_png_fallbacks'], old['epub_png_fallbacks'])
        self.assertEqual(current['diagrams'] - len(current['epub_png_fallbacks']), 142)

    def test_unknown_edition_cannot_silently_change_coverage(self):
        with self.assertRaisesRegex(ValueError, 'Unreviewed source edition'):
            profile_for_version('9.9.9')

    def test_actual_manifest_files_and_credits_pass(self):
        self.assertEqual(len(self.check()), self.profile['figures'])

    def test_duplicate_manifest_entry_is_rejected(self):
        self.assets[-1] = self.assets[0]
        self.write('asset-manifest.json', self.assets)
        with self.assertRaisesRegex(ValueError, 'Duplicate asset manifest'):
            self.check()

    def test_duplicate_placement_is_rejected(self):
        self.placements[-1] = self.placements[0]
        with self.assertRaisesRegex(ValueError, 'every unique figure exactly once'):
            self.check()

    def test_wrong_chapter_placement_is_rejected(self):
        self.placements[0]['chapter'] = 'C58'
        with self.assertRaisesRegex(ValueError, 'wrong chapter'):
            self.check()

    def test_asset_count_cannot_follow_an_accidental_deletion(self):
        self.write('asset-manifest.json', self.assets[:-1])
        self.placements.pop()
        with self.assertRaisesRegex(ValueError, 'Asset count differs'):
            self.check()

    def test_unmanifested_resource_is_rejected(self):
        (self.source / 'resources/stray.svg').write_text('<svg/>')
        with self.assertRaisesRegex(ValueError, 'Unmanifested resource'):
            self.check()

    def test_duplicate_photo_credit_is_rejected(self):
        credits = self.read('photo-license-manifest.json')
        credits[-1] = credits[0]
        self.write('photo-license-manifest.json', credits)
        with self.assertRaisesRegex(ValueError, 'Duplicate or unmatched photograph credit'):
            self.check()

    def test_photo_credit_hash_cannot_drift(self):
        credits = self.read('photo-license-manifest.json')
        credits[0]['sha256'] = '0' * 64
        self.write('photo-license-manifest.json', credits)
        with self.assertRaisesRegex(ValueError, 'credit hash mismatch'):
            self.check()

    def test_missing_license_is_rejected(self):
        credits = self.read('photo-license-manifest.json')
        credits[0]['license'] = ''
        self.write('photo-license-manifest.json', credits)
        with self.assertRaisesRegex(ValueError, 'Incomplete photograph license'):
            self.check()

    def test_missing_reader_attribution_is_rejected(self):
        credits = self.read('photo-license-manifest.json')
        appendix = self.source / 'back-matter/photo-credits.md'
        appendix.write_text(appendix.read_text().replace(credits[0]['author'], ''))
        with self.assertRaisesRegex(ValueError, 'attribution missing from appendix'):
            self.check()

    def test_stale_prepared_profile_is_rejected(self):
        self.write('edition-profile.json', self.profile)
        self.assertEqual(prepared_profile(self.source), self.profile)
        altered = dict(self.profile, diagrams=self.profile['diagrams'] - 1)
        self.write('edition-profile.json', altered)
        with self.assertRaisesRegex(ValueError, 'stale or altered'):
            prepared_profile(self.source)

    def test_duplicate_fallback_entry_is_rejected(self):
        from book_pipeline import edition
        config = Path(self.temp.name) / 'config'
        config.mkdir()
        for name in ['edition-profiles.json', 'epub-png-fallbacks.json']:
            shutil.copy2(edition.CONFIG / name, config / name)
        fallbacks = json.loads((config / 'epub-png-fallbacks.json').read_text())
        (config / 'epub-png-fallbacks.json').write_text(json.dumps(fallbacks + fallbacks[:1]))
        with patch.object(edition, 'CONFIG', config), self.assertRaisesRegex(ValueError, 'Duplicate or excessive'):
            profile_for_version('1.1.0')


if __name__ == '__main__':
    unittest.main()
