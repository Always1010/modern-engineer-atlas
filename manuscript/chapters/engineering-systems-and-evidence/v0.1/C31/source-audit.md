# 第三十一章 Windows Qt 与设备上位机 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 本章资料与核验范围

[S1] Microsoft，[Using Messages and Message Queues](https://learn.microsoft.com/en-us/windows/win32/winmsg/using-messages-and-message-queues)，核验于 2026-10-03。Win32 事件循环、排队与同步消息。

[S2] Microsoft，[GetMessageW](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagew)，核验于 2026-10-03。正值、零与错误返回需分别处理。

[S3] Microsoft，[Closing the Window](https://learn.microsoft.com/en-us/windows/win32/learnwin32/closing-the-window)，核验于 2026-10-03。关闭意图、销毁与退出的分层。

[S4] Qt，[QObject，6.8](https://doc.qt.io/qt-6.8/qobject.html)，核验于 2026-10-03。对象树、生命期、连接与线程归属。

[S5] Qt，[Threads and QObjects，6.8](https://doc.qt.io/qt-6.8/threads-qobject.html)，核验于 2026-10-03。GUI 线程、连接类型、事件循环与线程亲和性。

[S6] Qt，[QThread，6.8](https://doc.qt.io/qt-6.8/qthread.html)，核验于 2026-10-03。QThread 对象与其管理线程的区别、合作式停止及结束机制。

[S7] Qt，[QAbstractItemModel，6.8](https://doc.qt.io/qt-6.8/qabstractitemmodel.html)，核验于 2026-10-03。模型线程边界与更新协议。

[S8] Microsoft，[Canceling Pending I/O Operations](https://learn.microsoft.com/en-us/windows/win32/fileio/canceling-pending-i-o-operations)，核验于 2026-10-03。取消请求与完成回收的竞争。

[S9] Sunmist，[UART to USB adapter](https://commons.wikimedia.org/wiki/File:UART_to_USB_adapter.jpg)，2016-08-31，原作者以 CC0 1.0 发布；核验、下载于 2026-10-03，仅作真实器件外观识别。

[S10] Qt，[QSerialPort，6.8](https://doc.qt.io/qt-6.8/qserialport.html)，核验于 2026-10-03。事件与阻塞接口、状态和读写语义。

[S11] Qt，[QCanBusDevice，6.8](https://doc.qt.io/qt-6.8/qcanbusdevice.html)，核验于 2026-10-03。插件后端能力与设备状态，不承诺每个后端具备相同功能。

[S12] Qt，[High DPI，6.8](https://doc.qt.io/qt-6.8/highdpi.html)，核验于 2026-10-03。逻辑坐标与设备像素比。

[S13] Microsoft，[High DPI Desktop Application Development on Windows](https://learn.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows)，核验于 2026-10-03。平台 DPI awareness 与多显示器边界。

[S14] Qt，[Accessibility，6.8](https://doc.qt.io/qt-6.8/accessible.html)，核验于 2026-10-03。控件语义与辅助技术接口。

[S15] Qt，[Qt for Windows Deployment，6.8](https://doc.qt.io/qt-6.8/windows-deployment.html)，核验于 2026-10-03。依赖与插件部署；许可义务需按实际分发组件另行核查。

[S1]: https://learn.microsoft.com/en-us/windows/win32/winmsg/using-messages-and-message-queues
[S2]: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getmessagew
[S3]: https://learn.microsoft.com/en-us/windows/win32/learnwin32/closing-the-window
[S4]: https://doc.qt.io/qt-6.8/qobject.html
[S5]: https://doc.qt.io/qt-6.8/threads-qobject.html
[S6]: https://doc.qt.io/qt-6.8/qthread.html
[S7]: https://doc.qt.io/qt-6.8/qabstractitemmodel.html
[S8]: https://learn.microsoft.com/en-us/windows/win32/fileio/canceling-pending-i-o-operations
[S9]: https://commons.wikimedia.org/wiki/File:UART_to_USB_adapter.jpg
[S10]: https://doc.qt.io/qt-6.8/qserialport.html
[S11]: https://doc.qt.io/qt-6.8/qcanbusdevice.html
[S12]: https://doc.qt.io/qt-6.8/highdpi.html
[S13]: https://learn.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows
[S14]: https://doc.qt.io/qt-6.8/accessible.html
[S15]: https://doc.qt.io/qt-6.8/windows-deployment.html
