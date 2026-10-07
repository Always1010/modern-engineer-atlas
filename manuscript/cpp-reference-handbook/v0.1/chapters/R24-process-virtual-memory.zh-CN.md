# 第24章 进程与虚拟内存

C++ 对象属于语言层的生命周期；进程地址空间与驻留页属于 OS 的资源管理。delete 结束对象并交回分配器，不保证进程的 RSS 立即下降；看到虚拟地址也不能据此判断它对应哪一块物理内存。

**版本与平台**：语言边界按 C++17/20；平台接口分别按 Linux man-pages 与 Windows Win32 文档。**先修**：对象、指针、RAII、线程。首次读第1至3节；内存增长查第4节，跨进程数据查第5节。

## 1 进程、线程与调度：共享的范围是什么

进程拥有地址空间及一组系统资源；同一进程的线程通常共享这些资源，各自有执行上下文、栈和线程局部状态。进程隔离不表示完全没有共享：共享映射、文件、内核对象可以形成显式通道。[Windows 进程与线程](https://learn.microsoft.com/en-us/windows/win32/procthread/processes-and-threads)。

上下文切换把执行从一个线程转给另一个；寄存器、调度、地址转换及缓存状态的成本随平台和情形变化。线程从 runnable 到实际运行需要调度；condition_variable 被通知不表示马上执行。高 CPU 利用率可能来自有效计算、忙等或频繁重试，低利用率可能是在等 I/O、锁或外部服务。应结合各线程栈、等待原因和吞吐判断。

Linux fork 创建子进程，父子最初内容相同而地址空间独立，常见写时复制减少立即复制成本；修改普通内存不会自动通知另一进程。多线程进程 fork 后，子进程只留下调用线程，其他线程所持锁可能遗留；在 exec 前仅调用 async-signal-safe 函数是重要限制。不要把 fork 当 thread 构造的等价物。Windows CreateProcess 则不是同一复制模型。[Linux fork](https://man7.org/linux/man-pages/man2/fork.2.html)。

## 2 虚拟页、映射与缺页

虚拟地址经页表等机制映射到物理页或其他后备对象，页大小与大页能力由平台决定。不同进程可有相同数值的虚拟地址而指向不同内容；一个物理页也可被多个映射引用。地址空间预留、提交／建立后备承诺、实际驻留是不同状态，Windows 特别区分保留与提交。[Windows 虚拟地址空间](https://learn.microsoft.com/en-us/windows/win32/memory/virtual-address-space)。

![地址空间与物理页的多种映射](../resources/R24-virtual-pages.svg)

图24-1：页号与地址均为示意。共享页由显式映射建立，空洞不允许直接访问；物理页存在不意味着 C++ 对象已构造。Windows reserve/commit 术语不能原样替代 Linux 映射与过量承诺策略。

缺页异常是地址转换发现当前访问需要 OS 处理；它可以是合法的首次触碰、从文件读取或换入，也可以是非法地址导致信号／异常。缺页不等于崩溃。Linux minor/major fault 指标帮助区分是否需要 I/O，但应结合映射类型和负载；把首次触碰成本算进 steady-state 基准会影响结论。

进程“堆”通常容纳动态分配，线程“栈”通常容纳自动对象，但 C++ 不规定每个局部变量必有栈槽，也不规定所有动态对象来自单一堆。线程栈受大小限制，深递归与大局部数组可能失败；栈映射的存在同样不延长局部对象生命期。

## 3 mmap 与地址的有效区间

Linux `mmap` 返回映射地址，失败为 MAP_FAILED 而非 nullptr。`munmap` 解除映射，使对应区间不能再按原映射使用；映射长度、偏移对齐、访问权限和文件大小要核验。映射区不是一个自动构造的 T 数组，非平凡对象需要语言层的构造与析构。

MAP_SHARED 使修改可对同一后备对象的其他映射可见，MAP_PRIVATE 的修改不写回原文件；并发协议另需同步。映射文件被截短后访问不再有对应文件内容的页可能触发 SIGBUS，故“指针未变”不能证明仍可读取。Windows 文件映射通过 CreateFileMapping／MapViewOfFile，句柄与视图分别释放，不能用 munmap 的契约替换它。[Linux mmap/munmap](https://man7.org/linux/man-pages/man2/mmap.2.html)、[Windows 文件映射](https://learn.microsoft.com/en-us/windows/win32/memory/file-mapping)。

## 4 RSS、working set、分配器与泄漏诊断

RSS 表示驻留内存，包含的共享、私有、文件与匿名页需进一步拆分。Linux /proc/pid/status 的 VmRSS 等快速指标有精度限制，详细分析可读 smaps 或 smaps_rollup；PSS 按共享者比例分摊共享页，与 RSS 不同。Windows working set 是进程当前驻留页集合，其中可含共享页，不应与 private bytes 混为一个数。[Linux status](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html)、[Linux smaps](https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html)、[Windows working set](https://learn.microsoft.com/en-us/windows/win32/memory/working-set)。

| 现象 | 检查依据 | 不能直接认定 |
| --- | --- | --- |
| 分配后虚拟内存增加，RSS变化小 | 是否只预留；页面是否被触碰 | 成功分配不等于所有页已驻留 |
| delete 后 RSS 不降 | 分配器缓存、碎片、仍驻留的其他对象 | 不等于 delete 未执行 |
| 请求停下后内存保持高位 | 活对象、容器 capacity、池上限 | 高水位不自动等于泄漏 |
| RSS随请求数持续上升 | 存活对象数、未完成任务、连接与映射 | 要找持有者，不能只看总曲线 |
| 内存不足但空闲块很多 | 尺寸分布、连续分配、碎片 | 总空闲量不保证一次分配能满足 |
| 多进程 RSS总和很大 | 共享页与 PSS／私有页 | 直接相加可能重复计算物理页 |

分配器可保留空闲块供重用，碎片又分为块内浪费和空闲块难以满足请求等情况。先记录“分配多少、仍存活多少、由谁持有”，再比较 OS 视图。RAII 防止遗漏释放路径，但业务队列无上限、缓存不淘汰或循环 shared_ptr 仍可让资源长期存活，见 R09、R21。

连接池空闲对象、未完成任务、历史查询结果和分配器空闲块都能占据内存，但释放条件不同。用相同负载观察多轮后是否达到平台，比单次峰值更能说明是否持续保留；通过对象计数和分配栈找实际持有者。不要为让指标下降而盲目清空池，这可能把成本转成分配与缺页抖动。进程内存上限也要包含线程栈、映射和队列，不能只限制业务对象总尺寸。

## 5 IPC 与动态库的边界

跨进程通信可选择管道、Unix domain socket／Windows 命名管道、消息机制或共享内存。共享内存减少复制并不免除布局、同步和恢复协议：地址空间基址可不同，不能直接把裸指针写进去；用偏移／索引，说明版本、字段尺寸与所有权。普通 std::mutex 不提供可移植进程间同步保证，需平台进程共享同步或其他通信协议。[Linux POSIX shared memory](https://man7.org/linux/man-pages/man7/shm_overview.7.html)。

动态库装入给进程增加代码与数据映射，不是创建隔离进程。Linux dlopen/dlsym/dlclose 与 Windows LoadLibrary/GetProcAddress/FreeLibrary 属平台 API；ABI、异常、分配与释放必须有契约。卸载前要结束执行库代码的线程，并使函数指针、回调及库内对象不再被访问；“关了句柄”不证明这些借用已结束。[Linux dlopen](https://man7.org/linux/man-pages/man3/dlopen.3.html)。

本章提供机制与诊断，不以标准库程序模拟 OS 页表。本轮未运行平台映射／IPC 程序；来源支持接口边界，目标 OS 仍需定向验证。系统 I/O 见 R25，地址与对象规则见 R05、R07。
