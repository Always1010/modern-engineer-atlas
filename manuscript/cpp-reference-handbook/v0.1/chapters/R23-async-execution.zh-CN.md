# 异步执行、事件循环与任务调度

任务是待执行的工作；执行器决定怎样执行；队列保存待办；线程承载实际执行；事件循环按事件推进操作。本章先建立这些对象及正常提交流程，再介绍背压、关闭和 C++20 协程。

**范围与先修**：基础使用 C++17；协程标 C++20。执行器/线程池是本章工程抽象，不是 C++17/20 的通用标准库类型。先修为所有权、[异步结果](R20-threads-async.zh-CN.md)、锁与条件变量；平台 epoll/IOCP API 集中在 [系统 I/O](R26-syscalls-file-io.zh-CN.md)。

## 任务与执行环境

**基础概念**。任务（task）是一份可调用工作及其输入、状态和结果协议；执行线程（execution thread）是执行指令的线程。异步表示调用与完成分离，并发表示多份工作可交错推进，并行表示工作同时推进。

| 实体 | 保存或承载 | 正常操作 |
| --- | --- | --- |
| 任务 | 函数、捕获的数据、结果状态 | 构造、提交、执行、完成 |
| OS 线程 | 实际指令执行 | 启动、等待、回收 |
| 执行器 | 接受与执行策略 | 提交、拒绝、关闭 |
| 待办队列 | 尚未开始的任务 | 入队、取出、排空 |
| 线程池 | 有限工作线程与队列 | 工作者取任务并执行 |
| 事件循环 | 待处理事件与操作状态 | 等待事件、分发、更新状态 |

任务最短操作可以是保存函数后调用，片段需 `<functional>`：

```cpp
std::function<int()> work = [] { return 6 * 7; };
int value = work();
```

这在当前线程计算 42；没有异步保证。捕获引用/this 不自动保活对象，执行器接受工作也不能从类型名字推断借用寿命。

## 执行器与提交协议

**基础操作**。执行器（executor）接受工作并规定其执行位置、次数与结果去向。提交接口首先声明：成功代表已接受还是已经运行，能否内联执行，哪些线程调用工作，拒绝时是否已有副作用，异常如何报告。

![任务、执行线程与结果通道](../resources/R23-task-flow.svg)

图23-1：提交成功后，待办进入队列，工作线程取出并执行，结果经共享状态交付。队列锁只保护队列；结果通道不延长任务借用对象寿命。

配套 Executor 的项目接口摘要如下；它不是 std 类型，源码见后面的组合应用：

```cpp
template<class F>
std::optional<std::future<int>> try_submit(F&& work);
void close_and_wait();
```

`try_submit` 接收返回 int 的工作，成功返回关联结果的 future，满队列或关闭返回 nullopt；分配/构造仍可抛异常。下面假设 `executor` 是配套 Executor，需 `<future>`、`<optional>`，`consume` 由调用方提供：

```cpp
auto result = executor.try_submit([] { return 6 * 7; });
if (result) consume(result->get());
else { /* 尚未接受，调用方决定重试或拒绝 */ }
```

get 可以等待或重抛任务异常。不能让所有池内工作者同步等待只能由同一池执行的后继任务，否则可能耗尽全部执行能力。

## 队列与工作线程

**基础操作**。待办队列和执行中的工作分别计数。正常工作线程循环为：

1. 取得队列锁，等待“有任务或不再接受”。
2. 有任务时移出一项；关闭且队列空时结束。
3. 释放队列锁。
4. 执行任务，交付值或异常，再处理下一项。

以下摘录需 `<queue>`、`<future>`、`<mutex>`、`<condition_variable>`、`<utility>`；沿用配套 Executor 中的 `mutex_`、`changed_`、`accepting_` 和 `queue_`。queue_ 保存 `packaged_task<int()>`，片段位于 worker 的循环体：

```cpp
std::packaged_task<int()> task;
{
    std::unique_lock<std::mutex> lock(mutex_);
    changed_.wait(lock, [this] { return !accepting_ || !queue_.empty(); });
    if (queue_.empty()) return;
    task = std::move(queue_.front());
    queue_.pop();
}
task();
```

用户工作在锁外执行；packaged_task 将工作异常交给 future。队列锁不保护任务访问的所有业务对象；这些对象由自己的同步契约管理。工作者间的处理完成顺序也未必等于入队顺序。

