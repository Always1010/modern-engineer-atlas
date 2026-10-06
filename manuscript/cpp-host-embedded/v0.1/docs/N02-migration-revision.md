# 第二章编辑与技术核验记录

稳定章ID：N02。样章版本：sample-0.1。记录日期：2026年10月6日。正文为《第二章 C++程序 对象与资源生命期》，路径为 chapters/N02-program-objects-lifetime.zh-CN.md。本记录提供正文来源、迁移取舍和验证边界，与读者正文分开保存。

## 交付内容与范围

- 已写完整可编辑Markdown正文，包含九个自然章节层级、十段代码、三幅图示及两条完整故障推理
- 读者假设：会变量、条件与函数，不预设现代C++、硬件和工业现场经验
- 主线：低压温度节点采集工站；TemperatureReading是进程内读数，不是传输协议布局；temperature_mC单位为毫摄氏度，sequence是教学采样序号
- 核心链：程序执行 → 对象与存储 → 借用 → 析构清理 → 独占与移动 → SDK适配 → 最后使用点 → 嵌入式约束
- 章末有六条有答案面试追问；没有作业、打卡、重复导读或“从一次……开始”结构
- 正文代码均明示教学、未编译、未运行；SDK是虚构接口，故障场景是按语义推演，不是已发生的生产事故
- 正文初次字数检查为约10300汉字，随后补入必要语法与int范围前提，最终检查为10574汉字；最终页数以本次PDF版面记录为准，14页为预算而非完成声称

## 原章全文来源与取得方式

固定基线为book-v1.1.0，提交0842f624995d2fd99f46c68426c9a33a73610cbb。实施方案的本地edition-plan-sources目录中，本章所需的部分原章只有前30行，部分在代码块内截断。本章没有把这些片段当成全文；另经GitHub只读接口取得固定提交的完整原章，保存到cpp-samples/sources/original/，不修改仓库。

以下七章全文已取得；C09、C10、C11为主核读对象，其余按本章所用小节核读。GitHub固定提交链接可复核，文件名保留原样。

| 原章 | 实际标题 | 固定来源 |
| --- | --- | --- |
| C07 | 操作系统提供的执行与资源模型 | [C07全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C07-operating-system-execution-and-resources.zh-CN.md) |
| C08 | 编译链接装载与二进制边界 | [C08全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C08-compilation-linking-loading-and-abi.zh-CN.md) |
| C09 | 对象生命周期与资源所有权 | [C09全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C09-object-lifetime-and-ownership.zh-CN.md) |
| C10 | 值语义与泛型参数传递 | [C10全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C10-value-semantics-and-forwarding.zh-CN.md) |
| C11 | 对象模型与可观察边界 | [C11全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C11-object-model-and-observable-boundaries.zh-CN.md) |
| C14 | 错误处理与健壮的库接口 | [C14全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C14-errors-and-robust-library-interfaces.zh-CN.md) |
| C19 | 异步 IO 协程与调度 | [C19全文](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C19-asynchronous-io-coroutines-and-scheduling.zh-CN.md) |

## 逐节精确迁移对照

以下新稿小节以完整中文标题定位；N02只在元数据与编辑记录使用。多个来源在一节共同出现时已重新组织，不声称逐段原文搬运。

