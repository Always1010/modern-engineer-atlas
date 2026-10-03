# 第三十章 Linux 内核驱动与系统软件 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 本章资料与核验范围

以下固定版本文档均于 2026-10-03 核验；它们描述 Linux 接口，不是 ISO C++ 保证。

[S1] Linux 6.12，[The Linux Kernel Driver Interface](https://docs.kernel.org/6.12/process/stable-api-nonsense.html)。用于区分内部接口与用户 ABI，不把发行版额外兼容政策视为上游保证。

[S2] Linux 6.12，[Driver Basics](https://docs.kernel.org/6.12/driver-api/basics.html)。模块入口、退出与引用责任。

[S3] Linux 6.12，[The Linux Kernel Device Model](https://docs.kernel.org/6.12/driver-api/driver-model/overview.html)。设备、总线与驱动生命周期。

[S4] Linux 6.12，[Devres](https://docs.kernel.org/6.12/driver-api/driver-model/devres.html)。托管释放不替代在途活动停止协议。

[S5] Linux 6.12，[Lock types and their rules](https://docs.kernel.org/6.12/locking/locktypes.html)。上下文与 PREEMPT_RT 差异。

[S6] Linux 6.12，[Dynamic DMA mapping Guide](https://docs.kernel.org/6.12/core-api/dma-api-howto.html)。CPU/DMA 地址、映射与同步边界。

[S7] Linux 6.12，[Bus-Independent Device Accesses](https://docs.kernel.org/6.12/driver-api/device-io.html)。MMIO 访问器与总线访问规则。

[S8] Linux 6.12，[Linux kernel memory barriers](https://docs.kernel.org/6.12/core-api/wrappers/memory-barriers.html)。CPU、DMA 与设备观察顺序的分层。

[S9] Linux 6.12，[Overview of the Linux Virtual File System](https://docs.kernel.org/6.12/filesystems/vfs.html)。VFS、目录项、inode 与打开文件对象。

[S10] Linux 6.12，[Multi-Queue Block IO Queueing Mechanism](https://docs.kernel.org/6.12/block/blk-mq.html)。软件提交与硬件队列的组织。

[S11] Linux 6.12，[NAPI](https://docs.kernel.org/6.12/networking/napi.html)。网络接收轮询与预算契约。

[S12] Linux 6.12，[eBPF verifier](https://docs.kernel.org/6.12/bpf/verifier.html)。验证器检查边界；正文观测方案为作者分析，不以验证通过证明业务安全。

[S13] Linux，[KVM API Documentation](https://docs.kernel.org/virt/kvm/api.html)，滚动页面核验于 2026-10-03。只使用文件描述符层次与能力探测等基础概念，未把滚动扩展倒推到 6.12。

[S14] Linux man-pages，[namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)，核验于 2026-10-03。命名空间的资源视图边界。

[S15] Linux 6.12，[Control Group v2](https://docs.kernel.org/6.12/admin-guide/cgroup-v2.html)。资源统计、控制与层次语义。

[S16] Linux 6.12，[Seccomp BPF](https://docs.kernel.org/6.12/userspace-api/seccomp_filter.html)。系统调用过滤与非完整沙箱边界。

[S17] Linux，[Documentation for Kdump](https://docs.kernel.org/admin-guide/kdump/kdump.html)，滚动页面核验于 2026-10-03。只讨论预配置崩溃取证机制，不提供系统修改命令。

[S18] Linux 6.12，[KASAN](https://docs.kernel.org/6.12/dev-tools/kasan.html)、[KCSAN](https://docs.kernel.org/6.12/dev-tools/kcsan.html)及 [Runtime locking correctness validator](https://docs.kernel.org/6.12/locking/lockdep-design.html)。检测器与锁验证的覆盖必须按实际构建配置核对。

[S19] Linux 6.12，[libbpf Overview](https://docs.kernel.org/6.12/bpf/libbpf/libbpf_overview.html)。BTF与CO-RE的类型布局适配边界，不作任意内核兼容保证。

[S1]: https://docs.kernel.org/6.12/process/stable-api-nonsense.html
[S2]: https://docs.kernel.org/6.12/driver-api/basics.html
[S3]: https://docs.kernel.org/6.12/driver-api/driver-model/overview.html
[S4]: https://docs.kernel.org/6.12/driver-api/driver-model/devres.html
[S5]: https://docs.kernel.org/6.12/locking/locktypes.html
[S6]: https://docs.kernel.org/6.12/core-api/dma-api-howto.html
[S7]: https://docs.kernel.org/6.12/driver-api/device-io.html
[S8]: https://docs.kernel.org/6.12/core-api/wrappers/memory-barriers.html
[S9]: https://docs.kernel.org/6.12/filesystems/vfs.html
[S10]: https://docs.kernel.org/6.12/block/blk-mq.html
[S11]: https://docs.kernel.org/6.12/networking/napi.html
[S12]: https://docs.kernel.org/6.12/bpf/verifier.html
[S13]: https://docs.kernel.org/virt/kvm/api.html
[S14]: https://man7.org/linux/man-pages/man7/namespaces.7.html
[S15]: https://docs.kernel.org/6.12/admin-guide/cgroup-v2.html
[S16]: https://docs.kernel.org/6.12/userspace-api/seccomp_filter.html
[S17]: https://docs.kernel.org/admin-guide/kdump/kdump.html
[S18]: https://docs.kernel.org/6.12/dev-tools/kasan.html
[S19]: https://docs.kernel.org/6.12/bpf/libbpf/libbpf_overview.html
