# 第十章 Qt应用结构与界面模型 迁移与修订说明

## 版本和范围

- 新章稳定标识：N10
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N10-qt-application-models.zh-CN.md
- 生成本报告时正文字符数：17,826；字数不是实测页数，正式页码另由排版核准

## 原文读取范围与身份

本轮以本地固定提交的完整源文件核对，不使用早期仅前30行的摘录。C25、C31、C33、C34、C35、C48、C57已完整阅读；C58仅完整阅读58.2.1至58.2.13及其相关来源条目，不声称已完整阅读C58其他项目。表内引用的原小节均已实际核对。

- [C25 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C25-architecture-and-long-term-evolution.zh-CN.md)；SHA-256：c884f23407fd592c329eba306d386613917948e3f2535871ab2819a775933448
- [C31 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C31-windows-qt-and-device-host-applications.zh-CN.md)；SHA-256：f007d17dba6b090f381406a33e788923ec408922015fcc50584d2a3773965c23
- [C48 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C48-sensors-frames-time-and-integration.zh-CN.md)；SHA-256：4dc78c14ce45b6a1eae283eb7324ae8a9f15bc6ff9ef7ecc2a96e1c0d75ccf61
- [C57 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C57-interview-reasoning-and-evidence.zh-CN.md)；SHA-256：27ed5bd39456f6f4bfd63513e06921234a8b3e4e5b4b998d7b82cc20d1038285

## 精确逐节对应

| 新节 | 原节精确定位 | 处置与理由 |
| --- | --- | --- |
| 10.1 从窗口到业务事实 | C31 31.1.6 工业界面所处的位置决定完成条件；C31 31.2.7 让工作对象拥有流程 让界面拥有呈现；C31 31.3.1 把界面状态与设备状态分别建模；C25 25.1.3 用内聚与变化原因检验模块边界 | 合并重写。先定义业务模型、界面模型、视图与独立状态；用四角色取代巨型窗口，移出MES事务细节。 |
| 10.2 QObject把身份 通知和拥有关系放在一起 | C31 31.2.1 QObject 的对象树是一种拥有关系；C31 31.2.3 线程亲和性约束事件交付；C25 25.2.8 组合根与工厂管理构造和生命期 | 核心保留并扩写。新增元对象/moc入门、值快照、setModel不转移所有权、对象树与连接图区别；线程迁移细节交N11。 |
| 10.3 信号槽和事件循环怎样让界面前进 | C31 31.1.2 消息循环负责把事件送到处理入口；C31 31.1.3 排队与同步发送具有不同生命期风险；C31 31.2.2 Signal 和 Slot 表达通知关系 | 重写。删去Win32窗口过程实现，以QApplication/信号槽讲执行、重入、上下文与对话框目标冻结。 |
| 10.4 用Model/View表达测量表格 | C31 31.2.6 模型变化与视图通知是一项协议 | 扩写主实现链。新增四列表格、角色、数值与格式分离、有界插入及通知区间；明确未编译和分配失败边界。 |
| 10.5 排序 筛选和编辑需要第二层身份检查 | C31 31.2.6 模型变化与视图通知是一项协议；C25 25.2.2 身份 计划与实际结果是不同概念 | 新增细化。代理映射、稳定身份、编辑草稿/提交/设备确认和筛选完整性分别说明。 |
| 10.6 趋势图表示时间关系而非替代原始记录 | C31 31.1.4 绘制应依据模型 而不是保存屏幕像素；C31 31.3.7 让界面实时与数据真实分别成立；C48 48.2.5 采样时刻 接收时刻和处理时刻必须分开 | 合并重写。新增三种时间、缺口、像素桶极值顺序、自绘快照，原始记录不以显示降采样替代。 |
| 10.7 用可解释的快照更新整个画面 | C31 31.2.7 让工作对象拥有流程 让界面拥有呈现；C31 31.2.9 判定一致性比跨线程调用方便更重要；C31 31.4.2 可访问性需要语义而不只是颜色 | 重写并新增整体ViewState修订。避免设备名、温度、状态混代；保留颜色外语义和未知状态。 |
| 10.8 从显示异常追到模型契约 | C31 31.2.6 模型变化与视图通知是一项协议；C31 31.3.7 让界面实时与数据真实分别成立；C57 57.2.4 第四层从现象构造可区分的假设；C57 57.2.6 第六层必须说明怎样验收 | 新构造三条完整故障链：排序错目标、长期模型膨胀、重复开始；有回答的追问替代题目。 |

