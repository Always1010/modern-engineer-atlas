# 规划阅读术语速查

- JD：Job Description，招聘职位说明；样本只能证明该职位列出了什么要求
- ABI：Application Binary Interface，应用二进制接口；与源代码API兼容是两回事
- RAII：Resource Acquisition Is Initialization，用对象生命周期管理资源
- UB：Undefined Behavior，未定义行为；不能靠某次运行结果推断标准保证
- IR：在编译器中是Intermediate Representation，中间表示；本文件的检索领域直接写“信息检索”，避免同缩写歧义
- FFI：Foreign Function Interface，跨语言函数接口
- SIMD / SIMT：单指令多数据 / 单指令多线程，两种相关但不相同的执行表述
- NUMA：Non-Uniform Memory Access，非一致内存访问；访问代价随拓扑变化
- SLI / SLO：服务指标 / 服务目标；SRE是Site Reliability Engineering，站点可靠性工程
- RTOS / MCU：实时操作系统 / 微控制器
- WCET：Worst-Case Execution Time，最坏执行时间
- SIL / HIL：软件在环 / 硬件在环验证
- BSP：Board Support Package，板级支持包
- OTA：Over-the-Air，联网更新；具体链路和安全设计需说明
- DDS：Data Distribution Service，数据分发服务标准及相关中间件
- SLAM：Simultaneous Localization and Mapping，同时定位与建图
- ODD：Operational Design Domain，运行设计域；系统预期运行条件的边界
- SOTIF：Safety of the Intended Functionality，预期功能安全
- EDA / CAD / CAE：电子设计自动化 / 计算机辅助设计 / 计算机辅助工程
- HPC：High-Performance Computing，高性能计算
- GEMM：General Matrix Multiply，通用矩阵乘法
- TTFT / TPOT：首Token时间 / 每输出Token时间；具体统计口径必须固定
- RAG：Retrieval-Augmented Generation，检索增强生成
- MCP：Model Context Protocol，模型上下文协议；标准化接口不自动提供安全保证
- SBOM：Software Bill of Materials，软件物料清单
- ADR：Architecture Decision Record，架构决策记录
- Companion Site：配套网站，维护版本、实验、勘误与补充资料

速查只为读懂规划；正式章节仍应在首次引入概念时解释作用和边界，不能让读者反复翻缩写表才能继续。
