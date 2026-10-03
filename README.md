# modern-engineer-atlas

## 以现代 C++ 与系统思维为主线的软件工程师能力地图

本项目用于整理一本面向现代软件工程师的技术书：从语言与系统基础出发，连接岗位方向、工程实践和面试追问，帮助读者建立可以解释、验证和持续扩展的知识体系。

## 内容方向

- 共享基础：数据结构与算法、计算机体系结构、操作系统、现代 C++、并发、网络与性能分析
- 工程能力：构建、调试、测试、安全、协作、可靠交付与故障诊断
- 方向模块：嵌入式、系统与驱动、桌面软件、服务与数据库、音视频与图形、编译器、HPC 与 GPU
- 智能系统：AI 基础设施、推理优化、机器人、LLM 应用与 Agent 工程
- 能力验证：工程场景、常见错误、设计取舍、面试问题与递进追问

各方向按先修关系连接。读者可沿自己的目标岗位选择路径，逐步补齐基础与专门知识。

## 当前阶段

第一阶段研究与规划 V1，基准日期为 2026-10-03。

目前已形成书籍定位、知识架构、三级目录、岗位阅读路径、图片体系、来源清单与后续研究流程。目录规划为 13 篇、58 章、232 节；现进入第二阶段专题样章 v0.6，以 C13 vector 与 C55 可恢复 Agent 两篇完整专题稿校准写法。两篇覆盖各自选定的局部专题，不表示 C13、C55 的全部规划内容已经写完；说明代码与故障场景均未执行。

本仓库作为共同编辑的工作区。规划源稿、目录数据、来源清单、图示和导出工具纳入版本管理；合并稿、PDF、EPUB 和校验文件均在构建目录中生成，不提交到 Git。

## 阅读入口

- [规划源稿](planning/01-position-and-map.md)与[阅读路径源稿](planning/03-paths-and-workflow.md)：九项规划输出与证据附录
- [三级目录结构源](planning/catalog-data.json)：章节、节和章节属性
- [岗位阅读路径与后续流程](planning/03-paths-and-workflow.md)：13条路径、图片体系、在线配套和研究写作流程
- [知识依赖边表](planning/dependency-edges.csv)与[原创知识架构图](assets/knowledge-map.png)
- [技术来源台账](evidence/sources.md)、[招聘样本](evidence/jobs.md)、[2025年官方岗位补充](evidence/jobs-2025-supplement.md)
- [标准与版本基线](planning/version-baseline.md)、[术语速查](planning/glossary.md)
- [待决事项](DECISIONS.md)、[质量检查与限制](REVIEW.md)、[版本变化](CHANGELOG.md)

重要方向仍以讨论后确定的结论为准；上传草稿不代表内容已定稿。

## 第二阶段专题样章 v0.6

- [样章阅读说明](manuscript/samples/v0.6/README.md)：专题范围、修订方向、图文与核验边界
- [C13 从一组数据认识 vector](manuscript/samples/v0.6/C13-vector-lifetime.zh-CN.md)：用途与选择、基本操作与存储、借用有效期、工程取舍与排障
- [C55 从语言模型到可恢复的 Agent](manuscript/samples/v0.6/C55-agent-recovery.zh-CN.md)：适用范围、系统关系、只读协作、外部动作恢复与 MCP 边界
- [复核说明](manuscript/samples/v0.6/REVIEW.md)与[来源索引](manuscript/samples/v0.6/source-audit.md)
- [v0.5 历史样章](manuscript/samples/v0.5/README.md)
- [v0.4 历史样章](manuscript/samples/v0.4/README.md)
- [v0.3 历史样章](manuscript/samples/v0.3/README.md)
- [v0.2 历史样章](manuscript/samples/v0.2/README.md)
- [v0.1 历史样章](manuscript/samples/v0.1/README.md)

v0.6 精简开篇说明，删除重复的正文展开顺序与固定栏目预告，并通读两篇全文调整衔接。主题关系图随相关定义呈现，细节继续渐进展开，正文中的故障排查、面试追问与来源边界完整保留。对话只交付 PDF，权威 Markdown 与六幅原创图按版本维护。本版 PDF 为24页；图文、引用和逐页检查范围见复核记录，技术示例执行、故障实验和目标读者实测仍待完成。

