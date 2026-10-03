# 第二十八章 MCU 与固件的硬件边界 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 本章资料与核验范围

[S1] Teardown Central，STM32F4 Discovery 实物照片，2013-06-18。[Wikimedia Commons 文件页](https://commons.wikimedia.org/wiki/File:STM32F4_Discovery_(9067300323).jpg)明确作者、原 Flickr 来源及 CC BY-SA 2.0，核验并下载于 2026-10-03。原始文件按独立图片授权使用。

[S2] STMicroelectronics，[STM32F4DISCOVERY 产品资料](https://www.st.com/en/evaluation-tools/stm32f4discovery.html)，核验于 2026-10-03。用于区分板级目标 MCU、调试器与 USB 功能，不以照片代替当前板卡原理图。

[S3] STMicroelectronics，RM0090，[STM32F4 系列参考手册](https://www.st.com/resource/en/reference_manual/rm0090-stm32f4xx-reference-manual-stmicroelectronics.pdf)，重点核对存储器与总线体系、GPIO 和 DMA。在线整本抓取受文件体积限制，已核对官方索引与可检索相关条目；实际实施须按具体料号查完整手册和勘误。

[S4] NXP，UM10204，[I2C-bus specification and user manual](https://www.nxp.com/docs/en/user-guide/UM10204.pdf)，Rev. 7.0，2021-10-01。核验于 2026-10-03，作为 I2C 线路、寻址与模式边界依据。

[S5] Texas Instruments，Steve Corrigan，[Controller Area Network Physical Layer Requirements](https://www.ti.com/lit/an/slla270/slla270.pdf)，SLLA270，2008-01。用于物理层分工与典型终端原理，不替代现代 CAN FD 器件的具体时序条件。

[S6] USB-IF，[USB 2.0 Specification 官方入口](https://www.usb.org/document-library/usb-20-specification)，核验于 2026-10-03。正文只讨论主机、设备、枚举和传输类别，不将 USB 2.0 与 Type-C/USB PD 混为同一规范。

[S7] Arm，[CMSIS-Core NVIC 文档](https://arm-software.github.io/CMSIS_6/latest/Core/group__NVIC__gr.html)，核验于 2026-10-03。网页为滚动版本，实现位数与优先级配置仍以目标芯片为准。

[S8] ISO C++ 公开固定参照，[N4861](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)，2020-04-01。仅用于限定语言 volatile 与并发语义的边界，不以 C++ 标准证明 MMIO 或 DMA 协议。

[S9] Arm，[CMSIS Cortex-M7 D-Cache Functions](https://arm-software.github.io/CMSIS_6/latest/Core/group__Dcache__functions__m7.html)，核验于 2026-10-03。用于缓存维护分类与该接口的地址对齐条件，不推广为所有 MCU 缓存结构。

[S10] STMicroelectronics，AN2606，[Introduction to system memory boot mode on STM32 MCUs](https://www.st.com/resource/en/application_note/an2606-introduction-to-system-memory-boot-mode-on-stm32-mcus-stmicroelectronics.pdf)，核验于 2026-10-03。在线内容为 Rev. 70 系列页面；本章仅引用按器件核查启动条件的原则，不提供可能跨修订失效的地址表。

[S1]: https://commons.wikimedia.org/wiki/File:STM32F4_Discovery_(9067300323).jpg
[S2]: https://www.st.com/en/evaluation-tools/stm32f4discovery.html
[S3]: https://www.st.com/resource/en/reference_manual/rm0090-stm32f4xx-reference-manual-stmicroelectronics.pdf
[S4]: https://www.nxp.com/docs/en/user-guide/UM10204.pdf
[S5]: https://www.ti.com/lit/an/slla270/slla270.pdf
[S6]: https://www.usb.org/document-library/usb-20-specification
[S7]: https://arm-software.github.io/CMSIS_6/latest/Core/group__NVIC__gr.html
[S8]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S9]: https://arm-software.github.io/CMSIS_6/latest/Core/group__Dcache__functions__m7.html
[S10]: https://www.st.com/resource/en/application_note/an2606-introduction-to-system-memory-boot-mode-on-stm32-mcus-stmicroelectronics.pdf
