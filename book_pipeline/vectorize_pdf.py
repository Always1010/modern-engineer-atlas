"""Replace only byte-identified diagram pixels; preserve photos, text, bookmarks and layout."""
from pathlib import Path
import hashlib
import json
import fitz
from PIL import Image


def vectorize(source, output, directory):
    sha = lambda data: hashlib.sha256(data).hexdigest()
    document = fitz.open(source)
    pngmap = {}
    for file in (directory / 'figures').glob('*.png'):
        with Image.open(file) as original:
            image = original.convert('RGB')
            key = (image.width, image.height, sha(image.tobytes()))
        assert key not in pngmap
        pngmap[key] = file.stem
    assert len(pngmap) == 154
    seen = {image[0]: image for page in document for image in page.get_images(full=True)}
    assert len(seen) == 164
    jobs, photos = [], []
    for xref, image in seen.items():
        if image[8] == 'DCTDecode':
            photos.append(sha(document.xref_stream_raw(xref)))
            continue
        pixels = fitz.Pixmap(document, xref)
        key = (pixels.width, pixels.height, sha(pixels.samples))
        assert key in pngmap, xref
        name = pngmap[key]
        if image[1]:
            mask = fitz.Pixmap(document, image[1])
            with Image.open(directory / 'figures' / (name + '.png')) as original:
                assert sha(mask.samples) == sha(original.getchannel('A').tobytes()), name
        jobs.append((xref, name))
    assert len(jobs) == 154 and len(photos) == 10
    original_pages = len(document)
    original_toc = document.get_toc()
    for xref, name in jobs:
        with fitz.open(directory / 'diagram-pdf' / (name + '.pdf')) as vector:
            rect = vector[0].rect
            temp = document.new_page(width=rect.width, height=rect.height)
            form = temp.show_pdf_page(temp.rect, vector, 0)
            document.delete_page(len(document) - 1)
        document.update_object(xref, f'<</Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 1 1] /Resources <</XObject <</Vector {form} 0 R>>>>>>')
        document.update_stream(xref, f'q\n{1/rect.width:.15g} 0 0 {1/rect.height:.15g} 0 0 cm\n/Vector Do\nQ\n'.encode())
        document.xref_set_key(xref, 'AtlasVectorSource', '(' + name + ')')
    document.save(output, garbage=4, deflate=True, deflate_images=True, deflate_fonts=True, clean=False)
    document.close()
    with fitz.open(output) as final:
        assert len(final) == original_pages and final.get_toc() == original_toc
        final_images = {image[0]: image for page in final for image in page.get_images(full=True)}
        assert len(final_images) == 10
        assert sorted(sha(final.xref_stream_raw(xref)) for xref in final_images) == sorted(photos)
    (directory / 'pdf-vectorization.json').write_text(json.dumps({'pages_preserved': original_pages, 'outlined_diagrams': 154, 'photos_byte_identical': 10, 'bookmarks_preserved': len(original_toc)}, indent=2) + '\n')
