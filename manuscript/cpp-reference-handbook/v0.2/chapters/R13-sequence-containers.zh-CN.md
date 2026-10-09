# 顺序容器

顺序容器把同一种类型的对象按位置组织起来。选型时先看数据如何访问、在哪里增删、是否要保存元素地址；不要只比较一个插入操作的复杂度。

**版本**：本章核心接口适用于 C++17；`std::erase_if` 单独标为 C++20。**先修**：引用、对象生命周期、拷贝与移动。文中的“失效”表示旧指针、引用或迭代器不再能按原来的元素借用使用，不是“它的数值变成了空”。

## 顺序容器分类

| 类型与头文件 | 保证与访问方式 | 优先考虑的场景 | 主要限制 |
| --- | --- | --- | --- |
| `std::array<T, N>` · `<array>` | 固定 N，元素连续，支持下标 | 编译期固定长度的缓冲与小表 | 无扩容与插删；存放在栈还是堆由对象所在位置决定 |
| `std::vector<T>` · `<vector>` | 动态长度，除 bool 特化外元素连续 | 批处理、扫描、排序、尾部追加 | 扩容与中间修改会影响借用 |
| `std::deque<T>` · `<deque>` | 随机访问；不保证整体连续 | 频繁在两端增删，同时需要下标 | 不能当连续数组传给 C 接口 |
| `std::list<T>` · `<list>` | 双向迭代；插入不使既有元素借用失效 | 已持有位置、需要稳定节点或拼接 | 无下标；找位置仍要遍历 |
| `std::forward_list<T>` · `<forward_list>` | 单向迭代；围绕前驱修改 | 明确需要单向节点链的场景 | 无 size、back、push_back；需维护前驱 |

