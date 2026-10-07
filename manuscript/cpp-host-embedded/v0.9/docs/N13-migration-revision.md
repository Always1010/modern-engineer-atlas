# 第十三章 PLC与工业数据交互 迁移与修订说明

## 版本和范围

- 新章稳定标识：N13
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N13-plc-industrial-data.zh-CN.md
- 生成本报告时正文字符数：13,682；字数不是实测页数，正式页码另由排版核准

## 原文读取范围与身份

本轮以本地固定提交的完整源文件核对，不使用早期仅前30行的摘录。C25、C31、C33、C34、C35、C48、C57已完整阅读；C58仅完整阅读58.2.1至58.2.13及其相关来源条目，不声称已完整阅读C58其他项目。表内引用的原小节均已实际核对。

- [C25 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C25-architecture-and-long-term-evolution.zh-CN.md)；SHA-256：c884f23407fd592c329eba306d386613917948e3f2535871ab2819a775933448
- [C31 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C31-windows-qt-and-device-host-applications.zh-CN.md)；SHA-256：f007d17dba6b090f381406a33e788923ec408922015fcc50584d2a3773965c23
- [C33 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C33-network-protocols-and-high-performance-services.zh-CN.md)；SHA-256：423b21f02bfd51bc91f15dc6fadc4dc892d2d5396d9d474f5f43345deabbcf23
- [C34 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C34-distributed-correctness-and-middleware.zh-CN.md)；SHA-256：368d23f445a676f31383fd9b5a3761ed0dbc116c60a4d7084ba9f0c132afea90
- [C57 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C57-interview-reasoning-and-evidence.zh-CN.md)；SHA-256：27ed5bd39456f6f4bfd63513e06921234a8b3e4e5b4b998d7b82cc20d1038285

## 精确逐节对应

| 新节 | 原节精确定位 | 处置与理由 |
| --- | --- | --- |
| 13.1 PLC程序怎样观察现场 | C31 31.1.6 工业界面所处的位置决定完成条件；C31 31.3.8 PLC 握手需要动作身份和重启代际 | 重写前置。新增PLC/过程映像/扫描与任务的入门解释，不泛化某品牌扫描顺序；普通PLC不等于安全PLC。 |
| 13.2 先设计握手 再选择寄存器地址 | C31 31.3.8 PLC 握手需要动作身份和重启代际；C25 25.2.11 状态 命令与通知各自解决不同问题；C34 34.1.1 部分失败让未知成为一种正常结果 | 核心扩写。稳定命令、接纳、完成、receipt、启动代际、影子区与快照一致性，明确不是协议自带事务。 |
| 13.3 Modbus把数据组织成什么 | C31 31.3.8 PLC 握手需要动作身份和重启代际 | 新增主协议教学。四类数据、协议地址与传统编号、字序/单位、寄存器表与有符号转换，表非厂商定义。 |
| 13.4 RTU与TCP保留不同的传输条件 | C31 31.3.3 串口应用的第一层是物理兼容；C31 31.3.8 PLC 握手需要动作身份和重启代际；C33 33.1.1 Socket 是接口 连接是状态 消息是约定 | 扩写RTU/TCP边界。串行时间与MBAP事务配对，不把Transaction ID当command_id。 |
| 13.5 用Qt读取一次完整的PLC状态 | C31 31.3.8 PLC 握手需要动作身份和重启代际；C31 31.2.8 一组固定身份贯穿一次工件尝试 | 新增Qt读状态完整骨架。reply空/立即完成/异步完成、代际与单在途，未实现关闭细节明确。 |
| 13.6 OPC UA将值 质量 时间和结构一起提供 | C31 31.3.9 OPC UA 订阅传的是带质量和时间的数据 | 扩写质量、时间、采样、发布、队列与身份安全；不声称订阅保证完整测量。 |
| 13.7 趋势 历史和告警有不同的证据用途 | C31 31.3.10 趋势 历史与告警不能压成一条曲线 | 保留重写。实时趋势、历史保存与告警确认不同；不可用SCADA相近时间补造工件证据。 |
| 13.8 沿握手和数据质量定位故障 | C31 31.3.11 对通信超时的追问必须落到业务证据；C57 57.2.9 工业测试站如何解释一件产品的结果 | 三条新增推理链：协议写成功仍等待、PLC重启旧完成、UA重连缺口；追问给出答案。 |

