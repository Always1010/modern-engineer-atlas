# 第一批正文来源复核

核验日期：2026-10-03。各章的完整来源链接与适用边界保留在章末；来源标记只在所属章内编号，不跨章合并 S1 等标识。

## 规范与项目资料

- C01：15 个章内来源条目。MIT 与 Cornell 支持数学和渐近分析入口；NIST 支持统计定义及实验设计；Prometheus 支持分位数聚合边界；LAPACK 区分问题条件性和后向稳定；NumPy isclose 支持所用有限值比较式。NumPy 核验页显示 v2.5；滚动项目页不代表锁定依赖
- C04：17 个章内来源条目，另链接 N4859 编辑报告。C++ 用 N4861 固定参照；P1236R1、P0907R4 只作标准化背景。Unicode 使用 17.0.0 及其固定附录，RFC 3629、3339、8259、8949 分别支持编码、时间和格式边界。Protobuf 与 IANA 是核验时维护者资料，未锁定部署版本
- C09：4 个章内来源条目。N4861 支持对象与库接口规则；N4859 说明固定草案身份；Core Guidelines 是工程建议；LLVM AddressSanitizer 文档支持诊断用途及覆盖限制

## 二次核验重点

| 主题 | 一手定位 | 审读结论 |
|---|---|---|
| 整数表示和转换 | [N4861](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf) `[basic.fundamental]`、`[conv.integral]`、`[conv.fpint]` | C++20 补码不赋予有符号溢出回绕保证；整数同余转换与浮点转整数规则分开 |
| 对象生命与退出 | N4861 `[basic.life]`、`[except.ctor]`、`[except.terminate]` | 类通常在析构调用开始时结束生命，构造析构期有专门访问规则；未捕获异常不普遍保证完整展开 |
| 固定草案身份 | [N4859](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html) New papers | N4861 封面面向 C++23，但内容与 C++20 DIS N4860 除报告列明项目外一致；不能把封面与内容基线混同 |
| 单调时钟 | N4861 `[time.clock.steady]` | 时间点不随物理时间前进而倒退，且稳定推进；跨机器起点和休眠语义不可由此推断 |
| 字素边界 | [Unicode UAX 29](https://www.unicode.org/reports/tr29/tr29-47.html) §3 | 字素簇为默认文本分段，不恒等于所有界面的用户感知字符；图中四字符是限定例子 |
| 未知字段保留 | [Protobuf proto3](https://protobuf.dev/programming-guides/proto3/#unknowns) | 二进制通常保留未知字段；JSON 转换和按已知字段重建可能丢失 |
| 序列化稳定性 | [Proto Serialization Is Not Canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/) | 确定性序列化不是跨版本和跨语言规范编码 |
| 分位数聚合 | [Prometheus Histograms and summaries](https://prometheus.io/docs/practices/histograms/) | 均值可按总量合并，局部分位数一般不能直接平均为整体分位数 |
| 均值区间 | [NIST Confidence Limits for the Mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm) | t 区间的样本条件、标准误和重复抽样覆盖解释保持明确 |
| 数值接受标准 | [NumPy isclose](https://numpy.org/doc/stable/reference/generated/numpy.isclose.html) Notes | 使用绝对容差加参考尺度上的相对容差；说明非对称性与默认值限制 |
| 条件性与稳定性 | [LAPACK Standard Error Analysis](https://www.netlib.org/lapack/lug/node78.html) | 后向稳定不消除病态问题对输入误差的放大 |

## 原创构造与执行边界

- C01 内存账目合计 232 MiB，超出设定的 192 MiB；128 MiB 经 1 GiB/s 共用带宽的模型下界为 125 ms。正文显式指出其与 75 ms 读写预算的冲突
- C01 两组 100 个构造请求均值均为 40 ms；甲按约定名次法的 p95/p99 为 20/420 ms，乙为 40/40 ms。零失败的模型上界由独立固定概率假设下公式求得；不是本项目可靠性测试
- C04 文本 Aé中😀 对应 UTF-8 十字节、UTF-16 五码元、四码点；预组合与分解的 é 示例对应两种字节序列。构造帧头为八字节，长度只含帧体，64 KiB 是示例预算
- C09 optional 时间线、共享环和退出图均为关系示意；不规定 ABI、布局或耗时。关闭路径的文字推演不等于已验证后台任务已停止

正文、说明代码及图的组织为原创；没有复制第三方图或生产测量数据。C04-B 的 emoji 以 DejaVu Sans 字形轮廓固定呈现，仅为字体渲染稳定性，不引入第三方图像素材或项目级许可证变更。
