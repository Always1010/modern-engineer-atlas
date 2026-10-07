# N23 测试校准工站迁移与修订

## 版本和范围

- 新章稳定标识：N23
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N23-temperature-calibration-station.zh-CN.md
- 生成本报告时正文字符数：22,265；字数不是实测页数，正式页码另由排版核准

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
| 23.1 工站的物理对象和信息对象 | C58 58.2.1 从真实制造追溯确定案例的责任范围；C31 31.1.6 工业界面所处的位置决定完成条件；C48 48.1.1 一次测量经历的不只是一个传感器 | 核心重写。先物理对象与测量链，再制造信息；仅监测低压节点，不建立危险温控操作。 |
| 23.2 为N240017建立一次不可混淆的尝试 | C58 58.2.2 工单 路线与五种身份先于开始按钮；C58 58.2.3 一条工站链的每个确认都有不同含义；C25 25.2.2 身份 计划与实际结果是不同概念 | 扩写单件连续身份、接纳点和冻结计划，新增容量演算；工件/电子/外标身份明确。 |
| 23.3 烧录把文件变成可运行固件 | C58 58.2.11 烧录与升级记录仍要面对断电和版本兼容 | 扩写烧录前后版本、boot_id、活动参数和健康证据，工具100%不等于运行合格。 |
| 23.4 先建立可比较的温度测量 | C58 58.2.4 校准要留下调整前后与独立复核的证据；C48 48.1.1 一次测量经历的不只是一个传感器；C48 48.2.4 标定是带条件的参数估计；C48 48.2.5 采样时刻 接收时刻和处理时刻必须分开；C48 48.2.6 时间同步不能用无限等待换取整齐 | 新增深度：热场/参考/工件稳定、窗口配对、时钟与缺口，超出原章简述但不冒充规程。 |
| 23.5 校准 调整与独立复核分别做什么 | C58 58.2.4 校准要留下调整前后与独立复核的证据；C48 48.2.4 标定是带条件的参数估计 | 核心扩写。保留原count两点算例，明确不同于N16温度输入；raw_count必须独立消息模式，增加拟合函数和活动参数验证。 |
| 23.6 测量不确定度怎样进入软件判断 | C58 58.2.4 校准要留下调整前后与独立复核的证据 | 大幅新增。标准/扩展不确定度、相关性、统计前提、40/30/20/50mC预算、k=2边界与事先批准的保护带。 |
| 23.7 用一次有效测量形成逐步结果 | C58 58.2.5 原始值 限值和决定应出现在同一条证据链；C58 58.2.10 低功耗与网关证据延伸同一个产品身份 | 重写有效窗口、逐步结果JSON、采样完整性和通信终检，基础帧不夹带未定义字段。 |
| 23.8 从测量决定走到本地可恢复结果 | C58 58.2.6 用 NI 的结果架构检验自研工站的职责划分；C58 58.2.7 Qt 工作对象负责执行 界面负责解释状态；C31 31.4.8 本地质量记录和待发送队列应一起提交；C25 25.2.11 状态 命令与通知各自解决不同问题 | 合并为流程事件入口和持久提交，新增代码与更正规则，避免重复N11退出骨架。 |
| 23.9 三个中断点怎样恢复同一件工件 | C58 58.2.8 三个崩溃窗口分别恢复三种事实；C34 34.3.3 幂等键标识同一意图 不能只取请求内容的哈希；C34 34.3.4 在途重复比事后重复更容易暴露竞态；C34 34.3.6 Outbox 解决本地双写 不替外部世界提交；C35 35.3.3 短写与目录同步是持久化协议的细节 | 核心扩写三个故障窗口的恢复身份与证明范围；无查询能力不能伪装命令级确认。 |
| 23.10 MES离线时产品放在哪里 | C58 58.2.9 MES 对接应能处理离线 重复与业务拒绝；C31 31.4.9 复测与追溯依赖不可覆盖的证据 | 重写离线处置、工位释放/隔离/路线放行、复测与重发的不同账。 |
| 23.11 生产证据怎样连接到现场运行 | C58 58.2.10 低功耗与网关证据延伸同一个产品身份；C58 58.2.11 烧录与升级记录仍要面对断电和版本兼容 | 保留同产品运行延伸；0.0826mA/约504天标为原构造理想算式，不写入实际报告。 |
| 23.12 这座工站怎样验收 | C58 58.2.12 验收材料沿同一个工件解释故障；C48 48.4.6 集成验收要保留分层证据；C25 25.2.9 可测试性来自可控制输入与可观察结果 | 扩写三层证据与六类故障矩阵，同一工件沿全链验收，模拟不代替计量或安全。 |
| 23.13 从关键决定继续追问 | C58 58.2.13 工站与运行之间仍需解释的三个问题；C57 57.2.9 工业测试站如何解释一件产品的结果；C25 25.2.13 从新增设备追问到失败恢复 | 新增连续追问：职责、读回、独立性、不确定区域、原子边界和失准追溯；答案明确未执行范围。 |

