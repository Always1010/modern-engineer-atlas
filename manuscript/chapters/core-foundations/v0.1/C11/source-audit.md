# 第十一章 对象模型与可观察边界 来源与核验

核验日期：2026-10-03。完整正文见[第十一章 对象模型与可观察边界](C11-object-model-and-observable-boundaries.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核对象布局、构造析构、虚调用、类型转换及别名访问。标准布局、具体ABI布局与二进制兼容分开；尺寸示意、智能指针和观察接口均保留使用前提。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期为 2026-10-03。正文、示例和 SVG 为原创教学表达；没有执行 C++、记录对象地址或测量虚调用开销。所有尺寸图都明确标出假设。

- S1：WG21 N4861，重点为 `[basic.types]`、`[basic.align]`、`[class.prop]`、`[class.mem]`、`[class.virtual]`、`[class.cdtor]`、`[class.base.init]`、`[expr.dynamic.cast]`、`[expr.typeid]`、`[expr.delete]`、`[basic.lval]`、`[bit.cast]`、`[ptr.launder]`
- S2：Itanium C++ ABI 官方文档，数据布局、虚表布局与成员指针章节；只作为采用该 ABI 的实现实例
- S3：Microsoft Learn 的 MSVC 对齐说明，用于实现扩展与目标布局边界，不替代标准 alignas 的规范
- S4：C++ Core Guidelines C.35、C.67 等，提供多态析构与防止切片的工程建议
- S5：Clang UndefinedBehaviorSanitizer 官方文档，说明检测覆盖与配置；本章没有实际运行检测器
- S6：Microsoft Learn 的 MSVC 跨版本二进制兼容说明，用于链接器、运行库与 LTO 的实现边界

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://itanium-cxx-abi.github.io/cxx-abi/abi.html
[S3]: https://learn.microsoft.com/en-us/cpp/cpp/align-cpp?view=msvc-170
[S4]: https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines
[S5]: https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html

[S6]: https://learn.microsoft.com/en-us/cpp/porting/binary-compat-2015-2017?view=msvc-170
