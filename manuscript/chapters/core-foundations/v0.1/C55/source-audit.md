# 第五十五章 可恢复的 Agent 与工具协议 来源与核验

核验日期：2026-10-03。完整正文见[第五十五章 可恢复的 Agent 与工具协议](C55-agent-recovery.zh-CN.md)。本记录保留来源定位、关键条件与验证边界。

## 核验重点

复核任务记忆、检查点、持久存储、操作身份、协议能力和多Agent协作。取消请求、底层执行及业务效果分开；厂商工程实例不外推为通用可靠性或效率保证。

本章四个规划主题已完成内容审读。代码、命令和技术实验未执行；图面检查与内容审读不等同运行验证。全书合版后的排版、交叉引用和阅读器验收仍待完成。

## 引用资料与适用范围

本章情境与执行轨迹为解释概念而构造，未执行示例或故障实验，未验证某套框架的生产表现。资料核验日为 2026-10-03。Agent 的定义采用本章说明的工程口径；厂商指南用于展示相关设计观点，不是统一行业标准。MCP 固定参照 2025-11-25；其他产品文档为核验时可见的滚动版本，实际选型需按使用版本复核。

1. [Anthropic Building effective agents][1]，最初发表于 2024-12-19。Agent 用语差异及工作流与动态选择的工程区分；其工具清单随时间更新，本章不据此推荐特定实现
2. [OpenAI A practical guide to building agents][2]。模型、工具、指令及执行流程的设计视角
3. [RFC 9110 HTTP Semantics §9.2.2][3]，2022-06。幂等语义及自动重试边界
4. [AWS Builders’ Library Making retries safe with idempotent APIs][4]。调用方操作标识、原子记录与意图区分
5. [Stripe Idempotent requests][5]。复用已保存结果及键清理后的接口行为
6. [LangGraph Interrupts][6]。中断恢复的重跑位置与副作用注意事项
7. [MCP Lifecycle][7]，2025-11-25。版本和能力协商
8. [MCP Tools][8]，2025-11-25。工具发现、调用、结构约束与注解信任
9. [MCP Authorization][9]，2025-11-25。传输授权、令牌适用对象与禁止透传
10. [MCP Tasks][10]，2025-11-25。实验性任务机制、结果获取、保留期限与取消
11. [MCP Cancellation][11]，2025-11-25。普通请求取消的边界

12. [Anthropic How we built our multi-agent research system][12]：特定研究系统中的协调与并行设计；不把其产品实验外推为普遍收益
13. [Anthropic Effective context engineering for AI agents][13]：2025-09-29，上下文压缩与持久记录的工程讨论；不等同于本书的已执行验证
14. [LangGraph Persistence][14]：持久检查点与状态恢复接口的具体框架实例

[1]: https://www.anthropic.com/engineering/building-effective-agents
[2]: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
[3]: https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2
[4]: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
[5]: https://docs.stripe.com/api/idempotent_requests
[6]: https://docs.langchain.com/oss/python/langgraph/interrupts
[7]: https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
[8]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
[9]: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
[10]: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks
[11]: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation

[12]: https://www.anthropic.com/engineering/multi-agent-research-system
[13]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[14]: https://docs.langchain.com/oss/python/langgraph/persistence
