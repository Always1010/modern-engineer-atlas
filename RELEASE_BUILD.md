# 构建与发布说明

## 输入与生成关系

发布输入为 `manuscript/complete-edition/v1.0/`：58 份分章正文、前后附录、`book-order.json`、图源和许可资料。`planning/` 与 `evidence/` 提供研究依据，不作为出版正文输入。

`book_pipeline/assembly.py` 按 `book-order.json` 组装 13 篇、58 章和前后附录，生成篇内章名列表与目录，解析章内引用并调整图片相对路径。正文直接来自当前章节；整本 Markdown 只生成到 `build/book.md`。PDF 与 EPUB 使用同一次组装的 `build/chapters.html`、图片与字体资源。

普通章节编辑不需要更新哈希锁，也不需要另存或同步合并稿。构建记录当前源文件快照与生成 HTML 的哈希；制品校验会重新对照当前源稿，拒绝过期的 Markdown、HTML 或输入快照。图片仍由书稿中的 `asset-manifest.json` 校验完整性，改图时须审查并更新对应素材记录。

## 环境

GitHub Actions 使用以下环境：

- Ubuntu 24.04
- Python 3.11.9
- Pandoc 3.1.11.1
- Inkscape、`fonts-noto-cjk`、`fonts-dejavu-core`
- `requirements-export.txt` 中固定版本的 Python 包
- Java 17 与 EPUBCheck 5.4.0，用于 EPUB 发布门禁

字体默认读取 Debian/Ubuntu 标准系统路径。其他系统需自行满足路径与工具要求；不保证跨操作系统的分页或文件字节完全一致。构建不需要预制 PDF/EPUB、私人工作目录、登录信息或 API 密钥。

在 Ubuntu 上安装系统依赖，并准备上述版本的 Python、Pandoc 和官方 EPUBCheck：

```sh
sudo apt-get update
sudo apt-get install --yes --no-install-recommends \
  inkscape fonts-noto-cjk fonts-dejavu-core openjdk-17-jre-headless
python -m pip install -r requirements-export.txt
python --version
pandoc --version
inkscape --version
java -version
```

