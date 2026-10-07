# 第30章 性能与资源排障

先确定损失发生在计算、等待还是资源积压，再挑工具。一次微基准只能回答它设定的负载问题，不能自动代表线上吞吐、尾延迟或内存峰值。

**基线**：测量示例 C++17，平台工具分别标明。**先修**：容器与算法、CPU缓存、并发、I/O和网络。优化结论需要数据，不给容器或语言设施做无条件性能排名。

## 1 指标与观察口径

| 指标 | 说明 | 必须附带的条件 |
| --- | --- | --- |
| 吞吐量 | 单位时间完成多少工作 | 请求类型、并发度、成功标准 |
| 延迟及 p95/p99 | 单次工作耗时及分布尾部 | 采样范围、时间窗口、失败与超时是否计入 |
| CPU 使用 | 已消耗的处理器时间 | 单核／整机口径、进程／线程、采样间隔 |
| RSS／工作集 | 当前驻留的部分内存状态 | 平台定义、共享页口径，不等于活对象总量 |
| 队列长度与等待时间 | 工作积压与服务速度 | 队列上限、取消与拒绝策略 |

p99 不是最大值，小样本也不适合强行给出稳定尾部分位数。CPU不高但延迟高，可能在等待锁、I/O或调度；CPU高也可能是无效轮询，不代表有效工作多。

![性能问题的计算等待与积压分流](../resources/R30-performance-triage.svg)

图30-1：分流决定下一步收集什么证据。图是调查路径，不承诺某个症状只有一个原因，也不是靠一张火焰图就能证明因果。

## 2 profiler 与 benchmark 分别回答什么

| 方法 | 擅长回答 | 不能独立证明 |
| --- | --- | --- |
| CPU 栈采样 | CPU 时间常落在哪些调用路径 | 等待时间的全部原因、每次操作精确成本 |
| 硬件计数器 | 指令、分支、缓存等事件的统计 | 单个指标升高就是根因 |
| 事件／等待分析 | I/O、调度、锁等待的时间关系 | 没有事件就是没有等待 |
| 微基准 | 控制条件下两个实现的成本差异 | 线上全负载、可靠性与资源上限 |

Linux 的 perf stat 可统计命令期间的性能事件，perf record/report 采集与查看样本；硬件、权限和内核配置决定可用事件。不要为用 perf 擅自放宽整机安全配置。[perf stat](https://man7.org/linux/man-pages/man1/perf-stat.1.html)、[perf 权限](https://docs.kernel.org/admin-guide/perf-security.html)。

Windows 可用 WPR 收集 ETW 事件，WPA 分析对应跟踪；记录规模、权限和隐私也需控制。工具名称类似不代表指标定义完全相同。[WPR](https://learn.microsoft.com/en-us/windows-hardware/test/wpt/windows-performance-recorder)。

## 3 测量区间与正确性结果

例子将准备输入放在测量区间外，并保留可核对的结果；它演示计时范围，不是防优化完备的 benchmark，也不给特定机器规定耗时。

```cpp
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <vector>
int main() {
    constexpr std::uint64_t n = 4096, rounds = 64;
    std::vector<std::uint64_t> values(n);
    std::iota(values.begin(), values.end(), std::uint64_t{0});
    std::uint64_t checksum = 0;
    const auto start = std::chrono::steady_clock::now();
    for (std::uint64_t r = 0; r < rounds; ++r) {
        ++values[static_cast<std::size_t>(r % n)];
        checksum += std::accumulate(values.begin(), values.end(),
                                    std::uint64_t{0});
    }
    const auto elapsed = std::chrono::steady_clock::now() - start;
    const auto expected = rounds * n * (n - 1) / 2 +
                          rounds * (rounds + 1) / 2;
    if (checksum != expected || elapsed < decltype(elapsed)::zero())
        return 1;
    std::cout << "checksum=" << checksum << " elapsed_ns="
              << std::chrono::duration_cast<std::chrono::nanoseconds>(elapsed).count()
              << '\n';
    return std::cout ? 0 : 2;
}
```

配套文件：[r30-performance.cpp](../examples/r30-performance.cpp)，按 R01 的 C++17 编译入口运行。固定校验和为 536741920；elapsed_ns 依机器和执行条件变化，不应写进精确结果断言。steady_clock 适合相对时间测量，不受系统墙钟校时影响；测量包括区间内的全部工作，既包含遍历也包含每轮对元素的修改。[steady_clock](https://timsong-cpp.github.io/cppwp/n4659/time.clock.steady)。

结果可观察仍不保证每一条源代码都实际执行。比较实现时使用真实输入、合适的防优化措施，必要时看汇编；即使 DoNotOptimize 也不阻止表达式自身被优化。重复测量、热身、负载交错和报告波动比只取最快一次更有意义。[Google Benchmark 防优化与统计](https://github.com/google/benchmark/blob/main/docs/user_guide.md)。

## 4 常见排障路径

| 问题 | 优先收集 | 可能的改进 | 必须继续验证 |
| --- | --- | --- | --- |
| CPU 高 | 热点栈、有效工作量、指令与分支 | 算法、重复解析、减少忙等 | 正确性、不同数据规模 |
| 延迟高 | 分阶段时间、线程栈、I/O与队列 | 锁粒度、批处理、截止时间 | 尾延迟与过载行为 |
| RSS 增长 | 活对象、分配速率、容量与缓存 | 缩短保活、限制缓存、复用缓冲 | 不把驻留变化直接判为泄漏 |
| 线程卡死 | 全线程栈、锁顺序、等待谓词 | 退出通知、锁顺序、取消协议 | 不是增加随机超时掩盖死锁 |
| 连接耗尽 | 连接状态、池上限、请求寿命 | 复用、超时、背压、及时关闭 | 重试放大与资源回收 |

数据布局可以减少不必要的指针追踪，批量处理可能减少调用成本，但都依负载取舍。缓存、锁和 I/O 改进不能跳过性能对照：相同硬件、编译选项、输入规模与线程数，一次只改变可解释的因素。

## 5 优化交付检查

记录基线、实验条件、结果分布、正确性检查和回退策略。若吞吐更高却扩大无界队列，尾延迟与内存可能更糟；若去掉锁，则先证明数据访问与对象回收仍满足内存模型。

构建身份见R28，正确性检查见R29，容器成本见R13/R14，内存与I/O见R23至R25，网络过载见R27。没有可靠证据时，结论应是继续收集什么，而不是给出虚假的速度提升百分比。
