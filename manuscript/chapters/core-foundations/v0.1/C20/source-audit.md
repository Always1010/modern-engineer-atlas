# 第二十章 性能优化是一套实验方法 来源与核验

核验日期：2026-10-03。完整正文见[第二十章 性能优化是一套实验方法](C20-performance-optimization-as-experiment.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核统计口径、分位聚合、协调遗漏、负载模型、Roofline和火焰图的解释边界。人工数据与公式已复算，相关性不作因果证明，未运行基准或性能采样。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

排队、尾部与 Roofline 依据原始论文 [S2]、[S3]、[S9]；工具及平台说明来自相关官方文档与作者资料，核验于 2026-10-03。全部数据与 SVG 是原创教学模型。代码未编译、未执行，命令未执行；图面检查不能替代运行、统计或平台验证。

[S1]: https://github.com/HdrHistogram/HdrHistogram
[S2]: https://pubsonline.informs.org/doi/abs/10.1287/opre.9.3.383
[S3]: https://research.google/pubs/the-tail-at-scale/
[S4]: https://google.github.io/benchmark/user_guide.html
[S5]: https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm
[S6]: https://www.kernel.org/doc/html/latest/kernel-hacking/false-sharing.html
[S7]: https://docs.kernel.org/admin-guide/mm/numa_memory_policy.html
[S8]: https://llvm.org/docs/Vectorizers.html
[S9]: https://people.eecs.berkeley.edu/~kubitron/courses/cs252-S09/handouts/papers/RooflineVyNoYellow.pdf
[S10]: https://man7.org/linux/man-pages/man1/perf-stat.1.html
[S11]: https://man7.org/linux/man-pages/man1/perf-record.1.html
[S12]: https://man7.org/linux/man-pages/man1/perf-report.1.html
[S13]: https://docs.kernel.org/admin-guide/perf-security.html
[S14]: https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html

[S15]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