## 新增 合并 重写与移出

- 以完整C58.2为主线，扩写热稳定、测量配对、校准/调整/复核与不确定度。
- 保留原始count算例，并标明独立扩展与N16不同输入；没有将原始count混作temperature_mC。
- 新增守门规则示例与需处置区域，不把未满足保守接纳直接等同已证明真实超差。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：C58.1事件服务存储、58.3GPU、58.4机器人/Agent不迁入；低功耗与升级仅作为同一产品证据延伸，不重新开专题。

## 官方资料与核验边界

[23-1] Siemens，[Meccanotecnica Umbra case study](https://resources.sw.siemens.com/en-US/case-study-meccanotecnica-umbra/)。仅作制造上下文、质量与单件追溯的公开案例，不借用其未公开实现和未经独立验证的效益。

[23-2] JCGM，[International Vocabulary of Metrology 200:2012](https://www.bipm.org/documents/20126/2071204/JCGM_200_2012.pdf)。校准、调整、验证及计量溯源概念；本文不是该文件的翻译、改编标准或认可声明。

[23-3] JCGM，[Guide to the Expression of Uncertainty in Measurement 100:2008](https://www.bipm.org/documents/20126/2071204/JCGM_100_2008_E.pdf)。测量模型、合成和扩展不确定度的概念依据；数值预算为原创教学构造。

[23-4] NIST，[Technical Note 1297](https://www.nist.gov/pml/nist-technical-note-1297)。标准不确定度评估、合成与报告；不将k=2无条件解释为精确覆盖概率。

[23-5] ILAC，[G8:09/2019 Guidelines on Decision Rules and Statements of Conformity](https://ilac.org/?ddownload=122722)。决策规则与符合性声明；本例保守接纳带不是任何真实产品的批准规则。

[23-6] Qt，[Threads and QObjects](https://doc.qt.io/qt-6.8/threads-qobject.html)。线程归属与GUI边界；关闭的具体限制沿用第十一章Qt 6.8.3核对范围。

[23-7] NI，[TestStand Report Generation and Customization](https://www.ni.com/en/support/documentation/supplemental/08/teststand-report-generation-and-customization.html) 与 [Process Model Development and Customization](https://www.ni.com/en/support/documentation/supplemental/08/teststand-process-model-development-and-customization.html)。执行、结果收集与处理边界，不提供本文MES保证。

[23-8] SQLite，[Atomic Commit](https://www.sqlite.org/atomiccommit.html) 与 [WAL](https://www.sqlite.org/wal.html)。本地提交和环境假设。

[23-9] AWS，[Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)。事务发件箱与重复发送边界。

资料按2026-10-06核对。原书C58.2提供工站主线，本章重新从无硬件经验读者所需的物理对象、身份、测量和恢复展开；移除GPU、机器人与Agent案例。Qt API、协议、计量概念和存储资料分别支持相应局部事实，不能合成未经验证的整站保证。

本章尚未完成真实板卡和传感器选型冻结、完整工程、编译、协议联调、参考器选择、热场验证、不确定度评估、烧录、计量复核、断电、MES联调和安全验收。所有图和数值均明确是教学材料；任何正式交付都必须把这些未执行项转为独立证据，而不是删除标记。

## 本章图像和许可

- ../assets/fig23-1.svg：扫码器、低压节点、治具、参考温度计和受控温度环境连接工控机；MES提供执行上下文并接收结果，ERP提供工单来源。
- ../assets/fig23-2.svg：调整前读数保留，两个校准点用于拟合，另一个独立点用于复核；示意判定边界同时考虑规定限值与不确定度。
- ../assets/fig23-3.svg：同一次尝试在设备动作、本地事务和MES接纳三个窗口中断，恢复分别查询原命令、发送已保存结果和查询原提交。
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

- 恢复时改为主机创建generation、向设备查询boot_id，不把主机代际描述成线上字段。
- 长期采样去重补充uint32回绕与迟到/保留窗口或设备扩展身份；基础帧不自动拥有永久唯一键。
- 独立复核以设备实际temperature_mC对参考比较；主机count换算只交叉核对，JSON显式区分host_calculated_mC与设备读数，两者相等属构造假设。
- 复核回调增加command_id/window_id/step_id门控；window_id只是主机业务窗口身份；复核后推进通信终检，全部必需步骤汇总后方能定稿留档。
- 明确N16的20→20.6/40→40.8关系下30.72→约30.02，与本章raw count两点输入是不同教学组；raw_count须独立诊断消息或校准模式。
- 将150m°C明确为教学方法预先约定的向上取整决策用值，不是可随UI格式改变的显示修约；复核保存设备实际输出改为无条件要求。
