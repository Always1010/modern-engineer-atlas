"""Export reviewed diagram geometry to PNG and outlined vector, with no font dependencies."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import subprocess
import fitz
from PIL import Image
from lxml import etree


def export(directory, jobs=4):
    for name in ['figures', 'diagram-pdf', 'diagram-svg', 'inkscape-config', 'inkscape-cache']:
        (directory / name).mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, XDG_CONFIG_HOME=str(directory / 'inkscape-config'), XDG_CACHE_HOME=str(directory / 'inkscape-cache'))
    def one(source):
        png = directory / 'figures' / (source.stem + '.png')
        pdf = directory / 'diagram-pdf' / (source.stem + '.pdf')
        svg = directory / 'diagram-svg' / source.name
        subprocess.run(['inkscape', str(source), '--export-type=png', '--export-width=1600', '--export-filename=' + str(png)], env=env, check=True, capture_output=True)
        subprocess.run(['inkscape', str(source), '--export-type=pdf', '--export-text-to-path', '--export-filename=' + str(pdf)], env=env, check=True, capture_output=True)
        with fitz.open(pdf) as document:
            assert len(document) == 1 and not document[0].get_text() and not document[0].get_fonts() and not document[0].get_images(), source
            doc = etree.fromstring(document[0].get_svg_image(text_as_path=True).encode())
            with Image.open(png) as image:
                width, height = image.size
            # Preserve the exact reviewed intrinsic image box, including pixel rounding.
            doc.set('width', f'{width}px')
            doc.set('height', f'{height}px')
            doc.set('preserveAspectRatio', 'xMidYMid meet')
            svg.write_bytes(etree.tostring(doc, encoding='UTF-8', xml_declaration=True))
        return source.name
    sources = sorted((directory / 'resources').glob('*.svg'))
    with ThreadPoolExecutor(max_workers=jobs) as executor:
        names = list(executor.map(one, sources))
    assert len(names) == 154, len(names)
    (directory / 'diagram-export.json').write_text(json.dumps(names, indent=2) + '\n')
    print(f'Exported {len(names)} PNG + outlined vector diagrams', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--jobs', type=int, default=4)
    args = parser.parse_args()
    export(args.directory.resolve(), args.jobs)
