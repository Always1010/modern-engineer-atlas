# 后台采集与安全关闭 来源核验与修订说明

本节保留三章样稿0.1的来源与修订历史，末尾追加完整候选版0.9的集成变更；当前环境与证据状态以全书版次说明为准。

## 版本与交付范围

- 新章稳定标识：N11
- 正文标题：第十一章 后台采集与安全关闭
- 样章版本：0.1
- 核验日期：2026-10-06
- 编辑依据：已批准的《C++上位机与嵌入式精编版首份实施方案》0.1版
- 原书基准：`Always1010/modern-engineer-atlas` 固定提交 `0842f624995d2fd99f46c68426c9a33a73610cbb`
- 目标平台：Qt 6.8.3，Windows 为主，Linux 为次；通用API参考Qt6.8文档，线程回收边界按固定源码核对
- 交付：可编辑 Markdown 正文、三幅图的引用及图意说明、本来源与核验台账
- 本轮没有修改原书与出版构建程序，没有执行 C++ 编译或真实设备操作

规划阶段掌握的 C09、C16、C17、C19、C22 原文只有前30行，不能支撑全文迁移。已从上述固定提交补取完整文件；本台账依据补齐后的全文。所需全文已按对应章节与小节核对，固定提交身份见统一来源清单。

## 逐节来源与处置

“重写”表示保留原机制但重新组织读者起点、案例和解释；“新增”表示本样章新写的机制展开或代码。“移出本章”不是删除原书，相关主题按实施方案归其他新章。