| 新稿节与小节 | 原章与精确小节原标题 | 处理与本轮变化 |
| --- | --- | --- |
| 一／源文件不是正在运行的工站 | C07《操作系统提供的执行与资源模型》7.1.2「程序文件 运行实例与业务任务不是同一件事」；C08《编译链接装载与二进制边界》8.1.1「构建链路是信息逐步确定的过程」、8.1.2「翻译单元是独立检查的重要边界」；C09 9.1.1「对象不只包括类的实例」 | 合并重写。构建仅保留一段，不讲目标文件格式；新增统一温度记录、入口与启动的区别、进程内对象不等于报文布局 |
| 一／对象存在 不等于值已经准备好 | C09 9.1.1「对象不只包括类的实例」；C11《对象模型与可观察边界》11.4.1「不同的未知有不同含义」 | 保留规则、改写解释。只保留未初始化整数与UB必要含义；新增“零度不代表读取成功”，为optional铺垫 |
| 二／作用域回答在哪里能使用这个名字 | C09 9.1.2「存储期与名字所在的作用域」 | 重写。新增局部static序号例子，明确仅单线程教学，补常量初始化可能更早完成的边界 |
| 二／存储期回答空间按什么规则保留 | C09 9.1.2「存储期与名字所在的作用域」；C11 11.1.1「对象表示 值表示与对齐」 | 合并选留。主讲自动、静态、动态，线程存储期只点到；保留大小和对齐前提，删除布局尺寸推导，明确栈堆不是标准要求 |
| 二／空间留下来 内部对象也可能已经结束 | C09 9.1.1「对象不只包括类的实例」、9.1.3「存储仍在与对象仍在」 | 保留并改写。optional<int>变为optional<TemperatureReading>，新增saved独立副本时间线；精确保留析构调用开始的生命期界限 |
| 三／引用和指针都能形成借用 | C09 9.2.1「访问原对象与保存独立的值」、9.2.3「只读限制与使用期限」；C10《值语义与泛型参数传递》10.1.1「一份值与一个对象的身份」 | 合并重写。用同一温度记录演示值、引用、指针；补&两个位置、箭头、const不是快照；不展开别名优化 |
| 三／借用要写明结束点 | C09 9.2.2「非空不能证明目标仍然存在」、9.2.3「只读限制与使用期限」；C10 10.2.3「临时物化与直接构造」、10.2.4「生命周期延长只沿规定的语法发生」 | 重写压缩。保留返回局部借用、临时延长限制和string_view；只铺垫vector失效，详细容器规则移至新第三章 |
| 三／故障推理 温度文字偶尔变成上一台设备的内容 | C09 9.4.2「回调与缓存里的隐含保留」；C10 10.2.3、10.2.4；C09章末「沿创建到最后一次使用排查」 | 新增完整教学故障链。原稿没有本publish_temperature场景；用post延迟回调、按值复制视图、字符串快照修复，明确未实测；补lambda捕获的最低语法解释 |
| 四／资源不仅是动态内存 | C09 9.3.1「把资源释放交给对象」；C14《错误处理与健壮的库接口》14.1.2「栈展开负责销毁 不负责撤销业务」 | 合并重写。文件流改成读取温度结果的optional例子；保留早退、异常清理与持久化/业务成功边界 |
| 四／构造先建立可用状态 析构按依赖退出 | C09 9.4.3「构造失败与依赖资源的释放顺序」；C11 11.3.2「基类子对象不是独立完整对象的复刻」中的初始化顺序部分 | 重写。三层依赖改为SdkRuntime→Connection→Task；只讲普通非继承类，清楚写Task析构完成后不再借用前提；继承次序细节不进入本章 |
| 五／先问是否真的需要一个动态对象 | C09 9.3.2「先使用值 再表达独占所有权」；C10 10.1.2「移动提供重用资源的机会」 | 保留并统一例子。显示管理对象与目标对象分开，get/reset/release不同，新增auto最低语法解释；图不推导unique_ptr内存布局 |
| 五／std::move只是允许后续选择移动 | C10 10.1.2「移动提供重用资源的机会」、10.1.3「std::move 不执行移动」、10.1.4「特殊成员函数是一个协作集合」；10.4.5「参数形式应来自保存与消费需求」 | 合并压缩。保留转换、移后有效但未指明、零法则；移出重载候选删除规则、自移动与完整特殊成员函数生成矩阵 |
| 五／共享所有权不是所有借用的升级版 | C09 9.3.3「共享所有权要有真实需求」、9.3.4「weak_ptr 表达可消失的观察关系」、9.4.1「先区分拥有边与观察边」、9.4.2「回调与缓存里的隐含保留」 | 保留为短边界，不给新共享代码例子。解释last owner、强环、weak lock和线程安全区别；不展开控制块、缓存淘汰和引用计数成本 |
| 六／先读契约 再写包装 | C07 7.2.5「关闭与继承是资源所有权问题」、7.2.6「Windows 句柄延续同样的问题意识」；C08 8.4.7「分配 释放与异常应在同一责任边界内闭合」；C09 9.3.2末尾SDK释放建议 | 合并并新增实现。虚构sdk_open/read/close契约明确，unique_ptr自定义删除器负责不透明句柄；新增CreateFileW和CloseHandle官方核验点；不提供完整串口驱动代码 |
| 六／析构不应把新异常扔到外面 | C09 9.3.1「把资源释放交给对象」；C10 10.4.3「noexcept 是失败边界的承诺」；C14 14.1.2、14.1.6「捕获 重抛与终止」 | 合并重写。指出异常不能逃出、显式finish/close检查业务结果、析构日志可能失败，不承诺持久化 |
| 六／故障推理 配置失败后设备一直被占用 | C09 9.4.3「构造失败与依赖资源的释放顺序」；C14 14.1.3「构造失败时谁被析构」、14.4.5「验证失败路径不能只测试抛出发生了」 | 新增完整教学故障链。裸句柄的BrokenSession反例、非委托构造失败、RAII成员修复与失败注入验收；不声称确有驱动事故 |
| 七／正确关闭要覆盖最后一次使用 | C09 9.4.2「回调与缓存里的隐含保留」、9.4.4「退出路径需要覆盖最后一次使用」；C08 8.4.10「回调与异步接口还要约定谁在何时调用」；C19《异步 IO 协程与调度》19.3.3「取消必须沿操作树传播并最终汇合」 | 合并选留。只讲请求停止与结束借用；新增CancelIoEx官方反例、QObject父子树一段；Qt线程归属与deleteLater机制交给新第十一章 |
| 八／这套方法怎样进入嵌入式 | C14 14.4.1「禁用异常是整条调用链的配置决定」、14.4.2「不让异常穿过没有共同约定的边界」；实施方案第五节「C++在嵌入式中的表达要诚实」 | 新增聚焦说明。把启动、资源预算、错误机制和中断/DMA访问条件连回生命周期。只提示目标平台必须核验，不假定已确定工具链、RTOS或SDK |
| 九／面试追问要回答到责任和证据 | C09章末「面试中的一条追问链」及「沿创建到最后一次使用排查」；C10各节面试追问 | 重新拟题与回答，共六题。问题从本章机制和两个故障自然产生，不搬入模板、协程或高级ABI问答 |
| 资料与核验范围 | C09、C10、C11章末来源与阅读边界 | 重新核验。日期改为本次实际核验日2026-10-06；新增微软和Qt来源，明确滚动文档不等于部署版本 |

