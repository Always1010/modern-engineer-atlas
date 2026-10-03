# 第五十八章 跨层工程项目与作品集 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

核验日期：2026-10-03。全部项目、数字与故障轨迹为原创教学构造，未执行项目代码、硬件实验、模型推理、机器人回放或外部业务动作。本章没有给出未实施测试的通过结果。

- [S1] Linux man-pages，fsync(2)：文件同步、目录项与错误边界
- [S2] Zephyr，System Power Management：系统级电源状态与策略
- [S3] Zephyr，Device Runtime Power Management：设备使用与运行时电源管理
- [S4] Qt 6.8，Threads and QObjects：线程亲和与事件驱动对象
- [S5] NVIDIA CUDA C++ Best Practices Guide：参照验证、数值差异与计时边界；不照搬其中历史设备性能为本项目结果
- [S6] NVIDIA TensorRT，Best Practices：可重复测量、资源边界与部署环境；本章不提供声称兼容所有版本的运行时代码
- [S7] ROS 2 rosbag2，Jazzy 分支 README：记录与回放、模拟时间；分支文档仍需与实际安装版本对应
- [S8] MCP 2025-11-25，Tasks：实验性任务能力及其生命周期边界
- [S9] NVIDIA TensorRT，How TensorRT Works：执行上下文的并发边界与引擎反序列化信任边界；滚动文档，应与实际部署版本核对
- [S10] NVIDIA CUDA Programming Guide，Device-Callable APIs and Intrinsics：Cooperative Groups 集体操作的参与要求；不把它推广为所有同步原语完全相同的退出规则

[S1]: https://man7.org/linux/man-pages/man2/fsync.2.html
[S2]: https://docs.zephyrproject.org/latest/services/pm/system.html
[S3]: https://docs.zephyrproject.org/latest/services/pm/device_runtime.html
[S4]: https://doc.qt.io/qt-6.8/threads-qobject.html
[S5]: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html
[S6]: https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/best-practices.html
[S7]: https://github.com/ros2/rosbag2/tree/jazzy
[S8]: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks
[S9]: https://docs.nvidia.com/deeplearning/tensorrt/latest/architecture/how-trt-works.html
[S10]: https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/device-callable-apis.html
