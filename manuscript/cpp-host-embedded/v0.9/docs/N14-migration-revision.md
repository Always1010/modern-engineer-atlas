# N14 测试流程与追溯修订

## 版本和范围

- 新章稳定标识：N14
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N14-test-records-traceability.zh-CN.md
- 生成本报告时正文字符数：14,333；字数不是实测页数，正式页码另由排版核准

## 原文读取范围与身份

本轮以本地固定提交的完整源文件核对，不使用早期仅前30行的摘录。C25、C31、C33、C34、C35、C48、C57已完整阅读；C58仅完整阅读58.2.1至58.2.13及其相关来源条目，不声称已完整阅读C58其他项目。表内引用的原小节均已实际核对。

- [C25 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C25-architecture-and-long-term-evolution.zh-CN.md)；SHA-256：c884f23407fd592c329eba306d386613917948e3f2535871ab2819a775933448
- [C31 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C31-windows-qt-and-device-host-applications.zh-CN.md)；SHA-256：f007d17dba6b090f381406a33e788923ec408922015fcc50584d2a3773965c23
- [C34 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C34-distributed-correctness-and-middleware.zh-CN.md)；SHA-256：368d23f445a676f31383fd9b5a3761ed0dbc116c60a4d7084ba9f0c132afea90
- [C35 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C35-storage-engines-and-durability.zh-CN.md)；SHA-256：a75fc953e2a4200942a1e0856637686b03f0cb308c13dc4f4a9868ca91addcef
- [C48 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C48-sensors-frames-time-and-integration.zh-CN.md)；SHA-256：4dc78c14ce45b6a1eae283eb7324ae8a9f15bc6ff9ef7ecc2a96e1c0d75ccf61
- [C57 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C57-interview-reasoning-and-evidence.zh-CN.md)；SHA-256：27ed5bd39456f6f4bfd63513e06921234a8b3e4e5b4b998d7b82cc20d1038285
- [C58 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C58-cross-layer-projects-and-portfolios.zh-CN.md)；SHA-256：4c4e53ccd6424e196c15ec8cf12b14aed78d075e50f98bfa40e3484061546569

## 精确逐节对应

| 新节 | 原节精确定位 | 处置与理由 |
| --- | --- | --- |
| 14.1 生产语境从工单和工件开始 | C31 31.1.6 工业界面所处的位置决定完成条件；C31 31.2.8 一组固定身份贯穿一次工件尝试；C58 58.2.1 从真实制造追溯确定案例的责任范围；C58 58.2.2 工单 路线与五种身份先于开始按钮 | 重写工业前置。完整解释ERP/MES/工单/路线/工站/治具/仪器；workpiece_id内部记录、serial_number外标、device_id电子身份。 |
| 14.2 开始一次尝试就是冻结一份上下文 | C25 25.2.2 身份 计划与实际结果是不同概念；C31 31.2.7 让工作对象拥有流程 让界面拥有呈现；C58 58.2.2 工单 路线与五种身份先于开始按钮 | 核心合并。冻结TestContext与版本、容量和并行占用；拒绝点击不伪装产品测试。 |
| 14.3 步骤执行和质量决定分开 | C25 25.2.6 组合与策略隔离变化 不必构造继承树；C31 31.2.9 判定一致性比跨线程调用方便更重要；C58 58.2.5 原始值 限值和决定应出现在同一条证据链；C58 58.2.6 用 NI 的结果架构检验自研工站的职责划分 | 重写并新增纯整数判定。执行、有效性、质量、提交多维状态；不把Invalid/Unknown计成产品不良。 |
| 14.4 一条结果怎样保留形成过程 | C31 31.4.8 本地质量记录和待发送队列应一起提交；C48 48.2.5 采样时刻 接收时刻和处理时刻必须分开；C58 58.2.5 原始值 限值和决定应出现在同一条证据链 | 扩写结果JSON、缺失值、原值/换算/判据/时钟；占位摘要与教学数据明确。 |
| 14.5 本地提交要能抵御明确的故障 | C31 31.4.6 文件保存要定义失败时留下什么；C31 31.4.8 本地质量记录和待发送队列应一起提交；C34 34.3.6 Outbox 解决本地双写 不替外部世界提交；C35 35.1.5 从写入接受到持久完成存在多个台阶；C35 35.3.1 WAL 先保存恢复依据 再允许数据页越过持久化边界；C35 35.3.3 短写与目录同步是持久化协议的细节 | 核心合并新增SQLite教学模式。结果+outbox同事务、文件先可靠后引用、孤儿回收、线程与同步配置边界。 |
| 14.6 MES接纳需要应用层回执 | C31 31.4.8 本地质量记录和待发送队列应一起提交；C34 34.3.3 幂等键标识同一意图 不能只取请求内容的哈希；C34 34.3.4 在途重复比事后重复更容易暴露竞态；C34 34.3.5 重试是额外负载 需要预算与终点；C58 58.2.9 MES 对接应能处理离线 重复与业务拒绝 | 重写MES应用回执、同ID同内容/冲突/查询、业务拒绝和离线策略；不承诺客户端端到端恰好一次。 |
| 14.7 复测 更正和良率要保存真实分母 | C31 31.4.9 复测与追溯依赖不可覆盖的证据；C58 58.2.9 MES 对接应能处理离线 重复与业务拒绝 | 扩写复测/更正/分母。新增100件80/10/10算例、80%与88.9%及最终98%的不同口径，皆为构造数。 |
| 14.8 从一件产品查到受影响的一批产品 | C31 31.4.9 复测与追溯依赖不可覆盖的证据；C35 35.4.4 复制不能替代具有时间隔离的备份；C35 35.4.5 恢复目标决定备份链如何保留；C58 58.2.13 工站与运行之间仍需解释的三个问题 | 合并重写追溯与反向查受影响批次，不从关联直接宣布不合格；备份不同于复制。 |
| 14.9 记录系统的故障怎样证明修好了 | C31 31.4.8 本地质量记录和待发送队列应一起提交；C31 31.4.9 复测与追溯依赖不可覆盖的证据；C57 57.2.9 工业测试站如何解释一件产品的结果 | 新增磁盘满/重复MES/历史限值变化三条故障，明确验收未执行。 |

