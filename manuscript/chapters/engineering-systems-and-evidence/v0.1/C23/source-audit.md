# 第二十三章 从测试到可信验证 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

官方资料核验于2026-10-03。测试方法、场景推理和图为原创组织；本章未运行任何测试、故障实验或生成代码验收，未提供虚构覆盖率和性能结论。

- S1：Google SRE Testing for Reliability，测试组合与系统可靠性背景
- S2：GoogleTest Primer，测试组织及致命/非致命断言
- S3：gMock Cookbook，行为预期与替身使用边界
- S4：Pact How Pact works，消费者测试与提供者验证
- S5：Hypothesis 官方入口，性质与输入生成
- S6：Hypothesis Replaying failed tests，失败保存与回放范围
- S7：LLVM libFuzzer，覆盖引导目标与驱动约束
- S8：AFL++ 官方深度指南，语料与模糊测试配置
- S9：Microsoft Research Finding and Reproducing Heisenbugs in Concurrent Programs，系统化调度探索
- S10：Microsoft Chaos engineering and resilience，受控故障实验
- S11：Clang Static Analyzer，静态路径分析定位
- S12：clang-tidy 官方说明，检查类别与构建上下文
- S13：Clang Source-based Code Coverage，覆盖口径
- S14：GitHub Copilot Agents 负责任使用说明，生成内容与自动审查的验证责任
- S15：Hypothesis Stateful tests，操作序列与模型对照方法

[S1]: https://sre.google/sre-book/testing-reliability/
[S2]: https://google.github.io/googletest/primer.html
[S3]: https://google.github.io/googletest/gmock_cook_book.html
[S4]: https://docs.pact.io/getting_started/how_pact_works
[S5]: https://hypothesis.readthedocs.io/en/latest/
[S6]: https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html
[S7]: https://llvm.org/docs/LibFuzzer.html
[S8]: https://github.com/AFLplusplus/AFLplusplus/blob/stable/docs/fuzzing_in_depth.md
[S9]: https://www.microsoft.com/en-us/research/publication/finding-and-reproducing-heisenbugs-in-concurrent-programs/
[S10]: https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-chaos-engineering-overview
[S11]: https://clang.llvm.org/docs/ClangStaticAnalyzer.html
[S12]: https://clang.llvm.org/extra/clang-tidy/
[S13]: https://clang.llvm.org/docs/SourceBasedCodeCoverage.html
[S14]: https://docs.github.com/en/copilot/responsible-use/agents
[S15]: https://hypothesis.readthedocs.io/en/latest/stateful.html
