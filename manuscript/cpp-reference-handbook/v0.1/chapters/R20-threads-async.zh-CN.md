# 线程与异步结果

线程对象管理一条执行线程；异步结果对象管理一次计算的值或异常。本章先分别介绍启动与回收、结果提供与消费，再介绍启动策略和 C++20 协作停止。

**版本与先修**：核心接口自 C++11 提供，按 C++17 展开；`jthread` 与停止令牌标 C++20。先修为函数、lambda 捕获、移动、RAII 和异常。线程间共享数据的保护见 [互斥与线程协作](R21-mutex-coordination.zh-CN.md)。

## std::thread

**基础操作**。`<thread>` 的 `std::thread` 表示一条执行线程，可移动、不可复制。常用声明摘要：

```cpp
thread() noexcept;
template<class F, class... Args> explicit thread(F&& f, Args&&... args);
thread(thread&& other) noexcept;
bool joinable() const noexcept;
void join();
void detach();
thread::id get_id() const noexcept;
static unsigned hardware_concurrency() noexcept;
```

默认构造不关联线程；以可调用对象 `f` 和参数构造时启动线程。在 C++17，函数与参数按衰变后的类型保存；`std::ref`（`<functional>`）使参数以引用方式传递，调用者必须保活目标。普通返回值被忽略，返回结果需使用受同步保护的状态或 future。构造失败可抛 `system_error`；入口函数的未捕获异常导致 `terminate`。[thread 构造](https://timsong-cpp.github.io/cppwp/n4659/thread.thread.constr)

下面启动一条线程计算结果，再等待它结束。代码置于普通函数中，需 `<thread>`；工作期间主线程不访问 `value`，成功 `join` 后可读到 42。

```cpp
int value = 0;
std::thread worker([&] { value = 6 * 7; });
worker.join();
int answer = value;
```

`join()` 阻塞至线程结束，线程完成与成功 join 返回同步；不能加入自身，也不能对不可加入的对象调用。`detach()` 使 thread 对象不再关联线程，工作仍可继续；其数据寿命和完成确认由另一协议负责。`get_id()` 返回关联线程标识；空对象返回默认 id。`hardware_concurrency()` 是并发线程数提示，可为 0，不能据此直接推出最佳线程池大小。[thread 成员](https://timsong-cpp.github.io/cppwp/n4659/thread.thread.member)

| 操作后状态 | `joinable()` | 后续资源责任 |
| --- | --- | --- |
| 默认构造或移动源 | false | 无关联线程需回收 |
| 已启动，工作仍运行或已返回 | true | 仍需 join 或 detach |
| join 成功 | false | 已确认结束，可释放仅被该线程借用的数据 |
| detach 成功 | false | 另行保证游离线程的数据寿命与退出 |
| 移动到目标 | 目标接手关联 | 目标接手结束处理 |

析构或移动赋值覆盖一个仍 joinable 的对象会终止程序；异常路径同样要回收线程。RAII 能维护释放路径，但不能修复“工作者等待自己”的依赖关系。[thread 析构与赋值](https://timsong-cpp.github.io/cppwp/n4659/thread.thread.destr)

## std::this_thread

**基础操作**。`<thread>` 的 `std::this_thread` 命名空间操作当前线程：`get_id()` 返回当前 id，`yield()` 提供让出执行机会的提示；`sleep_for(duration)` 按相对时长等待，`sleep_until(time_point)` 按绝对时点等待。时长/时点来自 `<chrono>`，计时类型见 [时间库](R19-time-files.zh-CN.md)。

```cpp
std::this_thread::sleep_for(std::chrono::milliseconds(10));
auto id = std::this_thread::get_id();
std::this_thread::yield();
```

局部例需 `<thread>`、`<chrono>`。睡眠可能因调度延长，yield 不保证其他指定线程运行；两者都不建立共享数据的同步关系，不能用 sleep 证明另一个线程“已经完成”。[this_thread](https://timsong-cpp.github.io/cppwp/n4659/thread.thread.this)

## 异步共享状态

**基础概念**。共享状态保存一次结果或异常，以及是否就绪。提供者写入结果；结果持有者等待和读取。它不等于执行线程，也不负责保活计算所借用的外部对象。

| 提供者 | 建立与完成状态 | 执行方式 |
| --- | --- | --- |
| `promise<T>` | 构造状态，显式 set_value/set_exception | 调用方安排工作 |
| `packaged_task<R(Args...)>` | 构造状态，调用时保存值或异常 | 调用方、线程或执行器调用 |
| `async` | 返回关联状态的 future | 由启动策略决定 |

就绪可以表示值，也可以表示异常。`valid()` 只说明是否关联状态，未就绪仍可为 true。提供者放弃未就绪状态，会保存 `broken_promise` 并使状态就绪；它与工作计算抛出的异常含义不同。[共享状态](https://timsong-cpp.github.io/cppwp/n4659/futures.state)

## std::promise

**基础操作**。`<future>` 中 `template<class T> class promise;`，`T` 是结果类型；另有 `T&`、`void` 特化。默认构造建立共享状态，可移动、不可复制。常用接口：

```cpp
std::future<T> get_future();
void set_value(const T& value); // 非引用、非void形式
void set_value(T&& value);
void set_exception(std::exception_ptr error);
```

`get_future()` 每个共享状态只能成功取一次；`set_value` 保存结果并就绪，`set_exception` 保存非空异常指针并就绪。重复满足状态抛 `future_error`。引用特化用 `set_value(T&)`，不延长所指对象寿命；void 特化用无参数 `set_value()` 表示完成。

下面在提供者一侧先设值，再由结果持有者读取；片段需 `<future>`。创建 promise 本身不启动线程。

```cpp
std::promise<int> provider;
auto result = provider.get_future();
provider.set_value(42);
int value = result.get();
```

捕获计算异常时用 `<exception>` 的 `std::current_exception()` 交付：

```cpp
try { provider.set_value(compute()); }
catch (...) { provider.set_exception(std::current_exception()); }
```

这是替代上例设值语句的局部形式，`compute` 由调用方提供，且异常处理仅用于尚未被满足的状态。`set_value_at_thread_exit` / `set_exception_at_thread_exit` 保存结果，到当前线程退出时才使状态就绪；普通完成通常用立即就绪形式。[promise](https://timsong-cpp.github.io/cppwp/n4659/futures.promise)

## std::future

**基础操作**。`<future>` 中 `template<class T> class future;` 是唯一结果持有者，可移动、不可复制；默认构造无状态，通过 promise、packaged_task、async 或移动取得状态。

| 接口 | 参数与结果 | 状态变化 |
| --- | --- | --- |
| `valid()` | bool，是否关联状态 | 不表示就绪 |
| `wait()` | 无参数，等待就绪 | 不取走结果 |
| `wait_for(duration)` | 返回 `future_status` | ready / timeout / deferred，不取结果 |
| `wait_until(time_point)` | 同上，绝对时点 | 超时不取消工作 |
| `get()` | 等待并返回 T / T& / void；可重抛异常 | 释放状态，之后 valid 为 false |
| `share()` | 返回 `shared_future<T>` | 转移状态，原 future 无状态 |

等待与 get 要求关联有效状态；本章 C++17 基线不依赖无状态时实现会抛异常。下面检查相对等待状态；需 `<future>`、`<chrono>`，`result` 是已有效的 `future<int>`，`consume` 接收结果：

```cpp
auto status = result.wait_for(std::chrono::milliseconds(20));
if (status == std::future_status::ready) consume(result.get());
else if (status == std::future_status::deferred) { /* 选择触发执行或改用其他策略 */ }
else { /* 本次等待超时，任务可能仍在执行 */ }
```

ready 后 get 仍可抛异常。提供者完成到成功检测就绪之间有相应同步，但不覆盖提供者设值后继续修改的普通对象。[future](https://timsong-cpp.github.io/cppwp/n4659/futures.unique_future)

## std::shared_future

**基础操作**。`<future>` 中 `template<class T> class shared_future;` 允许多个结果持有者共享状态，可复制、可移动。可默认构造，或从 `future<T>&&` 构造/通过 `future::share()` 获得；等待接口与 future 同类，但 `get()` 不消耗状态，可重复调用。

普通 `T` 的 `get()` 返回 `const T&`；`T&` 特化返回 `T&`，void 特化只确认完成。引用随共享状态或被引用对象的寿命约束；多个线程宜分别持有自己的 shared_future 副本，结果对象后续访问仍要遵守同步规则。

```cpp
std::promise<int> p;
auto first = p.get_future().share();
auto second = first;
p.set_value(42);
int a = first.get();
int b = second.get();
```

局部例需 `<future>`，a、b 都为 42。`first` 与 `second` 并不代表两次计算。[shared_future](https://timsong-cpp.github.io/cppwp/n4659/futures.shared_future)

## std::packaged_task

**基础操作**。`<future>` 中 `template<class Signature> class packaged_task;`，重点形式为 `packaged_task<R(Args...)>`；模板参数是一种函数签名。默认构造无任务，以可调用对象构造保存任务和共享状态，可移动、不可复制。

```cpp
std::packaged_task<int(int)> task([](int x) { return x * 2; });
auto result = task.get_future();
task(21);
int value = result.get();
```

局部例需 `<future>`，值为 42。构造不执行任务；`operator()(Args...)` 调用包装函数并把返回值或异常保存到状态。`get_future()` 每个状态取一次；`valid()` 判断有无任务状态；重复调用已满足状态报错。`reset()` 保留任务并建立新的共享状态，随后重新取 future；原未完成状态被放弃。`make_ready_at_thread_exit(args...)` 调用任务而延迟到线程退出才使结果就绪。[packaged_task](https://timsong-cpp.github.io/cppwp/n4659/futures.task)

## std::async 与启动策略

**基础操作**。`<future>` 的 `std::async(policy, f, args...)` 返回对应结果类型的 future；省略 policy 的重载允许 async 或 deferred。此处描述调用形状，完整返回类型推导见草案。

```cpp
auto parallel = std::async(std::launch::async, [] { return 6 * 7; });
auto delayed = std::async(std::launch::deferred, [] { return 20 + 22; });
int a = parallel.get();
int b = delayed.get();
```

局部例需 `<future>`。async 策略安排独立线程执行，资源不足可抛异常；deferred 在第一次非定时等待时由等待线程执行。定时等待可返回 deferred，不能把它当作普通超时反复轮询。

异步策略共享状态的最后释放可能等待工作完成；丢弃临时 future 可能使连续调用看起来串行。持有工作需要的 mutex 时释放这种状态可能形成互等。普通 promise 的 future 没有 async 的线程等待规则。异常在 get 时重抛；future 无通用 cancel 成员。[async](https://timsong-cpp.github.io/cppwp/n4659/futures.async)

组合应用 [r20-async-result.cpp](../examples/r20-async-result.cpp) 保留值、异常及 get 后状态的完整演示；基本调用分别维护于以上条目。

## std::jthread（C++20）

**基础操作**。`<thread>` 的 jthread 可移动、不可复制；默认构造无线程，以函数构造时启动线程。若函数能接收 `std::stop_token`，构造会将令牌作为首参传入。普通 join、detach、joinable、get_id 与 thread 同类；另外提供 `get_stop_source()`、`get_stop_token()`、`request_stop()`。

```cpp
std::jthread worker([](std::stop_token token) {
    while (!token.stop_requested()) {
        // 执行一个有限、可返回的工作单元
    }
});
worker.request_stop();
worker.join();
```

局部例需 `<thread>`、`<stop_token>`。析构时若 joinable，先请求停止再 join；请求不强制终止线程，不自动中断 OS I/O，也不保证退出时间上界。工作必须有可达的观察点和阻塞唤醒路径。[C++20 jthread](https://timsong-cpp.github.io/cppwp/n4861/thread.jthread.class)

## 停止状态与令牌（C++20）

**基础操作**。`<stop_token>` 的 stop_source 是请求端，stop_token 是观察端，`stop_callback<Callback>` 为关联状态注册停止响应。source 默认建立停止状态，token 默认无状态；复制 source/token 共享状态，不表示额外线程。

```cpp
std::stop_source source;
auto token = source.get_token();
std::stop_callback callback(token, [] { /* 唤醒协作等待者 */ });
bool first = source.request_stop();
bool requested = token.stop_requested();
```

`request_stop()` 第一次使关联状态停止返回 true，后续返回 false；source 的 `stop_possible()` 判断是否拥有停止状态；token 的同名查询在状态已停止或仍存在可发请求的 source 时为 true。callback 构造时若已经停止，可立即执行回调；否则在发请求的线程同步执行。回调不能假定运行于工作线程，也不能抛异常；它的析构与正在执行的回调存在同步责任。[停止状态](https://timsong-cpp.github.io/cppwp/n4861/thread.stoptoken)

![协作停止与资源销毁的时间关系](../resources/R20-task-lifetime.svg)

图20-1：停止请求 → 工作观察或等待被唤醒 → 工作退出 → join → 释放被借用资源。请求和确认结束是两个事件。

## 线程与结果调查入口

| 现象 | 先检查 | 处理方向 |
| --- | --- | --- |
| 主线程 catch 无效而终止 | 线程入口异常、未回收 thread | 入口交付异常，退出路径回收 |
| 析构等待不结束 | 工作依赖的锁、条件变量、I/O | 建立可达停止与唤醒路径 |
| async 看起来串行 | 策略、临时 future 的释放 | 保存 future 并明确策略 |
| future 不就绪 | 是否执行 task、谁持有 provider | 每个接受的任务要有结果终态 |
| 过载时内存增长 | 待办数与每项资源 | 执行器和背压见 R23 |

任务调度见 [异步执行](R23-async-execution.zh-CN.md)，平台 I/O 取消见 [系统 I/O](R26-syscalls-file-io.zh-CN.md)。
