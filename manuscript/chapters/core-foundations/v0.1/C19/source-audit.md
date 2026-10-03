# 第十九章 异步 IO 协程与调度 来源与核验

核验日期：2026-10-03。完整正文见[第十九章 异步 IO 协程与调度](C19-asynchronous-io-coroutines-and-scheduling.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核就绪与完成、协程帧和外部借用、取消与资源归还。协议分帧和竞速轨迹为构造示例；多次完成与零复制通知按具体接口契约解释，不概括为一次提交对应一次完成。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

C++20 协程依据 [S1] 的 `[dcl.fct.def.coroutine]`、`[expr.await]` 和协程句柄契约。平台接口依据 Linux man-pages、Linux kernel 文档及 Microsoft Learn，动态文档均于 2026-10-03 核验。Asio strand 仅作为具体库契约示例。C++26 只用 P2300 设计材料与固定 N5050，不宣称 C++20 已具备相同标准库。

所有接口流程、帧图、分帧协议与状态机是作者教学构造。代码明确使用假设库类型，未编译、未执行；本章没有 IO 压测、内核能力探测或平台兼容性运行结果。SVG 渲染检查只验证图面可读。

[S1]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S2]: https://man7.org/linux/man-pages/man7/epoll.7.html
[S3]: https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports
[S4]: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile
[S5]: https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfilecompletionnotificationmodes
[S6]: https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus
[S7]: https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex
[S8]: https://www.boost.org/doc/libs/latest/doc/html/boost_asio/overview/core/strands.html
[S9]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/p2175r0.html
[S10]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2024/p2300r10.html
[S11]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5050.pdf
[S12]: https://man7.org/linux/man-pages/man7/io_uring.7.html
[S13]: https://man7.org/linux/man-pages/man2/sendfile.2.html
[S14]: https://man7.org/linux/man-pages/man2/splice.2.html
[S15]: https://docs.kernel.org/networking/msg_zerocopy.html

[S16]: https://man7.org/linux/man-pages/man3/io_uring_prep_recv_multishot.3.html
[S17]: https://man7.org/linux/man-pages/man3/io_uring_prep_send_zc.3.html
