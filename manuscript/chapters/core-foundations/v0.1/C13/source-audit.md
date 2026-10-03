# 第十三章 标准库容器算法与分配 来源与核验

核验日期：2026-10-03。完整正文见[第十三章 标准库容器算法与分配](C13-standard-library-and-allocation.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核迭代器与Range、vector有效期、分配器传播、PMR资源选择及值类型与视图。分配器复制与容器复制分开，资源释放不代替对象析构，非传播交换保留相等要求。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围


资料核验日期为 2026-10-03。正文、示例和插图由本项目原创组织，未转载第三方配图。公开规范、工程建议与设计背景分别列出；本版没有代码执行、诊断输出或性能测量证据。

- **S1 C++20 规范参照。** WG21 [N4861 公开工作草案](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)，重点为 `[vector.overview]`、`[vector.capacity]`、`[vector.modifiers]`、`[container.requirements.general]`（含分配器感知容器要求表）、`[allocator.traits.types]`、`[span.overview]`、`[iterator.requirements]`、`[range.view]`、`[range.adaptors]`、`[mem.poly.allocator.ctor]`、`[mem.poly.allocator.mem]`、`[mem.res.monotonic.buffer]`、`[optional]`、`[variant]`、`[string.view]` 和 `[except.spec]`。用固定条款核对保证，不以当前滚动草案的新规则回填 C++20；它也不替代正式出版文本或后续缺陷报告分析。
- **S2 版本身份。** WG21 [N4859 编辑报告](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html)，说明 N4861 与 C++20 DIS N4860 的内容关系。本章可执行形式的说明代码以 C++20 为基线；C++23 expected 仅作错误处理章节的交叉引用，旧项目需另行选择视图接口。
- **S3 工程建议。** [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rsl-vector)，关注 SL.con.2、SL.con.4 及资源管理建议。它是工程指南，不能作为特定负载的性能证据。
- **S4 设计背景。** WG21 [N2855 Rvalue References and Exception Safety](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2009/n2855.html)。用来理解移动与异常恢复的冲突，旧提案不替代 C++20 的最终接口条款。
- **S5 诊断工具。** LLVM [AddressSanitizer 文档](https://clang.llvm.org/docs/AddressSanitizer.html)。实际能力应结合工具版本、编译配置与执行覆盖核对。
- **S6 调试迭代器。** GCC libstdc++ [Using the Debug Mode](https://gcc.gnu.org/onlinedocs/libstdc++/manual/debug_mode_using.html)。尤其注意调试与非调试构建的兼容边界。

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html
[S3]: https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rsl-vector
[S4]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2009/n2855.html
[S5]: https://clang.llvm.org/docs/AddressSanitizer.html
[S6]: https://gcc.gnu.org/onlinedocs/libstdc++/manual/debug_mode_using.html
