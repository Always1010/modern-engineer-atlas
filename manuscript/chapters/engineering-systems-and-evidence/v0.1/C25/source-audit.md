# 第二十五章 架构设计与长期演进 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

2026-10-03打开核验以下官方与原作者资料。正文的容量数字、迁移场景和评审方法均为原创教学推理，未声称真实执行或企业采用。模式材料用于解释机制与权衡，不作普遍最优证明。

- S1：SEI Quality Attribute Workshop Collection，质量属性场景与优先级
- S2：James Lewis与Martin Fowler，Microservices，独立部署与业务边界
- S3：Martin Fowler，Monolith First，边界不确定时的演进讨论
- S4：C4 model官方说明，多层架构表达
- S5：Martin Fowler，Inversion of Control Containers and Dependency Injection，构造与使用分离
- S6：Protocol Buffers proto3指南，字段演进与兼容限制
- S7：Microsoft Strangler Fig Pattern，渐进替换
- S8：Microsoft Anti-Corruption Layer Pattern，模型转换与隔离
- S9：Martin Fowler，Technical Debt Quadrant，技术债背景与责任
- S10：Microsoft Microservices Architecture Style，运维与一致性成本
- S11：NIST AI RMF及核心说明，风险治理与责任背景
- S12：Michael Nygard，Documenting Architecture Decisions，决策记录

[S1]: https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/
[S2]: https://martinfowler.com/articles/microservices.html
[S3]: https://martinfowler.com/bliki/MonolithFirst.html
[S4]: https://c4model.com/
[S5]: https://martinfowler.com/articles/injection.html
[S6]: https://protobuf.dev/programming-guides/proto3/
[S7]: https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig
[S8]: https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer
[S9]: https://martinfowler.com/bliki/TechnicalDebtQuadrant.html
[S10]: https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices
[S11]: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
[S12]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
