# 第十四章 错误处理与健壮的库接口 来源与核验

核验日期：2026-10-03。完整正文见[第十四章 错误处理与健壮的库接口](C14-errors-and-robust-library-interfaces.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核错误表示、异常安全、错误传播与库接口责任，区分可恢复业务结果、契约违背和进程级失败。C++23设施与C++20基线分别标明；代码和故障路径仅经静态审读。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

核验日期为 2026-10-03。所有文字、代码和图为原创组织；未执行异常注入、编译矩阵或运行时实验。C++20 与 C++23 内容分开标记。

- S1：WG21 N4861，重点 `[except.ctor]`、`[except.handle]`、`[except.spec]`、`[except.terminate]`、`[syserr]`、`[cassert.syn]`、`[dcl.attr.nodiscard]` 与相关容器交换条款
- S2：WG21 N4950，`[expected]`、访问器与组合操作；版本身份见 N4951 编辑报告
- S3：WG21 N2855 的异常安全讨论，作为工程术语和设计背景，不覆盖具体容器例外
- S4：GCC libstdc++ 官方异常配置说明，展示禁用异常是实现与依赖配置问题
- S5：Microsoft Learn 的跨 DLL 传递 CRT 对象风险，支持内存与运行时责任边界

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4950.pdf
[S3]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2009/n2855.html
[S4]: https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_exceptions.html
[S5]: https://learn.microsoft.com/en-us/cpp/c-runtime-library/potential-errors-passing-crt-objects-across-dll-boundaries?view=msvc-170
[S6]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html
