# 第三章 从算法选择到可解释的工程取舍 来源与核验

核验日期：2026-10-03。完整正文见[第三章 从算法选择到可解释的工程取舍](C03-algorithm-tradeoffs.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核二分单调条件、最短路径的边权前提、动态规划依赖、贪心交换与缓存准入。人工轨迹和复杂度推理明确输入条件，不等同于实际性能测量。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期：2026-10-03。C++ 以 C++20 为基线，使用固定公开草案 N4861。课程与作者教材用于核对经典性质；Redis 与 TinyLFU 只支持各自实现或论文的说明，不能推广为标准库保证。本章所有任务、图、访问序列、数值表和 SVG 都是原创教学构造。C++ 示例未编译、未执行；没有运行性能基准、缓存回放或图算法测试。

- **S1 C++20 算法契约。** [WG21 N4861][S1]，重点 `[alg.sorting]`、`[sort]`、`[stable.sort]`、`[alg.binary.search]`、`[lower.bound]`、`[alg.nth.element]`；浮点类型和比较另参见 `[basic.fundamental]` 与 `[expr.rel]`。固定版本身份参见 [N4859 编辑报告](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html)
- **S2 归并排序。** [Sedgewick 与 Wayne 的 Mergesort][S2]。核对合并、复杂度与稳定性机制
- **S3 快速排序。** [Quicksort][S3]。核对划分、随机化分析与重复键三路划分；未使用其 Java 实现
- **S4 DFS 与 BFS。** [Undirected Graphs][S4]。核对可达性、BFS 最少边数和邻接遍历；本章没有复制课件图
- **S5 最短路。** [Shortest Paths][S5]。核对松弛、非负权 Dijkstra、DAG 次序与负环；复杂度按本章明确的数据结构分别说明
- **S6 有向图与拓扑。** [Directed Graphs][S6]。核对 DAG、拓扑次序和强连通分量；就绪调度与时长例子为本章构造
- **S7 贪心证明。** [Jeff Erickson Algorithms 第四章 Greedy Algorithms][S7]。用于核对交换论证的方法；本章使用自己的任务数值和反例
- **S8 动态规划。** [Jeff Erickson Algorithms 第三章 Dynamic Programming][S8]。用于核对子问题、记忆化和状态依赖；任务价值表与状态扩展讨论为原创说明
- **S9 递归与分治。** [Jeff Erickson Algorithms 第一章 Recursion][S9]。核对递归成本分析与分治原则
- **S10 字符串匹配。** [Substring Search][S10]。核对 KMP 的不回退文本性质和滚动哈希的碰撞边界；前缀函数算例为原创
- **S11 实际缓存淘汰。** [Redis Key eviction][S11]，核验时可见维护者文档。只引用采样 LRU 和带衰减概率 LFU 的设计，不声称锁定全部版本或配置
- **S12 准入与频率摘要。** [Einziger、Friedman、Manes 的 TinyLFU 论文][S12]。用于区分准入决策与已有条目的淘汰决策，不声称本文实现了该算法

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://algs4.cs.princeton.edu/22mergesort/
[S3]: https://algs4.cs.princeton.edu/23quicksort/
[S4]: https://algs4.cs.princeton.edu/41graph/
[S5]: https://algs4.cs.princeton.edu/44sp/
[S6]: https://algs4.cs.princeton.edu/42digraph/
[S7]: https://jeffe.cs.illinois.edu/teaching/algorithms/book/04-greedy.pdf
[S8]: https://jeffe.cs.illinois.edu/teaching/algorithms/book/03-dynprog.pdf
[S9]: https://jeffe.cs.illinois.edu/teaching/algorithms/book/01-recursion.pdf
[S10]: https://algs4.cs.princeton.edu/53substring/
[S11]: https://redis.io/docs/latest/develop/reference/eviction/
[S12]: https://arxiv.org/abs/1512.00727
