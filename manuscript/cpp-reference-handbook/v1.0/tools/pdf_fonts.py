"""Check embedded font programs, including self-contained Type 3 glyphs."""
from pypdf.generic import StreamObject


def embedded_font(font):
    font = font.get_object()
    if font.get('/Subtype') == '/Type3':
        # PDF 32000-1 table 112: CharProcs contains the actual glyph programs.
        # Type 3 glyphs do not use FontFile/FontFile2/FontFile3 embedding.
        procs = font.get('/CharProcs')
        procs = procs.get_object() if procs else {}
        return bool(procs) and all(isinstance(p.get_object(), StreamObject) and bool(p.get_object().get_data()) for p in procs.values())
    descriptor = font.get('/FontDescriptor')
    return bool(descriptor and any(key in descriptor.get_object() for key in ('/FontFile', '/FontFile2', '/FontFile3')))
