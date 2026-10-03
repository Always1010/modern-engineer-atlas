# 技术来源台账

统一访问日期：2026-10-03。F为官方规范/维护者文档，P为项目或团队实践。台账中的“支撑”说明采用范围，不表示整份外部文档已逐句审读。动态网页需在写章时锁定具体版本。没有引用社区帖作为技术规范，没有运行所列工具。

## 标准与编译实现

- S01 F [ISO C++已出版标准目录](https://www.iso.org/standard/83626.html)：ISO/IEC14882:2024为C++23；下一版显示DIS状态。支撑C15的出版状态，不代表全部编译器支持
- S02 F [WG21 N5051编辑报告](https://www.open-std.org/JTC1/SC22/WG21/docs/papers/2026/n5051.html)：2026-06-01，N5050是C++26最终工作草案、DIS基础及C++29初始草案；本书C++26锁此基线
- S03 F [WG21 N5050固定草案](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5050.pdf)：C09—C18涉及C++26部分的语言语义校核入口；C++20和23分别使用附录一固定参照；后续正文按条款逐项核查，不以滚动网页替代固定版
- S04 F [WG21 N5055编辑报告](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/n5055.html)：N5054属于C++29后续工作；不能把最新工作草案全部标记为C++26
- S05 F [GCC C++状态](https://gcc.gnu.org/projects/cxx-status.html)：特性级支持和开关；C++26实验性、consume按acquire处理并弃用的变化需要版本标签
- S06 F [libstdc++状态](https://gcc.gnu.org/onlinedocs/libstdc++/manual/status.html)：标准库支持需和前端支持分别核查
- S07 F [Clang C++状态](https://clang.llvm.org/cxx_status)：特性级语言状态，不代表libc++完成度
- S08 F [libc++ C++23](https://libcxx.llvm.org/Status/Cxx23.html)与[libc++ C++26](https://libcxx.llvm.org/Status/Cxx26.html)：库特性状态
- S09 F [MSVC语言符合性](https://learn.microsoft.com/en-us/cpp/overview/visual-cpp-language-conformance?view=msvc-170)：语言/库版本与工具集，不能预设VS2022仍为最新

## 系统与二进制

- S10 F [Itanium C++ ABI](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)：对象布局、虚表和RTTI属于特定ABI；不升级为ISO普遍规则
- S11 F [x86-64 psABI维护仓库](https://gitlab.com/x86-psABIs/x86-64-ABI/-/blob/master/README.md)：ELF调用约定等系统ABI，与C++ ABI分层
- S12 F [Windows x64调用约定](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170)：寄存器、shadow space、unwind与平台边界
- S13 F [libstdc++ Dual ABI](https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_dual_abi.html)：标准模式与ABI选择不是一回事
- S14 F [MSVC二进制兼容](https://learn.microsoft.com/en-us/cpp/porting/binary-compat-2015-2017?view=msvc-170)：链接器/运行库条件和LTO限制，不作无条件承诺
- S15 F [Linux内存屏障](https://docs.kernel.org/core-api/wrappers/memory-barriers.html)：编译器、CPU、设备访问的区分；不是C++用户态规范，也不是所有硬件的规范
- S16 F [Intel SDM官方入口](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)：本轮入口为2026-09-21版本093，C05/C06的处理器参考；其他架构须另行审读
- S17 F [Linux pthreads](https://man7.org/linux/man-pages/man7/pthreads.7.html)：线程共享/独有状态、NPTL及futex背景
- S18 F [Linux epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)：LT/ET及非阻塞约束
- S19 F [Windows IOCP](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports)：完成通知与线程调度，不能等同epoll就绪模型

## 工程工具与交付

- S20 F [CMake编译特性](https://cmake.org/cmake/help/latest/manual/cmake-compile-features.7.html)：标准模式与具体特性能力不同
- S21 F [CMake Modules](https://cmake.org/cmake/help/latest/manual/cmake-cxxmodules.7.html)：工具链/生成器限制，不能宣称普适替代include
- S22 F [CMake Presets](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html)、[Conan锁文件](https://docs.conan.io/2/tutorial/versioning/lockfiles.html)、[vcpkg版本](https://learn.microsoft.com/en-us/vcpkg/users/versioning)：环境与依赖入口
- S23 P [Reproducible Builds定义](https://reproducible-builds.org/docs/definition/)：依赖锁定不自动等于逐位可复现
- S24 F [GDB手册](https://sourceware.org/gdb/current/onlinedocs/gdb.html/)、[LLDB教程](https://lldb.llvm.org/use/tutorial.html)、[Windows调试器](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/)：C22的调试环境入口
- S25 F [Linux perf安全](https://docs.kernel.org/admin-guide/perf-security.html)：性能观测的权限和数据泄露边界
- S26 F [ASan](https://clang.llvm.org/docs/AddressSanitizer.html)、[TSan](https://clang.llvm.org/docs/ThreadSanitizer.html)、[UBSan](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)：检测覆盖/平台不同，检测通过不是正确性证明
- S27 F [libFuzzer](https://llvm.org/docs/LibFuzzer.html)：维护状态和版本匹配；不是唯一或普遍最新路线
- S28 F [NIST SSDF1.1](https://csrc.nist.gov/pubs/sp/800/218/final)：安全开发框架，用于C24/C26，不代替行业认证
- S29 F [SLSA1.2](https://slsa.dev/spec/v1.2/)、[SPDX](https://spdx.dev/use/specifications/)、[CycloneDX](https://owasp.org/projects/cyclonedx)：来源、构建、成分表达分工；SBOM不保证没有漏洞
- S30 P [Google SRE实施SLO](https://sre.google/workbook/implementing-slos/)：公开团队方法，支撑可靠性与错误预算教学；不是所有组织统一规范
- S31 F [CISA内存安全路线](https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps)：讨论风险治理与迁移方向；不解释为所有C++必须立即废弃

## GPU 与 AI 系统

- S32 F [CUDA最佳实践](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)：迭代优化、内存和数值精度，支撑C43/C44
- S33 F [NCCL Communicators](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/communicators.html)：异步错误及通信恢复，支撑分布式GPU故障语义
- S34 F [ONNX Runtime图优化](https://onnxruntime.ai/docs/performance/model-optimizations/graph-optimizations.html)：优化产物受provider与目标硬件约束
- S35 F [TensorRT10.x最佳实践](https://docs.nvidia.com/deeplearning/tensorrt/10.x.x/performance/best-practices.html)：作为明确版本案例，不宣称为最新版
- S36 F [Triton Inference Server指标](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/metrics.html)：排队、计算、输入输出和GPU指标；注意与Triton编程语言同名不同项目
- S37 F [Nsight Compute性能分析](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html)：replay与观测扰动，C20/C44的测量边界

## 机器人

- S38 F [ROS2 Clock and Time](https://design.ros2.org/articles/clock_and_time.html)：系统/稳定/ROS时间和跳时；设计文档需结合具体发行版行为
- S39 F [ros2_control Jazzy Controller Manager](https://control.ros.org/jazzy/doc/ros2_control/controller_manager/doc/userdoc.html)：控制周期、抖动和调度；不是硬件无关实时保证
- S40 F [ROS与Gazebo配套安装](https://gazebosim.org/docs/ionic/ros_installation/)：发行版匹配，教材测试基线待选；不混搭不同版本教程
- S41 F [OpenCV4.13相机标定](https://docs.opencv.org/4.13.0/dc/dbb/tutorial_py_calibration.html)：内外参、畸变、重投影误差的参考入口
- S42 F [Nav2 Collision Monitor](https://docs.nav2.org/rolling/configuration_and_development/configuration_guide/core_servers/collision_monitor/configuring_collision_monitor_node/)：普通软件监测不提供硬实时安全认证；rolling配置需回到锁定发行版

## Agent与检索

- S43 F [MCP2025-11-25安全最佳实践](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices)：confused deputy、SSRF、token passthrough和会话边界；已核验路径，不等于声称是最新协议
- S44 P [Azure RAG端到端评测](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-llm-evaluation-phase)：质量、安全和实验报告；厂商参考架构不绑定唯一方案
- S45 P [Azure RAG检索阶段](https://learn.microsoft.com/azure/architecture/ai-ml/guide/rag/rag-information-retrieval)：检索指标与样本，和生成评测分开
- S46 F [OpenTelemetry GenAI约定维护仓库](https://github.com/open-telemetry/semantic-conventions-genai)：字段演进应放在线，不能默认为永久稳定接口
- S47 F [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)：状态持久化与恢复案例；checkpoint不是外部副作用exactly-once保证

## 关键事实与目录对应

C++26状态S01—S09对应C15；语言/ABI边界S03/S10—S14对应C08/C11；内存模型分层S03/S15/S16对应C17；IO模型S18/S19对应C19；工具限制S20—S29对应C21—C26；运行可靠性S30对应C27；GPU优化S32—S37对应C43—C47；机器人时间与安全S38—S42对应C48—C52；Agent安全与恢复S43—S47对应C53—C56。

C02/C03等稳定算法目录是课程编排提案，不是已完成文献综述；数据库、图形、媒体、控制、网络协议的逐章权威来源仍需在正式写作研究包补齐。该缺口已列入下一阶段，不用几十个未打开的链接伪装完成全面调查。
