# 第八章 编译链接装载与二进制边界 来源与核验

核验日期：2026-10-03。完整正文见[第八章 编译链接装载与二进制边界](C08-compilation-linking-loading-and-abi.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核翻译、归档链接、动态装载、节与段以及跨语言接口条件。C++语言保证、对象文件格式和具体ABI分别说明；接口声明不视为已运行的库实现。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

以下一手资料核验于 2026-10-03。C++ 语言讨论采用 C++20 基线；公开工作草案供核查，正式标准为规范依据。在线 GCC、LLVM、Microsoft 和 ABI 文档可能继续演进，具体选项与兼容范围应重新对应实际工具版本。

- [S1] GCC manual，[Overall Options](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
- [S2] Clang documentation，[Assembling a Complete Toolchain](https://clang.llvm.org/docs/Toolchain.html)
- [S3] GNU C Preprocessor manual，[The C Preprocessor](https://gcc.gnu.org/onlinedocs/cpp/)
- [S4] LLVM documentation，[LLVM Language Reference Manual](https://llvm.org/docs/LangRef.html)
- [S5] GNU Binutils，[Using as](https://sourceware.org/binutils/docs/as/)
- [S6] System V gABI，[ELF Object File Format](https://gabi.xinuos.com/elf/)
- [S7] System V gABI，[Symbol Table](https://gabi.xinuos.com/elf/05-symtab.html)
- [S8] System V gABI，[Relocation](https://gabi.xinuos.com/elf/06-reloc.html)
- [S9] ABI 维护者文档，[Itanium C++ ABI](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [S10] Microsoft Learn，[Decorated names](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)
- [S11] ISO C++ 工作草案 N4861，[basic.def.odr、dcl.inline、dcl.link 等条款](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)
- [S12] System V gABI，[Sections](https://gabi.xinuos.com/elf/03-sheader.html)
- [S13] GNU linker manual，[Options](https://sourceware.org/binutils/docs/ld/Options.html)
- [S14] GCC manual，[Code Gen Options](https://gcc.gnu.org/onlinedocs/gcc/Code-Gen-Options.html)
- [S15] GCC manual，[Optimize Options 与 LTO](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)
- [S16] Clang documentation，[ThinLTO](https://clang.llvm.org/docs/ThinLTO.html)
- [S17] GNU Binutils，[nm](https://sourceware.org/binutils/docs/binutils/nm.html)
- [S18] GNU Binutils，[readelf](https://sourceware.org/binutils/docs/binutils/readelf.html)
- [S19] GNU Binutils，[objdump](https://sourceware.org/binutils/docs/binutils/objdump.html)
- [S20] System V gABI，[Program Loading](https://gabi.xinuos.com/elf/07-pheader.html)
- [S21] System V gABI，[Dynamic Linking](https://gabi.xinuos.com/elf/08-dynamic.html)
- [S22] Linux man-pages，[ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html)
- [S23] Microsoft Learn，[PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [S24] Microsoft Learn，[Dynamic-link library search order](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order)
- [S25] Linux man-pages，[dlopen(3)](https://man7.org/linux/man-pages/man3/dlopen.3.html)
- [S26] Linux man-pages，[dlsym(3)](https://man7.org/linux/man-pages/man3/dlsym.3.html)
- [S27] GCC manual，[Debugging Options](https://gcc.gnu.org/onlinedocs/gcc/Debugging-Options.html)
- [S28] DWARF 标准维护者，[DWARF Version 5](https://dwarfstd.org/dwarf5std.html)
- [S29] GDB manual，[Separate Debug Files](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Separate-Debug-Files.html)
- [S30] Microsoft Learn，[/PDB Use Program Database](https://learn.microsoft.com/en-us/cpp/build/reference/pdb-use-program-database?view=msvc-170)
- [S31] Linux man-pages，[ldd(1) 及不可信输入警告](https://man7.org/linux/man-pages/man1/ldd.1.html)
- [S32] x86-64 psABI 维护仓库，[Low Level System Information](https://gitlab.com/x86-psABIs/x86-64-ABI/-/raw/master/x86-64-ABI/low-level-sys-info.tex)。参数传递与栈规则以规范正文为准
- [S33] Microsoft Learn，[x64 Calling Convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170)
- [S34] Arm 官方 ABI 仓库，[AAPCS64](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [S35] libstdc++ manual，[Dual ABI](https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_dual_abi.html)
- [S36] GCC manual，[Link Options](https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html)
- [S37] Microsoft Learn，[C++ binary compatibility](https://learn.microsoft.com/en-us/cpp/porting/binary-compat-2015-2017?view=msvc-170)。兼容承诺带有工具版本、链接器与运行时条件
- [S38] Microsoft Learn，[Potential Errors Passing CRT Objects Across DLL Boundaries](https://learn.microsoft.com/en-us/cpp/c-runtime-library/potential-errors-passing-crt-objects-across-dll-boundaries?view=msvc-170)
- [S39] Microsoft Learn，[DllMain entry point](https://learn.microsoft.com/en-us/windows/win32/dlls/dllmain)
- [S40] Linux man-pages，[execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html)
- [S41] GNU linker manual，[VERSION 与符号版本](https://sourceware.org/binutils/docs/ld/VERSION.html)

[S1]: https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html
[S2]: https://clang.llvm.org/docs/Toolchain.html
[S3]: https://gcc.gnu.org/onlinedocs/cpp/
[S4]: https://llvm.org/docs/LangRef.html
[S5]: https://sourceware.org/binutils/docs/as/
[S6]: https://gabi.xinuos.com/elf/
[S7]: https://gabi.xinuos.com/elf/05-symtab.html
[S8]: https://gabi.xinuos.com/elf/06-reloc.html
[S9]: https://itanium-cxx-abi.github.io/cxx-abi/abi.html
[S10]: https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170
[S11]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S12]: https://gabi.xinuos.com/elf/03-sheader.html
[S13]: https://sourceware.org/binutils/docs/ld/Options.html
[S14]: https://gcc.gnu.org/onlinedocs/gcc/Code-Gen-Options.html
[S15]: https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html
[S16]: https://clang.llvm.org/docs/ThinLTO.html
[S17]: https://sourceware.org/binutils/docs/binutils/nm.html
[S18]: https://sourceware.org/binutils/docs/binutils/readelf.html
[S19]: https://sourceware.org/binutils/docs/binutils/objdump.html
[S20]: https://gabi.xinuos.com/elf/07-pheader.html
[S21]: https://gabi.xinuos.com/elf/08-dynamic.html
[S22]: https://man7.org/linux/man-pages/man8/ld.so.8.html
[S23]: https://learn.microsoft.com/en-us/windows/win32/debug/pe-format
[S24]: https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order
[S25]: https://man7.org/linux/man-pages/man3/dlopen.3.html
[S26]: https://man7.org/linux/man-pages/man3/dlsym.3.html
[S27]: https://gcc.gnu.org/onlinedocs/gcc/Debugging-Options.html
[S28]: https://dwarfstd.org/dwarf5std.html
[S29]: https://sourceware.org/gdb/current/onlinedocs/gdb.html/Separate-Debug-Files.html
[S30]: https://learn.microsoft.com/en-us/cpp/build/reference/pdb-use-program-database?view=msvc-170
[S31]: https://man7.org/linux/man-pages/man1/ldd.1.html
[S32]: https://gitlab.com/x86-psABIs/x86-64-ABI/-/raw/master/x86-64-ABI/low-level-sys-info.tex
[S33]: https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170
[S34]: https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst
[S35]: https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_dual_abi.html
[S36]: https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html
[S37]: https://learn.microsoft.com/en-us/cpp/porting/binary-compat-2015-2017?view=msvc-170
[S38]: https://learn.microsoft.com/en-us/cpp/c-runtime-library/potential-errors-passing-crt-objects-across-dll-boundaries?view=msvc-170
[S39]: https://learn.microsoft.com/en-us/windows/win32/dlls/dllmain
[S40]: https://man7.org/linux/man-pages/man2/execve.2.html
[S41]: https://sourceware.org/binutils/docs/ld/VERSION.html