## 新增 合并 重写与移出

- 增加工件内部身份与外标绑定、状态四维、SQLite/outbox/独立文件提交，以及良率分母算例。
- 守住测量决定、本地留档、MES接纳和现场处置四层，不强制合为一个状态。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：存储引擎B+Tree/LSM/Compaction和共识/复制算法移出；只保留确认、事务、备份与未知结果需要的机制。

## 官方资料与核验边界

[14-1] NI，[TestStand Report Generation and Customization](https://www.ni.com/en/support/documentation/supplemental/08/teststand-report-generation-and-customization.html)。步骤结果收集与结果处理分层；本文的存储和MES设计不是NI默认保证。

[14-2] SQLite，[Atomic Commit](https://www.sqlite.org/atomiccommit.html)。原子提交及文件系统和设备假设。

[14-3] SQLite，[Write-Ahead Logging](https://www.sqlite.org/wal.html)。WAL、检查点及部署约束。

[14-4] SQLite，[PRAGMA synchronous](https://www.sqlite.org/pragma.html#pragma_synchronous)。同步配置和故障保证的区别。

[14-5] Qt，[QSqlDatabase](https://doc.qt.io/qt-6.8/qsqldatabase.html)。连接、事务和线程使用边界。

[14-6] AWS，[Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) 与 [Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)。本地双写、重复与稳定意图；工站实现为本文教学设计。

[14-7] SQLite，[Online Backup API](https://www.sqlite.org/backup.html)。一致备份机制；没有执行备份或恢复。

[14-8] SQLite，[CREATE TABLE的PRIMARY KEY约束](https://www.sqlite.org/lang_createtable.html#the_primary_key)。文本主键的NULL边界，本文显式加NOT NULL。

资料按2026-10-06核对。本章只建立数据和确认契约，未选定最终SQLite二进制版本、同步配置、文件系统与存储介质组合，未运行SQL、事务故障注入、断电或MES互操作测试。所有示意数值和记录均不可作为实际生产或校准证据。

## 本章图像和许可

- ../assets/fig14-1.svg：工单关联工件，工件关联多次尝试，每次尝试冻结方案并链接命令、步骤、原始数据及MES提交。
- ../assets/fig14-2.svg：测量决定形成后，本地结果与outbox共同提交，再向MES发送并保存回执；每个确认都有独立条件。
- 原创机制图按host-figures.md规格重建；非运行截图，非实测波形。图的最终可读尺寸及页码由整合版视觉检查确认。

## 已完成的文稿静态检查

- 已检查本章字段与共同案例的语义，不把generation、boot_id、source_time或raw_count私自加到type01基础帧。
- 已检查代码行的显示宽度上限80个等宽列、表格最多四列、章节号与源码路径。此为文稿检查，不是代码编译。
- 已检查三种确认：测量判定、本地持久化、MES业务接纳不相互替代；现场放行依批准策略。
- 保留C++20和Qt6.8 API边界；N11的Qt6.8.3收尾结论不扩张到任意TLS或SDK尾部。

## 未执行与尚需验收

- 所有C++、Qt、SQL、命令和故障注入均未运行；没有创建Codex任务，没有修改仓库、构建或发行管线。
- 未编译、未执行主机测试、未接真实板卡/PLC/仪器、未烧录、未校准、未提交MES、未改变权限或安装软件。
- 目标平台与具体设备/工具链尚需冻结；代码中的辅助函数、资源失败与完整应用集成仍需实现。
- 排版、图像、链接与页面检查属于文档验收，不能转写为协议、硬件、计量或生产验收通过。

## 独立审校后的具体修订 2026-10-06

- SQLite普通rowid表非整数主键可为NULL，attempt_id/submission_id现显式PRIMARY KEY NOT NULL，并补官方CREATE TABLE依据。