## 新增 合并 重写与移出

- 新增PLC扫描入门与Modbus主实现链，不仅列出协议名；所有寄存器为原创教学映射。
- OPC UA保留质量、时间、采样/发布/队列以及告警语义，不承担完整采集保证。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：不展开品牌PLC梯形图、实时控制与安全PLC编程，不把寄存器协议扩成现场总线百科；CAN/USB入口在N12。

## 官方资料与核验边界

[13-1] Siemens，[Processing the scan cycle in RUN mode](https://docs.tia.siemens.cloud/r/simatic_s7_1200_manual_collection_enus_20/plc-concepts/execution-of-the-user-program/processing-the-scan-cycle-in-run-mode)。S7-1200 文档示例，用于说明过程映像与周期执行；不推广为全部 PLC 的调度顺序。

[13-2] Modbus Organization，[Modbus Application Protocol V1.1b3](https://www.modbus.org/file/secure/modbusprotocolspecification.pdf)。四类数据、功能码、数据编码与异常响应。

[13-3] Modbus Organization，[Modbus over Serial Line V1.02](https://www.modbus.org/file/secure/modbusoverserial.pdf)。RTU 串行帧与时序。

[13-4] Modbus Organization，[Modbus Messaging on TCP/IP V1.0b](https://www.modbus.org/file/secure/messagingimplementationguide.pdf)。MBAP 与事务配对。

[13-5] Qt，[QModbusClient](https://doc.qt.io/qt-6.8/qmodbusclient.html)。请求、重试和超时 API。

[13-6] Qt，[QModbusReply](https://doc.qt.io/qt-6.8/qmodbusreply.html)。完成与对象生命期。

[13-7] OPC Foundation，[Part 4 DataValue](https://reference.opcfoundation.org/specs/OPC-10000-4/7.11)。值、状态和时间。

[13-8] OPC Foundation，[Part 4 MonitoredItem model](https://reference.opcfoundation.org/specs/OPC-10000-4/5.13.1)。采样、过滤、队列和修订参数。

[13-9] OPC Foundation，[Part 4 Subscription model](https://reference.opcfoundation.org/specs/OPC-10000-4/5.14.1)。发布、通知确认及恢复范围。

[13-10] OPC Foundation，[Part 2 Security Model](https://reference.opcfoundation.org/specs/OPC-10000-2/full)。安全能力与部署责任。

[13-11] OPC Foundation，[Part 11 Read raw functionality](https://reference.opcfoundation.org/specs/OPC-10000-11/6.5.3.2)。历史所保存数据的边界。

[13-12] OPC Foundation，[Part 9 Concepts](https://reference.opcfoundation.org/specs/OPC-10000-9/4)。告警条件与确认。

以上资料于2026-10-06核对，OPC UA在线规范为1.05系列维护内容，具体设备能力仍需按产品版本确认。寄存器表、状态机、ID和时序均为原创教学契约。未进行PLC编程、在线写寄存器、真实扫描测量、Qt编译或OPC UA互操作验证，也没有建立任何安全控制认证结论。

## 本章图像和许可

- ../assets/fig13-1.svg：PC先准备一致参数再提交命令身份，PLC按自身任务读取并发布接纳与完成；通信确认与现场许可分开。
- ../assets/fig13-2.svg：源采样、服务器确认、订阅发布和工站接收处于不同位置；质量和缺口随值保留。
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

- 补齐奇偶快照协议：串行写者先奇数、后数据、最后新偶数；读者只接受前后相同偶数，并验证平台可见顺序、原子性和回绕界。
- 提交影子槽后禁止覆盖，直到相同command_id接纳或明确终态拒绝；超时未知不得复用。
- Qt单次读骨架明确以PLC提供一致发布快照为前提，否则改为三段读取状态机；不把一次批量请求宣称为PLC事务。
- OPC UA sourceTimestamp改为依数据源约定的值/状态时间，明确UTC及缺失，不普遍称采样时刻。
