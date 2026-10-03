# 第十二章 泛型编程与编译期表达 来源与核验

核验日期：2026-10-03。完整正文见[第十二章 泛型编程与编译期表达](C12-generic-programming-and-constant-evaluation.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核推导、替换、实例化、约束满足与建模、常量求值及泛型调用方式。反例和修正版明确区分，标准版本限制不由滚动草案或实现诊断替代。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期为 2026-10-03。正文、示例与插图均为原创组织，未编译或执行任何示例，未收集构建时间数据。

- S1：WG21 N4861，重点为 `[temp.param]`、`[temp.deduct.call]`、`[temp.deduct.type]`、`[temp.class.spec]`、`[temp.inst]`、`[temp.explicit]`、`[temp.dep]`、`[temp.constr]`、`[expr.prim.req]`、`[res.on.requirements]`、`[concepts.equality]`、`[dcl.constexpr]`、`[dcl.constinit]`、`[expr.const]`、`[stmt.if]`、`[meta]`
- S2：Clang Compiler User's Manual，构建与诊断观测能力；具体配置需对应选定版本核实
- S3：GCC C++ Dialect Options，模板深度、常量求值和诊断相关选项；不作为项目当前构建结果

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://clang.llvm.org/docs/UsersManual.html
[S3]: https://gcc.gnu.org/onlinedocs/gcc/C_002b_002b-Dialect-Options.html
