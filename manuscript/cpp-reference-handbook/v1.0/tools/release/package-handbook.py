"""Package only the maintained handbook; never install or execute examples."""
import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import platform
import subprocess
from pathlib import Path
import zipfile

from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

from release_lib import (EDITION, REPO, check_identity, check_html, check_pdf,
                         digest, local_target, names, pdf_signature, rewrite_html, source_url)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--ref", required=True, help="Release tag, or full commit for a preview")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--runtime", type=Path, required=True)
    parser.add_argument("--font-licenses", type=Path, required=True)
    args = parser.parse_args()
    check_identity(args.repository, args.version, args.commit, args.ref)
    catalog = json.loads((EDITION / "catalog.json").read_text(encoding="utf-8"))
    if catalog["version"] != "1.0":
        raise ValueError("This release configuration is for content edition 1.0")
    git_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip()
    if git_sha != args.commit:
        raise ValueError("Package commit differs from checked-out source")
    tracked = subprocess.check_output(["git", "ls-files", "--", "manuscript/cpp-reference-handbook/v1.0"], cwd=REPO, text=True).splitlines()
    inventory = {str(Path(name).relative_to(EDITION.relative_to(REPO))).replace("\\", "/"): digest((REPO / name).read_bytes()) for name in tracked}
    companions = {name: (EDITION / name).read_bytes() for name in inventory if name.startswith(("examples/", "sources/"))}
    if not companions:
        raise ValueError("Empty companion inventory")
    runtime = json.loads(args.runtime.read_text(encoding="utf-8"))
    reports = {}
    report_paths = {
        "source_examples": "qa/fullbook/source-example-report.json",
        "learning_revision": "qa/learning-revision/revision-check.json",
        "style": "qa/learning-revision/style-check.json",
        "pagination": "qa/learning-revision/pagination-check.json",
        "pdf_inspection": "qa/learning-revision/final-render/pdf-inspection.json",
        "render_build": "qa/learning-revision/render-build/Cpp-Reference-Handbook-v1.0-build.json",
    }
    for name, relative in report_paths.items():
        data = (EDITION / relative).read_bytes()
        report = json.loads(data)
        if report.get("errors") or report.get("outside_page_bounds_count") or report.get("replacement_character_pages"):
            raise ValueError("Failed validation report: " + name)
        reports[name] = {"sha256": digest(data), "report": relative}
    build = json.loads((EDITION / report_paths["render_build"]).read_text(encoding="utf-8"))
    for entry in build["files"]:
        if digest((EDITION / entry["file"]).read_bytes()) != entry["sha256"]:
            raise ValueError("Source changed after rendering: " + entry["file"])
    raw_html = (EDITION / "output/pdf/Cpp-Reference-Handbook-v1.0.html").read_text(encoding="utf-8")
    online = rewrite_html(raw_html, args.repository, args.ref)
    offline = rewrite_html(raw_html, args.repository, args.ref, offline=True)
    html_checks = check_html(online, args.repository, args.ref, files=companions)
    check_html(offline, args.repository, args.ref, offline=True, files=companions)
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError("Output directory must be empty; refusing to mix releases")
    pdf_name, html_name, zip_name, info_name, checksum_name = names(args.version)
    reader = PdfReader(EDITION / "output/pdf/Cpp-Reference-Handbook-v1.0.pdf")
    original_signature = pdf_signature(reader)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    changed = 0
    for page in writer.pages:
        for annotation in page.get("/Annots", []):
            action = annotation.get_object().get("/A")
            action = action.get_object() if action else {}
            if action.get("/S") == "/URI":
                target = local_target(str(action["/URI"]))
                if target:
                    action[NameObject("/URI")] = TextStringObject(source_url(args.repository, args.ref, *target))
                    changed += 1
    if not changed:
        raise ValueError("No PDF companion links converted")
    writer.write(output / pdf_name)
    packaged_reader, pdf_checks = check_pdf(output / pdf_name, args.repository, args.ref, companions)
    if pdf_signature(packaged_reader) != original_signature:
        raise ValueError("Packaging changed PDF outline, destinations, pages or link counts")
    # The PDF page-content streams must be byte-identical: packaging cannot
    # alter typography or page layout while rewriting link annotations.
    for before, after in zip(reader.pages, packaged_reader.pages, strict=True):
        if before.get_contents().get_data() != after.get_contents().get_data():
            raise ValueError("Packaging changed PDF page content")
    (output / html_name).write_text(online, encoding="utf-8")
    licenses = {"licenses/" + p.name: p.read_bytes() for p in sorted(args.font_licenses.iterdir()) if p.is_file()}
    if not licenses:
        raise ValueError("Font licenses must accompany the PDF")
    info = {
        "schema": 1, "title": catalog["title"], "content_version": catalog["version"],
        "release_version": args.version, "repository": args.repository, "source_commit": args.commit,
        "source_ref": args.ref, "tag": args.ref if args.ref.startswith("cpp-handbook-v") else None,
        "built_at_utc": datetime.now(timezone.utc).isoformat(), "runtime": runtime,
        "python": platform.python_version(),
        "python_packages": {name: importlib.metadata.version(name) for name in ("pypdf", "pdfplumber", "Pillow")},
        "source_files_sha256": inventory, "reports": reports,
        "checks": {"html": html_checks, "pdf": pdf_checks, "pdf_page_content_unchanged": True,
                   "pdf_navigation_unchanged": True, "cpp_examples_executed": False,
                   "historical_baseline_compared": json.loads((EDITION / report_paths["learning_revision"]).read_text(encoding="utf-8"))["baselineCompared"]},
        "companion_files_sha256": {name: digest(data) for name, data in companions.items()},
        "font_licenses_sha256": {name: digest(data) for name, data in licenses.items()},
    }
    info_bytes = (json.dumps(info, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    (output / info_name).write_bytes(info_bytes)
    readme = f"""# {catalog['title']}\n\n内容版本：v{catalog['version']}；发行版本：v{args.version}。\n源提交：{args.commit}。\n\n打开 handbook.html 离线阅读；examples/ 提供配套源码，sources/ 提供技术来源记录。\nhandbook.pdf 的源码链接指向该发行的 GitHub 源文件，在线查阅时使用。\nSVG 已内嵌，HTML 的配套源码链接使用本包相对路径。\n\n检查包括源稿结构、目录索引、源码摘录、HTML 导航、PDF 分页与字体、全页渲染和附件完整性。\n这些检查不编译或执行 C++ 示例，也不证明所有平台行为。构建记录见 build-info.json。\n\n字体权利说明见 licenses/。字体许可不延伸为整本手册的许可；项目未指定统一再授权条款。\n"""
    root = "Cpp-Reference-Handbook-v" + args.version + "/"
    with zipfile.ZipFile(output / zip_name, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        payload = {"handbook.html": offline.encode("utf-8"), "handbook.pdf": (output / pdf_name).read_bytes(),
                   "README.md": readme.encode("utf-8"), "build-info.json": info_bytes, **companions, **licenses}
        for name, data in sorted(payload.items()):
            item = zipfile.ZipInfo(root + name, date_time=(2026, 10, 13, 0, 0, 0))
            item.compress_type = zipfile.ZIP_DEFLATED
            item.external_attr = 0o100644 << 16
            archive.writestr(item, data)
    (output / checksum_name).write_text("".join(digest((output / name).read_bytes()) + "  " + name + "\n" for name in names(args.version)[:-1]), encoding="utf-8")
    print(json.dumps({"assets": names(args.version), "pdf_links_converted": changed, "commit": args.commit}))


if __name__ == "__main__":
    main()
