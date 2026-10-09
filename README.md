# 现代软件工程师能力地图

以现代 C++ 与系统思维为主线，连接语言基础、机器运行、工程实践与岗位能力。本书面向已有基本编程经验、希望建立完整知识体系的软件工程师，围绕机制解释、设计取舍、故障诊断和工程证据展开。

正文包含 **13 篇、58 章、232 个主题**，覆盖公共基础、现代 C++、并发与性能、可靠交付、嵌入式产品与工业设备软件、服务与数据、音视频与图形、编译器、HPC 与 GPU、AI 基础设施、机器人、LLM 应用与 Agent 工程。章节采用中文标题与分节编号，文件使用稳定的 `C01` 至 `C58` 编号。

## 阅读与维护入口

- [正文目录](manuscript/complete-edition/v1.0/README.md)：分章文件、编排与维护入口
- [章节覆盖说明](manuscript/complete-edition/v1.0/COVERAGE.md)：章节与主题范围
- [内容核验边界](manuscript/complete-edition/v1.0/EDITION-NOTES.md)：技术资料、示例和阅读制品的验证范围
- [构建与发布](RELEASE_BUILD.md)：环境、命令、校验和 GitHub Release 发布方式

**分章稿是正文的唯一编辑源。** PDF 与 EPUB 均从当前分章稿、前后附录和编排清单生成。整本 Markdown 只在构建时生成到 `build/book.md`，不在源码中另存一份，也不需要手工同步合并稿。

## C++ 图解参考手册

[C++ 与计算机基础图解参考手册 v0.2](manuscript/cpp-reference-handbook/v0.2/README.md)提供七篇35章的对象与任务查阅入口，独立维护其正文、索引和 HTML/PDF 生成工具。它与上面的能力地图正文分别编排。

## 项目结构

```text
.
├── manuscript/complete-edition/v1.0/   # 当前书稿源
│   ├── chapters/                      # C01—C58，共 58 份正文
│   ├── front-matter/                  # 书名页与阅读说明
│   ├── back-matter/                   # 术语、照片署名、核验说明、字体许可
│   ├── book-order.json                # 封面源、篇章顺序与目录标识
│   ├── resources/                     # 正文 SVG 图源与 JPEG 照片
│   ├── asset-manifest.json            # 正文图片路径、类型与 SHA-256
│   ├── photo-license-manifest.json    # 照片作者、来源、许可与修改说明
│   ├── FONT-LICENSES.txt              # 字体版权及许可全文
│   ├── README.md                      # 分章阅读入口
│   ├── COVERAGE.md                    # 正文覆盖范围
│   └── EDITION-NOTES.md               # 内容与验证边界说明
├── planning/                          # 知识结构、阅读路径和技术基线
├── evidence/                          # 技术来源与岗位研究证据
├── assets/                            # 项目知识地图、素材规划表与 EPUB 样式
├── book_pipeline/                     # 组装、校验、图片与字体处理、PDF 排版
├── tests/                             # 源稿、组装与制品破坏测试
├── build_book.py                       # PDF/EPUB 完整构建入口
├── build_source.py                     # 源稿校验与 Markdown/HTML 组装
├── render_pdf.py                       # PDF 导出入口
├── create_epub.py                      # EPUB 导出入口
├── validate_artifacts.py               # 当前源稿与两种制品的一致性校验
├── checksums.py                        # 发布文件 SHA-256 生成与核对
├── create_map.py                       # 项目知识地图绘制脚本
├── requirements-export.txt             # 固定版本的 Python 导出依赖
├── .github/workflows/publish-book.yml  # 标签发布与手动构建工作流
├── .gitignore                         # 排除生成文件和本地缓存
├── build/                             # 生成的中间文件，不入库
└── dist/                              # PDF、EPUB 与校验和，不入库
```

### 书稿与编排

- `chapters/`：每章一份 Markdown，维护正文、代码围栏、图片引用和该章来源。图片使用 `../resources/` 相对路径
- `front-matter/title-page.md`：书名、书稿版本标记和技术资料核验日期的来源；制品发行版本与发布日期由构建命令另行指定
- `front-matter/reading-guide.md`：进入书中的阅读说明
- `back-matter/`：分别维护术语、照片署名、核验边界与字体许可附录
- `book-order.json`：指定书名页、阅读说明、13 篇与 58 章以及附录顺序。篇内章名列表由章节标题生成，不重复维护
- `resources/` 与两份 JSON 素材清单：维护 158 幅原创机制图、11 张照片及其完整性与使用依据