## 线程池与背压

**机制解释**。线程池复用有限工作线程处理任务。背压（backpressure）是过载时限制上游继续提交的机制，容量限制只限制待办，不包含执行中任务、尚未取走结果及外部 I/O 缓冲。

| 提交策略 | 调用方观察 | 需约定的条件 |
| --- | --- | --- |
| 立即拒绝 | 未进入队列 | 是否可重试、是否有副作用 |
| 等待空位 | 提交可能阻塞 | 期限、关闭唤醒、是否允许工作者提交 |
| 丢弃或替换 | 某些工作不执行 | 哪些可丢、结果如何达到终态 |
| 优先级接受 | 高优先级先取得资源 | 低优先级饥饿与各类容量 |

按条目数设限仍可能持有大量字节；应按工作负载定义单项尺寸、累计数据与在途数量。工作者向同一满队列阻塞提交可能堵住所有消费者。排队时间与执行时间分开记录，才能判断任务没开始还是计算本身慢；并发数量需依据 CPU 工作、阻塞比例及测量决定，hardware_concurrency 只是提示。

## 事件循环与操作状态

**基础操作**。事件循环（event loop）反复取得事件，查找操作对象，并推进状态机。一个线程可以管理多个等待 I/O 的操作；它不要求一个连接对应一条线程。

以收消息为例，状态依次为读头 → 验证长度 → 读载荷 → 交付 → 继续或关闭。每次事件后要保存实际进度，不把一次 recv 当成整条消息，分帧规则见 [socket 编程](R29-sockets-production.zh-CN.md)。

| 状态字段 | 用途 | 结束条件 |
| --- | --- | --- |
| 输入缓冲与已读偏移 | 下次从未完成位置继续 | 无操作和视图借用 |
| 输出数据与已发偏移 | 短写不重复已发前缀 | 发送完成或协议终结 |
| 截止时间与终态 | 共享预算、只交付一次结果 | 终态已交付且无在途访问 |
| 身份与代次 | 识别关闭重建后的旧事件 | 旧操作全部结束 |

单线程循环可简化状态访问，但提交端、后台计算或回调重入仍可能并发。需指定哪个线程修改哪个操作状态；后台结果回到循环后校验身份与代次。长计算应转交受控执行资源，回调保持短，避免堵住其他事件。

## 就绪与完成模型

**机制解释**。就绪事件提示现在可能取得进展，应用随后调用读写接口；完成事件交付先前操作的结果，应用消费状态和实际数量。正常流程分别为：

- 就绪：注册关注 → 等待提示 → 执行非阻塞读写 → 保存偏移 → 更新关注。
- 完成：提交操作与缓冲 → 等待完成 → 检查状态和数量 → 结束或再次提交。

Linux epoll 使用前者；Windows IOCP 使用后者。连接、缓冲、取消与释放责任不同，不能把一套接口改名作为另一平台实现。API、边沿触发和取消完成规则只在 [R26 系统 I/O](R26-syscalls-file-io.zh-CN.md) 维护。

## 超时、取消与终态

**机制解释**。超时是等待预算耗尽，取消是请求工作停止，完成是达到协议终态。future 定时等待超时后，任务可能仍执行并提交副作用；业务结果未知与重试见网络章。

同一操作的成功、超时和取消可竞争，需由指定线程或同步保护只交付一次终态。取消协议说明：未开始任务是否移除，在途工作在哪些点观察，阻塞等待如何唤醒，最后谁确认结束。仅设置标志不使所有等待者自动醒来。

## 执行资源关闭

**基础操作**。关闭顺序是停止接受 → 处理待办 → 处理在途 → 确认退出 → 释放资源。

![关闭执行资源的顺序](../resources/R23-shutdown.svg)

图23-2：停止请求与确认停止是不同事件。先确认任务/回调不再借用，再销毁队列、缓冲或插件。

1. 新提交得到明确拒绝，防止销毁期间继续入队。
2. 待办按契约排空，或取消并交付对应结果；不能丢任务后留下永不完成的 future。
3. 在途工作正常结束或观察停止请求，唤醒条件变量/I/O 等待。
4. join 工作者或确认所有异步操作终态。
5. 销毁共享资源。

