# 核对与阅读制品重建

当前版本：v1.0，2026-10-10学习顺序修订版，7章35节。正文、图源、例子和生成工具是编辑源；HTML/PDF生成于output/pdf，检查产物存于qa，两者不入Git。

## 代码与资料核对范围

按用户明确要求，示例以可移植语法与接口摘录为主，后续不编译或运行C++程序。静态复核关注声明语法、头文件、已存在对象/上下文、参数与结果、版本及前提；它不是编译器证明，也不是所有平台行为的实测保证。

标准规则采用匹配版本公开草案；平台API、网络协议与工具采用官方资料。需要C++20/23标准库的短例就地标记，OS接口分平台。未运行Linux/Windows端点、任意并发交错、协程调度框架、各厂商标准库或Sanitizer，不根据本机返回值断言可移植语义。

历史检查保存在Git。2026-10-07/08旧稿曾在有限Windows工具链下运行部分配套程序；本次收到停止运行的要求之前，也做过有限的调试/工具类型/I/O例子检查。这些历史事实不能覆盖重构后的全部短例，不作为当前完成标准。配套工程README只维护接口、源码与适用范围。

## 文档与制品检查

- 目录与索引从实际标题生成，来源R编号和读者章、节编号分离；带片段的链接必须解析到具体条目。
- 本轮learning-revision-migration.json核对35节、478个旧主题的实际目标；每章、每节另起一页，小节连续排版。
- catalog中的历史迁移记录核对32旧章、183旧H2、87旧表及旧图去向，目标为当前真实标题。
- 源码工具核对显式source摘录；普通配套程序只检查引用关系，不强制全文嵌入正文。
- HTML检查图片加载、导航锚点、重复ID与候选布局溢出；SVG静态内嵌。
- 索引严格匹配正文标题；catalog登记中英概念及成员别名。完整制品使用已有Python/pypdf读取PDF命名目标、补入目录/附录页码并重排至稳定；缺失目标或页码不收敛会使构建失败。
- PDF检查章节、可检索文字、页边界和替换字符；全页渲染，联系图检查版面，稀疏/密集页进一步复核。HTML/PDF检查不执行C++代码。

2026-10-09对象条目版的266页及其检查结果属于整改前记录，已由本轮蓝色排版制品取代。蓝色排版阶段的检查结果见LAYOUT-REMEDIATION.zh-CN.md；当前 v1.0 的内容修订与制品验收见LEARNING-REVISION.zh-CN.md，详细报告存于qa/learning-revision。

## 使用已有环境重建

在本版本目录执行。Node包目录需要已有marked与playwright，浏览器参数指向已有兼容Chromium程序；变量取值由使用者提供，不安装依赖。

```powershell
$nodeModules = '已有Node包目录'
$browserExe = '已有浏览器程序路径'
$pythonExe = '已有Python程序路径'
node tools/sync-handbook-catalog.mjs
node tools/sync-handbook-index.mjs
node tools/check-handbook.mjs
node tools/check-example-sources.mjs
node tools/check-learning-revision.mjs
node tools/check-handbook-style.mjs
node tools/build-handbook.mjs $nodeModules $browserExe "--python=$pythonExe"
New-Item -ItemType Directory -Force qa/learning-revision/final-render | Out-Null
pdftoppm -r 90 -png output/pdf/Cpp-Reference-Handbook-v1.0.pdf qa/learning-revision/final-render/page
& $pythonExe tools/inspect-learning-pagination.py
& $pythonExe tools/inspect-handbook-pdf.py --pdf output/pdf/Cpp-Reference-Handbook-v1.0.pdf --qa qa/learning-revision/final-render --sheets
```

Python检查需要已有pdfplumber、pypdf和Pillow，页图需要已有Poppler。同步目录时保留catalog中已登记的迁移记录；重新追溯基线仅为编辑工作，不要求读者拥有ignored迁移工作文件。源码对应工具只静态读取文件，以上命令不编译执行任何示例。

新的局部审阅制品与全书共用tools/handbook.css、handbook-typography.mjs和标题模型；历史v2—v5样章保留为对照。若修改正文，重新同步目录/索引并生成受影响制品；若修改公共样式，重新检查全书页图。短代码尽量整体放置，长代码允许分页，续表重复表头；宽表先拆分内容。短节末说明连同标题整体放置，避免配套链接单独续到下一页。

HTML/PDF中的examples链接指向配套本地文件，单独复制PDF不会携带源码。SVG已内嵌HTML并进入PDF，不依赖外部图片加载。

## 独立 GitHub Release

专用工作流为 [publish-cpp-handbook.yml](../../../.github/workflows/publish-cpp-handbook.yml)。能力地图的 `book-v*` 标签使用自己的发布工作流；手册使用 `cpp-handbook-v*` 标签。

推送 `codex/cpp-reference-handbook` 分支且手册、专用工作流或手册发行说明变化时，工作流只构建和检查，成功后保存 `cpp-handbook-files-运行ID` 与 `cpp-handbook-evidence-运行ID`。标签推送不受路径过滤限制；合法 `cpp-handbook-vMAJOR.MINOR.PATCH` 形式的标签在检查成功后创建 Release。发行版本由标签指定，支持 `1.0.1`、`1.1.0`、`2.0.0` 等三段非负整数版本号，每段不含多余的前导零，并要求存在对应的发行说明。