`v1.0` 表示书稿组织版本。它与发布标签中的发行版本分别管理，不妨碍继续编辑其中的章节。

### 研究与导航资料

这些文件提供选题、先修关系和引用依据，不参与正文的自动组装。

- `planning/01-position-and-map.md`：读者定位、知识架构与目录设计依据
- `planning/03-paths-and-workflow.md`：岗位阅读路径、能力出口、图片及配套内容规划
- `planning/catalog-data.json`：用于规划的章节、主题与属性数据；实际出版顺序以 `book-order.json` 为准
- `planning/dependency-edges.csv`：章节和主题之间的必需先修、建议先修及交叉解释关系
- `planning/version-baseline.md`、`planning/glossary.md`：标准与工具版本基线、规划术语速查
- `evidence/sources.md`：技术来源、适用范围与核验日期
- `evidence/jobs.md`、`evidence/jobs-2025-supplement.md`：岗位能力研究样本及其日期、地区和证据限制，不表示岗位当前仍在招聘
- `assets/knowledge-map.png`、`create_map.py`：知识先修与交叉联系概览及其绘制源
- `assets/asset-manifest.csv`：项目知识地图与素材需求的规划台账；正文图片的实际许可和校验依据在书稿目录的 JSON 清单中

研究资料保留各自的核验日期与适用范围；正文内容和发布输入以当前书稿目录为准。

### 构建模块

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

## 怎样修改章节

1. 编辑 `manuscript/complete-edition/v1.0/chapters/` 中对应的 `Cxx-*.zh-CN.md`，保留稳定编号、章标题和分节结构
2. 同步维护该章引用；修改图源或照片时，审查来源与许可，再更新正文素材清单中的对应记录与 SHA-256
3. 修改阅读说明或附录时，直接编辑 `front-matter/`、`back-matter/`；调整编排时修改 `book-order.json`，并同步相关覆盖约束与测试
4. 运行测试与构建，检查生成的校验报告，并抽查改动涉及的页面、代码和图片

普通正文或代码示例修改不需要更新源文件锁。每次构建从当前章节重新组装，生成本次输入快照；快照用于发现旧构建输入，不是需要手工维护的编辑门槛。不要编辑 `build/book.md`、`build/chapters.html` 或 `dist/` 来修正文稿。

## 构建与发布

支持的 CI 环境是 Ubuntu 24.04、Python 3.11.9 和 Pandoc 3.1.11.1；还需要 Inkscape、Noto CJK 与 DejaVu 字体。完整安装说明、EPUBCheck 和发布步骤见 [RELEASE_BUILD.md](RELEASE_BUILD.md)。

环境就绪后，在仓库根目录运行：

```sh
python -m pip install -r requirements-export.txt
python -m unittest discover -s tests -v
python build_book.py \
  --input manuscript/complete-edition/v1.0 \
  --version local --date "$(date -u +%F)" \
  --build-dir build --output-dir dist
BOOK_TEST_BUILD=build \
BOOK_TEST_EXPORT_PROPAGATION=1 \
BOOK_TEST_EPUB=dist/modern-engineer-atlas-local.epub \
  python -m unittest discover -s tests -v
```

生成 `dist/modern-engineer-atlas-local.pdf`、`dist/modern-engineer-atlas-local.epub` 与 `dist/SHA256SUMS.txt`。源稿快照、组装结果和校验报告保存在 `build/`。这些目录均被 Git 忽略。

GitHub Actions 只在推送 `book-vMAJOR.MINOR.PATCH` 标签或手动运行时构建；普通 `main` 推送不会触发。手动运行只提供构建产物，标签运行通过全部门禁后才创建 Release。新发行标签应指向包含完整章节和当前管线的最终 `main` 提交；既有历史标签不移动、不覆盖。

## 核验范围与素材权利

构建校验关注章节完整性、正文与代码的一致性、图片与许可资料、导航链接及文件完整性。它不会编译或执行书中的教学代码，也不能代替技术实验、性能测量、硬件验证和真实阅读器测试。技术核验日期与制品发布日期分开维护，重新构建不表示完成了新一轮技术审查。

照片作者、来源和许可见[照片清单](manuscript/complete-edition/v1.0/photo-license-manifest.json)，字体许可见 [FONT-LICENSES.txt](manuscript/complete-edition/v1.0/FONT-LICENSES.txt)。相关署名和许可随阅读制品保留。照片及字体的许可不延伸为整本书的许可；项目尚未另行指定统一再授权条款。
