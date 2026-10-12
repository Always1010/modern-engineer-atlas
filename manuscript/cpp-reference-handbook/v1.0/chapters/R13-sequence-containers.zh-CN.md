# 顺序容器

顺序容器把同一种类型的对象按位置组织起来。选型时先看数据如何访问、在哪里增删、是否要保存元素地址；不要只比较一个插入操作的复杂度。

版本：本节核心接口适用于 C++17；`std::erase_if` 单独标为 C++20。先用整数 `vector` 观察元素、长度、容量和访问位置，再比较容器的成本与修改规则。变量初始化、下标、循环和引用足以进入前面的操作；拷贝、移动和异常知识用于理解后面的类型条件。

## std::vector


公开声明摘要省略成员和约束：


```cpp
namespace std {
    template<class T, class Allocator = allocator<T>> class vector;
}
```

`T` 是元素类型，`Allocator` 管理存储。类型能力按具体操作判断。

### vector 的构造与初始化

**`std::vector`** 拥有长度可变的一组同类型元素；一般 `vector` 的元素连续存储，`vector<bool>` 是特殊形式，不属于这里的连续元素模型。`std::vector<int>` 中的 `int` 指定元素类型。在源文件开头加入 `#include <vector>`，取得类型和成员的声明。

先建立空容器和三个整数，再在末尾追加一个整数：

```cpp
std::vector<int> empty;
std::vector<int> values{1, 2, 3};
values.push_back(4);
int first = values[0];                     // 1
```

`empty` 没有元素，`values` 最后为 `1、2、3、4`。下标从零开始；`push_back` 建立末尾新元素。容器离开作用域时销毁元素并释放它所管理的存储。移动构造通常转移存储，自定义分配器参与的形式另有约束。

### vector 的访问与遍历


**长度**是当前存在的元素数，由 `size()` 查询；`empty()` 判断长度是否为零。有效下标满足 `i < size()`，`operator[]` 不检查越界，`at()` 越界抛 `std::out_of_range`。`front/back` 要求非空。

下面使用检查访问修改第二个整数，再通过范围 for 修改每个元素。

```cpp
std::vector<int> values{1, 2, 3};
values.at(1) = 8;
int first = values.front();                 // 要求非空
auto length = values.size();                // 3
bool no_elements = values.empty();          // false
for (int& x : values) x *= 2;               // {2,16,6}
```

例中先将第二个元素改为 8，再逐项乘二，最后序列为 `2、16、6`。`size_type` 是无符号长度类型，空容器不能先算 `size()-1` 再访问末元素。

### 数量构造与初始化列表


下面对比数量构造与花括号列表，三种写法得到不同的元素序列。

```cpp
std::vector<int> zeros(3);  // 三个值初始化的 0
std::vector<int> a(3, 7);   // 三个 7：{7, 7, 7}
std::vector<int> b{3, 7};   // 两个元素：{3, 7}
```

