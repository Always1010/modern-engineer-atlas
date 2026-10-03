# 第二十六章 安全与内存安全工程 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

2026-10-03打开核验以下资料。全章为防御与授权验证内容；未执行漏洞复现、网络测试、凭证操作或书中代码。配置与平台能力应以实际采用版本复核。

- S1：OWASP Threat Modeling，资产、假设、边界与持续更新
- S2：OWASP Authorization Cheat Sheet，最小权限、默认拒绝与逐请求检查
- S3：OWASP Input Validation Cheat Sheet，语法与语义验证
- S4：WG21 N4861，C++20整数、对象、视图和相关语言前提
- S5：OWASP C-Based Toolchain Hardening，平台相关生产加固
- S6：The Rust Programming Language，Unsafe Rust，额外能力与封装责任
- S7：The Rust Reference，Behavior considered undefined，unsafe仍需满足的规则
- S8：Rustonomicon FFI，布局、所有权、回调与展开边界
- S9：CXX官方概览，受控Rust/C++桥接
- S10：CXX rust::Box说明，拥有式桥接约束
- S11：CXX std::string说明，跨语言字符串限制
- S12：OWASP Secrets Management，秘密生命周期
- S13：OWASP Authentication，身份与会话防护
- S14：OWASP Password Storage，密码散列与更新原则
- S15：RFC8446，TLS1.3与早期数据重放约束
- S16：RFC9525，TLS服务身份验证
- S17：OWASP Transport Layer Security，部署配置原则
- S18：CERT/CC Vulnerability Disclosure Guidance，协调漏洞处理

[S1]: https://community.owasp.org/Threat_Modeling
[S2]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
[S3]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
[S4]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf
[S5]: https://cheatsheetseries.owasp.org/cheatsheets/C-Based_Toolchain_Hardening_Cheat_Sheet.html
[S6]: https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html
[S7]: https://doc.rust-lang.org/reference/behavior-considered-undefined.html
[S8]: https://doc.rust-lang.org/nomicon/ffi.html
[S9]: https://cxx.rs/
[S10]: https://cxx.rs/binding/box.html
[S11]: https://cxx.rs/binding/cxxstring.html
[S12]: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
[S13]: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
[S14]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
[S15]: https://www.rfc-editor.org/rfc/rfc8446
[S16]: https://www.rfc-editor.org/rfc/rfc9525
[S17]: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
[S18]: https://www.kb.cert.org/vuls/guidance/
