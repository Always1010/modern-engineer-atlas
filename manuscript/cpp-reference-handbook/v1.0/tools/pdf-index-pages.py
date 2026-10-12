"""Resolve Chromium PDF named destinations to one-based printed page numbers."""
import json
import sys
from urllib.parse import unquote

from pypdf import PdfReader


def destination_pages(reader):
    result = {}
    for name, destination in reader.named_destinations.items():
        anchor = unquote(str(name).removeprefix("/"))
        page = reader.get_destination_page_number(destination)
        if page is None or not 0 <= page < len(reader.pages):
            raise ValueError(f"Invalid page for destination {anchor}")
        if anchor in result and result[anchor] != page + 1:
            raise ValueError(f"Conflicting destination {anchor}")
        result[anchor] = page + 1
    if not result:
        raise ValueError("PDF contains no named destinations")
    return result


if __name__ == "__main__":
    print(json.dumps(destination_pages(PdfReader(sys.argv[1])), ensure_ascii=True))
