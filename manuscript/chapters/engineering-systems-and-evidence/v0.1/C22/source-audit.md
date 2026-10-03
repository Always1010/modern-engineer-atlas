# 第二十二章 调试与故障证据链 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

核验日期为 2026-10-03。以下资料均已打开；未实际附加进程、采集转储、运行 sanitizer 或回放工具。所有场景与图为原创教学组织，工具平台范围须随采用版本再次核对。

- S1：GDB Separate Debug Files，独立符号与身份关联
- S2：Microsoft Symbols for Windows Debugging，模块与符号基础
- S3：GDB Backtrace，栈帧、线程和优化变量限制
- S4：LLDB Tutorial，断点、线程、变量和表达式操作
- S5：GDB Set Breaks，断点位置与多处解析
- S6：GDB Set Watchpoints，硬件和软件观察点限制
- S7：Linux core(5)，转储生成条件与内容限制
- S8：Microsoft Collecting User-Mode Dumps，Windows 用户态收集
- S9：Clang AddressSanitizer，检测类别、构建和限制
- S10：Microsoft AddressSanitizer，MSVC 专属支持范围
- S11：Clang ThreadSanitizer，数据竞争、平台和插桩边界
- S12：Clang UndefinedBehaviorSanitizer，各检查类别与运行模式
- S13：Valgrind Memcheck Manual，地址、未定义值、泄漏与抑制
- S14：Clang MemorySanitizer，未初始化值与依赖插桩要求
- S15：rr 项目官方说明，记录回放的用途及环境范围

[S1]: https://sourceware.org/gdb/current/onlinedocs/gdb.html/Separate-Debug-Files.html
[S2]: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/symbols
[S3]: https://sourceware.org/gdb/current/onlinedocs/gdb.html/Backtrace.html
[S4]: https://lldb.llvm.org/use/tutorial.html
[S5]: https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Breaks.html
[S6]: https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Watchpoints.html
[S7]: https://man7.org/linux/man-pages/man5/core.5.html
[S8]: https://learn.microsoft.com/en-us/windows/win32/wer/collecting-user-mode-dumps
[S9]: https://clang.llvm.org/docs/AddressSanitizer.html
[S10]: https://learn.microsoft.com/en-us/cpp/sanitizers/asan?view=msvc-170
[S11]: https://clang.llvm.org/docs/ThreadSanitizer.html
[S12]: https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html
[S13]: https://valgrind.org/docs/manual/mc-manual.html
[S14]: https://clang.llvm.org/docs/MemorySanitizer.html
[S15]: https://rr-project.org/