| 新小节 | 精确原小节与标题 | 处置及本版变化 |
| --- | --- | --- |
| 开头三段 | C31 31.1.6 工业界面所处的位置决定完成条件；C31 31.3.1 把界面状态与设备状态分别建模 | 合并重写。统一为只接收数据的低压温度工站；明确本机关闭与设备停止采样、安全停机不同；移出 MES、烧录、PLC 等任务背景 |
| 11.1 线程让工作分开 事件循环让通知前进 | C16 16.1.1 线程执行任务 任务不等于线程；C31 31.1.2 消息循环负责把事件送到处理入口；C31 31.2.3 线程亲和性约束事件交付；C19 19.1.1 阻塞 非阻塞 与异步分别描述什么；C19 19.3.1 执行位置与执行时间需要显式契约 | 合并重写。去掉 Win32 消息循环实现与 IOCP/epoll 专题，直接解释线程、槽、事件循环和长槽阻塞；新增“不必为了异步串口而强制新建线程”的选择条件 |
| 11.1 末段共享状态 | C17 17.1.1 先确定发生冲突的是哪些访问；C17 17.2.5 原子对象与被指向对象不是同一对象；C16 16.1.2 互斥量保护的是不变量 | 选留重写。解释 thread confinement 下普通字段可用，普通共享 bool/volatile 不能代替同步；删去本章内 memory order、CAS、屏障推导 |
| 11.2 QThread 管理线程 但它自己也有归属 | C31 31.2.4 QThread 对象不生活在它代表的工作线程；C31 31.2.7 让工作对象拥有流程 让界面拥有呈现 | 核心保留并扩写。明确 QThread 实例、run 中执行线程、普通直接调用和排队槽的区别；新增对 QObject、Q_OBJECT、emit 与 moc 的简短入门解释 |
| 11.2 对象树与线程归属必须一起检查 | C31 31.2.1 QObject 的对象树是一种拥有关系；C31 31.2.3 线程亲和性约束事件交付；C09 9.3.2 先使用值 再表达独占所有权；C09 9.4.1 先区分拥有边与观察边 | 合并重写。保留 parent/affinity 约束、成员不自动是 child、QPointer 边界；新增 Worker 构造只存值、初始化槽创建串口与定时器的统一组织方式；重绘图11-1 |
| 11.3 连接类型决定在哪里执行 | C31 31.2.2 Signal 和 Slot 表达通知关系；C31 31.1.3 排队与同步发送具有不同生命期风险 | 重写并新增 Snapshot、Q_DECLARE_METATYPE 与 qRegisterMetaType 片段。将 AutoConnection 判断标准写成“当前发射线程与接收对象归属”，统一字段 temperature_mC 和 sequence；新增采样时间与代际的含义 |
| 11.3 复制指针并没有复制指针指向的数据 | C09 9.2.1 访问原对象与保存独立的值；C09 9.2.2 非空不能证明目标仍然存在；C09 9.2.3 只读限制与使用期限；C09 9.3.3 共享所有权要有真实需求；C09 9.4.2 回调与缓存里的隐含保留；C31 31.2.2 Signal 和 Slot 表达通知关系 | 合并重写。用字节缓冲的迟到访问说明快照价值；缩减智能指针原理，保留共享拥有不等于可变内容线程安全；新增有上下文 lambda 的解释 |
| 11.4 事件驱动路线每次处理有限工作 | C31 31.3.3 串口应用的第一层是物理兼容；C31 31.3.4 字节到达事件不是应用消息边界；C19 19.3.2 内联完成会带来重入与栈深问题 | 选留重写。串口硬件兼容前提移到开头一句；分帧只保留接口边界。新增每轮预算、剩余缓冲需主动安排继续、NoError 过滤、双层缓冲上限；不写整套解析器 |
| 11.4 阻塞路线需要自己的停止通道 | C31 31.2.4 QThread 对象不生活在它代表的工作线程；C31 31.3.3 串口应用的第一层是物理兼容；C16 16.4.2 取消是请求与确认的两阶段关系；C19 19.1.1 阻塞 非阻塞 与异步分别描述什么 | 重写。将阻塞路线作为明确替代方案，与本章主线分开；新增有限等待、主动检查、无事件循环时排队 stop 不成立、不能 GUI 跨线程 close 的限制 |
| 11.5 停止请求与停止完成之间还有工作 | C31 31.3.2 取消是一项请求 不总是一个结果；C16 16.4.1 关闭是状态转换 不是一个布尔赋值；C16 16.4.2 取消是请求与确认的两阶段关系；C16 16.4.3 异常传播要保留任务与服务的层次；C19 19.3.3 取消必须沿操作树传播并最终汇合 | 合并重写并新增 finish 片段。解释停止入口、状态先变再关资源、唯一终态、初始化与立即停止竞态；区分本章接收显示与正式记录、SDK 在途操作；新增 Qt 槽异常边界 |
| 11.5 把关键连接在启动前安排好 | C31 31.2.5 删除必须与事件及在途操作协调；C09 9.4.4 退出路径需要覆盖最后一次使用 | 大幅扩写。新增完整关键连接骨架、移动失败的同线程回收、stopped→quit DirectConnection 的线程安全依据、finished→deleteLater AutoConnection 的原因；禁止误推广为任意跨线程直接调用 |
| 11.5 GUI 不阻塞等待 但仍然确认线程结束 | C31 31.2.5 删除必须与事件及在途操作协调；C16 16.1.5 死锁是等待关系中的环；C16 16.4.5 一个关闭卡死案例的逐层定位；C19 19.3.4 结构化并发把子任务生命期纳入作用域 | 合并重写，新增 finished 后 wait(0UL) 检查与上下文 singleShot 重试。明确固定6.8.3下的Worker子树回收、不承诺任意thread_local尾部同步、QThread唯一删除路径、控制器寿命；补足“终态收到+线程回收”汇合，不拿线程消失补造成功 |
| 11.5 窗口第一次收到关闭请求时先留下来 | C31 31.1.5 关闭请求不等于已经销毁；C31 31.1.7 从关闭窗口追问到工站放行；C31 31.2.7 让工作对象拥有流程 让界面拥有呈现 | 重写并新增 closeEvent 片段。首次 ignore、重复请求幂等、allStopped 后再 close；空闲完成排队避免重入；移出本章的 MES 放行细节，保留重要记录的独立完成责任 |
| 11.6 同一个窗口还在 不代表旧结果还适用 | C31 31.2.8 一组固定身份贯穿一次工件尝试；C31 31.3.7 让界面实时与数据真实分别成立；C31 31.3.8 PLC 握手需要动作身份和重启代际；C22 22.4.3 日志需要连接状态转移 | 选留合并重写。只取连接代际，不带入工单/PLC 握手协议。新增 generation 接纳、停止时失效、disconnect 后已有队列仍可交付、进程内不复用的完整约束 |
| 11.6 刷新限速之外 还要限制在途数量 | C31 31.1.4 绘制应依据模型 而不是保存屏幕像素；C31 31.3.7 让界面实时与数据真实分别成立；C16 16.3.5 队列容量也是资源预算；C16 16.4.4 取消和背压共同决定服务能否恢复；C19 19.3.5 异步也需要背压 | 合并重写。新增最新值邮箱+单在途 GUI 请求，避免把刷新定时器当容量上限；新增旧代回复不得先清 pending。记录通道只述必要责任，不给未验证队列实现；重绘图11-3 |
| 11.7 关窗一直不退出 | C16 16.1.5 死锁是等待关系中的环；C16 16.1.6 从卡住现场还原等待图；C16 16.4.5 一个关闭卡死案例的逐层定位；C22 22.1.6 卡住的程序需要查看所有相关线程；C22 22.4.2 建立假设表比同时修改五处更有效；C22 22.4.7 修复证据应比症状消失更强 | 新写 Qt 具体故障推理，用原证据方法组织现象、候选假设、所需事实、依赖环、修复与验收。没有伪造实际堆栈；给出有限 wait 后仍不能销毁运行线程的面试答案 |
| 11.7 重连后温度突然回到旧值 | C31 31.3.7 让界面实时与数据真实分别成立；C22 22.4.1 最小复现保留触发机制 而不只是删代码；C22 22.4.3 日志需要连接状态转移；C22 22.4.7 修复证据应比症状消失更强 | 新写延迟旧代数据的推理闭环，追加额度先验身份的细节与回放验收。面试答案区分新鲜度、所有权、结束同步 |

