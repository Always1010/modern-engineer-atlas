# 第二十一章 构建依赖与可复现交付 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

以下官方资料于 2026-10-03 打开核验。一般工程推理与示例为原创组织，不声称已完成编译、交叉运行或可复现性实验。滚动手册用于核对机制，CMake Modules 特别引用固定 3.30 文档作为支持受版本约束的例证。

- S1：CMake `cmake-buildsystem`，目标属性、使用要求和依赖传播
- S2：CMake `cmake-presets`，共享与个人预设及 schema 约束
- S3：CMake `cmake-toolchains`，工具链、sysroot 与交叉编译查找
- S4：Ninja 官方手册，构建图和增量执行机制
- S5：CMake 3.30 C++ Modules 文档，扫描、生成器与已知限制
- S6：GCC Warning Options，警告集合与错误策略
- S7：GCC Optimize Options，优化级别与选项语义
- S8：Clang Users Manual，驱动、目标和选项背景
- S9：Microsoft MSVC Compiler Options，编译器配置入口
- S10：Conan 2 Lockfiles，依赖图锁定的范围
- S11：Conan 2 Binary model，设置、选项与包二进制身份
- S12：Microsoft vcpkg Manifest mode，清单工作方式
- S13：Microsoft vcpkg Versioning reference，baseline 与版本选择
- S14：Microsoft C++ binary compatibility，受条件限制的工具集兼容
- S15：Reproducible Builds Definitions，可复现构建的定义
- S16：Reproducible Builds SOURCE_DATE_EPOCH，受工具支持约束的时间规范

[S1]: https://cmake.org/cmake/help/latest/manual/cmake-buildsystem.7.html
[S2]: https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html
[S3]: https://cmake.org/cmake/help/latest/manual/cmake-toolchains.7.html
[S4]: https://ninja-build.org/manual.html
[S5]: https://cmake.org/cmake/help/v3.30/manual/cmake-cxxmodules.7.html
[S6]: https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html
[S7]: https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html
[S8]: https://clang.llvm.org/docs/UsersManual.html
[S9]: https://learn.microsoft.com/en-us/cpp/build/reference/compiler-options?view=msvc-170
[S10]: https://docs.conan.io/2/tutorial/versioning/lockfiles.html
[S11]: https://docs.conan.io/2/reference/binary_model.html
[S12]: https://learn.microsoft.com/en-us/vcpkg/concepts/manifest-mode
[S13]: https://learn.microsoft.com/en-us/vcpkg/users/versioning
[S14]: https://learn.microsoft.com/en-us/cpp/porting/binary-compat-2015-2017?view=msvc-170
[S15]: https://reproducible-builds.org/docs/definition/
[S16]: https://reproducible-builds.org/docs/source-date-epoch/
