# 第三十三章 网络协议与高性能服务 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

以下资料核验于 2026-10-03。RFC 编号是固定参照，不意味着包含其后所有扩展；系统与框架滚动文档只支持本文注明的机制。示例、算术和原创图为教学设计，代码未编译、未执行，没有实际网络性能结果。

- S1：[RFC 9293 TCP](https://www.rfc-editor.org/rfc/rfc9293.html)，字节流、连接状态与传输边界
- S2：[Linux send(2)](https://man7.org/linux/man-pages/man2/send.2.html)，发送返回及局部错误范围
- S3：[RFC 5681 TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681.html)，经典窗口与拥塞机制
- S4：[RFC 6298 Computing TCP's Retransmission Timer](https://www.rfc-editor.org/rfc/rfc6298.html)，重传定时与退避
- S5：[Linux connect(2)](https://man7.org/linux/man-pages/man2/connect.2.html)，非阻塞连接与 SO_ERROR
- S6：[RFC 1034 DNS Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034.html)，分层名字、解析与缓存基础
- S7：[RFC 8446 TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)，握手及早期数据重放边界
- S8：[RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)，方法、状态及幂等语义
- S9：[RFC 9113 HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html)，流与 TCP 上的多路复用
- S10：[gRPC Deadlines](https://grpc.io/docs/guides/deadlines/)，期限传播及应用取消责任
- S11：[RFC 9000 QUIC](https://www.rfc-editor.org/rfc/rfc9000.html)，流、连接与共享控制边界
- S12：[RFC 9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)，HTTP 映射与压缩依赖
- S13：[Protocol Buffers proto3 Language Guide](https://protobuf.dev/programming-guides/proto3/)，字段存在性、编号与演进
- S14：[RFC 8767 Serving Stale Data](https://www.rfc-editor.org/rfc/rfc8767.html)，DNS过期数据使用条件与TTL边界
- S15：[Linux Kernel MSG_ZEROCOPY](https://docs.kernel.org/networking/msg_zerocopy.html)，内存复用通知与传输完成的区别
- S16：[Google SRE Handling Overload](https://sre.google/sre-book/handling-overload/)，分层重试预算与过载反馈
- S17：[Gil Tene wrk2原始项目说明](https://github.com/giltene/wrk2)，计划到达计时与协调遗漏；未运行工具

[S1]: https://www.rfc-editor.org/rfc/rfc9293.html
[S2]: https://man7.org/linux/man-pages/man2/send.2.html
[S3]: https://www.rfc-editor.org/rfc/rfc5681.html
[S4]: https://www.rfc-editor.org/rfc/rfc6298.html
[S5]: https://man7.org/linux/man-pages/man2/connect.2.html
[S6]: https://www.rfc-editor.org/rfc/rfc1034.html
[S7]: https://www.rfc-editor.org/rfc/rfc8446.html
[S8]: https://www.rfc-editor.org/rfc/rfc9110.html
[S9]: https://www.rfc-editor.org/rfc/rfc9113.html
[S10]: https://grpc.io/docs/guides/deadlines/
[S11]: https://www.rfc-editor.org/rfc/rfc9000.html
[S12]: https://www.rfc-editor.org/rfc/rfc9114.html
[S13]: https://protobuf.dev/programming-guides/proto3/
[S14]: https://www.rfc-editor.org/rfc/rfc8767.html
[S15]: https://docs.kernel.org/networking/msg_zerocopy.html
[S16]: https://sre.google/sre-book/handling-overload/
[S17]: https://github.com/giltene/wrk2
