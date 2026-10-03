# 前四篇完整正文与第五十五章扩展 v0.1

这是一份版本化正文里程碑，包含第一至第二十章，以及第五十五章完整扩展，共二十一章、八十四个既定主题。它不是五十八章全书终稿。全书仍按确认目录继续编写，最后统一提供完整修订版。

中文阅读编号采用“第一章”“1.1”“1.1.1”；内部Cxx仅用于稳定文件路径与元数据。第十三章从vector专题扩展为标准库与分配器完整章节，第五十五章从恢复专题扩展到任务记忆、协议及多Agent协作。原样章与旧正文版本继续保留。

## 核验范围

全部收录章节完成四主题内容审读：第一、四、九章沿用此前接受版本并改正中文编号；其余章节与扩展完成独立事实和阅读复核。来源以官方规范、原论文与实现文档为主。C++20固定N4861为主线，C++23补充用N4950，C++26前沿用N5050，滚动C++29草案不回填旧版。

示例均未编译、未执行；人工数值、推导、接口片段与实测结果明确区分。原创SVG随文保存且实际渲染检查。章节PDF审读已经覆盖对应页面，最后的小幅头文件/术语修改与全书合版仍会再次逐页复核；本目录不宣称已经完成整书PDF或EPUB验收。具体状态见[章节覆盖表](coverage-ledger.csv)与[核验说明](REVIEW.md)。

## 章节入口

- [第一章 用约束描述工程问题](C01/C01-engineering-constraints.zh-CN.md)
- [第二章 数据结构是怎样进入系统的](C02/C02-data-structures.zh-CN.md)
- [第三章 从算法选择到可解释的工程取舍](C03/C03-algorithm-tradeoffs.zh-CN.md)
- [第四章 数据与协议的共同语言](C04/C04-data-and-protocols.zh-CN.md)
- [第五章 处理器与内存层次](C05/C05-processors-and-memory.zh-CN.md)
- [第六章 地址空间与虚拟内存](C06/C06-address-spaces-and-virtual-memory.zh-CN.md)
- [第七章 操作系统提供的执行与资源模型](C07/C07-operating-system-execution-and-resources.zh-CN.md)
- [第八章 编译链接装载与二进制边界](C08/C08-compilation-linking-loading-and-abi.zh-CN.md)
- [第九章 对象生命周期与资源所有权](C09/C09-object-lifetime-and-ownership.zh-CN.md)
- [第十章 值语义与泛型参数传递](C10/C10-value-semantics-and-forwarding.zh-CN.md)
- [第十一章 对象模型与可观察边界](C11/C11-object-model-and-observable-boundaries.zh-CN.md)
- [第十二章 泛型编程与编译期表达](C12/C12-generic-programming-and-constant-evaluation.zh-CN.md)
- [第十三章 标准库容器算法与分配](C13/C13-standard-library-and-allocation.zh-CN.md)
- [第十四章 错误处理与健壮的库接口](C14/C14-errors-and-robust-library-interfaces.zh-CN.md)
- [第十五章 标准演进与项目迁移](C15/C15-standard-evolution-and-project-migration.zh-CN.md)
- [第十六章 同步原语与线程组织](C16/C16-synchronization-and-thread-organization.zh-CN.md)
- [第十七章 从语言内存模型理解原子操作](C17/C17-language-memory-model-and-atomics.zh-CN.md)
- [第十八章 无锁结构与安全回收](C18/C18-lock-free-structures-and-safe-reclamation.zh-CN.md)
- [第十九章 异步 IO 协程与调度](C19/C19-asynchronous-io-coroutines-and-scheduling.zh-CN.md)
- [第二十章 性能优化是一套实验方法](C20/C20-performance-optimization-as-experiment.zh-CN.md)
- [第五十五章 可恢复的 Agent 与工具协议](C55/C55-agent-recovery.zh-CN.md)

## 文件与权利

Markdown为正文规范原稿；assets保留可编辑图源及来源说明。既有项目许可证与发布方式未变更，本里程碑不新增许可、正式发行或平台兼容承诺。
