# 使用这本手册

这本书从一个能解释清楚的小程序出发，逐步进入对象、资源、数据处理、并发和系统。每个主题先说明对象或操作是什么，再给正常写法、结果和必要条件，最后展开机制与例外。首次学习可沿下面的路径进入具体小节；需要查一个名称或任务时，直接使用目录与索引。

## 首次学习路径

前一次阅读建立的概念，是下一次阅读的起点。一个阶段结束时，先用自己的话回答理解检查；能解释对象、操作和结果，再进入下一阶段。同一节还保留完整规则和接口，首次阅读可以在这里给出的入口之间前进。

### 阶段一：变量、计算与普通函数

从[源文件与 main](chapters/R01-program-build.zh-CN.md#源文件与-main)认识输入、计算和输出，再读[基础类型](chapters/R02-types-objects.zh-CN.md#基础类型分类)、[初始化与赋值](chapters/R03-initialization-deduction.zh-CN.md#初始化与赋值)、[初始化类别](chapters/R03-initialization-deduction.zh-CN.md#初始化类别)和[auto](chapters/R03-initialization-deduction.zh-CN.md#auto)。按值声明和引用声明都先用整数观察，完整类初始化留到类节。

接着读[常用表达式](chapters/R04-expressions-conversions.zh-CN.md#运算符分类)、[函数声明、定义与调用](chapters/R06-statements-functions.zh-CN.md#函数声明定义与调用)、[参数与返回值](chapters/R06-statements-functions.zh-CN.md#参数与返回值)、[if](chapters/R06-statements-functions.zh-CN.md#if-与-else)和[for](chapters/R06-statements-functions.zh-CN.md#for)。普通函数先使用按值参数；在知道函数如何调用后，下一步才选择指针或引用传参。

理解检查：`int n = 3; n = 5; auto copy = n; n = 8;` 中，哪些语句建立新对象？最后 copy 是多少？第一句和第三句建立 n、copy；其余两句修改已有 n。copy 是自己的整数副本，最后仍为 5。

### 阶段二：借用、对象寿命与资源

先读[指针声明、取址与解引用](chapters/R05-pointers-references.zh-CN.md#指针声明取址与解引用)、[左值引用与右值引用](chapters/R05-pointers-references.zh-CN.md#左值引用与右值引用)和[引用与指针参数](chapters/R05-pointers-references.zh-CN.md#引用与指针参数)，区分独立副本与访问同一对象。

再读[一个简单的类](chapters/R07-classes-lifetime.zh-CN.md#classstruct-与访问控制)、[构造函数](chapters/R07-classes-lifetime.zh-CN.md#构造函数与成员初始化)和[析构函数](chapters/R07-classes-lifetime.zh-CN.md#析构函数)。用 Active 的计数观察作用域结束，然后进入[RAII](chapters/R09-raii-memory.zh-CN.md#raii-资源对象)、[两种退出的清理](chapters/R09-raii-memory.zh-CN.md#正常退出与异常退出的清理)、[unique_ptr 构造与访问](chapters/R09-raii-memory.zh-CN.md#unique_ptr-构造与访问)和[转交与释放](chapters/R09-raii-memory.zh-CN.md#unique_ptr-转移reset-与-release)。

理解检查：拥有者的 get() 给出 int*，谁负责释放整数？把拥有者移给另一个 unique_ptr 后，源对象与整数分别怎样？get() 只提供借用，释放责任仍在拥有者；转交后源拥有者仍活着但为空，整数由目标拥有者管理。能分别指出对象寿命、资源寿命和借用期限，再进入复制与移动。

### 阶段三：复制、移动、模板与失败

先读[拷贝构造](chapters/R08-copy-move.zh-CN.md#拷贝构造)、[拷贝赋值](chapters/R08-copy-move.zh-CN.md#拷贝赋值)、[std::move](chapters/R08-copy-move.zh-CN.md#stdmove)、[值类别](chapters/R08-copy-move.zh-CN.md#值类别)和[移动后状态](chapters/R08-copy-move.zh-CN.md#移动后状态与借用)。已经见过独占资源转交，现在比较新对象、已有对象与源对象的关系。

进入[函数模板](chapters/R10-templates-compile-time.zh-CN.md#函数模板)和[类模板](chapters/R10-templates-compile-time.zh-CN.md#类模板)，认识一个定义怎样形成多个具体类型或函数；再按需要读[常量求值](chapters/R10-templates-compile-time.zh-CN.md#constexprconsteval-与-constinit)、[实参推导](chapters/R10-templates-compile-time.zh-CN.md#模板实参推导)和[转发引用](chapters/R10-templates-compile-time.zh-CN.md#转发引用与引用折叠)。此时类型查询和声明摘要有了读法。

随后读[throw](chapters/R11-errors-exception-safety.zh-CN.md#throw-与异常对象)、[try/catch](chapters/R11-errors-exception-safety.zh-CN.md#trycatch-与重新抛出)、[栈展开](chapters/R11-errors-exception-safety.zh-CN.md#栈展开与构造失败)和[异常安全保证](chapters/R11-errors-exception-safety.zh-CN.md#异常安全保证)。先解释失败时对象如何清理，再解释失败后的值是否保持。

理解检查：对 source 写 std::move 是否已经转交资源？没有，它只改变表达式类别，后续构造或赋值决定实际操作。捕获异常是否自动撤销此前的文件写入？不会，对象清理与外部效果回滚是不同的承诺。

### 阶段四：存放、遍历和处理数据

从[string](chapters/R12-strings-views.zh-CN.md#stdstring)和[vector](chapters/R13-sequence-containers.zh-CN.md#stdvector)开始。先掌握构造、下标、长度与容量，再读[reserve 与 resize](chapters/R13-sequence-containers.zh-CN.md#reserve-与-resize)、[访问位置](chapters/R13-sequence-containers.zh-CN.md#迭代器begin-与-end)和[失效规则](chapters/R13-sequence-containers.zh-CN.md#vector-的失效与异常保证)。位置的最小用法在第一次区间构造之前解释，随后到[半开区间](chapters/R15-iterators-ranges.zh-CN.md#半开区间与尾后位置)学习通用遍历模型。

掌握遍历以后，再读[排序](chapters/R16-algorithms.zh-CN.md#stdsort-与-stdstable_sort)、[二分查找](chapters/R16-algorithms.zh-CN.md#stdlower_boundstdupper_bound-与等价范围)，然后选择[关联容器](chapters/R14-associative-adaptors.zh-CN.md)。按任务继续读[optional](chapters/R17-utility-results.zh-CN.md#stdoptional)、[文本转换](chapters/R18-text-numeric.zh-CN.md)、[数值与随机工具](chapters/R33-numeric-random-bits.zh-CN.md)、[时间](chapters/R19-time-files.zh-CN.md)、[流与文件](chapters/R34-streams-files.zh-CN.md)和[文件系统](chapters/R35-filesystem.zh-CN.md)。

理解检查：vector 有三个元素，reserve(6) 后能否访问下标 5？不能，长度仍为 3，预留存储不等于已经建立元素。空容器的 begin() 是否可以解引用？不能，它与 end() 相等，当前位置没有元素。

### 阶段五：线程、互斥与结果

先读[线程及结果通道](chapters/R20-threads-async.zh-CN.md)，再读[互斥量与临界区](chapters/R21-mutex-coordination.zh-CN.md#互斥量与临界区)、[lock_guard](chapters/R21-mutex-coordination.zh-CN.md#stdlock_guard)、[unique_lock](chapters/R21-mutex-coordination.zh-CN.md#stdunique_lock)和[条件变量](chapters/R21-mutex-coordination.zh-CN.md#stdcondition_variable)。先组织寿命和受锁保护的状态，再到[原子操作分类](chapters/R22-atomics-memory-order.zh-CN.md#原子对象与操作类别)、[数据竞争与 happens-before](chapters/R22-atomics-memory-order.zh-CN.md#数据竞争与-happens-before)解释同步关系。任务提交与关闭在[异步执行](chapters/R23-async-execution.zh-CN.md)中展开。

理解检查：条件变量通知是否说明队列一定非空？不说明；等待者在持锁状态下重新检查谓词，处理虚假唤醒和其他线程先消费的情况。能给每个共享对象指定寿命与同步规则后，再阅读弱内存序、原子等待和调度模型。

### 阶段六：系统机制与网络交互

从[CPU 与内存成本](chapters/R24-cpu-memory-cost.zh-CN.md)进入机器模型，再读[进程与虚拟内存](chapters/R25-process-virtual-memory.zh-CN.md)、[系统调用与 I/O](chapters/R26-syscalls-file-io.zh-CN.md)以及[链接与装载](chapters/R27-linking-loading-libraries.zh-CN.md)。先明确地址空间、资源实体和操作流程，再查各平台 API。fd、HANDLE 等系统资源标识的最小含义在首次使用处说明。

网络部分先读[协议与连接](chapters/R28-protocols-connections.zh-CN.md)，明确端点、字节流和消息边界，再读[socket](chapters/R29-sockets-production.zh-CN.md)。理解检查：一次 send 或 recv 是否等于一个业务消息？TCP 提供字节流，一次调用可能只处理部分字节，应用需要自己的消息边界和完整收发流程。

### 阶段七：构建、调试与测量

阅读[最小工程](chapters/R30-build.zh-CN.md)、[调试会话](chapters/R31-debug.zh-CN.md)和[性能调查](chapters/R32-performance.zh-CN.md)。把前面的语言与系统知识用于组织产物、观察现场和设计对照。理解检查：两个实现各测一次，数值较小是否足以证明总是更快？需要明确输入、编译条件、计时范围和波动，并用可比较的多次测量支持结论。

## 按对象与任务查阅

已知名称时，用[正文目录](TOC.md)的具体条目或[附录索引](appendices.zh-CN.md)进入。类型条目可查声明、构造与接口组；语言条目可查语法与语义；工具条目可查命令、参数与结果。完整 PDF 在目录和附录标出直接入口页码，HTML 提供可点击导航。

| 当前任务 | 查阅入口 |
| --- | --- |
| 初始化、转换、函数调用 | 初始化 / 表达式 / 语句与函数 |
| 对象借用、转交、释放 | 指针与引用 / 类 / RAII / 拷贝移动 |
| 类型推导与通用接口 | 模板 / 常量求值 / 类型特征 / 转发 |
| 存放、查找、遍历和处理数据 | 字符串 / 容器 / 迭代器 / 算法 |
| 文本转换、随机数、时间与文件 | 文本 / 数值工具 / 时间 / 流 / 文件系统 |
| 线程等待、结果、互斥与调度 | 线程 / 互斥 / 原子 / 异步执行 |
| CPU、进程、内存与底层 I/O | 组成与系统领域 |
| 连接、协议与消息收发 | 协议 / socket |
| 构建失败、现场调试与资源调查 | 构建 / 调试 / 性能 |

## 页面、强调与适用范围

全书采用“第1章—1.2节—1.2.1小节”的结构。每章和每节从新页开始，小节随正文连续排版；章首页给出各节入口，节首目录列出具体对象与规则，不编号的局部标题组织接口组。

正文加粗用于正在定义的概念或符号，以及明确对比中的同级对象或结果。普通行内代码使用蓝色常规字重；普通解释、重复提及和限制保持正文样式。表格正文统一颜色和普通字重。

核心以 C++17 组织；C++20/23 接口在对应条目说明，并需要相应标准库支持。涉及 OS 的 API 单独标平台；日常文件操作先用标准流和文件系统，再进入下层机制。

## 代码、图与依据

短代码用于解释接口与语法。头文件通常在一个主题第一次使用时说明，后续只有依赖变化或承接前文对象时才补充具体前提。没有 main 的局部语句放在函数体内；类型和普通函数定义按相邻说明放在适用作用域。各个例子分别理解，文字明确承接时才沿用前文对象。

省略后的接口声明用于阅读，不复制到 namespace std 重新定义。多个线程路径按各角色理解，共享对象必须先建立并活到最后一次访问；替代写法各自理解，不接在已经消费结果的操作后继续执行。结果依据标准语义，类型大小、地址和耗时不能写成跨平台常量。

图注说明箭头表示分类、结构、流程还是状态；常见实现模型与语言、标准库保证分开。规则依据匹配版本公开草案、平台或工具文档，资料链接单独维护在来源清单中。

示例按用户要求只做静态语法、上下文和资料核对，不编译运行。文档链接、目录与阅读制品排版分别检查，不能将这些检查当成 C++ 执行结果。
