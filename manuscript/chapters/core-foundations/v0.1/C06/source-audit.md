# 第六章 地址空间与虚拟内存 来源与核验

核验日期：2026-10-03。完整正文见[第六章 地址空间与虚拟内存](C06-address-spaces-and-virtual-memory.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核地址转换、映射偏移、复制写入、缺页及进程内存指标，区分部署容器与标准库容器。映射示例限定文件类型、长度稳定和解除映射责任，尚未进行平台运行验证。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

以下一手资料核验于 2026-10-03。内核、运行时和 Windows 文档会持续更新；接口细节应与目标部署版本对应。教学地址、页大小、容量和案例数字均为显式假设，不是实测结果。

- [S1] Microsoft Learn，[Virtual Address Space](https://learn.microsoft.com/en-us/windows/win32/memory/virtual-address-space)
- [S2] Linux kernel documentation，[Page Tables](https://docs.kernel.org/mm/page_tables.html)
- [S3] Linux kernel documentation，[Cache and TLB Flushing Under Linux](https://docs.kernel.org/core-api/cachetlb.html)
- [S4] Linux man-pages，[mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html)
- [S5] Linux man-pages，[mlock(2)](https://man7.org/linux/man-pages/man2/mlock.2.html)
- [S6] Linux kernel documentation，[Transparent Hugepage Support](https://docs.kernel.org/admin-guide/mm/transhuge.html)
- [S7] Linux man-pages，[fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)
- [S8] Linux man-pages，[msync(2)](https://man7.org/linux/man-pages/man2/msync.2.html)
- [S9] Linux man-pages，[madvise(2)](https://man7.org/linux/man-pages/man2/madvise.2.html)
- [S10] ISO C++ 工作草案 N4861，[basic.stc、basic.life 与 expr.new](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)。本章采用 C++20 基线，工作草案是公开可核查材料，不代替正式标准文本
- [S11] Linux man-pages，[pthread_attr_setstacksize(3)](https://man7.org/linux/man-pages/man3/pthread_attr_setstacksize.3.html)
- [S12] Linux man-pages，[malloc(3)](https://man7.org/linux/man-pages/man3/malloc.3.html)
- [S13] GNU C Library manual，[Memory Allocation Tunables](https://sourceware.org/glibc/manual/latest/html_node/Memory-Allocation-Tunables.html)。仅采用机制与可调性，不把在线最新文档的默认值推广为所有版本的常量
- [S14] Linux man-pages，[proc_pid_smaps(5)](https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html)
- [S15] Microsoft Learn，[Page State](https://learn.microsoft.com/en-us/windows/win32/memory/page-state)
- [S16] Linux man-pages，[getrusage(2)](https://man7.org/linux/man-pages/man2/getrusage.2.html)
- [S17] Linux man-pages，[mincore(2)](https://man7.org/linux/man-pages/man2/mincore.2.html)
- [S18] Linux kernel documentation，[Concepts overview](https://docs.kernel.org/admin-guide/mm/concepts.html)
- [S19] Linux kernel documentation，[Overcommit Accounting](https://docs.kernel.org/mm/overcommit-accounting.html)
- [S20] Linux kernel documentation，[Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [S21] Linux kernel documentation，[PSI Pressure Stall Information](https://docs.kernel.org/accounting/psi.html)
- [S22] Linux man-pages，[proc_pid_maps(5)](https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html)

[S1]: https://learn.microsoft.com/en-us/windows/win32/memory/virtual-address-space
[S2]: https://docs.kernel.org/mm/page_tables.html
[S3]: https://docs.kernel.org/core-api/cachetlb.html
[S4]: https://man7.org/linux/man-pages/man2/mmap.2.html
[S5]: https://man7.org/linux/man-pages/man2/mlock.2.html
[S6]: https://docs.kernel.org/admin-guide/mm/transhuge.html
[S7]: https://man7.org/linux/man-pages/man2/fork.2.html
[S8]: https://man7.org/linux/man-pages/man2/msync.2.html
[S9]: https://man7.org/linux/man-pages/man2/madvise.2.html
[S10]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S11]: https://man7.org/linux/man-pages/man3/pthread_attr_setstacksize.3.html
[S12]: https://man7.org/linux/man-pages/man3/malloc.3.html
[S13]: https://sourceware.org/glibc/manual/latest/html_node/Memory-Allocation-Tunables.html
[S14]: https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html
[S15]: https://learn.microsoft.com/en-us/windows/win32/memory/page-state
[S16]: https://man7.org/linux/man-pages/man2/getrusage.2.html
[S17]: https://man7.org/linux/man-pages/man2/mincore.2.html
[S18]: https://docs.kernel.org/admin-guide/mm/concepts.html
[S19]: https://docs.kernel.org/mm/overcommit-accounting.html
[S20]: https://docs.kernel.org/admin-guide/cgroup-v2.html
[S21]: https://docs.kernel.org/accounting/psi.html
[S22]: https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html