## 原书未进入本章的内容

1. C31 31.1.1 窗口是一项需要管理的系统资源：只取生命周期思想，不展开 HWND、窗口类、WndProc。31.1.2 的 Win32 GetMessage 示例移出本章。
2. C31 31.2.6 模型变化与视图通知是一项协议：留给界面与模型章；31.2.9 判定一致性比跨线程调用方便更重要：判定和冻结限值留给测试流程章。
3. C31 31.3.3 的接线细节与适配器照片：留给板卡/通信内容；31.3.5 CAN Adapter 与协议栈需要能力探测、31.3.6 USB 与网络也需要独立会话契约、31.3.9 OPC UA 订阅传的是带质量和时间的数据、31.3.10 趋势 历史与告警不能压成一条曲线，不在本章发展独立专题。
4. C31 31.4 全节部署、质量记录与生产追溯：除完成责任的必要提醒外，移至对应新章。没有用关窗示例宣称已经具备持久化或 MES 事务保证。
5. C16 条件变量、信号量、future、线程池与其完整队列代码：不复写。保留关闭谓词、唯一终态、等待环与容量思想。
6. C17 原子内存序、CAS、cache coherence、处理器屏障；C19 协程帧、executor/sender、epoll/IOCP/io_uring 实现：不作为 Qt 初学者前置专题。
7. C22 调试器命令、转储工具、sanitizer 和 Valgrind 操作：留给公共调试章。本章仅保留可区分假设、所有相关线程和回归证据。

## 官方断言核验台账

以下按 2026-10-06 浏览 Qt 6.8 官方页面核对，线程创建与结束路径另核对Qt官方固定tag v6.8.3源码。表中“设计推论”是将已核对契约组合到本例，不能误标为 Qt 自动提供的业务机制。页面当前补丁显示可能为 6.8.8 或 6.8.9；通用API采用Qt6.8分支已有接口，而非滚动Qt6中新接口。在线6.8.9维护文档的更强wait尾部同步表述与可见6.8.3源码存在版本边界，已按下方审校记录收窄，不再声称所有6.8补丁均保证操作系统线程完全退出。