## 新增 合并 重写与移出

- 完整解释业务模型、界面模型和视图的不同权威；提供有限可读代码而不是控件API目录。
- 新增排序目标错位、字段级编辑确认、显示聚合顺序和整体画面修订。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：Win32具体窗口过程与GetMessage代码不进入主实现；工作线程关闭详述移交N11，串口/PLC/MES事务不在本章重复展开。

## 官方资料与核验边界

[10-1] Qt，[The Meta-Object System](https://doc.qt.io/qt-6.8/metaobjects.html) 与 [moc](https://doc.qt.io/qt-6.8/moc.html)。元对象构建责任；2026-10-06 核对。

[10-2] Qt，[QObject](https://doc.qt.io/qt-6.8/qobject.html) 与 [Object Trees and Ownership](https://doc.qt.io/qt-6.8/objecttrees.html)。parent、不可复制身份和对象树边界。

[10-3] Qt，[Signals and Slots](https://doc.qt.io/qt-6.8/signalsandslots.html)。连接、上下文与应用端生命周期。

[10-4] Qt，[Threads and QObjects](https://doc.qt.io/qt-6.8/threads-qobject.html)。连接类型与线程归属；完整后台回收以第十一章的 Qt 6.8.3 静态核对为准。

[10-5] Qt，[QApplication](https://doc.qt.io/qt-6.8/qapplication.html)。GUI 应用对象和主事件循环。

[10-6] Qt，[Model/View Programming](https://doc.qt.io/qt-6.8/model-view-programming.html)。模型、视图、delegate、索引和角色。

[10-7] Qt，[QAbstractTableModel](https://doc.qt.io/qt-6.8/qabstracttablemodel.html)。最小接口与模型线程约束。

[10-8] Qt，[QAbstractItemModel](https://doc.qt.io/qt-6.8/qabstractitemmodel.html)。插入、删除、重置和数据变化通知。

[10-9] Qt，[QSortFilterProxyModel](https://doc.qt.io/qt-6.8/qsortfilterproxymodel.html)。代理与源索引映射。

[10-10] Qt，[QWidget::update](https://doc.qt.io/qt-6.8/qwidget.html#update)。重绘调度；绘图聚合算法是本章教学设计。

[10-11] Qt，[QAbstractItemModelTester](https://doc.qt.io/qt-6.8/qabstractitemmodeltester.html)。可用于检查一部分模型不变量；它不能证明测量、设备身份或业务判定正确。

在线 Qt 6.8 维护页面在核对时部分显示 6.8.9，不将该标记写成已经部署 Qt 6.8.9，也不引入高于 6.8 的新 API。正文完成了机制和资料核对；没有执行 moc、编译、模型测试器、压力回放、跨平台 GUI 或真实设备测试。正式工程还需补齐完整类声明、头文件、异常边界和有界存储，并用上述故障条件验证。图、计算和代码共同解释一种实现方法，均不能冒充已经通过验收的软件。

## 本章图像和许可

- ../assets/fig10-1.svg：设备会话向业务状态提交数据，业务状态向界面模型发布快照；窗口只发出操作意图，不能从控件文本倒推设备完成。
- ../assets/fig10-2.svg：源模型中的稳定记录经代理排序后成为不同的可见行；选中行先映射回源模型，再用记录身份发起操作。
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

- 修正长期样本身份表述：device_id/boot_id/sequence仅在明确窗口内关联，不是永久唯一键；generation不能替代跨重连去重。
