# 使用这本手册

本书提供首次学习和按名称查阅两条路径。每章先分类，每个具体对象给定义、常用写法及结果，再展开相关机制。短代码是接口与语法摘录，不要求拼成可执行程序。

## 首次学习路径

先完成下面四个阶段。每阶段的“出口”是停下来检验理解的标准；进阶条目可在需要时回查，无须首次通读。

### 阶段一：写出并解释一个小程序

依次阅读[源文件与 main](chapters/R01-program-build.zh-CN.md#源文件与-main)、[声明与定义](chapters/R01-program-build.zh-CN.md#声明与定义)、[初始化类别](chapters/R03-initialization-deduction.zh-CN.md#初始化类别)、[算术入口](chapters/R04-expressions-conversions.zh-CN.md#运算符分类)、[if](chapters/R06-statements-functions.zh-CN.md#if-与-else)、[for](chapters/R06-statements-functions.zh-CN.md#for)、[函数调用](chapters/R06-statements-functions.zh-CN.md#函数声明定义与调用)。遇到类型疑问回查[类型与对象](chapters/R02-types-objects.zh-CN.md)。

**出口**：能指出声明、定义、初始化和赋值的区别，解释一个循环何时结束、参数和返回值如何传递。placement new、复杂推导与多文件 ODR 例外可后查。

**自检**：`int n{}; n = 7;` 哪一步建立对象，哪一步改变已有对象？答案：声明中的值初始化建立 n 并使其为 0，后一句赋值使其为 7。

### 阶段二：管理对象、借用和资源

依次阅读[指针与引用](chapters/R05-pointers-references.zh-CN.md#左值引用与右值引用)、[返回借用](chapters/R05-pointers-references.zh-CN.md#返回借用与非拥有成员)、[构造](chapters/R07-classes-lifetime.zh-CN.md#构造函数与成员初始化)、[析构](chapters/R07-classes-lifetime.zh-CN.md#析构函数)、[拷贝与移动](chapters/R08-copy-move.zh-CN.md#拷贝与移动操作分类)、[std::move](chapters/R08-copy-move.zh-CN.md#stdmove)、[RAII](chapters/R09-raii-memory.zh-CN.md#raii-资源对象)、[unique_ptr](chapters/R09-raii-memory.zh-CN.md#unique_ptr-构造与访问)、[栈展开](chapters/R11-errors-exception-safety.zh-CN.md#栈展开与构造失败)。

**出口**：能说明谁拥有资源、谁只是借用，以及正常退出和异常退出时谁负责释放。多态、共享所有权、自定义分配器及转发模板可后查。

**自检**：把 unique_ptr 移到另一个 unique_ptr 后，源拥有者和所指 int 分别处于什么状态？答案：源拥有者仍存活但为空，int 由目标拥有者保活；移动源句柄没有搬迁 int。

### 阶段三：存放和处理数据

依次阅读[string](chapters/R12-strings-views.zh-CN.md#stdstring)、[vector](chapters/R13-sequence-containers.zh-CN.md#stdvector)、[reserve 与 resize](chapters/R13-sequence-containers.zh-CN.md#reserve-与-resize)、[失效规则](chapters/R13-sequence-containers.zh-CN.md#vector-的失效与异常保证)、[半开区间](chapters/R15-iterators-ranges.zh-CN.md#半开区间与尾后位置)、[sort](chapters/R16-algorithms.zh-CN.md#stdsort-与-stdstable_sort)、[lower_bound](chapters/R16-algorithms.zh-CN.md#stdlower_boundstdupper_bound-与等价范围)、[optional](chapters/R17-utility-results.zh-CN.md#stdoptional)。按任务选读[流与文件](chapters/R34-streams-files.zh-CN.md)和[关联容器](chapters/R14-associative-adaptors.zh-CN.md)。

**出口**：能选择拥有数据的容器、检查索引和区间边界、判断修改后的借用是否有效，并满足排序和查找的前提。ranges、执行策略和随机/位工具可后查。

**自检**：vector 只有三个元素，reserve(6) 后能否读第六个槽位？答案：不能，size 仍为 3；必须先建立该位置的元素。不要执行越界代码来检验这个规则。

### 阶段四：协调线程并读取结果

依次阅读[线程](chapters/R20-threads-async.zh-CN.md)、[互斥量与临界区](chapters/R21-mutex-coordination.zh-CN.md#互斥量与临界区)、[lock_guard](chapters/R21-mutex-coordination.zh-CN.md#stdlock_guard)、[unique_lock](chapters/R21-mutex-coordination.zh-CN.md#stdunique_lock)、[条件变量](chapters/R21-mutex-coordination.zh-CN.md#stdcondition_variable)，然后阅读[数据竞争](chapters/R22-atomics-memory-order.zh-CN.md#数据竞争与-happens-before)与[原子基本操作](chapters/R22-atomics-memory-order.zh-CN.md#stdatomic)。

**出口**：能给出线程和共享对象的寿命关系，为每个共享可变状态指定同步规则，解释谓词等待为何在醒来后重新检查条件。弱内存序、无锁回收、协程调度可后查。

**自检**：条件变量收到通知是否说明队列一定非空？答案：不说明；等待者应在持锁状态下重新检查谓词，处理虚假唤醒和其他线程先消费的情况。

完成四阶段后，按任务选读时间、文件系统、进程、网络和系统机制。首次使用工程工具先查[最小工程](chapters/R30-build.zh-CN.md)与[调试会话](chapters/R31-debug.zh-CN.md)，性能调查需在有真实问题和可比较测量时进入。

## 按对象与任务查阅

已知名称时，用 [正文目录](TOC.md) 的具体条目或 [附录索引](appendices.zh-CN.md) 进入。类型条目可查声明/模板参数、初始化与接口组；语言条目可查语法和语义；工具条目可查命令、参数和结果。

| 当前任务 | 查阅入口 |
| --- | --- |
| 初始化、转换、函数调用 | 初始化 / 表达式 / 语句与函数 |
| 对象借用、转移、释放 | 指针与引用 / 拷贝移动 / RAII |
| 存放、查找、遍历和处理数据 | 字符串 / 容器 / 迭代器 / 算法 |
| 文本转换、随机数、时间与文件 | 文本 / 数值工具 / 时间 / 流 / 文件系统 |
| 线程等待、结果、互斥和调度 | 线程 / 互斥 / 原子 / 异步执行 |
| CPU、进程、内存与底层 I/O | 组成与系统领域 |
| 连接、协议与消息收发 | 协议 / socket |
| 构建失败、现场调试、资源调查 | 构建 / 调试 / 性能 |

## 阅读层级、版本与平台

- **基础操作**：当前对象的定义、正常写法、结果与必要条件。
- **机制解释**：生命周期、内部关系、时序或算法原理。
- **进阶后查**：低层操作、复杂规则、工程专题。

层级与版本分别标记。核心以 C++17 组织；C++20/23 接口在条目处说明，并需要相应标准库支持。涉及 OS 的 API 单独标平台；日常文件操作先用标准流/文件系统，系统章用于理解下层机制及特有能力。

## 代码、图与依据

局部代码说明所需头文件、已存在对象和所在上下文；声明摘要用于查公开接口，不作为重新定义标准库的代码。结果说明依据标准语义，不能把类型大小、地址或耗时写成跨平台常量。

图注说明箭头表示分类、结构、流程还是状态。常见实现模型帮助理解，不等同于语言或标准库保证。关键规则附匹配版本公开草案、平台或工具文档；不以本机执行结果代替这些依据。

示例的核对范围是标准资料、代码语法与上下文的静态复核，不包含编译运行。文档链接、目录与排版另行检查，具体范围见 [核对与重建说明](BUILD-NOTES.md)。
