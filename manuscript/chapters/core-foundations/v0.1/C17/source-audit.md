# 第十七章 从语言内存模型理解原子操作 来源与核验

核验日期：2026-10-03。完整正文见[第十七章 从语言内存模型理解原子操作](C17-language-memory-model-and-atomics.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核C++20释放序列、CAS失败序、atomic_ref访问要求、原子等待及顺序一致性边界。事件关系经静态推导；未进行弱序模型检查，不以硬件观察替代语言规则。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

N4861 的 `[intro.races]`、`[atomics.order]`、`[atomics.types.operations]`、`[atomics.wait]`、`[atomics.fences]` 是本章 C++20 规则基线。释放序列与 SC 调整分别参考设计提案 [S2]、[S3]，不把提案动机代替正式规则。C++26 consume 说明仅使用 [S4] 与固定 N5050 [S5]。内核资料 [S6] 只支持分层边界说明。

所有事件图、CAS 计数与 litmus 都是作者教学构造。代码未编译、未执行；不存在本章实测硬件结果。图像渲染检查验证排版，不能验证语言模型证明或无锁算法的生产适用性。

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0982r1.html
[S3]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0668r5.html
[S4]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2025/p3475r2.pdf
[S5]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5050.pdf
[S6]: https://docs.kernel.org/core-api/wrappers/memory-barriers.html