| 编号 | 正文断言及范围 | 官方 URL | 核验结论与边界 |
| --- | --- | --- | --- |
| Q01 | QThread 实例归属创建它的线程；run 在所管理线程；默认 run 调用 exec | https://doc.qt.io/qt-6.8/qthread.html | 与 Detailed Description、run() 一致；没有把 QThread 子类槽默认视为后台执行 |
| Q02 | QObject 亲和性约束排队调用；无运行事件循环无法通常交付；parent 与 child 同线程；移动 parent 会移动 children；普通成员非自动 child | https://doc.qt.io/qt-6.8/qobject.html#thread-affinity | 与 Thread Affinity 一致；正文采用移动前无 parent、初始化后创建子对象 |
| Q03 | moveToThread 在 Qt6.8 返回 bool；调用者通常须处于对象当前归属线程；有 parent 时失败 | https://doc.qt.io/qt-6.8/qobject.html#moveToThread | bool 自6.7引入，适合本章6.8；代码仅从当前GUI“推入”后台，不跨线程拉取 |
| Q04 | QWidget 只能在主线程使用；QObject 可重入不等于同一实例任意跨线程调用 | https://doc.qt.io/qt-6.8/threads-qobject.html | 核对 QObject Reentrancy 与 GUI 限制；正文无 worker 直接改控件 |
| Q05 | Direct/Queued/Auto/BlockingQueued 的执行及等待语义 | https://doc.qt.io/qt-6.8/qt.html#ConnectionType-enum | Auto 按发射当前线程决定；同线程 BlockingQueued 会死锁；其他依赖环为设计分析 |
| Q06 | Q_OBJECT 及 moc 支持信号槽；emit 不是启动新线程 | https://doc.qt.io/qt-6.8/moc.html | Qt 机制说明一致；完整工程所需模块未实际链接或构建 |
| Q07 | 自定义排队参数声明及注册、完整类型要求 | https://doc.qt.io/qt-6.8/qmetatype.html#Q_DECLARE_METATYPE ; https://doc.qt.io/qt-6.8/qmetatype.html#qRegisterMetaType | 使用显式声明+连接前注册的保守清晰写法；不声称它验证业务值或指针目标寿命 |
| Q08 | 有 context 的 lambda 连接随 sender/context 销毁断开，并在 context 事件循环执行；UniqueConnection 不为 lambda 去重 | https://doc.qt.io/qt-6.8/qobject.html#connect | 其余捕获对象仍须保活；未把 context 误当所有捕获的所有者；连接唯一性是单在途协议的应用前提 |
| Q09 | QPointer 是 QObject 弱观察，不提供跨线程任意访问保护 | https://doc.qt.io/qt-6.8/qpointer.html ; https://doc.qt.io/qt-6.8/threads-qobject.html | 前半直接契约，后半是两项契约组合的设计边界 |
| Q10 | QSerialPort open 返回/错误，配置失败可关闭；成功 open 历史上也可发 NoError | https://doc.qt.io/qt-6.8/qserialport.html#open ; https://doc.qt.io/qt-6.8/qserialport.html#SerialPortError-enum | 正文要求检查配置、open 结果并过滤 NoError；不只依赖错误信号 |
| Q11 | readyRead 是新数据到达，不是完整报文；剩余已缓冲数据不能只等再次通知 | https://doc.qt.io/qt-6.8/qiodevice.html#readyRead | 分帧、预算、单个继续任务由应用设计；不把通知当水平触发的业务帧事件 |
| Q12 | QSerialPort 内部接收缓冲可设上限 | https://doc.qt.io/qt-6.8/qserialport.html#setReadBufferSize | 不从限制Qt缓冲推出整个物理链路无丢样；应用缓冲另设上限 |
| Q13 | 阻塞串口可不需要事件循环；GUI不得承担长等待 | https://doc.qt.io/qt-6.8/qtserialport-blockingreceiver-example.html ; https://doc.qt.io/qt-6.8/qserialport.html | 主线仍为事件驱动；未将两种控制模型混用 |
| Q14 | waitForReadyRead / waitForBytesWritten 的超时与 false / true 语义 | https://doc.qt.io/qt-6.8/qserialport.html#waitForReadyRead ; https://doc.qt.io/qt-6.8/qserialport.html#waitForBytesWritten | -1不超时；false可能为超时或错误；写入进度不等于应用设备确认 |
| Q15 | requestInterruption 为协作请求；quit 只要求事件循环退出；二者文档均线程安全 | https://doc.qt.io/qt-6.8/qthread.html#requestInterruption ; https://doc.qt.io/qt-6.8/qthread.html#quit | 不自动打断任意阻塞调用；只对quit采用已核对的跨线程Direct连接 |
| Q16 | QSerialPort close 关闭并取消其 IO | https://doc.qt.io/qt-6.8/qserialport.html#close | 本章未持有原生异步请求；不能推广到任意SDK的cancel返回即全部完成 |
| Q17 | 槽抛出的异常须在槽内部处理，不能穿出Qt信号槽分派 | https://doc.qt.io/qt-6.8/exceptionsafety.html#signals-and-slots | 本文不承诺Qt内部分配失败后可继续正常GUI运行；未伪造异常恢复代码 |
| Q18 | deleteLater 安排延迟删除；主事件循环结束后调用不保证删除；官方 worker 模式 finished→deleteLater | https://doc.qt.io/qt-6.8/qobject.html#deleteLater | 本骨架保留Auto，理由是finished从关联线程发射且worker同线程；没有排入停转普通队列再等它工作 |
| Q19 | finished 发出时普通循环已停，仍处理DeferredDelete；finished本身不足以证明Worker子树已删除 | https://doc.qt.io/qt-6.8/qthread.html#finished ; https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_win.cpp | stopped、finished、allStopped明确分层；图11-2需保持此说明；不泛化任意C++ TLS清理 |
| Q20 | wait(0UL)使用毫秒重载；6.8.3的结束状态在Worker DeferredDelete后公布；未启动线程wait也可true | https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_win.cpp ; https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_unix.cpp | 仅用于本例对象树回收，不保证任意C++ TLS/SDK后续副作用；只在启动后的finished进入回收链，不拿初始true证明线程曾完成 |
| Q21 | singleShot(int, context, functor) 在context存活且其事件循环运行时调用 | https://doc.qt.io/qt-6.8/qtimer.html#singleShot | 10是毫秒；仅一条回收链，控制器活到结束；定时准确性不作硬实时保证 |
| Q22 | 运行中的普通QThread不能直接析构；QThread::create自6.3有专门规则；terminate危险 | https://doc.qt.io/qt-6.8/qthread.html#dtor.QThread ; https://doc.qt.io/qt-6.8/qthread.html#terminate | 本章使用new QThread，明确不套create例外；没有超时后直接delete或强杀线程的代码 |
| Q23 | QCloseEvent可ignore/accept；close再发事件；接受一般隐藏，是否销毁有条件 | https://doc.qt.io/qt-6.8/qcloseevent.html ; https://doc.qt.io/qt-6.8/qwidget.html#close | 正文没有把接受关闭普遍说成立即析构；mayClose门控和重复点击策略是应用设计 |
| Q24 | aboutToQuit后的事件处理能力有限；processEvents不宜替代合理事件组织 | https://doc.qt.io/qt-6.8/qcoreapplication.html#aboutToQuit ; https://doc.qt.io/qt-6.8/qcoreapplication.html#processEvents | 正常停止在app退出前发起；不依赖析构或aboutToQuit开启完整异步流程 |
| Q25 | disconnect后已排队事件仍可能到达 | https://doc.qt.io/qt-6.8/qobject.html#disconnect | generation校验为由此设计的接纳协议；Qt不自动提供代际 |
| Q26 | 系统线程创建失败时不能依赖started/finished收尾 | https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_win.cpp ; https://raw.githubusercontent.com/qt/qtbase/v6.8.3/src/corelib/thread/qthread_unix.cpp | 已核对官方固定tag的创建失败分支不发这两个信号；骨架明示系统线程创建成功前提 |