## 主要删减与迁出

此处“删除”指不进入N02样章，并非删除原书文件。

- C09原有四段目录式导读删除，以自然开头直接交代实际内容；原来的shared_ptr与weak_ptr完整示例缩减成设计边界
- C09 9.4.1与9.4.2的完整强引用环图、缓存保留策略，以及章末进程内存与分配器统计讨论不进入本章；本章只保留解释错误退出所需的责任链
- C10 10.2.1、10.2.2、10.2.5的完整值类别分类；10.3全部转发引用、引用折叠和完美转发推导；10.4.1、10.4.2及10.4.4的RVO、NRVO、move_if_noexcept深入不进入本章
- C11 11.1布局填充推导、11.2虚表/RTTI/类型擦除、11.3多态切片与虚析构、11.4低层转换及ABI实证不展开，只选取对象访问前提与构造次序；新第五、七章可按需要回收
- C07进程调度、系统调用细节、描述符继承与Linux close差异不进入；C08 ELF/PE、链接、ABI、FFI展开移至新第五章
- C14完整错误表示、expected和异常安全等级移至新第七章；本章的optional不是通用错误协议
- C19 IOCP/epoll、协程帧、执行器、零拷贝不进入，只保留取消请求不等于完成的寿命前提
- Qt内容止于QObject父子所有权与最后使用点，不加入QThread、moveToThread、连接类型、deleteLater时序实现，避免抢新第十一章职责

