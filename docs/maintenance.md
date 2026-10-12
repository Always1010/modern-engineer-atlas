# 能力地图维护说明

适用书稿：`manuscript/complete-edition/v1.0/`。构建命令、环境及发行步骤统一见[构建与发布](../RELEASE_BUILD.md)，项目其他文档见[维护导航](README.md)。

## 编辑源与日常修改

分章稿是正文的唯一编辑源。PDF 与 EPUB 从当前分章稿、前后附录和编排清单生成；整本 Markdown 只在构建时生成到 `build/book.md`。

1. 编辑 `manuscript/complete-edition/v1.0/chapters/` 中对应的 `Cxx-*.zh-CN.md`，保留稳定编号、章标题和分节结构
2. 同步维护该章引用；修改图源或照片时，审查来源与许可，再更新正文素材清单中的对应记录与 SHA-256
3. 修改阅读说明或附录时，直接编辑 `front-matter/`、`back-matter/`；调整编排时修改 `book-order.json`，并同步相关覆盖约束与测试
4. 运行测试与构建，检查生成的校验报告，并抽查改动涉及的页面、代码和图片

普通正文或代码示例修改不需要更新源文件锁。每次构建从当前章节重新组装，生成本次输入快照；快照用于发现旧构建输入，不是需要手工维护的编辑门槛。不要编辑 `build/book.md`、`build/chapters.html` 或 `dist/` 来修正文稿。


## 编排与素材职责

| 位置 | 维护内容 |
| --- | --- |
| `chapters/` | 每章正文、代码、图片引用及该章技术来源；图片使用 `../resources/` 相对路径 |
| `front-matter/title-page.md` | 书名、书稿源版本及技术资料核验日期；发行版本和发布日期由构建命令指定 |
| `front-matter/reading-guide.md` | 当前读者定位与阅读路径 |
| `back-matter/` | 随书术语、照片署名、核验边界与字体许可附录 |
| `book-order.json` | 前后文、篇章顺序和目录标识；篇内章名由实际章节标题生成 |
| `resources/`、`asset-manifest.json` | 正文图源、照片与素材完整性记录 |
| `photo-license-manifest.json`、`FONT-LICENSES.txt` | 照片使用依据、署名及字体版权与许可全文 |
| `COVERAGE.md`、`EDITION-NOTES.md` | 主题覆盖说明和内容核验范围 |

以上路径均相对于书稿目录。`planning/` 与 `evidence/` 是研究依据；素材需求表 `assets/asset-manifest.csv` 是项目规划台账。当前正文素材的完整性与使用依据在书稿 JSON 清单中维护。

## 构建模块

下列路径均相对于仓库根目录。命令与验收步骤见[构建与发布](../RELEASE_BUILD.md)。

- `book_pipeline/assembly.py`：读取编排清单，检查章节顺序与路径安全，解析章内引用，生成目录、整本 Markdown 和当前源文件快照
- `book_pipeline/manuscript.py`：检查真实章节与主题覆盖、代码围栏、图片引用、素材哈希和许可资料；代码数量从当前章节计算
- `book_pipeline/edition-profiles.json`：按书名页源版本选择受控的篇章与素材覆盖约束，保留历史版次；不以新增素材为由取消完整性检查
- `build_source.py`：调用组装与源稿校验，准备共享的 `book.md`、`chapters.html`、资源和源稿校验报告
- `book_pipeline/export_diagrams.py`：用 Inkscape 导出 PDF/EPUB 所需的矢量图与 PNG
- `book_pipeline/make_fonts.py`：从系统字体生成重命名的中文子集字体，并准备符号与等宽字体
- `book_pipeline/reviewed_pdf.py`、`book_pipeline/vectorize_pdf.py`：完成 PDF 排版，并在校对位置一致后替换为轮廓化矢量图；`render_pdf.py` 负责调用
- `create_epub.py`、`assets/epub.css`、`book_pipeline/epub-png-fallbacks.json`：生成 EPUB 结构与样式，指定需要 PNG 回退的图示
- `build_book.py`：串联组装、图片、字体、PDF、EPUB、校验和与制品检查
- `validate_artifacts.py`：核对当前源稿、生成的 Markdown/HTML、PDF 与 EPUB，拒绝过期输入、正文差异和损坏资源
- `checksums.py`：生成或验证发行文件的 SHA-256
- `tests/test_manuscript.py`、`tests/test_assembly.py`：检查章节、编排、引用、代码与过期输入
- `tests/test_artifacts.py`：通过篡改 EPUB 正文、照片和 SVG 属性验证失败门禁
- `tests/test_export_propagation.py`：在临时副本修改章节、代码、前后文与书名，确认改动进入 Markdown/PDF/EPUB，且真实源文件不变