## 内容与版本管理

以 Markdown 作为文本源，使用稳定的章节编号管理书稿、原创图示及资料清单，并从同一内容版本导出 PDF 和 EPUB。

知识点区分长期稳定、持续演进和快速变化内容；涉及标准、工具链、框架和实验时，记录适用版本、来源、环境与验证边界。正文、图示、引用和勘误随版本一起维护。

## 研究与质量原则

- 优先查阅官方规范、维护者文档、原始论文和可核验的工程资料
- 区分标准保证、平台行为、实验观察和编辑建议
- 招聘样本用于理解岗位的工作对象和能力组合，保留日期、地区和样本限制
- 图片记录来源与使用许可，优先使用原创图示
- 内容按事实准确性、知识结构和可读性进行审查
- 示例和实验完成验证后，再说明支持的环境与结论

## 编辑源与生成视图

- planning/01-position-and-map.md 和 planning/03-paths-and-workflow.md 是分段文字源
- planning/catalog-data.json 是三级目录的结构化源
- build_source.py 生成被 .gitignore 排除的 build/book.md、build/catalog.md 和 build/chapter-metadata.csv
- planning/dependency-edges.csv 维护章节与节之间的先修和交叉联系
- evidence/ 保留来源、岗位样本与证据限制
- assets/ 保留原创图、样式和[资产清单](assets/asset-manifest.csv)

修改编辑源后，再使用 build_source.py 生成根目录完整 Markdown；不要分别修改源和生成视图。PDF 和 EPUB 阅读版独立交付，仓库保留现有导出工具和必要资源，不保存渲染二进制。

## 文档导出

导出依赖记录在 requirements-export.txt；Pandoc、Python、Java 和 EPUBCheck 的版本在 GitHub Actions 中固定。create_map.py 当前使用 Linux Noto CJK 字体路径，其他平台需检查字体配置。

1. 在仓库根目录运行 python3 build_source.py --output-dir build，组装完整稿、目录视图和章节属性表
2. 需要更新知识图时，运行 python3 create_map.py
3. 安装 requirements-export.txt 中的 Python 依赖，并准备固定版本的 Pandoc
4. 运行 render_pdf.py 和 create_epub.py，分别传入 --input build/book.md、--version 和 --date，输出到被忽略的 dist/
5. 用官方 EPUBCheck 检查 EPUB，再运行 checksums.py write/verify 生成并核对 SHA-256 文件
6. 运行 validate_artifacts.py，传入 --manuscript、--pdf、--epub 和可选的 --checksums 做结构、覆盖、图片路径和文件完整性检查

EPUB 导出示例（具体发布版本由 book-v* 标签传入）：

```sh
python3 create_epub.py --input build/book.md \
  --output dist/modern-engineer-atlas-1.0.0.epub \
  --version 1.0.0 --date 2026-10-03
```

GitHub Actions 只响应 `book-v*` 推送，并额外要求 `book-vMAJOR.MINOR.PATCH`；构建 Job 只有 `contents: read`，发布 Job 使用自动提供的 `GITHUB_TOKEN` 和 `contents: write`。已有同名 Release 会使发布失败，上传不使用覆盖选项。仓库未启用 Git LFS。

这些工具不承诺重建文件逐字节一致；每个正式标签的 PDF、EPUB 和 SHA-256 文件只作为 GitHub Release 附件发布，不回写 Git。

## 当前验证边界与素材权利

V1 的目录覆盖、依赖节点、Markdown 图片路径及交付版 PDF/EPUB 结构由 validate_artifacts.py 检查；正式标签构建还会运行 EPUBCheck 和 SHA-256 核对。真实手机/阅读器测试、PDF 全品牌阅读器兼容验证、技术示例和硬件实验仍未开展。

知识图为本版原创。资产清单中的其他实物图片仅为计划，仍需取得并核对许可。来源台账保留链接和用途说明，未收录外部标准、教材或招聘页面的完整复制件。项目尚未另行指定再授权许可。

