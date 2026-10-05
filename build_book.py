"""One portable, source-complete entrypoint for both CI and local release rehearsals."""
import argparse
from datetime import date
import json
import os
from pathlib import Path
import re
import subprocess
import sys

from build_source import build
from book_pipeline.export_diagrams import export
from book_pipeline.assembly import cover_metadata
from book_pipeline.manuscript import DEFAULT_SOURCE, require
from checksums import write_checksums
from validate_artifacts import validate

ROOT = Path(__file__).resolve().parent


def build_book(source, directory, output, version, build_date, jobs=4):
    require(bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', version)), 'Unsafe version label')
    date.fromisoformat(build_date)
    source, directory, output = source.resolve(), directory.resolve(), output.resolve()
    require(directory != source and source not in directory.parents, 'Build output must not modify the source bundle')
    require(output != source and source not in output.parents, 'Distribution output must not modify the source bundle')
    build(source, directory)
    export(directory, jobs)
    subprocess.run([sys.executable, str(ROOT / 'book_pipeline/make_fonts.py'), '--directory', str(directory)], check=True)
    output.mkdir(parents=True, exist_ok=True)
    pdf = output / f'modern-engineer-atlas-{version}.pdf'
    epub = output / f'modern-engineer-atlas-{version}.epub'
    for script, artifact in [('render_pdf.py', pdf), ('create_epub.py', epub)]:
        subprocess.run([sys.executable, str(ROOT / script), '--input', str(directory), '--output', str(artifact), '--version', version, '--date', build_date], check=True)
    checksum = output / 'SHA256SUMS.txt'
    write_checksums(checksum, [pdf, epub])
    report = validate(source, directory, pdf, epub, checksum)
    report['publication'] = {'version': version, 'build_date': build_date, 'source_verified_date': cover_metadata(source)['source_verified_date'], 'source_version': cover_metadata(source)['source_version']}
    if os.environ.get('GITHUB_SHA'):
        require(bool(re.fullmatch(r'[0-9a-f]{40}', os.environ['GITHUB_SHA'])), 'Invalid workflow source commit')
        report['publication']['source_commit'] = os.environ['GITHUB_SHA']
    (directory / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=DEFAULT_SOURCE, help='Maintained complete source directory')
    parser.add_argument('--version', required=True)
    parser.add_argument('--date', required=True, help='ISO publication date, distinct from technical source verification date')
    parser.add_argument('--build-dir', type=Path, default=ROOT / 'build')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist')
    parser.add_argument('--jobs', type=int, default=4)
    args = parser.parse_args()
    build_book(args.input, args.build_dir, args.output_dir, args.version, args.date, args.jobs)


if __name__ == '__main__':
    main()
