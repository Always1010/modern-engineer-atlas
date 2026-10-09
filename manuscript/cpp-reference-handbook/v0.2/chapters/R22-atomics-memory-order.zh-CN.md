# 原子对象与内存序

原子对象提供单一存储位置的不可分割访问；内存序描述这些访问与其他线程操作的关系。本章先介绍初始化、读取、写入和读改写，再建立数据竞争、发布与回收的规则。

**版本与先修**：核心按 C++17；wait/notify、atomic_ref 等标 C++20。先修为对象生命周期、线程及互斥量。基础操作先使用默认 seq_cst，理解同步用途后再选择其他内存序。

## 原子对象与操作类别

**基础概念**。原子操作（atomic operation）不会被另一对同一原子对象的操作观察为“执行了一半”。读取、写入、读改写是不同类别；读改写在一次不可分割操作中读取旧值并更新值。原子性不使多个对象成为一个事务。

| 操作类别 | 常用接口 | 返回与变化 |
| --- | --- | --- |
| 读取 | load | 返回观测值，不修改 |
| 写入 | store | 用新值替换，无返回值 |
| 读改写 | exchange、fetch_*、成功 CAS | 读取并更新同一原子对象 |
| 比较交换失败 | CAS 失败分支 | 读取当前值，更新调用方 expected，不写原子对象 |

每个原子对象有自己的修改顺序；两个对象的先后 load 不构成同一时刻快照。普通 `n = n + 1` 即便 n 是 atomic，仍是分开的读和写，可丢失其他线程更新。

## std::atomic<T>

**基础操作**。`<atomic>` 中 `template<class T> class atomic;`；一般模板要求 T 满足平凡可复制等类型约束，整数、指针等另有特化。atomic 不可复制/移动。C++17 应显式提供初值，避免依赖默认构造的未初始化状态。

```cpp
std::atomic<int> count{0};
std::atomic<bool> ready{false};
std::atomic<int*> pointer{nullptr};
```

