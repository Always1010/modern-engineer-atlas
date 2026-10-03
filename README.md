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

目前已形成书籍定位、知识架构、三级目录、岗位阅读路径、图片体系、来源清单与后续研究流程。当前目录规划为 13 篇、58 章、232 节；正式章节正文和配套代码实验尚未开始。

本仓库作为共同编辑的工作区。V1 规划、目录、来源清单、图示和文档导出工具已纳入版本管理；在形成阶段成果或完成实质性变更后提交，提交记录用于追踪变化。

## 阅读入口

- [完整规划 V1](Modern-Engineering-Book-Plan-V1.zh-CN.md)：九项规划输出与证据附录
- [完整三级目录](planning/02-complete-catalog.md)：13篇、58章、232节及章节属性
- [岗位阅读路径与后续流程](planning/03-paths-and-workflow.md)：13条路径、图片体系、在线配套和研究写作流程
- [知识依赖边表](planning/dependency-edges.csv)与[原创知识架构图](assets/knowledge-map.png)
- [技术来源台账](evidence/sources.md)、[招聘样本](evidence/jobs.md)、[2025年官方岗位补充](evidence/jobs-2025-supplement.md)
- [标准与版本基线](planning/version-baseline.md)、[术语速查](planning/glossary.md)
- [待决事项](DECISIONS.md)、[质量检查与限制](REVIEW.md)、[版本变化](CHANGELOG.md)

重要方向仍以讨论后确定的结论为准；上传草稿不代表内容已定稿。

## 内容与版本管理

以 Markdown 作为文本源，使用稳定的章节编号管理书稿、原创图示及资料清单，并从同一内容版本导出 PDF 和 EPUB。

知识点区分长期稳定、持续演进和快速变化内容；涉及标准、工具链、框架和实验时，记录适用版本、来源、环境与验证边界。正文、图示、引用和勘误随版本一起维护。

## 研究与质量原则

- 优先查阅官方规范、维护者文档、原始论文和可核验的工程资料
- 区分标准保证、平台行为、实验观察和编辑建议
- 招聘样本用于理解岗位的工作对象和能力组合，保留日期、地区和样本限制
- 图片记录来源与使用许可，优先使用原创图示
- 内容按事实准确性、教学结构和可读性进行审查
- 示例和实验完成验证后，再说明支持的环境与结论

## 编辑源与生成视图

- planning/01-position-and-map.md 和 planning/03-paths-and-workflow.md 是分段文字源
- planning/catalog-data.json 是三级目录的结构化源
- planning/02-complete-catalog.md 和 planning/chapter-metadata.csv 是目录数据生成的视图
- planning/dependency-edges.csv 维护章节与节之间的先修和交叉联系
- evidence/ 保留来源、岗位样本与证据限制
- assets/ 保留原创图、样式和[资产清单](assets/asset-manifest.csv)

修改编辑源后，再使用 build_source.py 生成根目录完整 Markdown；不要分别修改源和生成视图。PDF 和 EPUB 阅读版独立交付，仓库保留现有导出工具和必要资源，不保存渲染二进制。

## 文档导出

现有工具不自动安装依赖，也不执行远程操作。使用前准备 Python 3、ReportLab、Pillow、PyMuPDF 和 Pandoc；create_map.py 当前使用 Linux Noto CJK 字体路径，其他平台需检查字体配置。

1. 在仓库根目录运行 python3 build_source.py，组装完整稿、目录视图和章节属性表
2. 需要更新知识图时，运行 python3 create_map.py
3. 创建 exports 目录，运行 python3 render_pdf.py 导出 PDF
4. 运行 python3 create_epub.py 生成窄屏友好文本，再用 Pandoc 导出 EPUB3
5. PDF 和 EPUB 均已生成后，运行 python3 validate_artifacts.py 做结构与覆盖检查

EPUB 导出示例：

```sh
mkdir -p exports
python3 create_epub.py
pandoc qa/epub-input.md --from markdown --to epub3 \
  --resource-path=. --css=assets/epub.css --toc \
  --metadata lang=zh-CN \
  --metadata title="现代 C++ 与软件工程师面试指南：第一阶段研究与规划 V1" \
  -o exports/Modern-Engineering-Book-Plan-V1.zh-CN.epub
```

这些工具尚未锁定跨平台环境，不承诺重建文件逐字节一致。重新导出的制品仍需检查版式和实际阅读效果。

## 当前验证边界与素材权利

V1 的58章232节覆盖、依赖节点、Markdown 图片路径及交付版 PDF/EPUB 结构已检查。EPUB 尚未完成 EPUBCheck 全量校验和真实手机/阅读器测试；PDF 未做所有品牌阅读器兼容验证。技术示例和硬件实验尚未开展。

知识图为本版原创。资产清单中的其他实物图片仅为计划，仍需取得并核对许可。来源台账保留链接和用途说明，未收录外部标准、教材或招聘页面的完整复制件。项目尚未另行指定再授权许可。
