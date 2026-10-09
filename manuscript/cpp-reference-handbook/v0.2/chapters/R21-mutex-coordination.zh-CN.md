# 互斥与线程协作

互斥量保护共享对象；锁管理器把锁所有权绑定到作用域；条件变量等待由共享状态表达的事实。C++20 的许可、一次性计数和阶段屏障解决不同协作任务，各自有独立入口。

**版本与先修**：核心按 C++17，`scoped_lock/shared_mutex` 是 C++17，C++20 设施就地标注。先修为对象寿命、RAII 与线程。基础路径是 mutex → lock_guard → unique_lock → 谓词等待；完成后再读[数据竞争与 happens-before](R22-atomics-memory-order.zh-CN.md#数据竞争与-happens-before)建立完整语言模型。

进入本章前只需掌握：多个线程共同访问可变对象时，必须为相关读写建立共同的同步规则。即使单次整数读写在某台机器上看似不可分割，也不能据此无保护地读写普通共享变量。最先学习的规则是“所有相关访问持有同一把锁”；线程启动前准备好状态，使用结束后再销毁状态和锁。本章的互斥量将这个规则具体化。

## 互斥量与临界区

**基础概念**。互斥量（mutex）控制某一时刻由哪个线程独占受保护操作；临界区是持锁执行的代码区间。锁保护的是数据及其一致性关系，例如“队列长度与内容一致”，应由同一把锁覆盖相关读写。

| 互斥量类型 | 取得方式 | 头文件 |
| --- | --- | --- |
| `mutex` | 独占 | `<mutex>` |
| `recursive_mutex` | 同线程可重复独占 | `<mutex>` |
| `timed_mutex` / `recursive_timed_mutex` | 独占及定时尝试 | `<mutex>` |
| `shared_mutex` | 独占或共享 | `<shared_mutex>` |
| `shared_timed_mutex` | 独占或共享及定时尝试 | `<shared_mutex>` |

互斥量不可复制、不可移动；应比所有借用它的锁管理器和等待操作活得久。`lock()` 可阻塞或抛 `system_error`，`try_lock()` 返回是否取得所有权，可虚假失败；`unlock()` 由当前拥有者调用。成功释放/取得之间建立相应同步，不保证公平。[互斥量要求](https://timsong-cpp.github.io/cppwp/n4659/thread.mutex.requirements)

## std::mutex

**基础操作**。`<mutex>` 的 mutex 默认构造为未锁定；常用接口 `void lock(); bool try_lock(); void unlock();`。同一线程不能再次锁定已拥有的非递归 mutex。

```cpp
std::mutex mutex;
int count = 0;
{
    std::lock_guard<std::mutex> guard(mutex);
    ++count;
}
```

局部例需 `<mutex>`，作用域结束释放锁；所有并发访问 count 的代码均使用同一个 mutex。正常使用交由 RAII 管理器释放，避免分支遗漏 unlock。[mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.mutex.class)

## std::recursive_mutex

**基础操作**。`<mutex>` 的 recursive_mutex 支持同一线程重复 `lock/try_lock`；其他线程仍被排除。每次取得对应一次 unlock，最后一次释放才允许其他线程取得。

```cpp
std::recursive_mutex mutex;
std::lock_guard<std::recursive_mutex> outer(mutex);
{
    std::lock_guard<std::recursive_mutex> inner(mutex);
    // 同线程再次取得，inner 结束只释放其中一次
}
```

局部例需 `<mutex>`。最大递归层数未指定；达到上限时 lock 报错、try_lock 失败。递归锁不消除跨线程的循环等待，也不自动保证重入时中间状态合法。[recursive_mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.mutex.recursive)

## std::timed_mutex

**基础操作**。`<mutex>` 的 timed_mutex 在 mutex 同类接口外增加相对/绝对定时尝试：

```cpp
template<class Rep, class Period> bool try_lock_for(
    const std::chrono::duration<Rep, Period>& duration);
template<class Clock, class Duration> bool try_lock_until(
    const std::chrono::time_point<Clock, Duration>& deadline);
```

true 表示已取得锁，false 表示未取得。等待时间受调度等影响，不是实时上界；失败也可能为虚假失败。下面用定时管理器避免手工释放，需 `<mutex>`、`<chrono>`：

```cpp
std::timed_mutex mutex;
std::unique_lock<std::timed_mutex> lock(mutex, std::defer_lock);
if (lock.try_lock_for(std::chrono::milliseconds(10))) {
    // 在独占所有权下操作共享状态
}
```

`unique_lock<mutex>` 没有可调用的定时锁能力；模板提供该名字不使底层 mutex 支持它。[timed_mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.timedmutex.class)

## std::recursive_timed_mutex

**基础操作**。`<mutex>` 的 recursive_timed_mutex 同时提供递归独占和 `try_lock_for/try_lock_until`。构造后未锁定，重复取得与释放次数配对，定时结果同 timed_mutex。

```cpp
std::recursive_timed_mutex mutex;
std::unique_lock<std::recursive_timed_mutex> outer(mutex);
std::unique_lock<std::recursive_timed_mutex> inner(
    mutex, std::chrono::milliseconds(10));
bool acquired = inner.owns_lock();
```

局部例需 `<mutex>`、`<chrono>`。内层定时构造取得失败时关联 mutex 但不拥有锁；只有 acquired 为 true 才可使用该所有权。[recursive_timed_mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.timedmutex.recursive)

## std::shared_mutex

**基础操作，C++17**。`<shared_mutex>` 的 shared_mutex 提供独占 `lock/try_lock/unlock`，以及共享 `lock_shared/try_lock_shared/unlock_shared`；可有多个共享拥有者，独占与共享不能同时成立。

```cpp
std::shared_mutex mutex;
{
    std::shared_lock<std::shared_mutex> read(mutex);
    // 只读受保护状态
}
{
    std::unique_lock<std::shared_mutex> write(mutex);
    // 修改受保护状态
}
```

局部例还需 `<mutex>`。读者更新缓存或延迟初始化仍是写入。标准无通用原子锁升级接口：释放读锁再取写锁后需重新核对状态，不保证公平或无饥饿。[shared_mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.sharedmutex.class)

## std::shared_timed_mutex

**基础操作，C++14**。`<shared_mutex>` 的 shared_timed_mutex 在独占/共享能力外提供 `try_lock_for/until` 与 `try_lock_shared_for/until`，参数为时长/时点，返回是否取得对应所有权。

```cpp
std::shared_timed_mutex mutex;
std::shared_lock<std::shared_timed_mutex> read(mutex, std::defer_lock);
if (read.try_lock_for(std::chrono::milliseconds(10))) {
    // 只读；不能据此写共享对象
}
```

局部例需 `<shared_mutex>`、`<chrono>`。定时等待和虚假失败条件同定时互斥量；共享所有权只能由对应的共享释放路径结束。[shared_timed_mutex](https://timsong-cpp.github.io/cppwp/n4659/thread.sharedtimedmutex.class)

## 锁标签

**基础操作**。`<mutex>` 定义三种标签，用于管理器构造；不是可以任意组合的优化开关。

| 标签 | 构造语义 | 前提/结果 |
| --- | --- | --- |
| `defer_lock` | 关联 mutex，暂不取得 | 管理器 initially 不拥有锁 |
| `try_to_lock` | 立即尝试取得 | 检查 owns_lock 后才使用受保护数据 |
| `adopt_lock` | 接管已取得的锁 | 当前线程已拥有对应锁，管理器负责释放 |

`lock_guard` 支持普通锁定和 adopt；`unique_lock/shared_lock` 支持上述各标签；`scoped_lock` 支持普通锁定和 adopt。[锁标签](https://timsong-cpp.github.io/cppwp/n4659/thread.lock)

## std::lock_guard

**基础操作**。`<mutex>` 中 `template<class Mutex> class lock_guard;`，Mutex 提供 lock/unlock。构造为 `explicit lock_guard(Mutex& m);` 或 `lock_guard(Mutex& m, adopt_lock_t);`；不可复制、不可移动，没有手工 unlock 成员。

```cpp
std::mutex mutex;
{
    std::lock_guard<std::mutex> guard(mutex);
    // 构造锁定，整个小作用域持锁
}
```

析构释放所持的锁；mutex 必须存活，管理器不能被跨线程转移。临时匿名管理器在语句末尾销毁，应给它变量名。[lock_guard](https://timsong-cpp.github.io/cppwp/n4659/thread.lock.guard)

## std::unique_lock

**基础操作**。`<mutex>` 中 `template<class Mutex> class unique_lock;` 是可移动、不可复制的独占锁管理器。默认构造无 mutex；普通构造立即锁定；标签构造和定时构造分别改变取得方式。

| 构造形式 | 取得方式 | 构造后状态 |
| --- | --- | --- |
| `unique_lock<Mutex> lock;` | 无关联 | mutex 为 nullptr，不拥有 |
| `unique_lock<Mutex> lock(m);` | 调用 lock | 成功后拥有 |
| `unique_lock<Mutex> lock(m, defer_lock);` | 暂不取得 | 已关联，不拥有 |
| `unique_lock<Mutex> lock(m, try_to_lock);` | 调用 try_lock | 按 owns_lock 判断 |
| `unique_lock<Mutex> lock(m, adopt_lock);` | 接管已取得锁 | 调用线程须已拥有 m |
| `unique_lock<Mutex> lock(m, duration/deadline);` | 定时尝试 | 底层须支持定时，按 owns_lock 判断 |

```cpp
std::mutex mutex;
std::unique_lock<std::mutex> lock(mutex, std::defer_lock);
lock.lock();
bool held = lock.owns_lock();
lock.unlock();
lock.lock();
```

关联 mutex 与拥有锁是两件事。`lock/try_lock/unlock` 操作对应底层 mutex；定时接口仅用于定时能力类型。`owns_lock()` 或显式 bool 查询所有权，`mutex()` 返回关联指针，`swap` 交换关联与所有权；`release()` 返回指针并解除管理，**不解锁**，调用者接手释放责任。

已拥有时再次 lock 或未拥有时 unlock 报 `system_error`；默认/已移动对象无关联，不能锁定。移动目标接手释放责任，但底层锁的线程所有权要求仍成立。析构仅在 owns_lock 为 true 时解锁。[unique_lock](https://timsong-cpp.github.io/cppwp/n4659/thread.lock.unique)

定时操作用具备能力的 timed_mutex；以下独立局部例需 `<mutex>`、`<chrono>`，取得失败时不能操作受保护状态：

```cpp
std::timed_mutex mutex;
std::unique_lock<std::timed_mutex> lock(mutex, std::defer_lock);
bool acquired = lock.try_lock_for(std::chrono::milliseconds(10));
if (acquired) { /* 访问受保护状态，析构自动释放 */ }
```

## std::scoped_lock

**基础操作，C++17**。`<mutex>` 中 `template<class... MutexTypes> class scoped_lock;` 管理零到多把 mutex；不可复制、不可移动。普通构造取得所有锁，多锁形式使用避免此次获取死锁的算法；adopt 形式接管当前线程已取得的全部锁。

```cpp
std::mutex left, right;
{
    std::scoped_lock guard(left, right);
    // 同时维护两个对象之间的不变量
}
```

析构释放所有锁，无手工 unlock 成员。零锁形式为空操作。不能把同一非递归 mutex 重复传入；算法避免获取阶段死锁，不消除锁内等待任务或外部回调形成的循环依赖。[scoped_lock](https://timsong-cpp.github.io/cppwp/n4659/thread.lock.scoped)

## std::shared_lock

**基础操作，C++14**。`<shared_mutex>` 中 `template<class Mutex> class shared_lock;` 管理共享所有权；可移动、不可复制。构造、标签、定时形式以及 owns_lock/mutex/release/swap 与 unique_lock 对应，但底层调用共享接口。

```cpp
std::shared_mutex mutex;
std::shared_lock<std::shared_mutex> read(mutex, std::try_to_lock);
if (read.owns_lock()) {
    // 仅在共享所有权下读取
}
```

`lock()` 调用 `lock_shared()`，`unlock()` 调用 `unlock_shared()`；`release()` 不释放共享锁。定时接口要求 shared_timed_mutex 等类型。[shared_lock](https://timsong-cpp.github.io/cppwp/n4659/thread.lock.shared)

## std::lock 与 std::try_lock

**基础操作**。`<mutex>` 的自由函数用于多锁协作，声明摘要：

```cpp
template<class L1, class L2, class... L> void lock(L1&, L2&, L&...);
template<class L1, class L2, class... L> int try_lock(L1&, L2&, L&...);
```

`lock` 使用避免获取阶段死锁的算法取得全部锁；抛异常时释放本次已取得的锁。`try_lock` 逐个尝试，全部成功返回 -1，否则返回失败对象的零起始索引并释放此前取得的锁。Lockable 也可为以 defer_lock 构造的 unique_lock。

```cpp
std::mutex a, b;
std::unique_lock<std::mutex> first(a, std::defer_lock);
std::unique_lock<std::mutex> second(b, std::defer_lock);
std::lock(first, second);
```

局部例需 `<mutex>`，两个管理器析构负责解锁。只需作用域持有时优先 scoped_lock，避免手工接管遗漏。[多锁函数](https://timsong-cpp.github.io/cppwp/n4659/thread.lock.algorithm)

## std::condition_variable

**基础操作**。`<condition_variable>` 的 condition_variable 是等待通知的协作对象，默认构造，不可复制/移动；它不保存业务谓词。常用形状：

```cpp
void wait(std::unique_lock<std::mutex>& lock);
template<class Predicate> void wait(std::unique_lock<std::mutex>& lock, Predicate pred);
void notify_one() noexcept;
void notify_all() noexcept;
```

wait 要求 lock 已拥有对应 mutex；等待原子地释放锁并阻塞，唤醒后重新取得锁。谓词形式循环检查 pred，只在 true 时返回。以下两个函数共享一组对象，需 `<mutex>`、`<condition_variable>`；提供者先存值再通知，消费者在锁内读值。

```cpp
std::mutex mutex;
std::condition_variable changed;
bool ready = false;
int value = 0;
void publish() {
    { std::lock_guard<std::mutex> lock(mutex); value = 42; ready = true; }
    changed.notify_one();
}
int receive() {
    std::unique_lock<std::mutex> lock(mutex);
    changed.wait(lock, [] { return ready; });
    return value;
}
```

这段展示一次结果交付；可由不同线程调用两个函数。notify_one 唤醒一个等待者，notify_all 唤醒全部；通知不保存数据，也不保证某个消费者取得数据。虚假唤醒（spurious wakeup）是没有对应通知仍醒来，谓词循环也应处理别的消费者抢先取走数据。同一 cv 上并发等待者使用同一 mutex；析构前所有等待者须退出且不能再进入。[condition_variable](https://timsong-cpp.github.io/cppwp/n4659/thread.condition.condvar)

### 定时等待

`wait_for(lock, duration)` / `wait_until(lock, deadline)` 无谓词形式返回 `cv_status::timeout/no_timeout`，仍须检查业务状态；谓词形式增加 pred，返回最终谓词是否成立。需要总预算时使用 steady_clock 的绝对期限，避免每次醒来重置完整相对时长。

```cpp
auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(1);
bool available = changed.wait_until(lock, deadline, [] { return ready; });
```

片段需 `<chrono>`，沿用已持锁的 lock。超时不取消生产任务；返回时仍持有锁，最终状态必须在锁下解释。

## std::condition_variable_any

**基础操作**。`<condition_variable>` 的 condition_variable_any 支持具备 lock/unlock 的其他锁类型；等待时仍释放并重新取得传入锁，使用谓词、wait_for/until、notify_one/all。对象不可复制/移动。

```cpp
std::recursive_mutex mutex;
std::condition_variable_any changed;
bool ready = false;
std::unique_lock<std::recursive_mutex> lock(mutex);
changed.wait(lock, [&] { return ready; });
```

这是另一独立上下文：ready 由同一 mutex 保护，需 `<mutex>`、`<condition_variable>`。递归锁在此只持有一层，否则等待释放一次后仍持有锁，生产者可能永远无法取得。C++20 另有 `wait(lock, stop_token, pred)` 等停止令牌重载，返回业务谓词是否成立，停止唤醒不等于谓词满足。[condition_variable_any](https://timsong-cpp.github.io/cppwp/n4659/thread.condition.condvarany)、[C++20 停止等待](https://timsong-cpp.github.io/cppwp/n4861/thread.condition.condvarany)

## std::counting_semaphore（C++20）

**基础操作**。`<semaphore>` 中 `template<ptrdiff_t LeastMaxValue = implementation_defined> class counting_semaphore;`，公开摘要省略完整声明。模板参数是要求支持的最低最大计数，不是初始计数；`max()` 是实现实际支持的最大值。构造 `counting_semaphore<N> permits(initial)`，无默认构造、不可复制/移动。

`acquire()` 等到计数可减一；`try_acquire()` 尝试，可能虚假失败；`try_acquire_for/until` 带时间预算；`release(update = 1)` 增加许可并可能唤醒等待者。初始量和增加后量不能超出允许范围。

```cpp
std::counting_semaphore<4> permits(2);
permits.acquire();
// 使用一个许可代表的资源
permits.release();
```

许可不绑定获得它的线程，不自动保护队列容器。局部例需 `<semaphore>`。

## std::binary_semaphore（C++20）

**基础操作**。`<semaphore>` 的 `binary_semaphore` 是 `counting_semaphore<1>` 的别名，构造指定初始 0 或 1，按二元授权使用。acquire 消耗许可，release 增加许可；try_acquire 和定时尝试形状同 counting_semaphore。最低最大值 1 不表示所有实现 max() 必定等于 1，二元协议仍按 0/1 维护。

```cpp
std::binary_semaphore signal(0);
signal.release();
signal.acquire();
```

局部例需 `<semaphore>`，先发出许可，再消耗；许可可跨线程交付。[semaphore](https://timsong-cpp.github.io/cppwp/n4861/thread.sema)

## std::latch（C++20）

**基础操作**。`<latch>` 的 latch 是一次性倒计数协作对象，`explicit latch(ptrdiff_t expected)` 指定初始计数，不可复制/移动。`count_down(update = 1)` 减计数；`wait()` 阻塞至零；`try_wait()` 查询是否为零；`arrive_and_wait(update = 1)` 先减再等。

```cpp
std::latch finished(2);
finished.count_down(); // 第一个工作者结束
finished.count_down(); // 第二个工作者结束
finished.wait();
```

局部例需 `<latch>`，展示一次完成条件。update 不能超过剩余计数；零后不能复位。工作异常退出时也必须履行约定的到达责任。[latch](https://timsong-cpp.github.io/cppwp/n4861/thread.latch)

## std::barrier（C++20）

**基础操作**。`<barrier>` 中 `template<class CompletionFunction = /* 实现提供 */> class barrier;` 是可重复的阶段屏障。构造指定参与计数和可选完成函数；不可复制/移动。每阶段达到零时执行完成步骤，随后进入新阶段。

```cpp
std::barrier<> phase(2);
// 两个参与线程分别在各自路径执行：
phase.arrive_and_wait();
```

局部例需 `<barrier>`，最后一行必须由两个参与者各自调用，不是同线程连续调用两次。`arrive(update)` 返回到达令牌，之后 `wait(std::move(token))` 等待所属阶段；`arrive_and_wait()` 合并二者，`arrive_and_drop()` 同时减少当前及后续参与人数，不等待。完成函数须满足不抛约束，不能遗漏参与者导致永久等待。[barrier](https://timsong-cpp.github.io/cppwp/n4861/thread.barrier)

## std::once_flag 与 std::call_once

**基础操作**。`<mutex>` 的 once_flag 默认构造为未完成，不可复制/移动；`call_once(flag, function, args...)` 对关联 flag 完成一次成功调用。成功后其他调用不再执行 function；若调用抛异常，该次不算完成，后续可重试。

```cpp
std::once_flag initialized;
std::call_once(initialized, [] { /* 建立共享资源 */ });
std::call_once(initialized, [] { /* 已成功完成时不执行 */ });
```

局部例需 `<mutex>`。成功完成与同一 flag 后续被动调用返回之间有同步；对象后续修改仍另需保护。flag 不能复位，用于一次初始化而非重复阶段。[call_once](https://timsong-cpp.github.io/cppwp/n4659/thread.once)

## 有界队列与关闭

**组合应用**。有界队列把容量限制转为背压：生产者等“未满或关闭”，消费者等“非空或关闭”。mutex 保护内容、容量与 closed；关闭标志在锁下更新后通知两类等待者。

![有界队列中等待与通知的位置](../resources/R21-queue-coordination.svg)

图21-1：通知触发再检查，队列内容才是事实。关闭时先唤醒等待者，再确认所有调用者结束，最后销毁队列。

[r21-bounded-queue.cpp](../examples/r21-bounded-queue.cpp) 保留容量 2 的完整组合程序：push 满时阻塞、关闭后拒绝，pop 关闭后排空已有项并最终返回 false。该 int 队列不承诺泛型元素异常的强保证，也不保证公平；销毁与外部调用不能并发。

容量按条目数还不能限制累计字节。消费者在同一满队列中阻塞提交可能耗尽所有消费能力；是否阻塞、拒绝、按期限等待或丢弃应由接口定义。任务结果交付与队列关闭见 [任务调度](R23-async-execution.zh-CN.md)。

## 协作调查入口

| 现象 | 检查依据 | 处理方向 |
| --- | --- | --- |
| 空队列 front 崩溃 | wait 后的谓词循环 | 通知不代表该消费者拥有一项数据 |
| 关闭不退出 | 两类等待者是否醒来 | 改 closed 后通知并确认结束 |
| 全部线程阻塞 | 锁顺序、持锁等待、递归提交 | 修复循环依赖，递归锁不能代替 |
| 队列满后延迟升高 | 消费成本、累计字节、等待时间 | 有界容量传播过载但不增加处理能力 |
| 读锁下有数据竞争 | 真正修改点与借用寿命 | 共享锁只允许真实只读操作 |
