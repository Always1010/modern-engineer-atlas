# 第十八章 无锁结构与安全回收 来源与核验

核验日期：2026-10-03。完整正文见[第十八章 无锁结构与安全回收](C18-lock-free-structures-and-safe-reclamation.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核进展条件、线性化历史、ABA与安全回收。逻辑删除、生命结束及地址复用分开，保护与验证责任完整；人工历史和资源预算不视为并发测试或内存上界实测。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

[S2] 与 [S4] 为进展与线性化原始论文；[S3] 为 Michael–Scott 队列原始论文，历史实验仅属于原文平台，不作为本书当前性能结论。[S5]、[S7]、[S8] 支持回收机制解释。[S6]、[S9] 是标准化设计背景，[S10] 仅用于 C++26 前沿规范。工具资料 [S11]、[S12] 说明能力与证据边界。

本章未提供自称生产就绪的无锁实现，没有执行编译、压力测试、模型检查或性能实验。所有交错与预算均为教学推导；插图原创并经过实际渲染检查，图面检查不等于算法验证。

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://cs.brown.edu/~mph/Herlihy91/p124-herlihy.pdf
[S3]: https://www.cs.rochester.edu/u/scott/papers/1996_PODC_queues.pdf
[S4]: https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf
[S5]: https://research.ibm.com/publications/hazard-pointers-safe-memory-reclamation-for-lock-free-objects
[S6]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2530r3.pdf
[S7]: https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-579.pdf
[S8]: https://docs.kernel.org/RCU/whatisRCU.html
[S9]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2545r4.pdf
[S10]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5050.pdf
[S11]: https://clang.llvm.org/docs/ThreadSanitizer.html
[S12]: https://plv.mpi-sws.org/genmc/
