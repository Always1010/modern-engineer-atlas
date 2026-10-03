# 标准与技术版本基线

核验日2026-10-03。下列为V1研究结论和教学建议，不是已经运行通过的环境。

- 官方事实：ISO/IEC14882:2024对应C++23；下一版为DIS。C++26技术工作完成/草案冻结与正式出版是不同里程碑
- 固定草案：WG21 N5050，经N5051说明为C++26最终工作草案与DIS基础。N5054等后续已进入C++29，不直接使用滚动草案填充C++26
- 教学建议：C++20为主线，C++23扩展，C++26前沿。遗留/嵌入式路线提供11/14/17桥接，不把全部项目迁移到最新标准当作正确答案
- C++11/14：移动、lambda、智能指针、线程/原子、constexpr与泛型lambda
- C++17：保证复制消除、结构化绑定、if constexpr、optional/variant/string_view、filesystem、并行算法
- C++20：Concepts、Ranges、span、Coroutine、Modules、jthread/stop_token、atomic wait和同步原语
- C++23：expected、print、mdspan、generator、显式对象参数、Ranges扩展
- C++26候选教学主题：reflection、contracts、异步执行控制、SIMD、固定容量容器、库强化和安全回收；逐项记录草案条款/提案与实现支持。不是所有项目现成可用的功能清单
- 单独警示：C++17执行策略与C++26异步执行控制不同；C++26弃用memory_order::consume并将其按acquire处理，不能再沿用独立依赖排序语义，也不能误称排序保证变弱
- 环境矩阵需分别列前端、标准库、编译选项、生成器、架构、ABI、OS。-std或CMake标准模式成功不能证明整个标准可用
- 工具限制例：TSan不能默认计划Windows对称覆盖；CMake Modules仍有生成器/工具链限制；依赖锁定不保证逐位可复现
- GPU/机器人/AI：TensorRT10.x、ROS2 Jazzy、MCP2025-11-25在本轮作为明确版本参考，不宣称各自为当前最新。选定实际教学环境后重新核验支持周期、兼容矩阵和原始依赖

- 主线版本分开校核：C++20公开固定参照[N4861](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)，[N4859](https://open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4859.html)说明其对应DIS内容，仍需跟踪出版差异和缺陷报告；C++23参照[N4950](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4950.pdf)，由[N4951](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html)确认最终工作草案；C++26参照N5050。不能用26版新增规则反向宣称20版已有。
- consume变化来源：[P3475R2](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2025/p3475r2.pdf)，以及N5050的D.24.5 [depr.atomics.order]。