当前书稿内容版为 `v1.0`，内部构建保留原文件名，发布附件使用标签中的发行版本。书稿内容版和发行版本分别记录在 `build-info.json` 中；提升发行版本号不会自动修改书稿目录、内容版或正文中的版本信息。升级书稿内容版时，需要同步修改编排、构建与核验配置。

工作流检出事件对应提交，采用 Windows 2022 runner、固定 Node/Python 和锁定的 Node/Python 包，使用匹配 Playwright 的 Chromium。Poppler、Noto CJK 字体及其许可证来源和 SHA-256 固定在 `tools/release/runtime-sources.json`。安装脚本只允许 GitHub Actions 环境执行；本机继续使用已有依赖，不因发布测试自动安装软件。CI 检查必需字体并记录 runner、工具、字体与源文件摘要；首次或字体/排版变更时审阅全页联系图及报告提示页。

目录、catalog 和索引同步后若与提交内容不同，CI 失败，需先在源分支修正并提交。检查覆盖已有源稿、源码摘录、修订覆盖、样式、HTML 导航、PDF 分页、字体嵌入、可检索文字、页边界及全页渲染，不编译或执行 C++ 示例。`check-handbook.mjs --publication` 仅将历史 `REVIEW-REPORT.zh-CN.md` 中仓库外的绝对附件路径记录为非发布依赖；仍核对全部仓库内链接和阅读正文，不跳过它们。全新检出没有 ignored 历史基线，构建记录明确标记这项检查未执行。

`tools/release/package-handbook.py` 只收集正式手册与 tracked 配套文件。单独下载的 HTML/PDF 源码链接指向本发行标签；离线 HTML 使用配套包相对路径。PDF 外部链接修改后检查页内容、书签、命名目标和链接数量保持一致。`verify-release.py` 校验完整五文件清单、摘要、来源提交及 ZIP 内容和链接，不信任校验文件或归档中的路径。

正式附件：`Cpp-Reference-Handbook-v<发行版本>.pdf`、同名 HTML、`Cpp-Reference-Handbook-v<发行版本>-bundle.zip`、`build-info.json` 和 `SHA256SUMS.txt`。ZIP 包含 PDF、离线 HTML、examples、sources、字体许可证和构建记录；不含旧版或排版样稿。QA 页图和报告保留为 Actions 证据。GitHub 自动 Source code ZIP/TAR 是整个仓库的标签快照。

### 发行步骤

1. 提交专用工作流、发布工具和对应 `revisions/cpp-handbook-v<发行版本>.md`；推送当前分支。
2. 等待该提交的手册预构建成功，检查 QA 报告及首次 CI 联系图。从 Actions Summary 获取完整源提交 SHA。
3. 给这个已验证提交创建新的 annotated 标签，并只推送该标签：

```powershell
$releaseCommit = '预构建成功并完成版面核验的完整提交SHA'
$releaseTag = 'cpp-handbook-v1.1.0' # 示例；选择尚未发布的版本
git tag -a $releaseTag $releaseCommit -m "C++ Reference Handbook $releaseTag"
git push origin $releaseTag
```

4. 标签构建成功后，发布任务下载并复核附件及远端标签提交，以 `--verify-tag` 创建草稿，上传全部附件，核对远端名称、大小和 SHA-256 后公开。手册使用 `--latest=false`，不会替换能力地图的 Latest 入口。下载后可使用 SHA256SUMS 核对文件。

重复标签格式、缺少专属发行说明、任何检查失败或已有同名 Release/草稿时停止，不覆盖。上传失败保留草稿并报告失败；检查失败原因及草稿状态后再决定恢复，不自动删除公开发行或移动已发布标签。后续内容修正用新提交、新发行说明与新版本标签。内容版升级需同步封面、catalog、检查规则及构建配置。

## 局部审阅制品生成

样章与全书共用正文、标题模型、生成器及CSS。局部制品用于审查对象条目和分页，不另维护一套内容或样式。R13仍可单独输出；跨领域模板选择R04、R17、R26、R31。

### 生成入口

在本版本目录执行，两个参数使用已有Node包目录与Chromium浏览器程序。本命令只导出HTML/PDF，不安装依赖，不编译运行C++。

```powershell
node tools/render-r13-review.mjs $nodeModules $browserExe
node tools/build-handbook.mjs $nodeModules $browserExe --chapters=R04,R17,R26,R31
```

R13按需生成output/pdf/R13-sequence-containers-review.pdf与同名HTML。跨领域模板输出为output/pdf/Handbook-template-samples.pdf与同名HTML。正式整书入口和检查口径见本文前述章节。

### 审阅对象

关注类型/规则是否先定义、基本操作是否明确、参数与结果是否就地可查、必要条件是否清楚，以及图表是否承担正确职责。代码是短摘录，完整组合源码在examples；不以是否含main或能否在当前机器执行判断正文质量。

检查版面时关注标题与后文、短代码完整性、续表表头、图注、长行和空白页。局部制品不能代替全书排版检查；生成文件与页图不提交Git，改正文或公共样式后重建。
