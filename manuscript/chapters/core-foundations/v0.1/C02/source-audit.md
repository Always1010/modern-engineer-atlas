# 第二章 数据结构是怎样进入系统的 来源与核验

核验日期：2026-10-03。完整正文见[第二章 数据结构是怎样进入系统的](C02-data-structures.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核连续与分段存储、哈希装载、Bloom 近似误报、树与索引访问成本；环形缓冲的状态转换和容量算例属于静态推导。具体产品页面格式、可见性及迭代器规则保留各自条件。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期：2026-10-03。C++ 基线为 C++20；规范参照使用固定公开草案 N4861，其与 C++20 DIS 的内容关系参见 [N4859 编辑报告](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html)。课程网站用于核对经典结构性质，产品文档只支持相应产品的说明，不代表所有实现。全文布局、数字算例、容量策略、示例代码和插图为原创教学设计；没有执行 C++ 编译、运行、性能测量或并发测试。

- **S1 C++ 容器契约。** [WG21 N4861][S1]，重点 `[vector.overview]`、`[vector.capacity]`、`[deque.overview]`、`[unord.req]`。用于连续性、摊还增长和标准无序容器失效规则；不据此指定具体库的内部布局
- **S2 哈希表冲突处理。** [Sedgewick 与 Wayne 的 Hash Tables][S2]。核对链地址、开放寻址与装载因子的含义；本章不采用其中 Java 示例作为 C++ 代码
- **S3 特定紧凑哈希实现。** [Abseil Swiss Tables Design Notes][S3]。仅用于元数据筛选的实现实例
- **S4 Bloom Filter。** [Broder 与 Mitzenmacher 的作者公开论文][S4] §2。核对近似成员判断、概率模型和参数关系；本文公式明确标为近似，算例为自拟
- **S5 平衡搜索树。** [Balanced Search Trees][S5]。核对通过平衡约束限制树高和旋转保留有序关系
- **S6 堆与优先队列。** [Priority Queues][S6]。核对堆序、上浮下沉与线性建堆
- **S7 Trie。** [Tries][S7]。核对按符号路径查找与前缀查询；编码选择由本章另作约束
- **S8 并查集。** [Case Study Union Find][S8]。核对加权合并、路径压缩及摊还界的适用范围
- **S9 图表示。** [Undirected Graphs][S9]。核对邻接表与邻接矩阵的基本成本；压缩数组算例为原创
- **S10 B+ 树。** [CMU 15-445/645 2025 B+Tree 项目说明][S10]。核对内部页面导航、叶页条目、分裂与叶层迭代的责任区分；未运行课程代码
- **S11 SQLite 页面格式。** [Database File Format][S11] §1.6。只用于说明产品页面有精确定义，不推广为所有 B+ 树格式
- **S12 PostgreSQL B-tree。** [PostgreSQL 18 B-Tree Indexes][S12]。用于说明实际索引还包含维护和版本相关机制
- **S13 跳表。** [William Pugh A Skip List Cookbook][S13]，UMIACS–TR–89–72.1。作者技术报告，由马里兰大学存储库提供
- **S14 覆盖索引与可见性。** [PostgreSQL 18 Index-Only Scans and Covering Indexes][S14]。仅支持该产品的可见性映射边界

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://algs4.cs.princeton.edu/34hash/
[S3]: https://abseil.io/about/design/swisstables
[S4]: https://www.eecs.harvard.edu/~michaelm/NEWWORK/postscripts/BloomFilterSurvey.pdf
[S5]: https://algs4.cs.princeton.edu/33balanced/
[S6]: https://algs4.cs.princeton.edu/24pq/
[S7]: https://algs4.cs.princeton.edu/52trie/
[S8]: https://algs4.cs.princeton.edu/15uf/
[S9]: https://algs4.cs.princeton.edu/41graph/
[S10]: https://15445.courses.cs.cmu.edu/fall2025/project2/
[S11]: https://www.sqlite.org/fileformat.html
[S12]: https://www.postgresql.org/docs/18/btree.html
[S13]: https://api.drum.lib.umd.edu/server/api/core/bitstreams/17176ef8-8330-4a6c-8b75-4cd18c570bec/content
[S14]: https://www.postgresql.org/docs/18/indexes-index-only-scans.html
