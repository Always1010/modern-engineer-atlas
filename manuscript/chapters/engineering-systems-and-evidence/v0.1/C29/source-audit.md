# 第二十九章 实时系统与联网设备生命周期 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 本章资料与核验范围

[S1] Zephyr Project，[Scheduling，3.7.0](https://docs.zephyrproject.org/3.7.0/kernel/services/scheduling/index.html)，核验于 2026-10-03。用于协作式与可抢占调度的固定版本例子；正文响应时间计算是带明确假设的作者教学推导。

[S2] FreeRTOS，[Mutexes](https://www.freertos.org/Documentation/02-Kernel/02-Kernel-features/02-Queues-mutexes-and-semaphores/04-Mutexes)与[官方互斥量说明入口](https://freertos.org/Real-time-embedded-RTOS-mutexes.html)，核验于 2026-10-03。用于基本优先级继承及其局限，不声称所有 RTOS 或所有版本行为相同。

[S3] Zephyr Project，[Device Runtime Power Management，3.7.0](https://docs.zephyrproject.org/3.7.0/services/pm/device_runtime.html)，核验于 2026-10-03。用于外设运行时电源管理及依赖关系。

[S4] Zephyr Project，[System Power Management，3.7.0](https://docs.zephyrproject.org/3.7.0/services/pm/system.html)，核验于 2026-10-03。用于空闲、策略与 SoC 低功耗操作的分工，不提供特定开发板的睡眠电流承诺。

[S5] Espressif，[Over The Air Updates，ESP-IDF 5.2.6，ESP32](https://docs.espressif.com/projects/esp-idf/en/v5.2.6/esp32/api-reference/system/ota.html)，核验于 2026-10-03。用于候选、首次启动确认与回滚/防回滚的分层。

[S6] MCUboot，[Bootloader design](https://docs.mcuboot.com/design.html)，核验于 2026-10-03。滚动文档，用于区分固定执行地址、交换、直接执行等模式；实施时须锁定具体 MCUboot 版本与配置。

[S7] Espressif，[Secure Boot V2，ESP-IDF 5.2.6，ESP32](https://docs.espressif.com/projects/esp-idf/en/v5.2.6/esp32/security/secure-boot-v2.html)，核验于 2026-10-03。用于芯片适用边界与信任链讨论；没有执行任何安全熔丝、凭据或调试权限操作。

[S8] NIST，[NISTIR 8259A IoT Device Cybersecurity Capability Core Baseline](https://csrc.nist.gov/pubs/ir/8259/a/final)，2020-05。用于设备生命周期安全能力的分类，不代替行业认证、法定合规或特定产品风险评估。

[S9] National Instruments，[The NI Hardware-in-the-Loop Test System Architecture](https://www.ni.com/en/solutions/transportation/hardware-in-the-loop/hardware-in-the-loop--hil--test-system-architectures.html)，核验于 2026-10-03。用于被测设备、实时模型与信号路径的结构说明；没有复制厂商图片或声称已运行台架。

[S10] Alan Burns、Robert I. Davis，[Response Time Analysis for Mixed Criticality Systems with Arbitrary Deadlines](https://www.cs.york.ac.uk/rts/static/papers/Burns2017b.pdf)，2017，第三节回顾约束截止期的固定优先级响应时间递推；本章只采用这一基础模型，并显式列出额外阻塞及开销预算，不讨论混合关键性扩展。

[S1]: https://docs.zephyrproject.org/3.7.0/kernel/services/scheduling/index.html
[S2]: https://www.freertos.org/Documentation/02-Kernel/02-Kernel-features/02-Queues-mutexes-and-semaphores/04-Mutexes
[S3]: https://docs.zephyrproject.org/3.7.0/services/pm/device_runtime.html
[S4]: https://docs.zephyrproject.org/3.7.0/services/pm/system.html
[S5]: https://docs.espressif.com/projects/esp-idf/en/v5.2.6/esp32/api-reference/system/ota.html
[S6]: https://docs.mcuboot.com/design.html
[S7]: https://docs.espressif.com/projects/esp-idf/en/v5.2.6/esp32/security/secure-boot-v2.html
[S8]: https://csrc.nist.gov/pubs/ir/8259/a/final
[S9]: https://www.ni.com/en/solutions/transportation/hardware-in-the-loop/hardware-in-the-loop--hil--test-system-architectures.html
[S10]: https://www.cs.york.ac.uk/rts/static/papers/Burns2017b.pdf
