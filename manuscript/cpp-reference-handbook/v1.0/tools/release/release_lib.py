"""Portable handbook assets and checks shared by packaging and verification."""
from collections import Counter
from hashlib import sha256
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
import re
from urllib.parse import quote, unquote, urlsplit

from pypdf import PdfReader

EDITION = Path(__file__).resolve().parents[2]
REPO = EDITION.parents[2]
EDITION_PATH = EDITION.relative_to(REPO).as_posix()
VERSION_PATTERN = r"(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)"


def check_identity(repository, version, commit, ref):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository):
        raise ValueError("Invalid repository")
    if not re.fullmatch(VERSION_PATTERN, version):
        raise ValueError("Invalid release version")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected a full source commit SHA")
    if ref not in (commit, "cpp-handbook-v" + version):
        raise ValueError("Links must use the exact commit or release tag")


def names(version):
    base = "Cpp-Reference-Handbook-v" + version
    return [base + ".pdf", base + ".html", base + "-bundle.zip", "build-info.json", "SHA256SUMS.txt"]


def digest(data):
    return sha256(data).hexdigest()


def source_url(repository, ref, relative, fragment=""):
    result = f"https://github.com/{repository}/blob/{quote(ref, safe='')}/{EDITION_PATH}/{quote(relative, safe='/')}"
    return result + ("#" + quote(fragment, safe="-._~") if fragment else "")


def local_target(uri):
    parsed = urlsplit(uri)
    if parsed.scheme.lower() != "file":
        return None
    # The original generator emits absolute file URIs. Only edition companions
    # may be rewritten; reject arbitrary files and traversal instead of guessing.
    path = unquote(parsed.path).replace("\\", "/")
    marker = "/" + EDITION_PATH + "/"
    if parsed.netloc or path.count(marker) != 1:
        raise ValueError("Unexpected local file URI: " + uri)
    relative = path.split(marker, 1)[1]
    parts = PurePosixPath(relative).parts
    if not parts or parts[0] not in ("examples", "sources") or any(p in (".", "..") for p in parts):
        raise ValueError("Local link is not a companion file: " + uri)
    target = (EDITION / relative).resolve()
    if not target.is_relative_to(EDITION) or not target.is_file():
        raise ValueError("Missing companion file: " + relative)
    return relative, unquote(parsed.fragment)


def rewrite_html(text, repository, ref, offline=False):
    def replace(match):
        uri = unescape(match[2])
        target = local_target(uri)
        if target is None:
            return match[0]
        relative, fragment = target
        uri = (quote(relative, safe="/") + ("#" + quote(fragment, safe="-._~") if fragment else "")) if offline else source_url(repository, ref, relative, fragment)
        return match[1] + escape(uri, quote=True) + match[3]
    return re.sub(r'(href=["\'])(.*?)(["\'])', replace, text)


class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        if "href" in values:
            self.hrefs.append(values["href"])


def check_html(text, repository, ref, offline=False, files=None):
    parser = Links()
    parser.feed(text)
    ids = set(parser.ids)
    if len(ids) != len(parser.ids):
        raise ValueError("Duplicate HTML anchors")
    count = 0
    for uri in parser.hrefs:
        parsed = urlsplit(uri)
        if parsed.scheme.lower() == "file":
            raise ValueError("Build-machine URI remains in HTML")
        if not parsed.scheme and not parsed.netloc and not parsed.path:
            if parsed.fragment and unquote(parsed.fragment) not in ids:
                raise ValueError("Broken HTML anchor: " + uri)
        elif not parsed.scheme:
            relative = unquote(parsed.path)
            if not offline or not files or relative not in files:
                raise ValueError("Unresolved relative HTML link: " + uri)
            count += 1
        elif uri.startswith(f"https://github.com/{repository}/blob/"):
            prefix = f"https://github.com/{repository}/blob/{quote(ref, safe='')}/{EDITION_PATH}/"
            if not uri.startswith(prefix):
                raise ValueError("Source link does not use release ref")
            relative = unquote(parsed.path.split("/" + EDITION_PATH + "/", 1)[1])
            if files is not None and relative not in files:
                raise ValueError("Source link missing from companion inventory")
            count += 1
    if not count:
        raise ValueError("No companion links found")
    return {"anchors": len(ids), "companion_links": count}


def pdf_signature(reader):
    def outline(items):
        result = []
        for item in items:
            if isinstance(item, list):
                result.append(outline(item))
            else:
                result.append((str(item.title), reader.get_destination_page_number(item)))
        return result
    destinations = {str(name): (reader.get_destination_page_number(dest), str(dest.get("/Top")), str(dest.get("/Left")), str(dest.get("/Type")))
                    for name, dest in reader.named_destinations.items()}
    actions = Counter()
    for page in reader.pages:
        for ref in page.get("/Annots", []):
            annotation = ref.get_object()
            action = annotation.get("/A")
            action = action.get_object() if action else {}
            actions[str(action.get("/S", "destination"))] += 1
    return {"pages": len(reader.pages), "destinations": destinations,
            "outline": outline(reader.outline), "link_actions": dict(actions)}


def check_pdf(path, repository, ref, files):
    reader = PdfReader(path)
    count = 0
    prefix = f"https://github.com/{repository}/blob/{quote(ref, safe='')}/{EDITION_PATH}/"
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            action = annotation.get_object().get("/A")
            action = action.get_object() if action else {}
            if action.get("/S") != "/URI":
                continue
            uri = str(action["/URI"])
            parsed = urlsplit(uri)
            if parsed.scheme.lower() == "file" or not parsed.scheme or parsed.scheme.lower() not in ("https", "http", "mailto"):
                raise ValueError("Nonportable PDF link: " + uri)
            if uri.startswith(f"https://github.com/{repository}/blob/"):
                if not uri.startswith(prefix):
                    raise ValueError("PDF source link does not use release ref")
                relative = unquote(parsed.path.split("/" + EDITION_PATH + "/", 1)[1])
                if relative not in files:
                    raise ValueError("PDF source link missing from companion inventory")
                count += 1
    if not count:
        raise ValueError("No companion links found in PDF")
    return reader, {"pages": len(reader.pages), "companion_links": count, "named_destinations": len(reader.named_destinations)}
