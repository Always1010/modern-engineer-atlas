# 项目维护文档导航

这里按工作任务组织正文之外的文档。读者入口见[项目首页](../README.md)；维护时先选择对应书稿，再查编辑规则、构建说明或问题记录。

[技术文章与书稿风格规范](technical-article-style.md)记录参考手册整改中确认的可复用约束，包括行文、重点标注、字体与配色、表格、代码说明和版本提示，附标注示例及可复制的任务指令。用于其他文章时明确采用，并另列其技术基线、结构和核验方式；现有书稿的专属规则在各自编辑文档中维护。

## 当前维护入口

| 要做的事 | 能力地图 | C++ 图解参考手册 |
| --- | --- | --- |
| 找到编辑源与编排 | [书稿说明](../manuscript/complete-edition/v1.0/README.md)、[编排清单](../manuscript/complete-edition/v1.0/book-order.json) | [手册说明](../manuscript/cpp-reference-handbook/v1.0/README.md)、[目录数据](../manuscript/cpp-reference-handbook/v1.0/catalog.json) |
| 确认范围与编写规则 | [主题覆盖](../manuscript/complete-edition/v1.0/COVERAGE.md)、[核验边界](../manuscript/complete-edition/v1.0/EDITION-NOTES.md) | [编辑规范](../manuscript/cpp-reference-handbook/v1.0/EDITORIAL-SPEC.md) |
| 构建或检查制品 | [构建与发布](../RELEASE_BUILD.md)、[维护与构建模块](maintenance.md) | [核对、全书重建与局部审阅](../manuscript/cpp-reference-handbook/v1.0/BUILD-NOTES.md) |
| 查修订依据与验证记录 | [v1.1.0 修订记录](../revisions/book-v1.1.0.md) | [v1.0 学习顺序修订](../manuscript/cpp-reference-handbook/v1.0/LEARNING-REVISION.zh-CN.md)、[历史审查依据](../manuscript/cpp-reference-handbook/v1.0/REVIEW-REPORT.zh-CN.md) |

[已确认问题记录](ISSUES.md)集中记录语义勘误、导航和实现问题。`HB-` 编号对应 C++ 参考手册；状态与验证范围在各条记录中维护。普通内容扩展通过正文及 Git 提交追溯。

能力地图目录中的 `v1.0` 是书稿组织版本，当前工业产品工程修订稿的源版本为 `1.1.0`；发行版本由构建命令指定。C++ 参考手册在自己的 `v1.0` 目录维护，使用独立的生成工具。两套书稿的技术基线、核验范围和构建流程分别查阅。

## 研究与早期规划

下列资料属于能力地图在 **2026-10-03** 的第一阶段研究与规划。保留它们用于追溯定位、选题和先修关系；其中“尚未开始正文”“待确认”“下一阶段”等描述是当时的状态。当前正文和编排分别以书稿目录与 `book-order.json` 为准。

| 资料 | 用途与维护边界 |
| --- | --- |
| [定位与知识架构](../planning/01-position-and-map.md) | 原始立项、方向分类与三级目录建议 |
| [阅读路径与工作流规划](../planning/03-paths-and-workflow.md) | 原方案第六至九部分，含图片与在线配套设想；文件编号沿用历史路径 |
| [规划目录数据](../planning/catalog-data.json)、[先修关系表](../planning/dependency-edges.csv) | 规划章号、主题属性与依赖关系；出版顺序以书稿编排为准 |
| [技术版本基线](../planning/version-baseline.md)、[规划术语速查](../planning/glossary.md) | 当时的教学建议与术语约定；当前章内版本说明及随书术语表在书稿中维护 |
| [技术来源台账](../evidence/sources.md) | 研究来源与采用范围；新增章节来源及核验日期在对应章节中维护 |
| [岗位样本](../evidence/jobs.md)、[2025 年历史样本补充](../evidence/jobs-2025-supplement.md) | 岗位能力研究证据，保留各自日期、地区和证据限制 |
| [知识地图](../assets/knowledge-map.png)、[绘制源](../create_map.py)、[素材规划台账](../assets/asset-manifest.csv) | 项目导航和素材需求；正文图片的实际完整性与许可依据是书稿中的 JSON 清单 |

## 文档归属与更新规则

| 内容 | 维护位置 | 更新方式 |
| --- | --- | --- |
| 项目概览与阅读入口 | 根 `README.md` | 简要说明两套书稿，链接到各自入口 |
| 维护入口与文档分工 | 本文件 | 文档新增、合并或迁移时同步链接 |
| 可复用的文章风格与标注规则 | `docs/technical-article-style.md` | 维护用户确认的通用规则、判断示例和复用指令，项目参数在各书稿规范中补充 |
| 编辑规则与构建命令 | 能力地图的维护说明、`RELEASE_BUILD.md`；手册的 `EDITORIAL-SPEC.md`、`BUILD-NOTES.md` | 在对应说明中维护完整规则和命令，其他入口只链接 |
| 已确认缺陷 | `docs/ISSUES.md` | 记录现象、原因、处理、状态与实际验证范围 |
| 某一版的修订和检查事实 | `revisions/` 或对应书稿的审查报告 | 保留版次和日期，按写作阶段与最终验收区分；后续变化另行记录 |
| 历史规划与研究依据 | `planning/`、`evidence/` | 保留研究日期与当时状态，新一轮研究另注明日期和采用范围 |
| 随书内容与读者索引 | 各书稿的正文、阅读指南、前后附录、目录及索引 | 按对应书稿流程维护 |
| 构建结果与检查日志 | `build/`、`dist/`，或手册的 `output/`、`qa/` | 按现有忽略规则管理，重建方式在构建说明中维护 |

新增说明前先检查上表是否已有归属。只有用途或生命周期独立时才增加文件；局部生成命令放进对应构建说明，历史事实放进版本记录。正文目录、阅读指南和随书附录属于出版内容，即使不在 `chapters/` 中，也按书稿维护。
