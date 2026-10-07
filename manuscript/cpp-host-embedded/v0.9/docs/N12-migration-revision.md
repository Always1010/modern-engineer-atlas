# 第十二章 串口 网络与设备会话 迁移与修订说明

## 版本和范围

- 新章稳定标识：N12
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N12-serial-network-sessions.zh-CN.md
- 生成本报告时正文字符数：15,377；字数不是实测页数，正式页码另由排版核准

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
| 12.1 同一个插头后面可能是完全不同的接口 | C31 31.3.3 串口应用的第一层是物理兼容 | 核心保留扩写。UART字符、RS232/RS485电气层、方向与拓扑、UART照片认知；不提供未知设备接线口诀。 |
| 12.2 枚举端口以后 仍要识别设备 | C31 31.3.3 串口应用的第一层是物理兼容；C31 31.3.6 USB 与网络也需要独立会话契约；C25 25.2.2 身份 计划与实际结果是不同概念 | 重写。端口位置、桥身份和device_id分开；枚举代码不自动发命令，boot_id需要设备能力。 |
| 12.3 QSerialPort提供字节访问 不提供设备协议 | C31 31.3.3 串口应用的第一层是物理兼容；C31 31.3.4 字节到达事件不是应用消息边界；C33 33.1.2 一次发送存在多层完成 | 重写主实现。配置/打开/识别、有限缓存、发送偏移和bytesWritten的本地含义；不重复N11线程回收。 |
| 12.4 将字节流变成有界的消息流 | C31 31.3.4 字节到达事件不是应用消息边界；C33 33.1.1 Socket 是接口 连接是状态 消息是约定；C33 33.3.2 事件循环需要公平预算 | 合并并新增与N04一致的帧边界和调度外壳。payload64/whole76、CRC范围、基础帧缺身份时间、有限继续任务明确。 |
| 12.5 TCP UDP和安全通道各提供什么 | C31 31.3.6 USB 与网络也需要独立会话契约；C33 33.1.1 Socket 是接口 连接是状态 消息是约定；C33 33.1.5 连接建立与关闭都需要状态机；C33 33.2.2 TLS 保护通道 但不定义业务授权 | 选留重写。仅TCP/UDP/TLS所需语义；移出HTTP/2/3、负载均衡、互联网高并发专题。 |
| 12.6 会话身份把重连与重做分开 | C31 31.3.1 把界面状态与设备状态分别建模；C31 31.2.8 一组固定身份贯穿一次工件尝试；C33 33.1.5 连接建立与关闭都需要状态机；C34 34.1.1 部分失败让未知成为一种正常结果 | 核心合并。sequence/generation/boot_id/command_id分开；显示迟到与重要动作迟到不采用同一丢弃规则。 |
| 12.7 超时 重试和取消必须保持原来的问题 | C31 31.3.2 取消是一项请求 不总是一个结果；C33 33.1.4 超时属于哪一层必须先说明；C33 33.4.4 重试预算必须在整条调用链中可见；C34 34.3.3 幂等键标识同一意图 不能只取请求内容的哈希；C34 34.3.5 重试是额外负载 需要预算与终点 | 重写。deadline、相同意图、内容冲突、取消窗口和重试预算，不把超时当未执行。 |
| 12.8 USB与CAN入口如何保留设备差异 | C31 31.3.5 CAN Adapter 与协议栈需要能力探测；C31 31.3.6 USB 与网络也需要独立会话契约；C25 25.2.10 适配与门面应保留有用的语义 | 选留。USB SDK回调与CAN后端能力、链路ACK和业务确认；不展开驱动替换操作。 |
| 12.9 三类相似故障有不同的修复方向 | C31 31.3.11 对通信超时的追问必须落到业务证据；C33 33.4.5 故障排查应沿阶段收集证据；C33 33.1.6 保活探测不能替代业务进展；C57 57.2.4 第四层从现象构造可区分的假设 | 新增完整诊断：偶发错帧、重复写入、心跳正常采样停更；回放与真实电气证据分开。 |

## 新增 合并 重写与移出

- UART/RS232/RS485层次及USB桥实物说明扩写；加入Qt发送偏移与有界解析调度。
- 共用N04帧，明确boot_id和源时间不在基础帧；无法确认重启时降低接纳保证。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：移出HTTP/2/3、QUIC、DNS缓存专题、网络高性能服务、负载均衡和分布式中间件实现；只回收设备所需超时、重试与背压。

## 官方资料与核验边界

[12-1] Texas Instruments，[The RS-485 Design Guide](https://www.ti.com/lit/an/slla272d/slla272d.pdf)。差分接口、拓扑和终端条件；本文不替具体板卡给出接线参数。

[12-2] Qt，[QSerialPortInfo](https://doc.qt.io/qt-6.8/qserialportinfo.html)。端口枚举和可获得属性。

[12-3] Qt，[QSerialPort](https://doc.qt.io/qt-6.8/qserialport.html)。参数、缓存、读写与错误接口。

[12-4] Qt，[QIODevice](https://doc.qt.io/qt-6.8/qiodevice.html)。字节读写与完成语义。

[12-5] IETF，[RFC 9293 TCP](https://www.rfc-editor.org/rfc/rfc9293.html)。字节流和传输层边界。

[12-6] Qt，[QAbstractSocket](https://doc.qt.io/qt-6.8/qabstractsocket.html)。异步连接、缓冲与 socket 状态。

[12-7] IETF，[RFC 8446 TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)。通道认证与保护；业务权限、去重是应用责任。

[12-8] Qt，[QUdpSocket](https://doc.qt.io/qt-6.8/qudpsocket.html)。数据报读取；UDP机制参见 IETF [RFC 768](https://www.rfc-editor.org/rfc/rfc768.html)。

[12-9] AWS Builders Library，[Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)。稳定意图身份、重复和内容冲突；设备实现是本文另行设计。

[12-10] USB-IF，[USB 2.0 Specification](https://www.usb.org/document-library/usb-20-specification)。主机、设备和接口机制；没有声称所有设备均采用这一代速率或驱动路径。

[12-11] Qt，[QCanBusDevice](https://doc.qt.io/qt-6.8/qcanbusdevice.html) 与 [Qt CAN Bus Plugins](https://doc.qt.io/qt-6.8/qtcanbus-backends.html)。后端能力与配置限制。

资料按2026-10-06核对。全书统一帧、状态名、身份和恢复路径为教学设计，Qt 不自动提供这些保证。尚未进行串口回环、驱动安装、插拔、TCP/UDP 故障注入、CAN 总线或板上验证；示例配置和容量不能直接作为生产默认值。

## 本章图像和许可

- ../assets/uart-to-usb-adapter-sunmist.jpg：USB转UART适配器外观，可辨认USB插头、桥接电路区域与目标侧连接器，不能由外观证明电平和引脚。
- ../assets/fig12-1.svg：应用帧经Qt缓冲、驱动和适配器成为线路字节，设备解析后才可能给出业务确认。
- ../assets/fig12-2.svg：写命令执行后回复丢失，主机进入未知；重连建立新代际后仍用原command_id查询，而不是重做动作。
- UART照片：Sunmist，CC0 1.0，原文件页 https://commons.wikimedia.org/wiki/File:UART_to_USB_adapter.jpg；照片只用于外观认知，不提供针脚与电平证据。
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

- 补充基础帧无法独立确认设备重启：需要额外运行身份能力，不能从sequence归零推导boot_id。