## 关键断言与正式技术资料对应

技术核验用WG21公开固定草案、Core Guidelines及厂商官方文档。timsong-cpp站点是N4861的便于按条款阅读的HTML镜像，不是另一份标准；规范身份以WG21官方PDF为准。正文解释与代码为重新组织的教学表达，未复制网页成段文字或第三方图片。

| 关键断言 | 规范或官方资料精确位置 | 本次核验与边界 |
| --- | --- | --- |
| int范围由实现决定，示例明确要求可表示50000 | [basic.fundamental](https://timsong-cpp.github.io/cppwp/n4861/basic.fundamental) 最小宽度表 | 已在线核对；没有假定所有实现int恒32位，未选定实测目标 |
| 对象有类型和存储，函数不是对象，成员是子对象 | [intro.object](https://timsong-cpp.github.io/cppwp/n4861/intro.object)；[官方N4861](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf) | 已在线读取；只讨论入门普通对象，没有把原始字节区域一概视为任意对象 |
| 类对象生命通常在初始化完成开始，析构调用开始结束；构造析构期间另有规则 | [basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life) 第1、4段；[class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) | 已在线核对；没有错误写成“析构完成才结束生命” |
| 读取未初始化普通int在C++20中的UB；观察未崩溃不证明合法 | [basic.indet](https://timsong-cpp.github.io/cppwp/n4861/basic.indet)；C11 11.4.1 | 已在线核对；明确固定C++20，不混入C++26 erroneous behavior规则 |
| 存储期与栈堆不同；普通局部/静态/动态各有规则；失效指针操作有限制 | [basic.stc](https://timsong-cpp.github.io/cppwp/n4861/basic.stc) | 已在线核对；不作栈分布、堆实现与指针尺寸的跨平台保证 |
| 局部static动态初始化在首次经过时执行，但可存在更早静态初始化 | [stmt.dcl](https://timsong-cpp.github.io/cppwp/n4861/stmt.dcl)；[basic.start.static](https://timsong-cpp.github.io/cppwp/n4861/basic.start.static) | stmt.dcl与basic.start.static均已在线读取核对；代码next{0}不误称必在首次调用才初始化 |
| optional外层仍在而内部可无对象；内部值存于optional自身，不为该值另分配 | [optional](https://timsong-cpp.github.io/cppwp/n4861/optional) optional.general、optional.optional第1段；[optional.mod](https://timsong-cpp.github.io/cppwp/n4861/optional.mod) | 已在线核对reset及容纳位置；不是对T内部自身是否会分配作保证 |
| 引用不普遍保活；临时对象延长不沿任意函数返回传递 | [class.temporary](https://timsong-cpp.github.io/cppwp/n4861/class.temporary)；C10 10.2.4 | 已在线核对；本章没有展开聚合括号、委托构造等低频例外 |
| 捕获视图不复制字符，lambda按值捕获其成员 | [expr.prim.lambda.capture](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.lambda.capture)；[string.view](https://timsong-cpp.github.io/cppwp/n4861/string.view) | 已在线核对；故障依赖post延迟到函数返回后执行这一明确教学契约 |
| vector重分配导致原元素借用失效 | [vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers) | 已在线核对；不声称reserve能解决所有失效 |
| 文件流内部filebuf析构进行close清理 | [filebuf.cons](https://timsong-cpp.github.io/cppwp/n4861/filebuf.cons) | 已在线核对；没有把close写成业务提交成功或断电持久化 |
| 异常传播到处理器时销毁已构造自动对象；普通非委托构造失败依靠已完成成员清理 | [except.ctor](https://timsong-cpp.github.io/cppwp/n4861/except.ctor) 第1至4段 | 已在线核对；正文刻意保留“普通非委托”限定，以避开委托构造完成后再抛出的例外 |
| 成员按声明顺序初始化，成员析构逆序，析构函数体先于成员析构 | [class.base.init](https://timsong-cpp.github.io/cppwp/n4861/class.base.init) 第13段；[class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) | 已在线核对；结构例子限定Task析构已完成全部停用 |
| 移动unique_ptr源为空、目标不因管理者移动而搬动；get、reset、release不同 | [unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr) unique.ptr.single.ctor、single.observers、single.modifiers | 已在线核对；仅针对普通非数组unique_ptr与本例删除器，不泛化到任意移动 |
| unique_ptr可用自定义删除器调用SDK；删除动作必须遵守不抛前提 | [unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr) unique.ptr.single、single.dtor、single.modifiers | 已在线核对；SdkDevice不透明，释放由sdk_close负责，没有使用default_delete |
| std::move只是转换；标准库移后通常有效但未指明 | [forward](https://timsong-cpp.github.io/cppwp/n4861/forward)；[lib.types.movedfrom](https://timsong-cpp.github.io/cppwp/n4861/lib.types.movedfrom) | 已在线核对；不承诺统一性能和移后为空 |
| 共享最后强拥有者负责销毁，weak lock提供临时拥有，不保护对象字段同步 | [util.smartptr.shared](https://timsong-cpp.github.io/cppwp/n4861/util.smartptr.shared)；[util.smartptr.weak](https://timsong-cpp.github.io/cppwp/n4861/util.smartptr.weak)；Core Guidelines R.24 | 已在线核对；只用于边界解释，正文无并发共享实现 |
| 异常逃出noexcept或异常展开中的析构会触发终止；终止不保证完整展开 | [except.terminate](https://timsong-cpp.github.io/cppwp/n4861/except.terminate) | 已在线核对；区别析构内部可处理异常与异常逃出 |
| RAII、裸指针借用、优先值、零法则、无异常环境资源管理属于设计建议 | [Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) R.1/R.3/R.4/R.5/R.20/R.21/R.24/C.20/E.25 | 已读资源与E.25相关文本；本章不把建议说成标准强制 |
| CreateFileW失败不是nullptr；CloseHandle不用于socket与registry key | [CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) Return value；[CloseHandle](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle) Remarks | 已在线读取；正文只给配对规则，不提供平台可运行封装 |
| CancelIoEx请求取消不等于等待完成，OVERLAPPED不能过早释放 | [CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex) Return value、Remarks | 已在线读取并核对明确原文；不推导所有SDK都与此接口相同 |
| QObject父删子、子从父移除，局部对象顺序可能冲突 | [Qt对象树](https://doc.qt.io/qt-6/objecttrees.html) Overview、Construction/Destruction Order | 已在线读取；网页当前显示Qt 6.12.0，为滚动文档，未声称样章使用已验证Qt部署版本 |
| freestanding/hosted实现范围、main前启动背景 | [intro.compliance](https://timsong-cpp.github.io/cppwp/n4861/intro.compliance)；[basic.start.main](https://timsong-cpp.github.io/cppwp/n4861/basic.start.main) | 已在线核对；具体MCU启动、异常禁用选项与运行库未选型，属于待工程验证项 |

## 教学代码与验证台账

| 片段 | 用途与依赖 | 已核验 | 未核验 |
| --- | --- | --- | --- |
| TemperatureReading/main | 类型、初始化、同步借用；演示0至50°C范围非产品限值 | 按C++20语义人工审阅，进程内对象/报文边界明确 | 未编译；未验证工具链整数模型；正式示例需确认int范围 |
| next_demo_sequence | 局部static与作用域；仅单线程 | 初始化与存储规则核对，注明回绕和非持久编号 | 未编译；没有线程安全或全局唯一保证 |
| optional slot | 含值/无值、reset、emplace、独立saved | 规范与时间线人工审阅 | 未编译；图已由本版重绘 |
| source/copy/alias/pointer | 简单记录复制与借用 | 人工审阅修改目标和副本结果 | 未编译 |
| publish_temperature反例 | 假定post延迟执行，show_text行为须查契约 | 明确借用越界路径和字符串按值修复 | 未运行故障复现；未执行检测器 |
| read_demo_temperature | ifstream RAII+optional结果；故意简化错误 | 已核对filebuf析构关闭规则，注明解析不足 | 未编译；未测试编码、超长输入和I/O故障 |
| StationSession | 依赖声明顺序；三个业务类型未实现 | 顺序与限定条件人工核验 | 结构示意不能独立编译；无取消/线程实现 |
| producer/consumer | unique_ptr移动、借用、reset | 规范语义人工审阅，目标地址不因这次移动改变 | 未编译、未运行；无性能测量 |
| SdkHandle/read_once | 虚构SDK+自定义删除器，同步借用 | 契约、早退与正确删除方式人工审阅 | 无真实SDK、驱动、板卡或工具链联调 |
| BrokenSession反例 | 先打开后构造失败，裸句柄漏清理 | 非委托构造失败规则核对；修复方案使用RAII成员 | 未注入失败、未统计句柄、未验证重连 |

## 修订说明

### 相对原书的实质变化

1. 从C09、C10、C11并列的语言知识结构，重组为温度工站中可追踪的一条对象责任链；删除原章固定四主题导读形式
2. 为基本编程读者补齐struct、成员、引用符号、指针箭头、std命名空间、模板参数、auto、lambda捕获、构造析构命名、public、using别名与operator()的最短解释
3. 将存储、名字与对象生命期分别解释，并以温度optional和独立值副本示意；保留N4861精确边界，避免“栈堆决定一切”简化
4. 合并复制、移动、零法则与独占资源责任；减少复杂值类别和转发推导；共享与弱引用只留必要选择边界
5. 新增自定义SDK删除器代码及Windows官方配对反例，明确虚构契约和真实SDK核验责任
6. 新增两个完整故障推理：延迟字符串视图失效、配置抛出后句柄泄漏；每个包含现象、缺失事实、可区分假设、证据、修复和待做验收
7. 新增MCU限制与Qt所有权铺垫，明确不提前展开第十一章线程模型；没有把桌面示例包装成可跨所有MCU直接部署
8. 新图重新构思为存储时间线、责任转移图、最后使用点关闭图，不复用旧SVG或未经核验照片

### 已完成检查

- 原章文件完整性：发现旧目录仅30行截断后，从固定提交只读取得全文
- 技术：在线核验标准条款、Microsoft返回值/释放/取消条件与Qt对象树规则
- 文稿：完整章节结构、引用号、代码围栏配对、三幅图示及故障链已检查
- 代码展示：十段代码共130行；最长代码行59字符，无超过70字符行；代码围栏闭合、14组引文号和参考资料对应；只做文本与语义审阅，没有调用编译器
- 范围：本轮只完成教学文稿与制品；原书构建程序与原章内容保持原样

### 版面完成与后续工程验证

- 三幅SVG、字体许可/哈希及图内文字均已完成；对应成图与正文逐一核对
- A4正文定位为第3至17页；代码整块、图注、字体、书签与中文换行已纳入逐页检查
- int具体范围、编译器/标准库版本、可运行例子组织、SDK取消与释放线程要求，待后续工程阶段确认
- 所有C++编译、运行、资源泄漏检测、故障注入、Windows/Qt联调和板上测试均未执行；不以资料核验替代这些证据
- 正式书稿若引入多态设备接口，另在新第七章说明基类析构设计，不应把本章独占指针例子直接泛化到无虚析构基类
- 标准条款HTML镜像提供定位便利；最终发行参考文献应保留WG21官方固定PDF和核验日期，并核查必要缺陷报告

## 本轮编辑决定

本章暂采用15页，保留两段故障证据链、构造失败边界和SDK契约。最低语法解释在用到时出现，没有另加语法大全。与其他两个样章合并看仍在40页正文预算以内；后续全书可以再次压缩重复追问，但不得通过缩小代码或图中字来满足页数。

