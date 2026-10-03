# 第十章 值语义与泛型参数传递 来源与核验

核验日期：2026-10-03。完整正文见[第十章 值语义与泛型参数传递](C10-value-semantics-and-forwarding.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核默认与显式删除的移动操作、临时对象的生命延长例外、转发推导、C++20隐式移动及返回值优化。容器异常保证保留复制插入和分配器条件，C++23变化另行标明。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期为 2026-10-03。章节叙述、示例与图由本项目原创组织。规范保证依据固定 C++20 草案，工程建议与设计历史单独标识；本章没有编译、执行或基准测试证据。

- S1：WG21 N4861，重点条款 `[class.copy.ctor]`、`[class.copy.assign]`、`[class.copy.elision]`、`[basic.lval]`、`[conv.rval]`、`[class.temporary]`、`[dcl.ref]`、`[temp.deduct.call]`、`[forward]`、`[lib.types.movedfrom]`、`[except.spec]`、`[vector.modifiers]`
- S2：WG21 N4859 编辑报告，用来核对 N4861 与 C++20 DIS 文本的关系；公开草案不替代正式出版文本与具体缺陷报告分析
- S3：C++ Core Guidelines，C.20、C.21、C.64、C.66 与 F.16—F.19；这些是设计建议，不是语言强制规则或性能测量
- S4：WG21 N2855，解释右值引用与异常安全的设计问题；旧提案用于背景，不替代 C++20 最终条款
- S5：WG21 P2266R3，说明 C++23 简化隐式移动所改变的规则，尤其是取消左值回退；本章 C++20 判断仍使用 N4861

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html
[S3]: https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines
[S4]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2009/n2855.html
[S5]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2022/p2266r3.html