局部例需 `<atomic>`。保存的指针值可原子访问，但指向的 int 寿命和内容不因此受保护。`is_lock_free()` 查询此对象是否无锁；`is_always_lock_free` 是 C++17 类型级常量，依实现而定，不能把所有 atomic 都视为一条 CPU 指令。[atomic 类型](https://timsong-cpp.github.io/cppwp/n4659/atomics.types.generic)

### load、store 与 exchange

重点接口形状如下，省略 volatile 等重载：

```cpp
T load(std::memory_order order = std::memory_order_seq_cst) const noexcept;
void store(T desired, std::memory_order order = std::memory_order_seq_cst) noexcept;
T exchange(T desired, std::memory_order order = std::memory_order_seq_cst) noexcept;
```

```cpp
std::atomic<int> state{0};
state.store(1);
int current = state.load();
int old = state.exchange(2);
```

局部例需 `<atomic>`；没有其他线程修改时 current/old 都为 1，最终 state 为 2。store 不返回旧值；exchange 返回旧值并写入新值。默认序为 seq_cst，选择有效的其他序见“内存序”。[原子操作](https://timsong-cpp.github.io/cppwp/n4659/atomics.types.operations)

## 整数与指针的 fetch 操作

**基础操作**。整数 atomic 提供 `fetch_add/sub/and/or/xor(operand, order = seq_cst)`，返回修改前的值。指针 atomic 提供 fetch_add/sub，参数是元素数，不是字节数；结果是否可解引用仍受目标数组与寿命约束。

```cpp
std::atomic<unsigned> count{0};
unsigned ticket = count.fetch_add(1);
unsigned previous = count.fetch_or(0x10u);
```

局部例需 `<atomic>`。单线程下 ticket 为 0，previous 为 1，最终 count 为 17；多线程的返回值依据该对象实际修改顺序解释。与 load 后加再 store 不同，fetch_add 把更新组成一次操作。[整数与指针特化](https://timsong-cpp.github.io/cppwp/n4659/atomics.types.generic)

## 比较交换：compare_exchange

**基础操作**。比较交换（compare-and-exchange，CAS）将原子当前表示与 expected 比较：匹配时写 desired 并返回 true；不匹配时返回 false，并把观测值写回 expected。常用形状：

```cpp
bool compare_exchange_weak(T& expected, T desired,
    std::memory_order success, std::memory_order failure) noexcept;
bool compare_exchange_strong(T& expected, T desired,
    std::memory_order order = std::memory_order_seq_cst) noexcept;
```

weak/strong 均有单序和双序重载。weak 可虚假失败，常用于循环；strong 不出现这种虚假失败，但竞争仍可使它失败。

```cpp
std::atomic<int> state{0};
int expected = 0;
bool changed = state.compare_exchange_strong(expected, 7);
expected = 0;
bool again = state.compare_exchange_strong(expected, 9);
```

局部例需 `<atomic>`，无其他写者时 changed 为 true，again 为 false，expected 更新为 7。CAS 不调用 T 的 operator==；C++17 比较对象表示，C++20 改为值表示相关规则，填充和同值多表示要按版本核对。

### CAS 重试

desired 依赖 expected 时，每次失败都要重新计算。例如以循环加一，需 `<atomic>`，count 为已初始化 atomic<int>，且加法不会超出 int 范围：

```cpp
int expected = count.load();
while (!count.compare_exchange_weak(expected, expected + 1)) {
    // expected 已由失败分支更新，下一轮重算 desired
}
```

循环体不能重复不可撤销外部副作用。失败只是读，failure 不能为 release/acq_rel；本章 C++17/20 不沿用旧版“失败序不能强于成功序”的要求。单序 acq_rel 映射失败为 acquire，release 映射为 relaxed。[C++17 CAS](https://timsong-cpp.github.io/cppwp/n4659/atomics.types.operations)、[C++20 CAS](https://timsong-cpp.github.io/cppwp/n4861/atomics.types.operations)

## std::atomic_flag

**基础操作**。`<atomic>` 的 atomic_flag 是标准保证无锁的原子标志，不可复制/移动。C++17 使用 `ATOMIC_FLAG_INIT` 初始化为清除状态；`test_and_set(order = seq_cst)` 设为 true 并返回原状态，`clear(order = seq_cst)` 清除。

```cpp
std::atomic_flag flag = ATOMIC_FLAG_INIT;
bool old = flag.test_and_set();
flag.clear();
```

局部例需 `<atomic>`，无其他线程时 old 为 false。重复 test_and_set 会返回 true，直到 clear。自旋锁需要停止与调度考虑，短操作示例不构成通用公平锁。[atomic_flag](https://timsong-cpp.github.io/cppwp/n4659/atomics.flag)

C++20 默认构造也初始化为清除，并增加 `test(order)` 无修改读取及 wait/notify。clear 是写操作，仅允许 relaxed/release/seq_cst，不能使用 consume/acquire/acq_rel。

## 原子等待与通知（C++20）

**基础操作**。`atomic<T>::wait(old, order = seq_cst)` 等待观测值与 old 不同；`notify_one()` / `notify_all()` 唤醒等待者。通知不改变存储值，必须另行 store/exchange 等修改状态。

wait 的 order 用于读取比较值，不允许 release/acq_rel；发布其他普通数据时，采用匹配的 release 写入与 acquire 等待/读取关系。

```cpp
std::atomic<int> phase{0};
// 提供者路径：
phase.store(1);
phase.notify_all();
// 等待者路径：
phase.wait(0);
int current = phase.load();
```

局部例需 `<atomic>`，两条路径可位于不同线程。wait 内部可虚假醒来，但只在比较值改变后返回；若值从 A 变成 B 又回 A，等待者可能看不到这个短暂变化，不应用作每个事件都必须累计的计数协议。atomic_flag 也提供 wait/notify。[C++20 原子等待](https://timsong-cpp.github.io/cppwp/n4861/atomics.wait)

## std::atomic_ref（C++20）

**基础操作**。`<atomic>` 中 `template<class T> class atomic_ref;` 为已有对象提供原子操作视图；以 `T&` 构造，可复制，操作形状与 atomic 对应。它不拥有目标，目标满足类型要求和 `required_alignment` 对齐并活过所有视图。

```cpp
alignas(std::atomic_ref<int>::required_alignment) int value = 0;
{
    std::atomic_ref<int> ref(value);
    ref.fetch_add(1);
}
int current = value;
```

存在 atomic_ref 期间，对目标的访问须通过相应 atomic_ref，不能同时以普通 int 路径访问。离开示例视图作用域后再普通读取；跨线程时还需确认其他视图结束并建立同步。[atomic_ref](https://timsong-cpp.github.io/cppwp/n4861/atomics.ref.generic)

## 数据竞争与 happens-before

**机制解释**。两个操作访问同一存储位置，至少一方修改或开始/结束重叠对象寿命时，称为冲突。不同线程潜在并发冲突，至少一方非原子且没有所需顺序关系时，会产生数据竞争，行为未定义。volatile 不提供线程同步。

happens-before（先行关系）是语言规则，不是墙钟先后。线程内 sequenced-before（先于定序）、线程间 synchronizes-with（同步于）及组合用于证明读写有序。典型同步边为 unlock 到随后取得同一 mutex 的 lock、线程完成到成功 join、匹配的 release/acquire。[C++17 线程与竞争](https://timsong-cpp.github.io/cppwp/n4659/intro.multithread)、[C++20 数据竞争](https://timsong-cpp.github.io/cppwp/n4861/intro.races)

不同容器元素通常可独立修改，`vector<bool>` 位打包是例外；扩容与访问现有元素不能因此并行。多个 atomic 字段仍不组成复合业务事务，整体一致性可用锁或不可变快照。

## 内存序

**机制解释**。内存序参数决定原子操作如何参与跨线程排序；不代替对象寿命和复合不变量。下表按 C++17 核心用途分类。

| 内存序 | 合法常见用途 | 同步含义 |
| --- | --- | --- |
| relaxed | load/store/读改写 | 原子性与该对象修改顺序；不发布旁边普通对象 |
| release | store/读改写写侧 | 向匹配的获取操作发布先前操作 |
| acquire | load/读改写读侧 | 读到匹配发布等条件时获取先前操作 |
| acq_rel | 读改写 | 同时承担读与写侧同步 |
| seq_cst | 默认 load/store/读改写 | 相应获取/发布语义及这类操作的共同全序 |

load 不接受 release/acq_rel；store 不接受 acquire/consume/acq_rel。C++17 的 consume 为依赖排序，本书不展开新代码模式，需直接发布时使用 acquire。仅降低内存序不能由某台机器上的观测结果证明。[内存序](https://timsong-cpp.github.io/cppwp/n4659/atomics.order)

独立统计只要求累计量时，可用 `count.fetch_add(1, std::memory_order_relaxed)`；从计数值不能推断相关普通数据已发布。fence 自由函数 `atomic_thread_fence(order)` 与 `atomic_signal_fence(order)` 只索引：前者用于特定原子读写配合的线程同步，后者用于同线程信号处理器排序，不替代普通线程同步。

## release/acquire 发布

**机制解释**。发布者先填充 payload，再 release 写 ready；读者 acquire **读到这次发布值**，则先前填充到后续读取形成 happens-before。不是任何一次读到 true 都自动对应当前轮次。

![对象发布的语言顺序关系](../resources/R22-publication-happens-before.svg)

图22-1：只画语言顺序与读取来源，不画缓存刷新；读到初始 false 时没有发布边。例子为一次发布且之后不再写 payload。

下面是两条执行路径的机制摘录，需 `<atomic>`；共享对象定义在两条路径之外，读者只在等待后读 payload。

```cpp
int payload = 0;
std::atomic<bool> ready{false};
// 发布者：
payload = 42;
ready.store(true, std::memory_order_release);
// 读者：
while (!ready.load(std::memory_order_acquire)) { /* 等待 */ }
int observed = payload;
```

忙等用于说明关系，长等待应使用条件变量或 C++20 原子等待。payload 读完前必须存活且没有后续无同步修改。[r22-release-acquire.cpp](../examples/r22-release-acquire.cpp) 保留发布和 CAS 组合源码；其示例读取发生在 join 之前，发布安全来自 release/acquire。

release sequence 是一次 release 开始的原子修改序列；C++17 与 C++20 对后续普通写入的成员规则不同。依赖多线程读改写链时需按目标版本证明，不能把一次发布图套到反复复用的标志。[C++17 顺序](https://timsong-cpp.github.io/cppwp/n4659/intro.multithread)、[C++20 顺序](https://timsong-cpp.github.io/cppwp/n4861/intro.races)

## 原子共享指针

**进阶后查 · `<memory>`；C++20 特化另需 `<atomic>`**。共享所有权保护目标寿命，原子共享指针保护同一个句柄槽位的并发访问。这两个责任需要分别判断。

| 标准基线 | 同一共享句柄槽位的接口 | 使用条件 |
| --- | --- | --- |
| C++17 | `atomic_load(&slot)`、`atomic_store(&slot, value)` 等 shared_ptr 自由函数 | 槽位为普通 shared_ptr；并发访问全部采用适用原子接口或同一外部同步 |
| C++20 | `std::atomic<std::shared_ptr<T>>` 的 load/store/exchange/CAS 等 | 通过原子对象成员接口访问槽位；此特化不要求 shared_ptr 平凡可复制 |

**独立片段 · C++17 · `<memory>` · 函数体内**：

```cpp
std::shared_ptr<const int> slot = std::make_shared<const int>(7);
std::shared_ptr<const int> next = std::make_shared<const int>(9);
std::atomic_store(&slot, next);
auto held = std::atomic_load(&slot); // 持有一份强所有权，*held 为 9
```

**独立片段 · C++20 · `<atomic>`、`<memory>` · 函数体内**：

```cpp
std::atomic<std::shared_ptr<const int>> slot{
    std::make_shared<const int>(7)};
slot.store(std::make_shared<const int>(9));
auto held = slot.load(); // 后续槽位改变不撤销 held 已取得的所有权
```

两个例子分别展示接口，不是并发程序；默认操作使用 seq_cst。将其用于共享状态时，槽位须先完成初始化并活过所有访问。发布新对象时先构造完整状态，再 store；读取取得的强所有权应覆盖整个访问期间。原子句柄不使可变目标的成员读写成为原子操作；仍需互斥或其他同步。`const` 句柄也不能消除其他可变别名，应维持真正的不可变快照契约。两条路径均不保证无锁，且分配、销毁和自定义删除器的成本不能由 load/store 名称推断。

C++20 将旧的 shared_ptr 原子自由函数标记为弃用；目标为 C++20 时优先使用特化，但不能在 C++17 模式中照搬。依据：[C++17 shared_ptr 原子自由函数](https://timsong-cpp.github.io/cppwp/n4659/util.smartptr.shared.atomic)、[C++20 atomic shared_ptr](https://timsong-cpp.github.io/cppwp/n4861/util.smartptr.atomic.shared)、[C++20 弃用接口](https://timsong-cpp.github.io/cppwp/n4861/depr.util.smartptr.shared.atomic)。控制状态与弱所有权见[shared_ptr](R09-raii-memory.zh-CN.md#shared_ptr-构造共享与访问)。

## 回收、ABA 与进展保证

**进阶后查**。原子指针读取只取得地址，不保活对象；解引用期间另一线程 delete 仍可能非法。安全回收另需锁、共享所有权或专用协议；hazard pointer/epoch 不是 C++17/20 通用标准库设施。

ABA 表示值从 A 变成 B 又回 A，CAS 看当前表示无法知道历史变化；地址复用尤其需要考虑。版本标签还需处理回绕，不独立解决寿命。

无锁（lock-free）通常讨论系统整体进展；无等待（wait-free）要求每次操作在有界步骤内完成。底层 atomic 无锁不使整个算法无锁，算法还可能分配、日志锁定或无限重试；两者也不等于更快。

| 现象 | 必须检查 | 处理方向 |
| --- | --- | --- |
| 计数丢更新 | 是否 load 后再 store | 用一个读改写更新 |
| ready 真却读取崩溃 | 匹配发布、后续写、寿命 | 同时证明顺序与保活 |
| 队列坏链 | ABA、回收、重试副作用 | CAS 不证明历史未变 |
| 重试占用高 | 争用与进展 | 无锁不保证每线程有限等待 |

缓存与伪共享的硬件机制见 [CPU 与内存](R24-cpu-memory-cost.zh-CN.md)，不能代替 C++ 语言同步证明。
