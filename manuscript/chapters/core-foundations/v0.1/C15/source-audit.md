# 第十五章 标准演进与项目迁移 来源与核验

核验日期：2026-10-03。完整正文见[第十五章 标准演进与项目迁移](C15-standard-evolution-and-project-migration.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

核对已出版标准、固定工作草案与后续草案的身份，以及编译器、标准库和构建工具的支持层次。滚动支持表只反映核验日资料，不能代替指定平台的实际构建与迁移验证。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

资料核验日期为 2026-10-03。下列官方状态页面会继续更新，表中记录仅代表当日可见资料；没有把状态表当作本项目测试结果。正文、说明代码和插图为原创组织。

- S1：ISO/IEC14882:2024 官方状态页，已出版版与下一版 DIS 状态
- S2：WG21 N4861，C++20 固定公开规范参照；前文资源、泛型与库机制按此基线交叉核对
- S3：WG21 N4950，C++23 固定最终工作草案参照；`[expected]`、`[mdspan]`、`[print]`、`[coro.generator]`、库模块与特性宏
- S4：N5050 固定 C++26 草案，重点 `[meta.reflection]`、`[basic.contract]`、`[exec]`、`[simd]`、`[inplace.vector]`、`[saferecl]`、`[depr.atomics.order]`
- S5：N5055 编辑报告，标明 N5054 已属 C++29，说明工作草案会议批准与编辑版本关系
- S6：WG21 N4659，C++17 固定草案，用于值类型、结构化绑定、复制消除、filesystem与执行策略
- S7—S11：GCC、Clang、Microsoft、libc++ 官方语言与库支持记录；libstdc++ 另见其官方状态页 [S13]
- S12：CMake 官方 C++ modules 手册，具体工具链、生成器和标准库模块条件；应对照项目锁定的 CMake 版本阅读
- S14、S15：N5051 与 N4951 编辑报告，分别核验 C++26 与 C++23 固定工作草案身份

[S1]: https://www.iso.org/standard/83626.html
[S2]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S3]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4950.pdf
[S4]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5050.pdf
[S5]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5055.html
[S6]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/n4659.pdf
[S7]: https://gcc.gnu.org/projects/cxx-status.html
[S8]: https://clang.llvm.org/cxx_status.html
[S9]: https://learn.microsoft.com/en-us/cpp/overview/visual-cpp-language-conformance?view=msvc-170
[S10]: https://libcxx.llvm.org/Status/Cxx23.html
[S11]: https://libcxx.llvm.org/Status/Cxx26.html
[S12]: https://cmake.org/cmake/help/latest/manual/cmake-cxxmodules.7.html
[S13]: https://gcc.gnu.org/onlinedocs/libstdc++/manual/status.html
[S14]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5051.html
[S15]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html