## 教学实现的静态审阅结果

### 已检查的关系

- 只有 GUI 控制器创建、拥有并删除 QThread；运行期不触发普通 QThread 析构
- Worker 无 parent 后移动；移动失败时还在 GUI，可直接删除；线程尚未启动，可删除管理对象
- Worker 移动成功后不由 GUI 直接调用或 delete；串口和定时器在初始化槽中创建，并由 Worker 对象树回收
- 所有新业务请求排队交给 Worker，窗口更新留在 GUI；唯一主动跨线程 Direct 调用为官方线程安全的 quit
- Worker 先停止接纳、关资源，再发一次 stopped；初始化、read、timer入口都受状态约束
- 骨架以对象分配与操作系统线程创建成功为前提；线程创建失败不依赖started/finished链回收，启动确认超时不能成为直接删除依据
- started→initialize 显式Queued，让工作线程事件循环负责初始化；立即停止可先把Worker置Finished，初始化不能复活
- finished→deleteLater 保留 AutoConnection；禁止误改显式Queued
- finished 后 GUI 用 wait(0UL) 与上下文定时器检查；只在成功后清除thread_并删除t
- allStopped 的定义为终态结果与线程释放都汇合，不能从线程退出补造成功
- 窗口第一轮closeEvent ignore，重复关闭幂等；allStopped后才再次close
- Snapshot不含借用指针；元类型声明注册在连接前；新代与旧代不得共用接纳身份
- 单在途快照在检查generation之后才清pending；停止清理本代额度；显示合并不冒充记录完整
- 背压不能阻塞唯一负责处理stop的事件循环；记录通道未用无界事件队列伪装容量控制

