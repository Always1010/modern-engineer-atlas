# 全书主题覆盖

每章四个主题均有正文，本表由当前分章标题对应维护；技术代码仍未执行。工业产品任务通过第二十五、二十八至三十一、五十七与五十八章连接，其余方向保留各自工作对象和限制。

| 章节 | 四个主题 |
|---|---|
| 第一章 用约束描述工程问题 | 输入输出与不变量；复杂度和资源预算；概率统计与实验可信度；按需补齐线性代数 数值误差与离散数学 |
| 第二章 数据结构是怎样进入系统的 | 数组 链表 栈队列与环形缓冲；Hash Table Bitmap Bloom Filter；Tree Heap Trie Union Find 与 Graph；B B+ Tree Skip List 与索引访问成本 |
| 第三章 从算法选择到可解释的工程取舍 | 排序 二分与边界不变量；DFS BFS 图最短路 拓扑与依赖；贪心 动态规划 分治和字符串匹配；Top K LRU LFU 与算法在系统中的组合 |
| 第四章 数据与协议的共同语言 | 整数 浮点 字节序和溢出；字符编码 Unicode 时间与单位；序列化 Schema 演进与兼容；状态机 协议解析与不可信输入 |
| 第五章 处理器与内存层次 | 处理器流水线 分支预测与乱序执行；Cache Cache Line SIMD 与局部性；Cache Coherence NUMA 与内存带宽；性能计数器和硬件差异的证据边界 |
| 第六章 地址空间与虚拟内存 | 地址空间 页表 TLB 地址转换缓存与缺页；mmap Copy on Write 与文件映射；Stack Heap 与分配器到页面的关系；内存压力 缺页与映射错误诊断 |
| 第七章 操作系统提供的执行与资源模型 | 进程 线程 Scheduler 与 Context Switch；系统调用 权限 文件描述符与句柄；IPC Signal 共享内存与同步边界；文件系统 I/O 持久化与资源隔离 |
| 第八章 编译链接装载与二进制边界 | 从源码到可执行文件 编译 汇编与目标文件；符号 链接 ODR 动静态库与 LTO；Loader 重定位 ELF PE 与调试信息；ABI 调用约定 版本边界和跨语言 FFI |
| 第九章 对象生命周期与资源所有权 | 存储期 对象生命周期与初始化；Pointer Reference 悬空与别名；RAII unique_ptr shared_ptr weak_ptr；所有权图 循环引用与资源退出路径 |
| 第十章 值语义与泛型参数传递 | Copy Move 与特殊成员函数；Value Category 临时对象与生命周期延长；转发引用 完美转发与引用折叠；返回值优化 noexcept 与接口取舍 |
| 第十一章 对象模型与可观察边界 | 布局 Alignment Padding 与标准布局；Virtual Function RTTI 多态与类型擦除；继承组合 对象切片与析构边界；Undefined Behavior 语言保证与 ABI 实现实例 |
| 第十二章 泛型编程与编译期表达 | Template 推导 特化与实例化；Concepts Constraints 与可诊断接口；constexpr consteval 类型萃取与编译期算法；编译成本 错误消息和泛型库边界 |
| 第十三章 标准库容器算法与分配 | STL Container Iterator Algorithm 与 Range；vector size capacity reallocation 与异常保证；Allocator PMR 缓存局部性与失效规则；string optional variant 等值类型与 span string_view 非拥有视图 |
| 第十四章 错误处理与健壮的库接口 | Exception 安全级别和栈展开；错误码 expected 与故障传播；契约 断言 不变量与 API 可用性；异常禁用环境 跨 DLL 边界和长期兼容 |
| 第十五章 标准演进与项目迁移 | C++11 与 14 的资源 值语义和泛型转折；C++17 的值类型与结构化表达；C++20 与 23 的 Concepts Ranges Modules Coroutine 及库演进；C++26 草案特性 工具链成熟度与迁移策略 |
| 第十六章 同步原语与线程组织 | Thread Mutex RWLock 与死锁；Condition Variable Semaphore 与等待谓词；Future Promise 任务队列与线程池；关闭 取消 异常传递和背压 |
| 第十七章 从语言内存模型理解原子操作 | 数据竞争 先行发生关系与可见性；Atomic CAS 与 Memory Ordering；Acquire Release Relaxed 和顺序一致性的适用边界；编译器重排 CPU 排序与 Cache Coherence 分层对照 |
| 第十八章 无锁结构与安全回收 | 进展保证 Lock Free Wait Free 与饥饿；ABA 问题和线性化点；Hazard Pointer Epoch 与 RCU 安全回收；无锁队列的验证 代价与互斥方案比较 |
| 第十九章 异步 IO 协程与调度 | IO 多路复用 epoll 就绪通知与 IOCP 完成通知；Coroutine Frame suspend resume 与生命周期；Executor Scheduler 取消与结构化并发；Async IO 批处理 Zero Copy 语境及内核接口限制 |
| 第二十章 性能优化是一套实验方法 | Latency Throughput 尾延迟与排队；Benchmark 负载模型 热身和统计偏差；False Sharing Cache NUMA SIMD 与数据布局；Profiling perf Flame Graph 与端到端取舍 |
| 第二十一章 构建依赖与可复现交付 | CMake Targets Presets Ninja与增量构建；GCC Clang MSVC及编译选项；Conan vcpkg依赖锁定与二进制兼容；Cross Compilation Toolchain Sysroot与可复现构建 |
| 第二十二章 调试与故障证据链 | GDB LLDB断点栈帧与符号；Core Dump Crash Dump和现场保全；ASan TSan UBSan Valgrind的覆盖及盲区；最小复现 日志关联与跨层定位 |
| 第二十三章 从测试到可信验证 | Unit Integration System与契约测试；Property Based Fuzzing 差分测试与边界；并发测试 故障注入 确定性回放；静态分析 覆盖率 AI生成代码独立验收与发布门禁 |
| 第二十四章 协作版本与发布工程 | Git提交 分支 合并 Rebase和恢复；代码评审 文档 架构决策记录与需求追踪；CI CD制品 版本号 发布回滚与变更审计；许可证 SBOM 依赖漏洞与供应链完整性 |
| 第二十五章 架构设计与长期演进 | 质量属性 设计原则与模块边界；行为契约 对象协作与模式选择；兼容性迁移 技术债与系统拆分；设计评审 AI辅助开发的责任边界 成本和沟通交付 |
| 第二十六章 安全与内存安全工程 | 威胁建模 信任边界与最小权限；解析器 边界检查 整数和内存安全；Rust互操作 内存安全迁移与遗留系统防护；秘密管理 认证授权 TLS和漏洞响应 |
| 第二十七章 运行可靠性与平台工程 | SLI SLO错误预算与用户感知；日志 Metrics Trace和事故复盘；Docker 容器编排 配置发布与容量；平台工程 可观测性 成本和多租户隔离 |
| 第二十八章 MCU 与固件的硬件边界 | 板卡器件 内存映射与供电时钟；UART SPI I2C CAN USB和电气边界；中断 DMA缓存与寄存器访问；安全测量 调试 首板启动与烧录 |
| 第二十九章 实时系统与联网设备生命周期 | 从中断与缓冲所有权到RTOS时限预算；低功耗 唤醒与持续监听预算；OTA 双分区回滚 安全启动与设备身份；验证 制造 校准与现场维护 |
| 第三十章 Linux 内核驱动与系统软件 | 板级支持 启动链与内核接口；设备模型 驱动 IRQ DMA和内存屏障；文件系统 块层 网络栈与eBPF观测；隔离 故障定位与产品发布 |
| 第三十一章 Windows Qt 与设备上位机 | 事件驱动与工业应用职责；Qt对象模型与工站流程；设备通信 PLC与数据采集；部署 质量记录与生产追溯 |
| 第三十二章 网络设备与高性能数据平面 | NIC队列 中断合并 RSS与DMA；DPDK RDMA内核旁路适用条件；网络虚拟化 流控和可观测性；电信工业网络时延可靠性及CPU预算 |
| 第三十三章 网络协议与高性能服务 | Socket TCP拥塞 超时与连接生命周期；DNS TLS HTTP RPC及协议演进；事件驱动 线程池 缓冲和背压；序列化 连接池 负载均衡与故障排查 |
| 第三十四章 分布式正确性与中间件 | 部分失败 时钟 顺序与一致性；复制 共识 Leader与分区故障；消息队列幂等 重试 去重与事务边界；缓存失效 服务治理和跨地域取舍 |
| 第三十五章 存储引擎与持久化路径 | 磁盘SSD块接口 IO与写放大；B+ Tree LSM Tree Bloom Filter与Compaction；WAL Checkpoint崩溃恢复和校验；Buffer Pool Page Cache冷热分层与备份恢复 |
| 第三十六章 数据库内核与查询执行 | 关系模型 SQL解析计划与优化；执行器 Join向量化与索引选择；事务隔离 MVCC锁和死锁；分布式查询 HTAP及正确性验证 |
| 第三十七章 数据平台搜索与基础服务 | 批流处理 数据质量与事件时间；倒排索引 检索排序与ANN边界；Schema注册 数据血缘 权限与治理；云存储 可扩展调度及平台成本 |
| 第三十八章 音视频系统与实时通信 | 采样 PCM颜色空间与压缩；Codec H264 H265封装和FFmpeg；音视频时钟 同步 抖动缓冲与延迟；WebRTC采集 编解码 传输渲染和质量评测 |
| 第三十九章 图形管线与GPU渲染 | 坐标变换 光照采样和渲染数学；OpenGL Vulkan Shader与资源绑定；命令缓冲 同步 GPU内存和帧分析；实时渲染质量预算及跨平台兼容 |
| 第四十章 游戏工业仿真与可视化引擎 | 场景图 ECS资源与生命周期；空间索引 碰撞 物理和时间步进；CAD几何 网格与科学可视化边界；编辑器 资产流水线和大场景性能 |
| 第四十一章 编译器与语言实现 | Lexer Parser AST类型系统与诊断；中间表示IR与SSA控制流数据流与优化正确性；LLVM Pass后端寄存器分配与代码生成；MLIR多层中间表示和领域编译器 |
| 第四十二章 运行时互操作与开发者工具 | JIT AOT GC与运行时接口；LSP索引 静态分析和重构；C ABI FFI Python绑定 Rust边界；Wasm隔离 扩展系统与工具可用性 |
| 第四十三章 并行数值计算与 HPC | 浮点误差 稳定性 BLAS稀疏与稠密运算；SIMD OpenMP任务和负载分配；MPI通信 分解 扩展性和故障；Roofline Amdahl数据移动与科学结果验证 |
| 第四十四章 CUDA 编程与 GPU 性能 | GPU线程组织 SIMT Warp线程束 Block线程块与Grid网格；Register Shared Global Memory与Coalescing；Kernel Stream Event Graph和同步；Occupancy Tensor Core Nsight与优化取舍 |
| 第四十五章 训练与推理软件栈 | Tensor Autograd计算图与PyTorch Runtime；ONNX导出 动态Shape与算子覆盖；训练数据流水线 优化器检查点及训练推理差异；编译执行引擎 TensorRT与跨设备部署 |
| 第四十六章 算子量化与异构优化 | GEMM Attention布局和数值验收；Kernel Fusion Triton与手写CUDA取舍；量化 校准 精度性能和误差分布；CPU GPU NPU端侧部署与协同 |
| 第四十七章 模型服务与分布式 AI 系统 | 生成请求 KV缓存 预填充 解码与批处理；Serving队列 SLO容量和成本；并行策略 NCCL拓扑 通信与分布式推理；模型版本灰度 故障恢复和端到端观测 |
| 第四十八章 传感器坐标时间与系统集成 | LiDAR Camera IMU Encoder电机与传感链；坐标系 TF标定 时间同步和单位；概率估计 Kalman及多传感器融合；仿真 日志回放 SIL HIL与现实差距 |
| 第四十九章 ROS 2 中间件与机器人软件平台 | Node Topic Service Action与执行器；DDS QoS发现 生命周期和通信诊断；组件部署 实时内存分配与延迟；ros2_control驱动接口及端云分工 |
| 第五十章 感知定位与 SLAM | 感知前处理 特征关联和模型误差；里程计 定位 地图与回环；滤波优化 因子图与可观测性；数据集真值 场景覆盖和退化检测 |
| 第五十一章 规划控制与闭环行为 | Graph Search采样规划与约束；轨迹优化 碰撞时序与行为决策；PID LQR MPC离散化和稳定性；执行延迟 饱和 安全停止与故障降级 |
| 第五十二章 自主系统的可靠性与安全论证 | 自动驾驶ODD场景和系统边界；Safety与Security 风险分析与需求追踪；功能安全 SOTIF验证及标准适用性；仿真覆盖 现场数据 变更影响和安全案例 |
| 第五十三章 模型 API 与 AI 应用边界 | LLM API上下文 Token成本和失败模式；Structured Output Schema验证与流式交互；Tool Calling参数 校验 副作用与幂等；模型选型 隐私 配额和产品可用性 |
| 第五十四章 检索增强与知识系统 | 文档摄取 Chunking Embedding与元数据；全文向量混合检索 Rerank和权限过滤；引用 溯源 更新删除与信息时效；检索评测 生成评测 泄漏与成本 |
| 第五十五章 可恢复的 Agent 与工具协议 | Agent Loop Workflow 状态与停止条件；任务记忆 状态检查点 长任务与人工介入；MCP 协议版本 发现能力 授权和信任边界；Multi Agent 分工 通信 成本与适用性 |
| 第五十六章 AI 系统的评测安全与运营 | 任务成功率 数据集分层及回归；Trace Observability在线反馈与成本归因；Prompt Injection工具滥用 Sandbox和权限；人工审批 回滚 补偿 长任务故障恢复 |
| 第五十七章 从知识点到面试追问与能力证明 | 岗位 JD 拆解 能力证据与项目复盘；六层追问链和现场推理；编码 调试 性能 系统设计与行为面试；未知问题 假设说明 权衡及评分标尺 |
| 第五十八章 跨层工程项目与作品集 | 事件驱动服务与崩溃恢复存储；设备产品测试校准与可追溯工站；GPU 算子和可测量模型服务；机器人回放或可恢复 Agent 的验收与复盘 |
