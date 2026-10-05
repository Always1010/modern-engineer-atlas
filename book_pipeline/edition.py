"""Reviewed edition structure and strict asset/license checks, without locking chapter prose."""
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
from .manuscript import require

CONFIG = Path(__file__).parent


def profile_for_version(version):
    catalog = json.loads((CONFIG / 'edition-profiles.json').read_text())
    require(catalog.get('schema_version') == 1, 'Unsupported edition profile schema')
    require(version in catalog.get('editions', {}), f'Unreviewed source edition: {version}')
    profile = dict(catalog['editions'][version], source_version=version)
    keys = ['sections', 'parts', 'chapters', 'topics', 'figures', 'diagrams', 'photos']
    require(all(type(profile.get(k)) is int and profile[k] > 0 for k in keys), 'Invalid edition coverage counts')
    require(profile['figures'] == profile['diagrams'] + profile['photos'], 'Edition figure totals disagree')
    fallback_file = profile.pop('epub_png_fallback_manifest')
    require(Path(fallback_file).name == fallback_file, 'Unsafe fallback manifest path')
    fallbacks = json.loads((CONFIG / fallback_file).read_text())
    require(isinstance(fallbacks, list) and all(isinstance(f, str) and Path(f).name == f and f.endswith('.svg') for f in fallbacks), 'Invalid EPUB fallback manifest')
    require(len(fallbacks) == len(set(fallbacks)) and len(fallbacks) <= profile['diagrams'], 'Duplicate or excessive EPUB fallbacks')
    profile['epub_png_fallbacks'] = fallbacks
    return profile


def edition_profile(source):
    from .assembly import cover_metadata
    return profile_for_version(cover_metadata(source)['source_version'])


def prepared_profile(directory):
    profile = json.loads((Path(directory) / 'edition-profile.json').read_text())
    require(profile == profile_for_version(profile.get('source_version')), 'Prepared edition profile is stale or altered')
    return profile


def checked_assets(source, placements, profile):
    """Require one declared, licensed, byte-exact asset at each chapter placement."""
    source = Path(source).resolve()
    assets = json.loads((source / 'asset-manifest.json').read_text())
    require(isinstance(assets, list) and len(assets) == profile['figures'], 'Asset count differs from edition profile')
    files = [a['file'] for a in assets]
    require(len(files) == len(set(files)), 'Duplicate asset manifest file')
    images = [p['file'] for p in placements]
    require(len(images) == profile['figures'] and len(images) == len(set(images)), 'Expected every unique figure exactly once')
    require(set(images) == set(files), 'Figure references differ from asset manifest')
    require(Counter(a['kind'] for a in assets) == Counter(diagram=profile['diagrams'], photograph=profile['photos']), 'Asset kinds differ from edition profile')
    by_file = {a['file']: a for a in assets}
    for asset in assets:
        relative = PurePosixPath(asset['file'])
        require(len(relative.parts) == 2 and relative.parts[0] == 'resources' and '..' not in relative.parts and '\\' not in asset['file'], 'Unsafe asset path')
        expected_suffix = '.svg' if asset['kind'] == 'diagram' else '.jpg'
        require(relative.suffix == expected_suffix, f'Asset kind/format mismatch: {relative}')
        require(re.fullmatch(r'[0-9a-f]{64}', asset.get('sha256', '')) is not None, 'Invalid asset SHA-256')
        require(isinstance(asset.get('rights'), str) and asset['rights'].strip(), f'Missing asset rights: {relative}')
        file = (source / relative).resolve()
        require(file.is_relative_to(source) and file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest() == asset['sha256'], f'Asset missing or modified: {relative}')
    require({str(p.relative_to(source)) for p in (source / 'resources').rglob('*') if p.is_file()} == set(files), 'Unmanifested resource files')
    require(len({a['sha256'] for a in assets}) == len(assets), 'Duplicate asset content')
    for placement in placements:
        require(placement['chapter'] == by_file[placement['file']]['chapter'], f'Figure placed in wrong chapter: {placement["file"]}')
        require(placement['alt'].strip(), f'Missing figure alt text: {placement["file"]}')
    diagrams = {Path(a['file']).name for a in assets if a['kind'] == 'diagram'}
    require(set(profile['epub_png_fallbacks']) <= diagrams, 'EPUB fallback names missing from diagram assets')
    photos = json.loads((source / 'photo-license-manifest.json').read_text())
    require(isinstance(photos, list) and len(photos) == profile['photos'], 'Missing photograph credits')
    expected_photos = {a['file']: a for a in assets if a['kind'] == 'photograph'}
    seen = set()
    appendix = (source / 'back-matter/photo-credits.md').read_text()
    for credit in photos:
        file = 'resources/' + credit['chapter'] + '-' + credit['file']
        require(file in expected_photos and file not in seen, 'Duplicate or unmatched photograph credit')
        seen.add(file)
        require(credit.get('sha256') == expected_photos[file]['sha256'], f'Photograph credit hash mismatch: {file}')
        fields = {
            'author': credit.get('author'), 'license': credit.get('license'),
            'source': credit.get('sourceURL') or credit.get('source_page') or credit.get('source'),
            'license URL': credit.get('licenseURL') or credit.get('license_url'),
            'modifications': credit.get('modification') or credit.get('modifications'),
        }
        require(all(isinstance(v, str) and v.strip() for v in fields.values()), f'Incomplete photograph license: {file}')
        require(all(fields[k].startswith(('https://', 'http://')) for k in ['source', 'license URL']), f'Invalid photograph source/license URL: {file}')
        require(all(fields[k] in appendix for k in ['author', 'license', 'source', 'license URL']), f'Photograph attribution missing from appendix: {file}')
    require(seen == set(expected_photos), 'Photograph credit coverage differs from assets')
    return assets


def checked_diagram_exports(source, directory):
    """Verify exact export inventory and the recorded source/output byte identities."""
    source, directory = Path(source), Path(directory)
    profile = edition_profile(source)
    report = json.loads((directory / 'diagram-export.json').read_text())
    require(report.get('schema_version') == 1, 'Unsupported diagram export report')
    entries = report.get('diagrams', [])
    names = [entry['file'] for entry in entries]
    expected = {p.name for p in (source / 'resources').glob('*.svg')}
    require(len(names) == profile['diagrams'] and len(set(names)) == len(names) and set(names) == expected, 'Diagram export inventory differs from source')
    for subdir, suffix in [('figures', '.png'), ('diagram-pdf', '.pdf'), ('diagram-svg', '.svg')]:
        require({p.name for p in (directory / subdir).iterdir() if p.is_file()} == {Path(name).stem + suffix for name in expected}, f'Unexpected diagram export files: {subdir}')
    for entry in entries:
        name = entry['file']
        files = {'source': source / 'resources' / name, 'png': directory / 'figures' / (Path(name).stem + '.png'), 'pdf': directory / 'diagram-pdf' / (Path(name).stem + '.pdf'), 'svg': directory / 'diagram-svg' / name}
        for kind, file in files.items():
            require(hashlib.sha256(file.read_bytes()).hexdigest() == entry.get(kind + '_sha256'), f'Diagram export hash differs: {kind}: {name}')
    return report