这些是文稿和API层的静态推理检查，不是已经运行的测试，也不证明省略部分实现正确。

### 尚未实现或执行

1. 完整QObject类声明、信号槽声明、头文件、moc生成、Qt模块链接及工程编译
2. 真实串口枚举、协议握手、通信参数、解析器、错误码到中文提示的映射
3. Worker初始化/stop/read/timer入口的完整代码，以及异常与资源分配失败路径
4. Windows/Linux线程创建异常监测、Qt插件与驱动行为、USB热拔插与端口占用
5. 完整shutdown/allStopped汇合、关闭超时提示、记录通道和持久化策略
6. 空闲关闭、初始化中关闭、半帧关闭、连续关闭、旧回复延迟、GUI停顿、记录队列过载的实际回归测试
7. 真实低压教学板、仪器、安全接线与性能验收

代码标为片段而非可复制运行工程，缺少上述部分是明确范围，不应在样章发行说明中写成“已编译通过”“保证50ms关闭”或“上板验证”。

## 本版修订摘要

1. 将原C31集中论述拆成面向Qt线程初学者的连续实现链，压低Win32、PLC、MES与协议专题带来的前置负担
2. 用QObject对象树与线程归属的双重约束替代“放进线程就安全”的模糊表达
3. 新增小型Snapshot、元类型、会话代际与单在途显示请求，补足跨线程结果的存续与新鲜度责任
4. 新增结束函数、启动前连接、非阻塞回收和窗口closeEvent四段关键代码，保持片段短而可解释
5. 明确stopped/finished/allStopped三个完成层级，纠正quit即取消、requestInterruption自动打断、finished即全部尾部清理已结束等危险推论
6. 明确finished→deleteLater不能机械改成显式QueuedConnection；普通QThread不能在超时后直接析构
7. 将“每100ms刷新”扩为真正有界的单在途协议，并与原始记录通道分开
8. 用关窗卡死、重连旧值两段完整故障推理替代题目清单，各保留有答案的面试追问
9. 固定Qt6.8.3线程实现边界及Qt6.8通用API资料，并分别标注文稿核验、未编译、未执行、未连接硬件；不把排版检查当实现验收

