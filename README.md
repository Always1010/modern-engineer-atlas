# 现代软件工程师能力地图

以现代 C++ 与系统思维为主线，连接语言基础、机器运行、工程实践与岗位能力。本书面向已有基本编程经验、希望建立完整知识体系的软件工程师，围绕机制解释、设计取舍、故障诊断和工程证据展开。

正文包含 **13 篇、58 章、232 个主题**，覆盖公共基础、现代 C++、并发与性能、可靠交付、嵌入式产品与工业设备软件、服务与数据、音视频与图形、编译器、HPC 与 GPU、AI 基础设施、机器人、LLM 应用与 Agent 工程。章节采用中文标题与分节编号，文件使用稳定的 `C01` 至 `C58` 编号。

## 阅读入口

| 书稿 | 定位与规模 | 入口 |
| --- | --- | --- |
| 现代软件工程师能力地图 | 以现代 C++ 与系统思维连接工程方向；13 篇、58 章、232 个主题 | [书稿与编排](manuscript/complete-edition/v1.0/README.md)、[阅读指南](manuscript/complete-edition/v1.0/front-matter/reading-guide.md) |
| C++ 与计算机基础图解参考手册 v1.0 | 按对象、规则和任务查阅；7章、35节，独立编排 | [手册入口](manuscript/cpp-reference-handbook/v1.0/README.md)、[正文目录](manuscript/cpp-reference-handbook/v1.0/TOC.md) |

## 维护入口

- [项目维护文档导航](docs/README.md)：按任务查找现行说明、研究资料和历史记录，并明确文档归属。
- [通用文章风格规范](docs/technical-article-style.md)：复用参考手册确认的结构、行文、标注和页面样式规则，包含判断示例与其他文章使用指令。
- [能力地图维护说明](docs/maintenance.md)：编辑源、日常修改、素材职责与构建模块。
- [能力地图构建与发布](RELEASE_BUILD.md)：环境、完整命令、制品校验和 GitHub Release 流程。
- [手册编辑规范](manuscript/cpp-reference-handbook/v1.0/EDITORIAL-SPEC.md)、[核对与重建说明](manuscript/cpp-reference-handbook/v1.0/BUILD-NOTES.md)：条目规则、静态核对、全书与局部制品生成。
- [已确认问题记录](docs/ISSUES.md)：语义勘误、导航及实现问题的原因、状态和验证范围。

分章稿是正文的唯一编辑源。能力地图的整本 Markdown 只生成到 `build/book.md`；PDF、EPUB 和手册 HTML/PDF 均由各自书稿及生成工具构建。日常修改在对应书稿源文件中进行。

## 项目结构

```text
.
├── manuscript/
│   ├── complete-edition/v1.0/       # 能力地图：正文、前后文、编排、图源和许可
│   └── cpp-reference-handbook/v1.0/ # 参考手册：正文、索引、例子和独立生成工具
├── docs/                          # 维护导航、能力地图维护说明、已确认问题
├── RELEASE_BUILD.md               # 能力地图构建与发布的完整说明
├── planning/                      # 2026-10-03 第一阶段规划与结构数据
├── evidence/                      # 技术来源与岗位研究证据，保留各自日期
├── revisions/                     # 能力地图按发行版本保存的修订记录
├── assets/                        # 项目知识地图、素材规划表、EPUB 样式
├── book_pipeline/                 # 能力地图的组装、校验和导出模块
├── tests/                         # 能力地图的源稿、组装及制品检查
├── build_book.py                   # 能力地图 PDF/EPUB 完整构建入口
├── build_source.py                # 源稿校验与 Markdown/HTML 组装
├── render_pdf.py / create_epub.py  # 两种制品的导出入口
├── validate_artifacts.py           # 源稿与生成制品的一致性校验
├── checksums.py / create_map.py    # 发布校验和与项目知识地图工具
├── requirements-export.txt        # 能力地图固定版本的 Python 导出依赖
└── .github/workflows/              # 能力地图标签发布与手动构建工作流
```

能力地图的 `v1.0` 表示书稿组织版本；当前工业产品工程修订稿的源版本为 `1.1.0`，发行版本由构建命令指定。参考手册在自己的 `v1.0` 目录维护。详细版本记录与早期规划见[维护文档导航](docs/README.md)。

## 核验范围与素材权利

构建校验关注章节完整性、正文与代码的一致性、图片与许可资料、导航链接及文件完整性。技术核验日期与制品发布日期分开维护；实际运行的检查及其边界见对应书稿的核验和构建说明。

照片作者、来源和许可见[照片清单](manuscript/complete-edition/v1.0/photo-license-manifest.json)，字体许可见 [FONT-LICENSES.txt](manuscript/complete-edition/v1.0/FONT-LICENSES.txt)。相关署名和许可随阅读制品保留。照片及字体的许可不延伸为整本书的许可；项目尚未另行指定统一再授权条款。