用户工作可能永不返回，排空就没有固定完成上界。执行器工作者不能等待自身退出；关闭/析构由控制线程负责，并与外部提交者协调。

## 有界执行器组合应用

[r23-executor.cpp](../examples/r23-executor.cpp) 保留一个工作线程、容量 2 的队列及 packaged_task<int()> 的完整实现。它定义非阻塞提交、异常结果与排空关闭；不支持优先级、取消在途或通用返回类型。

接受、执行、交付和关闭分别有位置：try_submit 在锁下决定接受并入队，run 移出后在锁外调用，packaged_task 保存异常，close_and_wait 改 accepting 并唤醒后 join。关闭/析构仅由控制线程调用；对象销毁时无外部提交者。完整程序中的确定性门闩用于展示拒绝，不作为基础线程池接口的一部分。

## 协程语法与帧（C++20）

**基础概念**。协程是含 `co_await`、`co_yield` 或 `co_return` 的可挂起函数。协程帧保存跨挂起点继续执行所需状态；挂起返回控制权，恢复从该点继续，完成后仍可能等待帧销毁。协程本身不提供线程池、网络 I/O 或取消策略。

返回类型的 `promise_type` 为编译器提供创建结果、初始/最终挂起、返回值或异常处理钩子；它不是 std::promise。等待器的 `await_ready/await_suspend/await_resume` 决定是否挂起、如何交付恢复与返回值。`co_return expr` 交给 promise 的 return_value，void 形式交给 return_void；`co_yield expr` 通过 yield_value 形成等待。[协程定义](https://timsong-cpp.github.io/cppwp/n4861/dcl.fct.def.coroutine)、[co_await](https://timsong-cpp.github.io/cppwp/n4861/expr.await)

## std::coroutine_handle 与挂起策略（C++20）

**机制解释**。`<coroutine>` 的 `coroutine_handle<Promise>` 引用协程帧，不自动拥有帧；resume 恢复、done 查询最终挂起状态、destroy 销毁。`suspend_always` 总挂起，`suspend_never` 不挂起。恢复/销毁必须协调，不能恢复已完成的帧。

下面仅展示一次手动挂起与恢复所需支撑，需 `<coroutine>`、`<exception>`；Pause 独占帧，禁止复制，最终挂起由析构销毁。

```cpp
struct Pause {
    struct promise_type;
    using Handle = std::coroutine_handle<promise_type>;
    Handle handle;
    explicit Pause(Handle h) : handle(h) {}
    Pause(const Pause&) = delete;
    Pause& operator=(const Pause&) = delete;
    ~Pause() { handle.destroy(); }
    struct promise_type {
        Pause get_return_object() { return Pause{Handle::from_promise(*this)}; }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_void() noexcept {}
        void unhandled_exception() { std::terminate(); }
    };
};
Pause pause_once() {
    co_await std::suspend_always{};
    co_return;
}
```

普通函数中的使用摘录：

```cpp
auto task = pause_once();
task.handle.resume(); // 从初始挂起进入，停在 co_await
task.handle.resume(); // 从 co_await 继续，停在最终挂起
bool finished = task.handle.done();
```

这里所有恢复都在调用线程，finished 为 true；离开作用域销毁帧。异步库需另行定义恢复线程、事件注销、错误、取消与最终所有权；帧存活不保活引用参数目标。协程 return 对象、等待器和事件循环是不同层。[协程库](https://timsong-cpp.github.io/cppwp/n4861/support.coroutine)

## 调度与关闭调查入口

| 现象 | 收集证据 | 处理方向 |
| --- | --- | --- |
| CPU 不高而延迟大 | 排队时间、待办数、线程栈 | 执行能力与阻塞依赖 |
| 关闭不返回 | 在途工作与等待条件 | 可达退出路径及终态确认 |
| 关闭后回调崩溃 | 身份、所有者、在途记录 | 借用寿命与注销协议 |
| 超时后仍有副作用 | 开始/完成/响应时间 | 分离超时、取消和业务结果 |
| 事件循环吞吐下降 | 回调耗时、队列长度 | 短回调、工作转交与背压 |
| future 永不完成 | 接受、执行、丢弃、提供者销毁 | 每个接受任务的结果协议 |

调试线程栈见 R31，测量等待与排队见 R32；测量帮助定位，正确性仍来自状态与寿命契约。