### 审校后补充 2026-10-06

- 将正文标题统一为“第十一章 后台采集与安全关闭”，稳定ID N11仅用于metadata和编辑台账
- 明确骨架的对象分配/系统线程创建成功前提，端口初始化错误与底层线程未能启动的错误分开；启动确认超时不赋予删除运行对象的资格
- 补充QObject元对象构建前提、普通共享bool/volatile的同步边界、应用异常不得穿出Qt槽、终态与线程回收双条件汇合

- 补充重复connect如何破坏单请求在途额度，以及UniqueConnection对lambda无去重作用；本例每代Worker只建立一次连接。


### 线程尾部同步的晚发现修订

2026-10-06在补核启动失败路径时发现：Qt6.8在线QThread页面当前标记6.8.9，wait说明列出Windows/Linux完整OS退出保证，但公开固定v6.8.3源码的wait仍会在Qt finished状态为真时提前返回。Windows的QThreadPrivate::finish先发finished，再处理DeferredDelete和QThreadStorageData、事件分派器，随后设置running/finished；Unix finish先处理DeferredDelete，之后cleanup公布状态并唤醒等待者。该关系足够支持本例Worker子树已在正确线程同步销毁，不足以证明任意C++运行时thread_local析构及外部SDK后续副作用都已结束。

- 已删除正文原先“等待成功覆盖操作系统线程真正退出”的概括，固定为Qt6.8.3已核对实现范围
- 保持finished→Auto deleteLater→GUI wait(0UL)成功→delete QThread骨架，没有新增未经验证的原生句柄同步代码
- 新增前提：必要清理显式放在Worker及其子对象生命期内，不藏入额外TLS或SDK回调；更换库版本或接SDK应重新核对结束条件
- 已核对官方公开v6.8.4-lts-lgpl Windows实现仍有相同wait状态早返，不能凭补丁号增加推断已修复
- 官方GitHub matching refs只列到v6.8.3和v6.8.4-lts-lgpl，未见公开v6.8.9 tag；官方6.8.9发布说明指明精确LTS源码需有效商业许可访问，因此没有声称核对6.8.9源码，也没有尝试越过访问限制
- 这是一项技术范围更正，不以“未实测”代替修正；正文所需对象树回收关系已由固定源码作静态依据

核验链接：[Qt6.8.3 Windows实现](https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_win.cpp)、[Qt6.8.3 Unix实现](https://github.com/qt/qtbase/blob/v6.8.3/src/corelib/thread/qthread_unix.cpp)、[Qt6.8.4 LTS LGPL Windows实现](https://github.com/qt/qtbase/blob/v6.8.4-lts-lgpl/src/corelib/thread/qthread_win.cpp)、[公开6.8标签](https://api.github.com/repos/qt/qtbase/git/matching-refs/tags/v6.8)、[Qt6.8.9商业LTS发布说明](https://www.qt.io/blog/commercial-lts-qt-6.8.9-released)。


## 完整候选版集成

版本0.9沿用样章主体内容与图11-1至11-3。Qt6.8文档与6.8.3实现的范围保持不变：不把finished、quit或工作对象清理等同于任意TLS和SDK尾部效果已全部结束。全书版本和导航由统一制品更新，未增加运行通过声明。


### 独立审校后的全书契约对齐

11.4将样章独立假设“最大帧64字节”改为全书统一协议“最大负载64字节、最大整帧76字节”。11.3说明sampleTick_us来自独立可选时间扩展，基础type01帧不含时间，并新增hasSampleTick存在标志，缺失时不把零解释为采样时刻；使用时还需绑定设备启动身份。开头将“教学板已经确认供电、电平和连接”改为实施前提，明确本版未做接线与硬件验证。三项均为范围与数据契约对齐，不改变线程收尾机制或引入实测结论。
