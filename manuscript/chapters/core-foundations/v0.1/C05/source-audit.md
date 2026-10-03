# 第五章 处理器与内存层次 来源与核验

核验日期：2026-10-03。完整正文见[第五章 处理器与内存层次](C05-processors-and-memory.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

区分指令退休、跨核可见性与语言数据竞争，复核缓存行、伪共享、NUMA 和性能计数的适用边界。具体微架构参数和事件名称不能推广为所有处理器的固定行为。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

资料核验日为 2026-10-03。本章以通用处理器的稳定原理为主，用 Intel、LLVM 与 Linux 官方资料核对实现边界。厂商页面、内核文档和事件目录会持续演进，使用时应核对目标型号与版本。代码未编译、未执行；图与数字例子是解释性模型，没有处理器跑分、计数器采集或 NUMA 实验结果。

- [S1 Intel 处理器架构与优化手册入口](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)：指令集与微架构资料的官方入口。核验时页面更新于 2026-09-21；不同处理器的具体组织须查对应手册。
- [S2 Intel 对推测执行术语的说明](https://www.intel.com/content/www/us/en/developer/articles/technical/software-security-guidance/best-practices/refined-speculative-execution-terminology.html)：区分预测、推测、退休与微架构效应，避免把回滚解释成没有任何痕迹。
- [S3 LLVM 自动向量化文档](https://llvm.org/docs/Vectorizers.html)：合法性、别名检查、成本模型与浮点归约限制。滚动文档不是所有已发布编译器的能力承诺。
- [S4 Arm 内存访问排序介绍](https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/memory-access-ordering---an-introduction)：用于区分一致性、排序和推测访问的作用，不能代替具体 Arm 架构手册。
- [S5 Linux 内核伪共享说明](https://docs.kernel.org/kernel-hacking/false-sharing.html)：共享行的判定、布局代价和诊断工具；本文没有执行相应工具。
- [S6 Linux 内核 NUMA 概念](https://docs.kernel.org/mm/numa.html)：节点、距离和调度背景；节点组织以实际平台为准。
- [S7 Linux NUMA 内存策略](https://docs.kernel.org/admin-guide/mm/numa_memory_policy.html)：策略作用域、默认分配与允许节点的关系，不把首次触及简化为永久分配承诺。
- [S8 Little 的排队关系原论文](https://doi.org/10.1287/opre.9.3.383)：用于说明稳态平均在途数量、到达率与平均等待的关系；本文的字节与时间演算是自行构造的简化示例。
- [S9 Linux perf_event_open 接口](https://man7.org/linux/man-pages/man2/perf_event_open.2.html)：计数、采样、多路复用、运行时间与权限限制，工具能力依内核和硬件而异。
- [S10 Intel 性能事件目录](https://perfmon-events.intel.com/)与[官方事件资料仓库](https://github.com/intel/perfmon)：按处理器型号查询事件定义和限制，不跨型号套用原始编码。
- [S11 Intel 自顶向下微架构分析](https://www.intel.com/content/www/us/en/docs/vtune-profiler/cookbook/2024-0/top-down-microarchitecture-analysis-method.html)：固定 2024.0 工具文档作为方法示例，不宣称当前所有型号和工具都使用同一公式。
- [S12 Intel 早期微架构优化参考手册卷二](https://cdrdv2-public.intel.com/821614/356477-Optimization-Reference-Manual-V2-002.pdf)：固定文档 356477-002，2.1.2、2.1.4.1 与 3.1 节提供顺序退休、依赖跟踪和退休后写入缓存的具体实例；不把旧型号的参数套到其他处理器。
- [S13 WG21 N4861 C++20 公开工作草案](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)：`[intro.races]` 核对数据竞争与原子操作边界；机器运行现象不能代替语言规则。

[S1]: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
[S2]: https://www.intel.com/content/www/us/en/developer/articles/technical/software-security-guidance/best-practices/refined-speculative-execution-terminology.html
[S3]: https://llvm.org/docs/Vectorizers.html
[S4]: https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/memory-access-ordering---an-introduction
[S5]: https://docs.kernel.org/kernel-hacking/false-sharing.html
[S6]: https://docs.kernel.org/mm/numa.html
[S7]: https://docs.kernel.org/admin-guide/mm/numa_memory_policy.html
[S8]: https://doi.org/10.1287/opre.9.3.383
[S9]: https://man7.org/linux/man-pages/man2/perf_event_open.2.html
[S10]: https://perfmon-events.intel.com/
[S11]: https://www.intel.com/content/www/us/en/docs/vtune-profiler/cookbook/2024-0/top-down-microarchitecture-analysis-method.html
[S12]: https://cdrdv2-public.intel.com/821614/356477-Optimization-Reference-Manual-V2-002.pdf
[S13]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