长度固定先看 `array`，普通动态序列先看 `vector`。再用两端操作、节点稳定性或拼接需求证明换容器的必要性。这是选型起点，不是性能结论。[顺序容器要求](https://timsong-cpp.github.io/cppwp/n4659/sequence.reqmts)、[array](https://timsong-cpp.github.io/cppwp/n4659/array)、[vector](https://timsong-cpp.github.io/cppwp/n4659/vector.overview)、[deque](https://timsong-cpp.github.io/cppwp/n4659/deque.overview)、[list](https://timsong-cpp.github.io/cppwp/n4659/list.overview)、[forward_list](https://timsong-cpp.github.io/cppwp/n4659/forwardlist.overview)。

![顺序容器的元素布局与访问路径](../resources/R13-container-layout.svg)

图13-1：连续性是 array 和一般 vector 的保证；deque 的分块索引、list 的双向节点和 forward_list 的单向节点是常见实现示意，不规定块大小、节点布局或额外内存的数量。

### 操作成本

n 为当前元素数；以下插删只修改一个元素。链表 O(1) 以已经持有正确位置为前提，forward_list 还需要前驱。

| 容器 | 第 k 个位置 | 尾部/头部添加 | 已知位置单点插删 |
| --- | --- | --- | --- |
| array | O(1) | 不提供 | 不提供 |
| vector | O(1) | 尾部摊还 O(1)，扩容 O(n)；头部 O(n) | O(n)，受距尾部距离影响 |
| deque | O(1) | 两端 O(1) | O(n)，受较近端距离影响 |
| list | O(k) 遍历 | 两端 O(1) | O(1)，已持有位置 |
| forward_list | O(k) 遍历 | 头部 O(1)，无 push_back | O(1)，已持有前驱 |

“摊还”指一串操作的平均成本界限，不保证某一次追加耗时很短。标准复杂度按元素操作次数描述，不是微秒承诺；大对象的移动、分配器、缓存和负载还会影响实测时间。[容器复杂度定义](https://timsong-cpp.github.io/cppwp/n4659/container.requirements.general)、[vector 操作](https://timsong-cpp.github.io/cppwp/n4659/vector.modifiers)、[deque 操作](https://timsong-cpp.github.io/cppwp/n4659/deque.modifiers)、[list 插删](https://timsong-cpp.github.io/cppwp/n4659/list.modifiers)。

### 复杂度与额外空间

O(f(n)) 描述随规模增长的上界，必须同时说明计算哪一种操作。**最坏**考察允许输入中最贵的一次；**平均**需要输入或分布假设，例如哈希查找的平均常数界；**均摊（摊还）**把一串操作的总成本分摊，不要求随机输入。三者不能互换：vector 追加的均摊常数不提供单次延迟上界。

比较次数、元素构造／移动／赋值次数、分配次数也不是同一单位。比较两个长字符串可能扫描多个字符；移动一个元素可能调用用户代码；中间 erase 的线性成本主要来自给后缀赋值。选型时还应单列**额外空间**：除结果元素外，为预留存储、索引、链接或算法工作区付出的空间。容量与节点开销须按目标实现测量，不由时间复杂度推导。[N4659 容器复杂度计量](https://timsong-cpp.github.io/cppwp/n4659/container.requirements.general)、[vector 删除的析构与赋值次数](https://timsong-cpp.github.io/cppwp/n4659/vector.modifiers)。

| 布局 | 访问成本来自哪里 | 额外空间与局部性 |
| --- | --- | --- |
| array／一般 vector 的连续元素 | 第 k 个位置可由起点与偏移直接定位 | 扫描地址相邻；vector 另有未构造的 capacity−size 个槽位 |
| 常见分段 deque | 先定位块，再定位块内偏移 | 块索引与两端空位有开销；块内连续不代表全序列连续 |
| 常见节点链表 | 定位第 k 个位置需沿链接逐个走 | 每节点有链接与分配开销；地址分散可能增加缓存未命中 |

后两行是常见实现的成本解释，不是节点字节数或缓存命中率的标准保证。连续布局利于扫描也不证明所有负载下 vector 都更快；先确定操作比例、元素大小与借用需求，再测量。

## std::array

**基础操作**。固定长度数组在 `<array>` 中拥有 `N` 个连续元素。公开声明摘要省略成员：

```cpp
namespace std {
    template<class T, size_t N> struct array;
}
```

`T` 是元素类型，`N` 是编译期长度，允许为零。它是聚合，不接受动态数量构造；默认局部 `array<int,3> a;` 不清零元素，`{}` 值初始化为零。

### array 的初始化、访问与遍历

```cpp
// 需要 <array>；局部摘录
std::array<int, 3> zero{};
std::array<int, 3> values{1, 2, 3};
values.at(1) = 8;                           // {1,8,3}
for (int& x : values) x += 1;               // {2,9,4}
auto n = values.size();                     // 3
int* first = values.data();                 // 连续元素入口
```

`operator[](i)` 要求 `i < N`，`at(i)` 越界抛 `out_of_range`；`front/back` 要求非空。`begin/end` 提供随机访问迭代器。`N==0` 时不能取首尾或解引用 `data()`，不能依赖 `data()` 是空指针。

### array 的修改与失效

```cpp
// 需要 <array>；局部摘录
std::array<int, 3> a{1, 2, 3};
std::array<int, 3> b{};
b.fill(9);                                 // 线性赋值为 {9,9,9}
int& slot = a[0];
a.swap(b);                                 // a={9,9,9}，b={1,2,3}
slot = 7;                                  // 修改 a[0]，没有转而引用 b
```

没有插删与扩容。访问为常数时间，`fill/swap` 与长度成线性关系；交换逐元素进行，不让引用迁移到另一数组。数组本体销毁仍结束元素寿命，存储位置由数组对象所在位置决定。[N4659 array](https://timsong-cpp.github.io/cppwp/n4659/array)。

## std::vector


**基础操作**。公开声明摘要省略成员和约束：

```cpp
namespace std {
    template<class T, class Allocator = allocator<T>> class vector;
}
```

`T` 是元素类型，`Allocator` 管理存储。类型能力按具体操作判断。

### vector 的构造与初始化

```cpp
// 需要 <vector>；局部摘录
std::vector<int> empty;
std::vector<int> values{1, 2, 3};
std::vector<int> part(values.begin() + 1, values.end()); // {2,3}
std::vector<int> copy(values);              // 独立元素序列
```

本例集中展示空构造、区间构造和拷贝构造；数量与初始化列表的区别见下方[数量构造与初始化列表](#数量构造与初始化列表)。移动构造通常转移存储，自定义分配器参与的形式另有约束。

### vector 的访问与遍历

```cpp
// 需要 <vector>；局部摘录
std::vector<int> values{1, 2, 3};
values.at(1) = 8;
int first = values.front();                 // 要求非空
for (int& x : values) x *= 2;               // {2,16,6}
auto it = values.begin();                   // 指向 2
```

`begin/end` 提供随机访问迭代器；`end` 不可解引用。`empty/size` 查询状态，`front/back` 要求非空。

### vector 的插入、删除与替换

常用形式为 `insert(pos,value)`、`insert(pos,count,value)`、`insert(pos,first,last)`、`insert(pos,{...})`，返回第一个新元素的迭代器。`emplace(pos,args...)` 原位构造一个元素并返回位置。位置可为 `end()`；区间输入应是有效的外部范围。

```cpp
// 需要 <vector>；局部摘录
std::vector<int> values{1, 4};
auto inserted = values.insert(values.begin() + 1, {2, 3});
inserted = values.erase(inserted);          // {1,3,4}，返回指向 3
values.assign(2, 9);                        // 替换为 {9,9}
values.clear();                             // 空，容量保留
```

`erase(pos)` 要求可解引用位置；区间形式删 `[first,last)`，返回后继。`assign(count,value)`、`assign(first,last)`、`assign({...})` 替换整段序列，不能沿用旧借用。容量与尾部追加见后续接口。

### vector 的核心接口
`vector<T, Allocator = std::allocator<T>>` 管理一段元素存储。以下针对一般 vector，不含 vector<bool> 特化。下列为常用接口形式，省略 const 重载；`size_type` 是容器的无符号长度类型，`iterator` 是它的迭代器类型。

| 接口 | 用途与返回值 | 必须记住的条件 |
| --- | --- | --- |
| `size_type size() const noexcept` | 已存在的元素数 | 不等于已分配容量 |
| `size_type capacity() const noexcept` | 不扩容能容纳的元素数 | size ≤ capacity；增长倍率未规定 |
| `T& operator[](size_type i)` | 访问第 i 个元素 | 必须 i < size；C++17/20 越界行为未定义，不保证抛异常 |
| `T& at(size_type i)` | 带边界检查的访问 | i ≥ size 抛 `std::out_of_range` |
| `T* data() noexcept` | 元素缓冲入口 | 只按 size 个元素使用；空容器不保证返回 nullptr |
| `void push_back(const T& x)` / `void push_back(T&& x)` | 尾部加入一个元素 | 复制插入／从右值插入，可能扩容；后者不保证调用移动构造 |
| `template<class... Args> T& emplace_back(Args&&... args)` | 用参数构造尾部元素 | C++17 起返回引用；不能免除旧元素迁移 |
| `iterator insert(const_iterator pos, const T& x)` | 在 pos 前插入，返回新元素位置 | pos 来自本容器，可为 end；元素类型需满足该重载要求 |
| `iterator erase(const_iterator pos)` | 删除元素，返回其后的新位置 | pos 必须可解引用，不能是 end |
| `void pop_back()` / `void clear() noexcept` | 删除最后一个／全部元素 | pop_back 要求非空；不释放 capacity 所代表的存储 |

其他 `insert` 重载可移动单元素、插入若干副本或外部区间。`erase(first, last)` 删除半开区间，空区间允许。对默认分配器而言，拷贝插入需要 T 可拷贝构造，vector 删除通常还需要 T 可移动赋值；完整的类型要求随重载变化。[vector 声明](https://timsong-cpp.github.io/cppwp/n4659/vector.overview)、[区间与类型要求](https://timsong-cpp.github.io/cppwp/n4659/sequence.reqmts)、[data](https://timsong-cpp.github.io/cppwp/n4659/vector.data)。

### 数量构造与初始化列表

```cpp
// 需要 <vector>；局部摘录
std::vector<int> zeros(3);  // 三个值初始化的 0
std::vector<int> a(3, 7);   // 三个 7：{7, 7, 7}
std::vector<int> b{3, 7};   // 两个元素：{3, 7}
```

花括号优先涉及 initializer_list 重载；不能把 `()` 机械改为 `{}`。固定数组的零初始化另见[std::array](#stdarray)。[vector 构造](https://timsong-cpp.github.io/cppwp/n4659/vector.cons)、[聚合与 array](https://timsong-cpp.github.io/cppwp/n4659/array)。

### reserve 与 resize

| 接口 | 改 size | 对容量与元素的影响 | 使用目的 |
| --- | --- | --- | --- |
| `void reserve(size_type n)` | 否 | n > capacity 才重分配；成功后 capacity ≥ n | 预估元素数，减少后续扩容 |
| `void resize(size_type n)` | 是 | 增大时补元素；缩小时销毁尾部元素，不缩 capacity | 让序列具有 n 个元素 |
| `void resize(size_type n, const T& value)` | 是 | 增大时补 value 的副本 | 同上，指定新增值 |
| `void shrink_to_fit()` | 否 | 请求缩容量，但实现可以不执行；可能重分配 | 确有需求时尝试释放多余存储 |

```cpp
// 需要 <vector>；局部摘录
std::vector<int> v{10, 20, 30};
v.reserve(6);              // size 仍为 3，capacity 至少为 6
v.push_back(40);           // 创建第 4 个元素
v.resize(6, -1);           // {10, 20, 30, 40, -1, -1}
v.resize(2);               // {10, 20}；capacity 不变
```

`reserve(6)` 后直接写 `v[5] = 42` 仍是越界：容量不是可索引的元素数。用于 C 接口填充的 vector 应先 `resize` 到允许写入的元素数，再传 `data()` 与相应长度。不要每次追加前都 `reserve(size()+1)`；这会干扰容器自身的增长策略，并可能造成累计线性搬迁的平方级成本。[容量与调整长度](https://timsong-cpp.github.io/cppwp/n4659/vector.capacity)。

![vector 中已存在元素和预留存储的区别](../resources/R13-vector-capacity.svg)

图13-2：与上例使用同一初始值及四次操作；教学图假设实际 capacity 为 6，reserve(6) 只保证容量至少为 6。push_back 创建 40，resize(6,-1) 再创建两个 -1，resize(2) 销毁尾部四个元素但保留容量。虚线表示没有元素的预留存储，不可通过下标访问。

### 动态数组扩容

array 的 N 属于类型，不能在尾部增加第 N+1 个元素；vector 的 size 可变，却仍要维持一般元素连续。当尾部没有容量时，重分配通常需要取得更大的连续存储、在新存储构造旧序列与新元素、最后销毁旧元素并释放旧存储；不能假定只把原缓冲地址“向后延长”。旧元素的拷贝／移动选择和失败处理见下文失效与异常保证。[N4659 vector 连续与均摊保证](https://timsong-cpp.github.io/cppwp/n4659/vector.overview)、[容量与重分配](https://timsong-cpp.github.io/cppwp/n4659/vector.capacity)。

用**每次容量翻倍的教学模型**理解均摊：从空开始追加到 n 个元素，历次迁移约为 1+2+4+…，其和为 O(n)，再加 n 次新元素构造，整串追加仍为 O(n)。这只是一个满足均摊要求的增长策略示意，标准不规定翻倍、倍率或每次实际容量。若每次强制只增加一个容量槽位，则可能搬迁 1+2+…+(n−1) 个旧元素，累计 O(n²)；因此一次合理 reserve 往往比逐次 reserve(size()+1) 更合适。

![vector 的增长模型与单次迁移成本](../resources/R13-vector-growth-cost.svg)

图13-3：容量 1、2、4、8 仅用于证明几何增长的累计迁移量；不是本机或标准规定的容量序列。扩容时新旧存储可能同时存在，峰值额外空间也应进入预算。

## vector 的失效与异常保证

借用包括指针、引用、迭代器和基于它们构造的视图。表中“保留”只针对容器自身这次修改，不延长所有者生命周期，也不提供跨线程同步。

| 成功执行的操作 | 已有元素借用 | 旧 end |
| --- | --- | --- |
| reserve，不重分配 | 保留 | 保留 |
| reserve 或 shrink_to_fit，发生重分配 | 全部失效 | 失效 |
| 尾部 push_back/emplace_back，不重分配 | 保留 | 失效 |
| insert/emplace，不重分配 | 插入点之前保留；该点及之后失效 | 失效 |
| 任意插入导致重分配 | 全部失效 | 失效 |
| erase 或 pop_back | 删除点之前保留；该点及之后失效 | 失效 |
| resize 缩小 | 保留前缀；被销毁的尾部借用失效 | 失效 |
| resize 增大 | 按尾部插入及重分配规则处理 | 失效 |
| clear | 元素借用全部失效 | 失效 |

`end()` 是尾后位置，不是最后一个元素，不能解引用。表中 resize 增大／缩小指长度确有变化；相同长度不是一次插入或删除。无重分配的 shrink_to_fit 不使借用失效。赋值、assign、swap 与带自定义分配器的移动另有规则，不能套用“扩容才失效”。[vector 容量](https://timsong-cpp.github.io/cppwp/n4659/vector.capacity)、[vector 修改](https://timsong-cpp.github.io/cppwp/n4659/vector.modifiers)、[clear 与 assign](https://timsong-cpp.github.io/cppwp/n4659/sequence.reqmts)。

![vector 不扩容插入和扩容时的不同失效范围](../resources/R13-vector-invalidation.svg)

图13-4：即使容量够用，在中间插入也会使插入点及后缀的旧借用失效。不能根据某个地址仍能读到整数，就把它视为原逻辑元素的稳定句柄。

### 元素操作的异常保证

`reserve(n)` 的 n 超过 max_size 时抛 `length_error`；分配失败可以抛异常。reserve、shrink_to_fit 与单参数 resize 通常在异常时无效果，但**不可拷贝且移动构造可能抛异常的 T**存在例外，不能无条件称为强保证。vector 尾部单元素插入在 T 可拷贝插入或移动构造不抛时，异常无效果；中间插入及 erase 不应直接套用这个结论，erase 可以因 T 的赋值而抛异常。[容量异常条件](https://timsong-cpp.github.io/cppwp/n4659/vector.capacity)、[修改异常条件](https://timsong-cpp.github.io/cppwp/n4659/vector.modifiers)。

生产中不要把 `noexcept` 当优化开关随意加到可能失败的移动构造上。先建立真实的不抛保证；扩容对现有 T 使用拷贝还是移动，应按类型能力和实现分析，而不是假定 emplace_back 就一定没有搬迁。

## 顺序容器的遍历删除

删除后使用返回的新位置，不对失效迭代器做递增。

```cpp
// 需要 <vector>；局部摘录
std::vector<int> v{1, 2, 3, 4, 5};
for (auto it = v.begin(); it != v.end(); ) {
    if (*it % 2 == 0) {
        it = v.erase(it);
    } else {
        ++it;
    }
}                         // {1, 3, 5}
```

这是迭代器使用正确的写法，但逐次删除可能反复搬移后缀，大量删除时最坏累计 O(n²)。批量过滤通常使用下面的 erase-remove 写法：

```cpp
v.erase(std::remove_if(v.begin(), v.end(),
                      [](int x) { return x % 2 == 0; }),
        v.end());         // C++17；还需要 <algorithm>
```

remove_if 把保留值压到前缀，返回“逻辑新尾部”，**并不缩小容器**；尾部元素仍存在，但其值不应当作过滤结果。erase 再销毁那个尾部。C++20 可写 `std::erase_if(v, pred)`，返回删除数量。过滤会改写元素，即使某些迭代器未失效，也不能假定它仍代表原来的业务对象。[remove 算法](https://timsong-cpp.github.io/cppwp/n4659/alg.remove)、[C++20 vector erasure](https://timsong-cpp.github.io/cppwp/n4861/vector.erasure)。

## std::deque


**基础操作**。双端队列在 `<deque>` 中拥有动态序列。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class deque;`，省略成员和约束。`T` 是元素类型，`Allocator` 管理存储。

### deque 的构造与操作

```cpp
// 需要 <deque>；局部摘录
std::deque<int> empty;
std::deque<int> copies(3, 7);
std::deque<int> values{2, 3};
values.push_front(1);
values.emplace_back(4);                     // {1,2,3,4}
values.at(1) = 8;
values.pop_front();                         // {8,3,4}
for (int x : values) { (void)x; }
```

数量、数量加值、区间和初始化列表构造与 vector 对应。`front/back` 和两端删除要求非空，`at` 检查下标。`insert/emplace` 位置可为尾后，`erase` 单元素位置必须可解引用并返回后继；`assign` 替换全序列，`clear` 销毁全部元素。两端操作为常数元素操作成本，中间修改与较近端距离有关。

### deque 的存储与失效
`deque<T>` 提供 `push_front/back`、`emplace_front/back`、`pop_front/back`、`operator[]` 与 `at`，但没有 vector 的 `reserve`、`capacity`、`data`。随机访问不等于连续存储。

常见实现用“块指针索引＋固定大小的元素块”：下标通过块号与块内偏移定位，两端增长可增添元素块而不搬迁所有已有元素。索引自身可能调整，这有助于理解为什么元素引用可以保留，而迭代器失效；具体失效仍以表中的标准规则为准。块大小、空块保留和索引增长各实现不同，两端 O(1) 的元素操作界不等于无分配、无索引维护或固定纳秒延迟。[N4659 deque 能力](https://timsong-cpp.github.io/cppwp/n4659/deque.overview)、[libstdc++ GCC 10.1 的分段实现说明](https://gcc.gnu.org/onlinedocs/gcc-10.1.0/libstdc++/api/a00605_source.html)。

| 成功执行的操作 | 元素引用与指针 | 迭代器与旧 end |
| --- | --- | --- |
| 两端插入 | 既有元素的借用保留 | 全部失效，包括旧 end |
| 中间插入 | 全部失效 | 全部失效 |
| 只删除头部，且未删除最后元素 | 只失效被删元素 | 只失效被删元素的迭代器；旧 end 保留 |
| 删除尾部，含删除最后元素 | 只失效被删元素 | 被删元素的迭代器和旧 end 失效 |
| 删除内部区间，不涉及首尾 | 全部失效 | 全部失效，包括旧 end |

```cpp
// 需要 <deque>；局部摘录
std::deque<int> q{10, 20};
int& first = q.front();
q.push_back(30);
first = 11;               // 有效：引用保留，q 为 {11, 20, 30}
// 若之前保存了 q.begin()，这里不可再使用那个旧迭代器。
```

这是“引用保留、迭代器失效”可以同时成立的例子。标准不规定 deque 迭代器的内部格式；分块索引只是帮助理解的一种实现。表中删除情况是常用头、尾、内段形式，不替代任意混合范围的逐项判断。[deque 接口](https://timsong-cpp.github.io/cppwp/n4659/deque.overview)、[deque 修改与失效](https://timsong-cpp.github.io/cppwp/n4659/deque.modifiers)。

## std::list


**基础操作**。双向链表在 `<list>` 中提供节点序列。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class list;`，省略成员与约束；没有下标或连续缓冲入口。

### list 的构造与常用成员

```cpp
// 需要 <list>、<iterator>；局部摘录
std::list<int> empty;
std::list<int> copies(3, 7);
std::list<int> values{1, 3};
auto pos = std::next(values.begin());
auto item = values.insert(pos, 2);          // {1,2,3}
values.erase(item);                         // {1,3}
values.push_front(0);
values.push_back(4);
for (int& x : values) x += 1;               // {1,2,4,5}
```

还提供数量、区间、复制/移动构造；`size/empty` 查询状态。首尾访问及首尾删除要求非空；`insert/emplace` 在位置前构造并返回新位置，`erase` 返回后继，单点删除要求可解引用。数量、范围、初始化列表插入成本随插入元素数增长；`clear/assign` 清空/替换序列。

`remove/remove_if` 直接删除节点，`unique` 删除相邻重复节点；C++17 返回 `void`，C++20 改为删除数量。`reverse` 反转链，`sort` 排序，`merge` 合并已按相同比较器排序的链表；比较器须满足严格弱序，详见 [R16](R16-algorithms.zh-CN.md)。

### list 的位置与 splice

list 插入不使既有迭代器和引用失效；删除只使被删除元素的借用失效。已持有位置时，单元素插删是 O(1)；`std::next(begin, k)` 找位置仍为 O(k)。list 用成员 `sort()` 排序，不符合 `std::sort` 的随机访问要求。[list 插删](https://timsong-cpp.github.io/cppwp/n4659/list.modifiers)、[list 专用操作](https://timsong-cpp.github.io/cppwp/n4659/list.ops)、[sort 的要求](https://timsong-cpp.github.io/cppwp/n4659/alg.sort)。

在常见双向链表中，已知位置插入修改的是附近链接，不需要搬移后缀的 T；但“按编号找位置，再插入”的总成本是 O(k)+O(1)，按值 find 后插入最坏为 O(n)。反复从 begin 定位每个编号会掩盖节点操作的优势。稳定地址、已保存迭代器和 splice 是选择 list 的依据；只因“插入 O(1)”改用 list，可能把原本的扫描和定位变得更贵。forward_list 同理，只是修改需要已知前驱。[N4659 list 修改](https://timsong-cpp.github.io/cppwp/n4659/list.modifiers)、[forward_list 修改](https://timsong-cpp.github.io/cppwp/n4659/forwardlist.modifiers)。

```cpp
// 需要 <list>；局部摘录
std::list<int> ready{10, 20};
std::list<int> active;
auto item = ready.begin();
active.splice(active.end(), ready, item);
// ready = {20}，active = {10}；item 仍指向 10，但属于 active。
```

| splice 形式 | 转移内容 | 复杂度与限制 |
| --- | --- | --- |
| `splice(pos, other)` | 整个 other | O(1)；other 不可为自身 |
| `splice(pos, other, it)` | it 所指元素 | O(1)；it 必须可解引用 |
| `splice(pos, other, first, last)` | [first, last) | 同表 O(1)，跨表 O(k)；pos 不得位于转移区间 |

所有形式要求两表的分配器比较相等；否则行为未定义。转移不复制或移动 T 本身，元素地址保持。转移后的迭代器属于目标表，不能再交给源表 erase。[splice 条件](https://timsong-cpp.github.io/cppwp/n4659/list.ops)。

## std::forward_list


**基础操作**。单向链表在 `<forward_list>` 中提供前驱之后的修改。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class forward_list;`，省略成员与约束；没有 `size/back/push_back`。

### forward_list 的构造与成员

```cpp
// 需要 <forward_list>；局部摘录
std::forward_list<int> empty;
std::forward_list<int> copies(3, 7);
std::forward_list<int> values{2, 3};
values.push_front(1);
auto first = values.insert_after(values.before_begin(), 0);
values.erase_after(first);                 // 删除 1，留下 {0,2,3}
for (int& x : values) x += 1;               // {1,3,4}
```

数量、区间、列表、复制/移动构造与其他动态序列对应；`front/pop_front` 要求非空。`insert_after/emplace_after` 返回新节点位置，多元素插入返回最后插入位置，空范围返回原位置。`clear/assign` 清空/替换序列。`remove/remove_if/unique/sort/reverse/merge` 操作节点，不用 `std::sort` 代替成员排序。

### forward_list 的前驱与 splice_after
`before_begin()` 是首元素前的不可解引用位置，用它可以统一处理头部。单点 `erase_after(prev)` 要求 prev 的后继是元素；返回被删元素之后的位置。范围形式 `erase_after(first, last)` 删除 **(first, last)**，两个端点都不删除，不是普通算法的 [first, last)。

```cpp
// 需要 <forward_list>；局部摘录
std::forward_list<int> f{1, 2, 3, 4};
auto prev = f.before_begin();
auto cur = f.begin();
while (cur != f.end()) {
    if (*cur % 2 == 0) {
        cur = f.erase_after(prev);
    } else {
        prev = cur;
        ++cur;
    }
}                         // {1, 3}
```

insert_after、emplace_after、splice_after 的目标可以是 before_begin 或元素位置，不能是 end。插入保留既有借用；删除只使被删节点借用失效。

splice_after 的单节点形式转移源迭代器的后继，该后继必须可解引用；范围形式转移 (first, last)，目标不得位于转移范围。整表形式不可自拼接，且为 O(n)；单节点 O(1)，范围操作线性。各形式要求分配器相等，不要照搬 list 的参数含义与整表 O(1)。[forward_list 接口](https://timsong-cpp.github.io/cppwp/n4659/forwardlist.overview)、[修改](https://timsong-cpp.github.io/cppwp/n4659/forwardlist.modifiers)、[转移](https://timsong-cpp.github.io/cppwp/n4659/forwardlist.ops)。

## 元素地址与业务句柄

### 拥有者与所指对象

如果外部要保存 T 的地址，但容器需要动态追加，可以考虑 `vector<unique_ptr<T>>`。vector 存的是拥有者；扩容会使这些拥有者自身的借用失效，却不会因移动拥有者而搬迁其所指 T。

```cpp
// 需要 <vector>、<memory>；局部摘录
std::vector<std::unique_ptr<int>> owners;
owners.push_back(std::make_unique<int>(42));
int* saved = owners.front().get();     // 借用所指对象，不是 &owners[0]
owners.reserve(owners.capacity() + 1); // 此处强制重分配
*saved = 43;                          // 有效：该对象仍被拥有
```

![vector 中拥有者地址与所指对象地址的区别](../resources/R13-owner-address.svg)

图13-5：稳定的是所指 T，不是 vector 的槽位、unique_ptr 的地址或迭代器。删除、reset、替换相应拥有者或销毁容器，仍会结束 T 的生命周期；多线程访问另需同步。[unique_ptr 移动](https://timsong-cpp.github.io/cppwp/n4659/unique.ptr.single.ctor)、[所有权替换](https://timsong-cpp.github.io/cppwp/n4659/unique.ptr.single.asgn)。

代价是额外分配和间接访问，T 也不再作为连续对象存储。它解决一个地址稳定性需求，不是 vector 的通用升级版。若需要长期业务句柄，还应区分“位置”“地址”“业务 ID”：下标可能因插删改变含义，裸指针不负责保活，ID 则需要自己的查找与有效性管理。

### 典型现象与检查点

| 现象或需求 | 优先检查 | 不要直接得出的结论 |
| --- | --- | --- |
| 追加之后旧指针崩溃 | 是否扩容；借用是否跨过所有者销毁 | 不能靠“预留过容量”证明永远安全 |
| 容量够用，中间插入仍读错对象 | 插入点及后缀的失效规则 | 没扩容不等于全部借用稳定 |
| deque 引用可用，迭代器却出错 | 是否在两端插入 | 随机访问容器不都遵循 vector 规则 |
| 删除后 RSS 没降 | capacity、分配器缓存、OS 回收策略 | clear 不等于把内存归还 OS |
| 链表插删快，但总体更慢 | 找位置、节点分配、访问局部性；按真实负载测量 | O(1) 不承诺比 O(n) 更低的实际延迟 |
| 需要严格有界的延迟或容量 | 分配、迁移、元素构造的最坏路径 | reserve 与摊还 O(1) 不是实时性保证 |

缓存与 RSS 的分析是工程检查方向，不是 C++ 标准保证。正确性先按规则核对，再测量性能。不要为避免一个失效问题，换容器后忽略新的同步、生命周期或内存成本。

## 参考资料

进一步查阅：[cppreference 顺序容器入口](https://en.cppreference.com/cpp/container)、[C++17 N4659 标准公开草案](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/n4659.pdf)、[C++20 N4861 标准公开草案](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf)。

相邻主题：非拥有视图见 R12，迭代器与 ranges 见 R15，算法前提见 R16，RAII 与分配器见 R09，并发访问见 R20 至 R22。本章不覆盖所有重载、分配器传播及并发容器设计。


[配套源码](../examples/r13-sequence-containers.cpp) 提供顺序容器组合应用参考。
