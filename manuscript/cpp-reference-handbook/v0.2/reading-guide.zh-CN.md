# 使用这本手册

本书提供首次学习和按名称查阅两条路径。每章先分类，每个具体对象给定义、常用写法及结果，再展开相关机制。短代码是接口与语法摘录，不要求拼成可执行程序。

## 首次学习路径

1. 从 [程序结构与编译](chapters/R01-program-build.zh-CN.md) 认识函数、main 和多文件构建，再读 [类型](chapters/R02-types-objects.zh-CN.md)、[初始化](chapters/R03-initialization-deduction.zh-CN.md)、[表达式](chapters/R04-expressions-conversions.zh-CN.md)。
2. 用 [语句与函数](chapters/R06-statements-functions.zh-CN.md) 写分支、循环和调用；结合 [指针与引用](chapters/R05-pointers-references.zh-CN.md) 理解参数与借用。
3. 阅读 [类](chapters/R07-classes-lifetime.zh-CN.md)、[拷贝与移动](chapters/R08-copy-move.zh-CN.md)、[RAII](chapters/R09-raii-memory.zh-CN.md)，建立对象与资源生命周期关系。
4. 查 [字符串](chapters/R12-strings-views.zh-CN.md)、[顺序容器](chapters/R13-sequence-containers.zh-CN.md)、[关联容器](chapters/R14-associative-adaptors.zh-CN.md)，再结合 [迭代器](chapters/R15-iterators-ranges.zh-CN.md) 与 [算法](chapters/R16-algorithms.zh-CN.md) 完成数据操作。
5. 阅读 [错误处理](chapters/R11-errors-exception-safety.zh-CN.md) 及 [结果类型](chapters/R17-utility-results.zh-CN.md)，需要泛型时再展开 [模板](chapters/R10-templates-compile-time.zh-CN.md)。
6. 日常操作直接查 [时间库](chapters/R19-time-files.zh-CN.md)、[流与文件](chapters/R34-streams-files.zh-CN.md)、[文件系统](chapters/R35-filesystem.zh-CN.md)；并发从 [线程](chapters/R20-threads-async.zh-CN.md) 与 [互斥](chapters/R21-mutex-coordination.zh-CN.md) 进入。
7. 按需要阅读系统、网络及构建调试。首次使用工具先查 [最小工程](chapters/R30-build.zh-CN.md) 与 [调试会话](chapters/R31-debug.zh-CN.md)，实现机制和生产调查可后查。

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

本轮按用户要求仅静态核对代码语法和上下文，不编译运行示例。文档链接、目录与排版另行检查，具体范围见 [核对与重建说明](BUILD-NOTES.md)。
