"""Verify downloaded release files without trusting the archive or checksum paths."""
import argparse
import io
import json
from pathlib import Path, PurePosixPath
import re
import zipfile

from release_lib import check_html, check_identity, check_pdf, digest, names


def verify(directory, version, repository, commit, ref):
    check_identity(repository, version, commit, ref)
    expected = names(version)
    if sorted(p.name for p in directory.iterdir()) != sorted(expected) or any(not (directory / n).is_file() for n in expected):
        raise ValueError("Unexpected release asset inventory")
    lines = (directory / "SHA256SUMS.txt").read_text(encoding="utf-8").splitlines()
    checksums = {}
    for line in lines:
        match = re.fullmatch(r"([0-9a-f]{64})  ([A-Za-z0-9._-]+)", line)
        if not match or match[2] not in expected[:-1] or match[2] in checksums:
            raise ValueError("Invalid checksum entry")
        checksums[match[2]] = match[1]
    if set(checksums) != set(expected[:-1]):
        raise ValueError("Missing checksum entry")
    for name, checksum in checksums.items():
        if digest((directory / name).read_bytes()) != checksum:
            raise ValueError("Checksum mismatch: " + name)
    info_bytes = (directory / "build-info.json").read_bytes()
    info = json.loads(info_bytes)
    if (info["release_version"], info["repository"], info["source_commit"], info["source_ref"]) != (version, repository, commit, ref):
        raise ValueError("Build provenance mismatch")
    if info["checks"]["cpp_examples_executed"] is not False or not info["checks"]["pdf_page_content_unchanged"] or not info["checks"]["pdf_navigation_unchanged"]:
        raise ValueError("Missing required publication checks")
    companions = info["companion_files_sha256"]
    check_html((directory / expected[1]).read_text(encoding="utf-8"), repository, ref, files=companions)
    _, pdf_checks = check_pdf(directory / expected[0], repository, ref, companions)
    root = "Cpp-Reference-Handbook-v" + version + "/"
    with zipfile.ZipFile(directory / expected[2]) as archive:
        members = archive.namelist()
        for name in members:
            path = PurePosixPath(name)
            if not name.startswith(root) or path.is_absolute() or ".." in path.parts or "\\" in name:
                raise ValueError("Unsafe archive member")
        expected_members = {root + n for n in ("handbook.html", "handbook.pdf", "README.md", "build-info.json", *companions, *info["font_licenses_sha256"])}
        if len(members) != len(set(members)) or set(members) != expected_members:
            raise ValueError("Unexpected bundle contents")
        if archive.testzip():
            raise ValueError("Damaged ZIP archive")
        if archive.read(root + "build-info.json") != info_bytes or archive.read(root + "handbook.pdf") != (directory / expected[0]).read_bytes():
            raise ValueError("Bundle and standalone assets differ")
        for name, checksum in (companions | info["font_licenses_sha256"]).items():
            if digest(archive.read(root + name)) != checksum:
                raise ValueError("Bundle file differs from inventory: " + name)
        html_checks = check_html(archive.read(root + "handbook.html").decode("utf-8"), repository, ref, offline=True, files=companions)
        check_pdf(io.BytesIO(archive.read(root + "handbook.pdf")), repository, ref, companions)
    return {"assets": len(expected), "companion_files": len(companions), "html": html_checks, "pdf": pdf_checks, "checksums": "passed"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--version", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--ref", required=True)
    args = parser.parse_args()
    print(json.dumps(verify(args.directory, args.version, args.repository, args.commit, args.ref)))
