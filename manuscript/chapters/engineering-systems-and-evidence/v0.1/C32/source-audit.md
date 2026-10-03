# 第三十二章 网络设备与高性能数据平面 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 本章资料与核验范围

[S1] Sub，[Ethernet pci card 原始照片与公有领域声明](https://commons.wikimedia.org/wiki/File:Ethernet_pci_card.jpg#Licensing)，2007-10-03；核验和下载于 2026-10-03。只用于器件外观识别，不推断现代硬件能力。

[S2] Linux 6.12，[NAPI](https://docs.kernel.org/6.12/networking/napi.html)，核验于 2026-10-03。中断、轮询与工作预算的组织。

[S3] Linux 6.12，[Scaling in the Linux Networking Stack](https://www.kernel.org/doc/html/v6.12/networking/scaling.html)，核验于 2026-10-03。RSS/RPS/RFS/XPS 的职责区别，不转录特定历史测试配置作为通用推荐。

[S4] DPDK 24.11，[Poll Mode Driver](https://doc.dpdk.org/guides-24.11/prog_guide/ethdev/ethdev.html)，核验于 2026-10-03，页面维护版本 24.11.7。用于批处理、队列与执行模型。

[S5] DPDK 24.11，[Packet Mbuf Library](https://doc.dpdk.org/guides-24.11/prog_guide/mbuf_lib.html)，核验于 2026-10-03。包元数据、分段与生命期。

[S6] DPDK 24.11，[Linux Drivers](https://doc.dpdk.org/guides-24.11/linux_gsg/linux_drivers.html)，核验于 2026-10-03。VFIO、IOMMU 与 bifurcated 驱动边界；正文没有执行绑定操作。

[S7] Linux 6.12，[AF_XDP](https://docs.kernel.org/6.12/networking/af_xdp.html)，核验于 2026-10-03。UMEM、环和复制/零拷贝条件。

[S8] NVIDIA，[RDMA Aware Networks Programming User Manual 1.7](https://docs.nvidia.com/rdma-aware-networks-programming-user-manual-1-7.pdf)，核验于 2026-10-03。用于 QP、CQ、内存注册与保护域等基础概念，不使用其中实验 API 作为当代通用接口。

[S9] libibverbs，[ibv_post_send(3)](https://man7.org/linux/man-pages/man3/ibv_post_send.3.html)，核验于 2026-10-03。工作请求、发送缓冲与完成边界。

[S10] Linux 6.12，[PCI Express I/O Virtualization Howto](https://www.kernel.org/doc/html/v6.12/PCI/pci-iov-howto.html)，核验于 2026-10-03。SR-IOV PF/VF 分工，不等同完全独占物理资源。

[S11] NVIDIA，[RoCE，Cumulus Linux 5.16](https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-516/Layer-1-and-Switch-Ports/Quality-of-Service/RDMA-over-Converged-Ethernet-RoCE/)与 [Priority Flow Control](https://networking-docs.nvidia.com/onyxum/3104706lts/priority-flow-control-pfc)，核验于 2026-10-03。只用于特定实现的流控/拥塞组合与风险解释，不统一规定所有 RDMA 网络。

[S12] Linux 6.12，[Interface statistics](https://docs.kernel.org/6.12/networking/statistics.html)，核验于 2026-10-03。标准与设备特定计数的观察边界。

[S13] Linux，[Timestamping](https://docs.kernel.org/networking/timestamping.html)，核验于 2026-10-03。滚动文档仅用于硬件/软件时间戳与时钟域概念，不将新接口倒推到固定内核。

[S14] IEEE 802.1，[Time-Sensitive Networking Task Group](https://1.ieee802.org/tsn/)，核验于 2026-10-03。标准族与不同机制的范围；本文不声明任何设备通过 TSN、工业功能安全或电信认证。

[S15] DPDK 24.11，[Read-Copy-Update Library](https://doc.dpdk.org/guides-24.11/prog_guide/rcu_lib.html)，核验于 2026-10-03。读侧、静止状态与回收契约，需按实际库版本使用。

[S1]: https://commons.wikimedia.org/wiki/File:Ethernet_pci_card.jpg#Licensing

[S2]: https://docs.kernel.org/6.12/networking/napi.html

[S3]: https://www.kernel.org/doc/html/v6.12/networking/scaling.html

[S4]: https://doc.dpdk.org/guides-24.11/prog_guide/ethdev/ethdev.html

[S5]: https://doc.dpdk.org/guides-24.11/prog_guide/mbuf_lib.html

[S6]: https://doc.dpdk.org/guides-24.11/linux_gsg/linux_drivers.html

[S7]: https://docs.kernel.org/6.12/networking/af_xdp.html

[S8]: https://docs.nvidia.com/rdma-aware-networks-programming-user-manual-1-7.pdf

[S9]: https://man7.org/linux/man-pages/man3/ibv_post_send.3.html

[S10]: https://www.kernel.org/doc/html/v6.12/PCI/pci-iov-howto.html

[S11]: https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-516/Layer-1-and-Switch-Ports/Quality-of-Service/RDMA-over-Converged-Ethernet-RoCE/

[S12]: https://docs.kernel.org/6.12/networking/statistics.html

[S13]: https://docs.kernel.org/networking/timestamping.html

[S14]: https://1.ieee802.org/tsn/

[S15]: https://doc.dpdk.org/guides-24.11/prog_guide/rcu_lib.html