花括号优先涉及 initializer_list 重载；不能把 `()` 机械改为 `{}`。固定数组的零初始化另见[std::array](#stdarray)。

### initializer_list 与构造选择

**`std::initializer_list<T>`**（`<initializer_list>`）提供对一个底层 `const T` 数组的轻量访问。容器中圆括号与花括号可以选择完全不同的构造。下面使用 `<vector>`：

```cpp
std::vector<int> repeated(3, 7); // 数量和值：三个 7
std::vector<int> listed{3, 7};   // 初始列表：两个元素 3、7
```

列表元素是 `const`，用列表构造容器通常需要从这些元素复制；列出多个 `unique_ptr` 不能通过 `std::move` 绕过不可拷贝限制。逐个 `emplace_back` 等移动方式见[顺序容器](R13-sequence-containers.zh-CN.md)。复制 `initializer_list` 描述不复制底层元素，也不会无条件延长原数组寿命；不能长期保存一个由局部临时列表产生的视图。

### reserve 与 resize

**容量**是无须重新分配就能容纳的元素数，由 `capacity()` 查询。容量至少等于长度；预留存储没有对应的已存在元素。

| 接口 | 改 size | 对容量与元素的影响 | 使用目的 |
| --- | --- | --- | --- |
| `void reserve(size_type n)` | 否 | n > capacity 才重分配；成功后 capacity ≥ n | 预估元素数，减少后续扩容 |
| `void resize(size_type n)` | 是 | 增大时补元素；缩小时销毁尾部元素，不缩 capacity | 让序列具有 n 个元素 |
| `void resize(size_type n, const T& value)` | 是 | 增大时补 value 的副本 | 同上，指定新增值 |
| `void shrink_to_fit()` | 否 | 请求缩容量，但实现可以不执行；可能重分配 | 确有需求时尝试释放多余存储 |


下面先预留空间，再追加、补值和缩短；每个注释给出状态变化。

```cpp
std::vector<int> v{10, 20, 30};
v.reserve(6);              // size 仍为 3，capacity 至少为 6
auto length = v.size();
auto available = v.capacity();             // available 至少为 6
v.push_back(40);           // 创建第 4 个元素
v.resize(6, -1);           // {10, 20, 30, 40, -1, -1}
v.resize(2);               // {10, 20}；capacity 不变
```

`reserve(6)` 后直接写 `v[5] = 42` 仍是越界：容量不是可索引的元素数。用于 C 接口填充的 vector 应先 `resize` 到允许写入的元素数，再传 `data()` 与相应长度。不要每次追加前都 `reserve(size()+1)`；这会干扰容器自身的增长策略，并可能造成累计线性搬迁的平方级成本。

![vector 中已存在元素和预留存储的区别](../resources/R13-vector-capacity.svg)

图13-1：与上例使用同一初始值及四次操作；教学图假设实际 capacity 为 6，reserve(6) 只保证容量至少为 6。push_back 创建 40，resize(6,-1) 再创建两个 -1，resize(2) 销毁尾部四个元素但保留容量。虚线表示没有元素的预留存储，不可通过下标访问。

### 迭代器、begin 与 end

**迭代器**（iterator）表示序列中的访问位置。对 `vector<int>`，`begin()` 取得首元素的位置，`end()` 取得最后一个元素之后的**尾后位置**。`*it` 访问当前位置的元素，`++it` 向前移动一个位置；迭代器的写法与指针相似，但不要求所有容器的迭代器都是裸指针。

用三个整数观察起点、前进和终点：

```cpp
std::vector<int> values{10, 20, 30};
auto it = values.begin();
int first = *it;                           // 10
++it;
int second = *it;                          // 20
```

两次读取都有对应元素。空容器的 `begin() == end()`，不能解引用起点；尾后位置没有元素，也不能解引用或继续递增。

![三个元素及它们的访问位置](../resources/R13-iterator-positions.svg)

图13-2：`begin()` 对应 10，递增三次到达 `end()`；终点仅用于判断遍历结束。

**半开区间** `[first,last)` 包含起点所指元素，不包含终点；整个容器对应 `[begin(),end())`。起点到终点必须可按允许的递增操作到达，不能拼接两个不同容器的位置。

用位置遍历同一组整数，每次读取前检查终点：

```cpp
std::vector<int> values{10, 20, 30};
int total = 0;
for (auto it = values.begin(); it != values.end(); ++it) {
    total += *it;
}
```

`total` 最后是 60；空序列第一次判断就结束。本例遍历中不改变容器结构。`vector` 支持 `begin()+n` 的位置偏移；非负 `n` 不超过 `size()`，可以到达尾后位置，尾后仍不能读取。这种直接偏移能力不能推广到链表，类别和通用导航见 [R15](R15-iterators-ranges.zh-CN.md)。

### vector 的区间构造与拷贝构造

区间构造复制 `[first,last)` 的元素；拷贝构造复制整个容器，产生独立的元素序列。用刚建立的位置模型选择第二个元素到结尾：

```cpp
std::vector<int> values{1, 2, 3};
std::vector<int> part(values.begin() + 1, values.end()); // {2,3}
std::vector<int> copy(values);              // 独立元素序列
```

`part` 有两个元素，`copy` 有三个；修改 `copy` 的整数不改变 `values`。区间必须有效，且元素类型满足所选构造要求。

### vector 的插入、删除与替换

常用形式为 `insert(pos,value)`、`insert(pos,count,value)`、`insert(pos,first,last)`、`insert(pos,{...})`，返回第一个新元素的迭代器。`emplace(pos,args...)` 原位构造一个元素并返回位置。位置可为 `end()`；区间输入应是有效的外部范围。


下面在第二个位置前加入 2、3，利用返回位置删除 2，再替换和清空序列。

```cpp
std::vector<int> values{1, 4};
auto inserted = values.insert(values.begin() + 1, {2, 3});
inserted = values.erase(inserted);          // {1,3,4}，返回指向 3
values.assign(2, 9);                        // 替换为 {9,9}
values.clear();                             // 空，容量保留
```

`erase(pos)` 要求可解引用位置；区间形式删 `[first,last)`，返回后继。`assign(count,value)`、`assign(first,last)`、`assign({...})` 替换整段序列，不能沿用旧借用。容量与尾部追加的签名在下一张核心接口表汇总。

### vector 的核心接口
`vector<T, Allocator = std::allocator<T>>` 管理一段元素存储。以下针对一般 `vector`，不含 `vector<bool>` 特化。下列为常用接口形式，省略 `const` 重载；`size_type` 是容器的无符号长度类型，`iterator` 是它的迭代器类型。

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

其他 `insert` 重载可移动单元素、插入若干副本或外部区间。`erase(first, last)` 删除半开区间，空区间允许。对默认分配器而言，拷贝插入需要 `T` 可拷贝构造，vector 删除通常还需要 `T` 可移动赋值；完整的类型要求随重载变化。

## 顺序容器分类

| 类型与头文件 | 保证与访问方式 | 优先考虑的场景 | 主要限制 |
| --- | --- | --- | --- |
| `std::array<T, N>` · `<array>` | 固定 N，元素连续，支持下标 | 编译期固定长度的缓冲与小表 | 无扩容与插删；存放在栈还是堆由对象所在位置决定 |
| `std::vector<T>` · `<vector>` | 动态长度，除 bool 特化外元素连续 | 批处理、扫描、排序、尾部追加 | 扩容与中间修改会影响借用 |
| `std::deque<T>` · `<deque>` | 随机访问；不保证整体连续 | 频繁在两端增删，同时需要下标 | 不能当连续数组传给 C 接口 |
| `std::list<T>` · `<list>` | 双向迭代；插入不使既有元素借用失效 | 已持有位置、需要稳定节点或拼接 | 无下标；找位置仍要遍历 |
| `std::forward_list<T>` · `<forward_list>` | 单向迭代；围绕前驱修改 | 明确需要单向节点链的场景 | 无 size、back、push_back；需维护前驱 |

长度固定先看 `array`，普通动态序列先看 `vector`。再用两端操作、节点稳定性或拼接需求证明换容器的必要性。这是选型起点，不是性能结论。

![顺序容器的元素布局与访问路径](../resources/R13-container-layout.svg)

图13-3：连续性是 array 和一般 vector 的保证；deque 的分块索引、list 的双向节点和 forward_list 的单向节点是常见实现示意，不规定块大小、节点布局或额外内存的数量。

### 复杂度与额外空间

**复杂度记号** `O(f(n))` 描述随规模增长的上界，必须同时说明计算哪一种操作。`O(1)` 的界不随元素数量增长，`O(n)` 随数量线性增长，`O(log n)` 为对数增长，`O(n²)` 为平方增长。**最坏**考察允许输入中最贵的一次；**平均**需要输入或分布假设，例如哈希查找的平均常数界；**均摊（摊还）**把一串操作的总成本分摊，不要求随机输入。三者不能互换：vector 追加的均摊常数不提供单次延迟上界。

比较次数、元素构造／移动／赋值次数、分配次数也不是同一单位。比较两个长字符串可能扫描多个字符；移动一个元素可能调用用户代码；中间 erase 的线性成本主要来自给后缀赋值。选型时还应单列**额外空间**：除结果元素外，为预留存储、索引、链接或算法工作区付出的空间。容量与节点开销须按目标实现测量，不由时间复杂度推导。

| 布局 | 访问成本来自哪里 | 额外空间与局部性 |
| --- | --- | --- |
| array／一般 vector 的连续元素 | 第 k 个位置可由起点与偏移直接定位 | 扫描地址相邻；vector 另有未构造的 capacity−size 个槽位 |
| 常见分段 deque | 先定位块，再定位块内偏移 | 块索引与两端空位有开销；块内连续不代表全序列连续 |
| 常见节点链表 | 定位第 k 个位置需沿链接逐个走 | 每节点有链接与分配开销；地址分散可能增加缓存未命中 |

后两行是常见实现的成本解释，不是节点字节数或缓存命中率的标准保证。连续布局利于扫描也不证明所有负载下 vector 都更快；先确定操作比例、元素大小与借用需求，再测量。

### 操作成本

n 为当前元素数；以下插删只修改一个元素。链表 O(1) 以已经持有正确位置为前提，forward_list 还需要前驱。

| 容器 | 第 k 个位置 | 尾部/头部添加 | 已知位置单点插删 |
| --- | --- | --- | --- |
| array | O(1) | 不提供 | 不提供 |
| vector | O(1) | 尾部摊还 O(1)，扩容 O(n)；头部 O(n) | O(n)，受距尾部距离影响 |
| deque | O(1) | 两端 O(1) | O(n)，受较近端距离影响 |
| list | O(k) 遍历 | 两端 O(1) | O(1)，已持有位置 |
| forward_list | O(k) 遍历 | 头部 O(1)，无 push_back | O(1)，已持有前驱 |

摊还的定义见前面的复杂度说明；它不保证某一次追加耗时很短。标准复杂度按元素操作次数描述，不是微秒承诺；大对象的移动、分配器、缓存和负载还会影响实测时间。

## 动态数组扩容

array 的 N 属于类型，不能在尾部增加第 N+1 个元素；vector 的 size 可变，却仍要维持一般元素连续。当尾部没有容量时，重分配通常需要取得更大的连续存储、在新存储构造旧序列与新元素、最后销毁旧元素并释放旧存储；不能假定只把原缓冲地址“向后延长”。旧元素的拷贝／移动选择和失败处理见下文失效与异常保证。

用每次容量翻倍的教学模型理解均摊：从空开始追加到 n 个元素，历次迁移约为 1+2+4+…，其和为 O(n)，再加 n 次新元素构造，整串追加仍为 O(n)。这只是一个满足均摊要求的增长策略示意，标准不规定翻倍、倍率或每次实际容量。若每次强制只增加一个容量槽位，则可能搬迁 1+2+…+(n−1) 个旧元素，累计 O(n²)；因此一次合理 reserve 往往比逐次 reserve(size()+1) 更合适。

![vector 的增长模型与单次迁移成本](../resources/R13-vector-growth-cost.svg)

图13-4：容量 1、2、4、8 仅用于证明几何增长的累计迁移量；不是本机或标准规定的容量序列。扩容时新旧存储可能同时存在，峰值额外空间也应进入预算。

## vector 的失效与异常保证

**失效**表示旧指针、引用或迭代器不能再按原来的元素借用使用，不是它的数值自动变成空。借用包括指针、引用、迭代器和基于它们构造的视图。表中“保留”只针对容器自身这次修改，不延长所有者生命周期，也不提供跨线程同步。

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

`end()` 是尾后位置，不是最后一个元素，不能解引用。表中 `resize` 增大／缩小指长度确有变化；相同长度不是一次插入或删除。无重分配的 `shrink_to_fit` 不使借用失效。赋值、`assign`、`swap` 与带自定义分配器的移动另有规则，不能套用“扩容才失效”。

![vector 不扩容插入和扩容时的不同失效范围](../resources/R13-vector-invalidation.svg)

图13-5：即使容量够用，在中间插入也会使插入点及后缀的旧借用失效。不能根据某个地址仍能读到整数，就把它视为原逻辑元素的稳定句柄。

### 元素操作的异常保证

`reserve(n)` 的 n 超过 max_size 时抛 `length_error`；分配失败可以抛异常。reserve、shrink_to_fit 与单参数 resize 通常在异常时无效果，但不可拷贝且移动构造可能抛异常的 `T` 存在例外，不能无条件称为强保证。vector 尾部单元素插入在 `T` 可拷贝插入或移动构造不抛时，异常无效果；中间插入及 erase 不应直接套用这个结论，erase 可以因 `T` 的赋值而抛异常。

生产中不要把 `noexcept` 当优化开关随意加到可能失败的移动构造上。先建立真实的不抛保证；扩容对现有 T 使用拷贝还是移动，应按类型能力和实现分析，而不是假定 emplace_back 就一定没有搬迁。

### 暂存与强保证提交

下面用默认分配器的 `vector<int>` 先修改副本，再不抛交换提交；需要 `<vector>`。完整[失败注入源码](../examples/r11-errors-exception-safety.cpp)另展示作用域清理。



```cpp
void append_strong(std::vector<int>& target, int value) {
    auto staged = target;     // 复制失败，target 不变
    staged.push_back(value);  // 追加失败，target 不变
    target.swap(staged);      // 适用的不抛提交
}
```

成功后 target 多一个元素，失败前 target 原值保持。若提交可能抛、分配器不满足交换条件，或副本共享可变外部状态，该结构不自动成立；回滚本身也须能完成。

![暂存、失败清理与提交](../resources/R11-rollback-sequence.svg)

图：副本失败被销毁，成功才交换提交；不保证任意类型或分配器都具有同样条件。

## 顺序容器的遍历删除

删除后使用返回的新位置，不对失效迭代器做递增。


```cpp
std::vector<int> v{1, 2, 3, 4, 5};
for (auto it = v.begin(); it != v.end(); ) {
    if (*it % 2 == 0) {
        it = v.erase(it);
    } else {
        ++it;
    }
}                         // {1, 3, 5}
```

这是迭代器使用正确的写法，但逐次删除可能反复搬移后缀，大量删除时最坏累计 O(n²)。批量过滤可分两步：`remove_if` 按谓词压紧保留值并返回逻辑新尾部，`erase` 再删除尾部元素。这里谓词是判断是否为偶数的 lambda；算法声明来自 `<algorithm>`，首次使用前加入 `#include <algorithm>`。下面继续使用前一个循环留下的 `v`，展示批量过滤形式：


```cpp
v.erase(std::remove_if(v.begin(), v.end(),
                      [](int x) { return x % 2 == 0; }),
        v.end());         // C++17
```

remove_if 把保留值压到前缀，返回“逻辑新尾部”，并不缩小容器；尾部元素仍存在，但其值不应当作过滤结果。erase 再销毁那个尾部。C++20 可写 `std::erase_if(v, pred)`，返回删除数量。过滤会改写元素，即使某些迭代器未失效，也不能假定它仍代表原来的业务对象。

## std::array

**固定长度数组**在 `<array>` 中拥有 `N` 个连续元素。公开声明摘要省略成员：


```cpp
namespace std {
    template<class T, size_t N> struct array;
}
```

`T` 是元素类型，`N` 是编译期长度，允许为零。它是聚合，不接受动态数量构造；默认局部 `array<int,3> a;` 不清零元素，`{}` 值初始化为零。

### array 的初始化、访问与遍历


在源文件开头加入 `#include <array>`，分别取得固定长度数组的声明。

下面建立固定长度数组，修改元素后查询长度和连续存储入口。

```cpp
std::array<int, 3> zero{};
std::array<int, 3> values{1, 2, 3};
values.at(1) = 8;                           // {1,8,3}
for (int& x : values) x += 1;               // {2,9,4}
auto n = values.size();                     // 3
int* first = values.data();                 // 连续元素入口
```

`operator[](i)` 要求 `i < N`，`at(i)` 越界抛 `out_of_range`；`front/back` 要求非空。`begin/end` 提供随机访问迭代器。`N==0` 时不能取首尾或解引用 `data()`，不能依赖 `data()` 是空指针。

### array 的修改与失效


下面保留 a 的一个元素引用，再交换两个数组，观察引用仍指向 a 的槽位。

```cpp
std::array<int, 3> a{1, 2, 3};
std::array<int, 3> b{};
b.fill(9);                                 // 线性赋值为 {9,9,9}
int& slot = a[0];
a.swap(b);                                 // a={9,9,9}，b={1,2,3}
slot = 7;                                  // 修改 a[0]，没有转而引用 b
```

没有插删与扩容。访问为常数时间，`fill/swap` 与长度成线性关系；交换逐元素进行，不让引用迁移到另一数组。数组本体销毁仍结束元素寿命，存储位置由数组对象所在位置决定。

## std::deque


**双端队列**在 `<deque>` 中拥有动态序列。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class deque;`，省略成员和约束。`T` 是元素类型，`Allocator` 管理存储。

### deque 的构造与操作


在源文件开头加入 `#include <deque>`，分别取得双端队列的声明。

下面分别建立空、重复值和列表队列，再从两端修改元素。

```cpp
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

常见实现用“块指针索引＋固定大小的元素块”：下标通过块号与块内偏移定位，两端增长可增添元素块而不搬迁所有已有元素。索引自身可能调整，这有助于理解为什么元素引用可以保留，而迭代器失效；具体失效仍以表中的标准规则为准。块大小、空块保留和索引增长各实现不同，两端 O(1) 的元素操作界不等于无分配、无索引维护或固定纳秒延迟。

| 成功执行的操作 | 元素引用与指针 | 迭代器与旧 end |
| --- | --- | --- |
| 两端插入 | 既有元素的借用保留 | 全部失效，包括旧 end |
| 中间插入 | 全部失效 | 全部失效 |
| 只删除头部，且未删除最后元素 | 只失效被删元素 | 只失效被删元素的迭代器；旧 end 保留 |
| 删除尾部，含删除最后元素 | 只失效被删元素 | 被删元素的迭代器和旧 end 失效 |
| 删除内部区间，不涉及首尾 | 全部失效 | 全部失效，包括旧 end |


下面在尾部插入后继续使用首元素引用，展示引用与迭代器不同的失效规则。

```cpp
std::deque<int> q{10, 20};
int& first = q.front();
q.push_back(30);
first = 11;               // 有效：引用保留，q 为 {11, 20, 30}
// 若之前保存了 q.begin()，这里不可再使用那个旧迭代器。
```

这是“引用保留、迭代器失效”可以同时成立的例子。标准不规定 deque 迭代器的内部格式；分块索引只是帮助理解的一种实现。表中删除情况是常用头、尾、内段形式，不替代任意混合范围的逐项判断。

## std::list


**双向链表**在 `<list>` 中提供节点序列。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class list;`，省略成员与约束；没有下标或连续缓冲入口。

### list 的构造与常用成员


在源文件开头加入 `#include <list>`、`#include <iterator>`，分别取得双向链表、自由 begin/end、导航函数和迭代器适配器的声明。

下面先从起点走到第二个节点，再在它之前插入并删除，最后修改首尾。

```cpp
std::list<int> empty;
std::list<int> copies(3, 7);
std::list<int> values{1, 3};
auto pos = values.begin();
++pos;                                    // 从首元素前进到 3 的位置
auto item = values.insert(pos, 2);          // {1,2,3}
values.erase(item);                         // {1,3}
values.push_front(0);
values.push_back(4);
for (int& x : values) x += 1;               // {1,2,4,5}
```

还提供数量、区间、复制/移动构造；`size/empty` 查询状态。首尾访问及首尾删除要求非空；`insert/emplace` 在位置前构造并返回新位置，`erase` 返回后继，单点删除要求可解引用。数量、范围、初始化列表插入成本随插入元素数增长；`clear/assign` 清空/替换序列。

`remove/remove_if` 直接删除节点，`unique` 删除相邻重复节点；C++17 返回 `void`，C++20 改为删除数量。`reverse` 反转链，`sort` 排序，`merge` 合并已按相同比较器排序的链表；比较器须满足严格弱序，详见 [R16](R16-algorithms.zh-CN.md)。

### list 的位置与 splice

`list` 插入不使既有迭代器和引用失效；删除只使被删除元素的借用失效。已持有位置时，单元素插删是 O(1)；`std::next(begin, k)` 找位置仍为 O(k)。`list` 用成员 `sort()` 排序，不符合 `std::sort` 的随机访问要求。通用导航 `std::next(it,k)`（在 `<iterator>` 中声明）取得前进 k 步的副本，不修改原位置；完整条件见 [R15](R15-iterators-ranges.zh-CN.md#stdadvancestdnextstdprev-与-stddistance)。

在常见双向链表中，已知位置插入修改的是附近链接，不需要搬移后缀的 T；但“按编号找位置，再插入”的总成本是 O(k)+O(1)，按值 find 后插入最坏为 O(n)。反复从 begin 定位每个编号会掩盖节点操作的优势。稳定地址、已保存迭代器和 splice 是选择 list 的依据；只因“插入 O(1)”改用 list，可能把原本的扫描和定位变得更贵。forward_list 同理，只是修改需要已知前驱。


下面把 ready 的一个节点转入 active，观察原节点迭代器仍表示同一整数。

```cpp
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

所有形式要求两表的分配器比较相等；否则行为未定义。转移不复制或移动 T 本身，元素地址保持。转移后的迭代器属于目标表，不能再交给源表 erase。

## std::forward_list


**单向链表**在 `<forward_list>` 中提供前驱之后的修改。公开声明摘要为 `template<class T, class Allocator = allocator<T>> class forward_list;`，省略成员与约束；没有 `size/back/push_back`。

### forward_list 的构造与成员


在源文件开头加入 `#include <forward_list>`，分别取得单向链表的声明。

下面从首元素前的位置插入，再删除其后继，观察前驱参数的含义。

```cpp
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
`before_begin()` 是首元素前的不可解引用位置，用它可以统一处理头部。单点 `erase_after(prev)` 要求 `prev` 的后继是元素；返回被删元素之后的位置。范围形式 `erase_after(first, last)` 删除 `(first, last)`，两个端点都不删除，不是普通算法的 `[first, last)`。


下面同时维护前驱和当前位置，删除偶数节点后使用返回位置继续。

```cpp
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

`splice_after` 的单节点形式转移源迭代器的后继，该后继必须可解引用；范围形式转移 `(first, last)`，目标不得位于转移范围。整表形式不可自拼接，且为 O(n)；单节点 O(1)，范围操作线性。各形式要求分配器相等，不要照搬 `list` 的参数含义与整表 O(1)。

## 元素地址与业务句柄

### 拥有者与所指对象

如果外部要保存 T 的地址，但容器需要动态追加，可以考虑 `vector<unique_ptr<T>>`。vector 存的是拥有者；扩容会使这些拥有者自身的借用失效，却不会因移动拥有者而搬迁其所指 T。


在源文件开头加入 `#include <memory>`，分别取得智能指针和创建拥有者的工厂的声明。

下面强制 vector 重新分配，同时保留 unique_ptr 所拥有整数的地址。

```cpp
std::vector<std::unique_ptr<int>> owners;
owners.push_back(std::make_unique<int>(42));
int* saved = owners.front().get();     // 借用所指对象，不是 &owners[0]
owners.reserve(owners.capacity() + 1); // 此处强制重分配
*saved = 43;                          // 有效：该对象仍被拥有
```

![vector 中拥有者地址与所指对象地址的区别](../resources/R13-owner-address.svg)

图13-6：稳定的是所指 T，不是 vector 的槽位、unique_ptr 的地址或迭代器。删除、reset、替换相应拥有者或销毁容器，仍会结束 T 的生命周期；多线程访问另需同步。

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


相邻主题：非拥有视图见 R12，迭代器与 ranges 见 R15，算法前提见 R16，RAII 与分配器见 R09，并发访问见 R20 至 R22。本节不覆盖所有重载、分配器传播及并发容器设计。


[配套源码](../examples/r13-sequence-containers.cpp) 提供顺序容器组合应用参考。