EPUBCheck 5.4.0 从 [W3C 官方发行页](https://github.com/w3c/epubcheck/releases/tag/v5.4.0)取得并解压。下文将 `EPUBCHECK_JAR` 设为解压所得 `epubcheck.jar` 的实际路径；GitHub Actions 会自动安装并运行它。

## 完整本地构建

在仓库根目录执行。示例使用 `local` 作为本地制品版本，不创建标签或 Release。

```sh
VERSION=local
BUILD_DATE="$(date -u +%F)"
EPUBCHECK_JAR=/path/to/epubcheck.jar

python -m unittest discover -s tests -v

python build_book.py \
  --input manuscript/complete-edition/v1.0 \
  --version "$VERSION" --date "$BUILD_DATE" \
  --build-dir build --output-dir dist

BOOK_TEST_BUILD=build \
BOOK_TEST_EXPORT_PROPAGATION=1 \
BOOK_TEST_EPUB="dist/modern-engineer-atlas-$VERSION.epub" \
  python -m unittest discover -s tests -v

java -jar "$EPUBCHECK_JAR" "dist/modern-engineer-atlas-$VERSION.epub"

python validate_artifacts.py \
  --source manuscript/complete-edition/v1.0 --build-dir build \
  --pdf "dist/modern-engineer-atlas-$VERSION.pdf" \
  --epub "dist/modern-engineer-atlas-$VERSION.epub" \
  --checksums dist/SHA256SUMS.txt

python checksums.py verify dist/SHA256SUMS.txt
```

`build_book.py` 自带源稿、制品和校验和检查，但不调用 EPUBCheck；本地发布验收须另行执行上面的 EPUBCheck 命令。构建前尚无制品时，制品破坏测试会明确跳过；构建后用 `BOOK_TEST_EPUB` 指向本次 EPUB 再运行，避免测到其他版本的文件。

### 版本和日期

- `front-matter/title-page.md` 提供书名、书稿版本标记和技术资料核验日期
- `--version` 指定制品发行版本，写入封面、EPUB 元数据和成品文件名
- `--date` 为 ISO 格式的制品发布日期，例如 `2026-10-04`；Actions 使用运行时的 UTC 日期
- 书稿目录 `v1.0` 与制品发行版本分别管理。重新构建或增加发行版本，不表示重新审查了技术资料

### 输出文件

| 路径 | 用途 |
| --- | --- |
| `dist/modern-engineer-atlas-VERSION.pdf` | 带目录、书签和矢量机制图的 PDF |
| `dist/modern-engineer-atlas-VERSION.epub` | 带导航、嵌入字体和图片的 EPUB |
| `dist/SHA256SUMS.txt` | 本次 PDF/EPUB 的 SHA-256 |
| `build/book.md` | 由当前源稿生成的整本 Markdown |
| `build/chapters.html` | PDF/EPUB 共享的正文结构 |
| `build/cover-metadata.json` | 当前书名页解析所得的封面元数据 |
| `build/chapter-edit-regression.json` | 临时编辑向三种格式传播的测试结果 |
| `build/source-validation.json` | 源稿覆盖统计、当前输入快照与 HTML 哈希 |
| `build/validation.json` | 完整构建的制品校验报告 |
| `build/diagram-export.json`、`build/pdf-vectorization.json` | 图示导出与 PDF 矢量替换检查记录 |
| `build/heading-pages.json` | PDF 标题页码记录 |
| `build/resources/`、图示导出目录、字体文件 | 可重新生成的构建资源 |
| `build/epubcheck.log` | Actions 保存的官方 EPUBCheck 输出 |

`build/`、`dist/`、PDF、EPUB、校验和与 Python 缓存均被 `.gitignore` 排除。不要将生成文件提交为新的正文来源。

## 分步检查与编辑

仅检查源稿并组装 Markdown/HTML：

```sh
python build_source.py \
  --input manuscript/complete-edition/v1.0 \
  --output-dir build
```

该步骤会复制正文资源和许可资料，但不会完成图示导出、字体准备或 PDF/EPUB 生成。`render_pdf.py` 与 `create_epub.py` 的 `--input` 接受准备好的构建目录，并要求 `--output`、`--version` 和 `--date`；通常应使用 `build_book.py` 一次完成所有依赖步骤。

维护规则：

1. 正文、引用与代码在对应的 `chapters/Cxx-*.zh-CN.md` 中修改；章内代码围栏按原文导出，数量按当前章节计算
2. 书名页、阅读说明及附录分别在 `front-matter/`、`back-matter/` 中修改；出版顺序在 `book-order.json` 中维护
3. 图源或照片修改后，审查内容、来源与许可，更新 `asset-manifest.json` 中相应 SHA-256；照片署名和许可变更还需同步照片清单与附录
4. 重新运行完整构建及测试，打开两种制品抽查改动页、图注、代码和导航。不要用修改生成文件的方式绕过失败门禁

覆盖检查由书名页的源版本选择 book_pipeline/edition-profiles.json 中的受控版次约束。本版为 13 篇、58 章、每章 4 个编号主题、158 幅机制图和 11 张照片；初版配置继续保留。增删章节、主题或图片需同步编排、版次约束和测试，不能只改数量说明或放宽完整性校验。

## 图片、字体与许可

- 中文使用由 Noto Sans CJK SC 转换并重命名的 Atlas Sans 子集字体，符号和代码使用 DejaVu Sans/Mono。EPUB 嵌入四份字体，PDF 嵌入所需字体子集
- `book_pipeline/make_fonts.py` 保留字体版权和许可；书稿与两种制品均包含相应许可资料
- SVG 由 Inkscape 导出。PDF 先完成布局，再经像素与透明度匹配把图示替换为轮廓化矢量图
- EPUB 的 16 幅 PNG 回退图由 `book_pipeline/epub-png-fallbacks.json` 指定，本版其余 142 幅机制图为无外部字体依赖的轮廓化 SVG
- 本版 11 张 JPEG 照片在两种制品中保留原始字节，作者、来源、许可与修改说明随书附上
- 照片和字体的授权范围各自独立，不构成整本书的统一再授权

## 自动检查的范围

### 源稿与组装

校验实际 58 章及其内容长度、232 个编号主题、章节顺序、前后附录、路径安全、图片引用和替代文本、素材哈希、许可资料及代码围栏。目录或提纲不能充当正文。章节标题变化会进入篇内列表与目录，章内引用按章解析，代码内容不会被路径或引用归一化改写。

`tests/test_assembly.py` 与 `tests/test_manuscript.py` 覆盖正常正文和代码编辑、无合并源稿时的组装，以及缺章、重复/错序编排、越界路径、失效代码围栏、缺图和改图等情况。校验不会修改源文件。

### PDF 与 EPUB

- PDF：检查章书签、编号主题、实质段落、完整代码、可提取文本、矢量图和照片字节、页面文字边界、内部链接及空白页。页数只作合理性检查，不能代替内容一致性检查
- EPUB：检查 ZIP 规则、XML、OPF、spine、导航、本地链接与锚点、字体资源、全部前后文章节和代码、全部图片、照片字节、SVG/PNG 内容及 SVG 属性
- 共同输入：重新从当前源稿组装，对照 `build/book.md`、`build/chapters.html` 和输入快照，防止把旧正文误当作新版本导出
- 三格式传播测试：`BOOK_TEST_EXPORT_PROPAGATION=1` 启用临时源稿编辑与 PDF/EPUB 重建；Actions 在完整构建后运行此门禁
- 制品破坏测试：对生成的 EPUB 刻意修改正文、照片和 SVG 元数据，确认校验会拒绝损坏制品
- 官方 EPUBCheck 5.4.0：Actions 的独立必过门禁。内部结构检查通过不等于运行过 EPUBCheck

这些检查不执行书中示例，不验证性能结论、硬件行为或所有真实阅读器。自动检查通过后仍应检查修改涉及的排版与阅读效果；报告应按实际运行结果解读。

## GitHub Actions 与发布

工作流为 `.github/workflows/publish-book.yml`：

- 推送 `book-vMAJOR.MINOR.PATCH` 标签，构建并校验，再创建 GitHub Release。工作流接收 `book-v*`，并在入口严格检查三段数字的版本格式
- `workflow_dispatch` 手动运行仅构建，可指定制品版本标签，不创建 Release
- 普通 `main` 推送不会触发此工作流
- 构建任务只有 `contents: read`；发布任务单独取得 `contents: write`，使用 GitHub 临时工作流令牌

### 发布步骤

1. 将需要发行的章节、资源、管线和文档提交到 `main`，完成审阅并确认最终提交 SHA
2. 从该提交进行本地完整构建，或在该分支手动运行工作流检查构建；查看源稿校验、制品校验、破坏测试和 EPUBCheck 的实际结果
3. 选择尚未使用的发行版本，将新的 `book-vMAJOR.MINOR.PATCH` 标签指向已确认的最终 `main` 提交，再推送该标签
4. 检查标签对应的 Actions 运行。仅在全部门禁成功后，发布任务才上传 PDF、EPUB 和 `SHA256SUMS.txt`
5. 检查 Release 的标签提交、三个附件和下载文件的 SHA-256，确认实际发布内容

既有 `book-v1.0.0` 属于历史版本，不应当作当前完整章节源与新管线的发布证明，也不应移动或删除后重用。新发行必须使用新的标签并指向最终提交。

### 失败与重试

已有 Release 不覆盖。发布任务先创建草稿，三个附件上传成功后才公开；上传失败会留下未公开草稿，避免出现缺少附件的公开发行。重试不会覆盖既有草稿，需先检查并处理失败原因及草稿状态。

构建失败时，优先查看 Actions 保存的 `book-build-evidence-*`；其中保留已生成的源稿、制品、矢量替换、页码与 EPUBCheck 记录。源稿或管线修正后重新构建，用新的未使用发行标签发布，不强行改写历史标签。
