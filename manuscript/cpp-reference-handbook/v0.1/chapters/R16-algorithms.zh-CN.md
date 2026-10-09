# 算法库

算法从区间读取或修改元素，并返回位置、值或输出终点。查询、复制、过滤、排序、二分、集合、堆与数值运算分别形成操作组；算法不会自动创建目标容器元素。

**基线**：C++17，C++20 的 ranges 入口见 [R15](R15-iterators-ranges.zh-CN.md)。先修为有效区间和迭代器能力；复杂度中的 n 是输入长度，通常计比较、谓词或元素操作次数。以下声明为常用签名摘要，省略其他重载、约束和执行策略。

## 比较器与谓词

**基础操作**。谓词（predicate）把元素映射为可作布尔判断的结果；比较器（comparator）在两个值间定义先后关系。排序与有序操作要求严格弱序（strict weak ordering）：`comp(x,x)` 为假，严格关系传递，互不先于所形成的等价关系也传递。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
struct Item { int key; };
std::vector<Item> values{{3}, {1}, {2}};
std::sort(values.begin(), values.end(),
          [](const Item& a, const Item& b) { return a.key < b.key; });
```

`<=` 不是合格排序比较器；NaN 与普通浮点 `<` 在任意混合输入上不形成所需关系，须排除或定义一致策略。比较关系不得因外部易变状态在操作中漂移；比较等价不一定等于 `operator==`。[N4659 sorting requirements](https://timsong-cpp.github.io/cppwp/n4659/alg.sorting)。

## std::find、std::find_if 与计数

**基础操作**。`<algorithm>`，签名摘要：

```cpp
namespace std {
    template<class I, class T> I find(I first, I last, const T& value);
    template<class I, class Pred> I find_if(I first, I last, Pred pred);
    template<class I, class T> typename iterator_traits<I>::difference_type
        count(I first, I last, const T& value);
}
```

`find/find_if` 返回首个命中或 `last`，最多 n 次比较/谓词调用；`count/count_if` 返回匹配数，恰 n 次。输入迭代器足够，不要求排序。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 2, 3};
auto it = std::find(values.begin(), values.end(), 2);
auto n = std::count(values.begin(), values.end(), 2); // 2
if (it != values.end()) { /* 可读取 *it，值为 2 */ }
```

## std::all_of、std::any_of 与 std::none_of

`<algorithm>`，常用签名形状为 `template<class I,class Pred> bool all_of(I first,I last,Pred pred);`，另两者参数相同。最多 n 次谓词调用，可提前停止；空区间的结果依次是 true、false、true。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{2, 4, 6};
bool all_even = std::all_of(values.begin(), values.end(),
                            [](int x) { return x % 2 == 0; }); // true
bool has_large = std::any_of(values.begin(), values.end(),
                             [](int x) { return x > 10; });    // false
```

## std::for_each

`<algorithm>`，`template<class I,class F> F for_each(I first,I last,F f);`。传统无策略形式按序调用函数，返回函数对象，恰 n 次调用；可修改元素，但不以结构修改破坏输入区间。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 3};
std::for_each(values.begin(), values.end(), [](int& x) { x *= 2; });
// values 为 {2,4,6}
```

## std::copy、std::copy_if 与填充

`<algorithm>`，常用形式为 `template<class I,class O> O copy(I first,I last,O out);`、`template<class I,class O,class Pred> O copy_if(I first,I last,O out,Pred pred);`。返回输出终点；copy 复制 n 项，copy_if 保持匹配项的相对顺序。目标须足够且满足算法的重叠限制。

```cpp
// 需要 <algorithm>、<iterator>、<vector>；局部摘录
std::vector<int> source{1, 2, 3, 4};
std::vector<int> odd;
std::copy_if(source.begin(), source.end(), std::back_inserter(odd),
             [](int x) { return x % 2 != 0; }); // {1,3}
std::vector<int> target(source.size());
std::copy(source.begin(), source.end(), target.begin());
```

`fill(first,last,value)` 给已有范围赋值，返回 void；`fill_n(out,count,value)` 返回输出终点。`copy_backward` 由末尾向前复制，适合满足其条件的右移重叠；普通 copy 不能当任意 `memmove`。

## std::transform

`<algorithm>`，签名摘要：

```cpp
namespace std {
    template<class I, class O, class F> O transform(I first, I last, O out, F op);
    template<class I1, class I2, class O, class F>
        O transform(I1 first, I1 last, I2 second, O out, F op);
}
```

一元形式 n 次调用，二元形式第二输入至少有 n 项；返回输出终点。可作相应就地映射，不改变容器长度，不能破坏输入区间或依赖未保证的调用次序。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 3};
std::transform(values.begin(), values.end(), values.begin(),
               [](int x) { return x * 10; }); // {10,20,30}
```

## std::remove、std::remove_if 与 std::unique

签名摘要为 `template<class I,class Pred> I remove_if(I first,I last,Pred pred);`、`template<class I> I unique(I first,I last);`，头文件 `<algorithm>`。remove 用值比较，unique 也有二元等价谓词重载。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 2, 3};
auto tail = std::remove_if(values.begin(), values.end(),
                           [](int x) { return x % 2 == 0; });
values.erase(tail, values.end());            // {1,3}，erase 才改变长度
```

`remove(first,last,value)` 和 `remove_if(first,last,pred)` 以保持相对顺序的方式压紧保留元素，返回逻辑新尾部；`unique` 只压紧相邻等价元素，不自动去掉全局重复。它们要求可写且满足相关移动赋值要求的迭代器，不能改 map 的 const 键。处理 n 元素的 remove 调用 n 次比较／谓词，unique 对非空区间作 n−1 次比较。[N4659 移除算法](https://timsong-cpp.github.io/cppwp/n4659/alg.remove)。

![remove 产生逻辑尾部，erase 再结束尾部生命周期](../resources/R16-remove-erase.svg)

图16-1：机制示意；remove 后尾部仍是存在的对象，其值不作为结果解释，不保证图示数值。erase 才改变容器长度，并按容器规则使借用失效。

C++20 的 `std::erase_if(v,pred)` 返回删除数。list 可以用成员 remove_if，避免移动值；C++17 该成员返回 void，C++20 改为返回删除数。想保留原数据则用 copy_if 到新的序列。

remove 未失效的迭代器可能已指向被改写的值；地址有效不代表业务身份不变。谓词需观察元素是否应移除，不应在内部删除容器元素或破坏算法正在遍历的结构。


## std::sort 与 std::stable_sort

`<algorithm>`，常用形式为 `template<class RandomIt,class Compare> void sort(RandomIt first,RandomIt last,Compare comp);`，stable_sort 形状对应。需随机访问迭代器和有效移动/赋值/交换操作；默认重载使用 `<`。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{3, 1, 2};
std::sort(values.begin(), values.end());      // {1,2,3}
bool sorted = std::is_sorted(values.begin(), values.end()); // true
```

sort 的比较次数 O(n log n)，不保留等价元素次序；stable_sort 保留，额外内存足够时 O(n log n)，否则 O(n log² n) 比较。不能由比较次数推出工作空间或字节搬运成本。链表调用成员 sort。

## std::min_element 与 std::max_element

`<algorithm>`，`template<class I> I min_element(I first,I last);`，max_element 与比较器重载对应；前向迭代器足够。空范围返回 last；非空 n−1 次比较，返回首次最小/最大位置，不重排。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{4, 1, 7};
auto smallest = std::min_element(values.begin(), values.end());
if (smallest != values.end()) { /* *smallest 为 1 */ }
```

## std::nth_element 与 std::partial_sort

`<algorithm>`，签名摘要为 `template<class RandomIt> void nth_element(RandomIt first,RandomIt nth,RandomIt last);`、`template<class RandomIt> void partial_sort(RandomIt first,RandomIt middle,RandomIt last);`，均有比较器重载。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{8, 2, 7, 1, 5, 3};
auto rank = values.begin() + 2;
std::nth_element(values.begin(), rank, values.end()); // *rank 为 3
std::partial_sort(values.begin(), values.begin() + 3, values.end());
// 前三个值成为 {1,2,3}，后缀次序未指定
```

nth 可为 last，不能解引用该位置；无策略 nth_element 平均线性。partial_sort 排好最小 k 项，约 n log k 次比较（k>1），中间位置必须有效。

## std::partition 与 std::stable_partition

`<algorithm>`，`template<class I,class Pred> I partition(I first,I last,Pred pred);`；partition 要求前向可写迭代器，stable_partition 要求双向。返回真假两组分界，恰 n 次谓词调用；后者保留组内次序，交换量受可用额外空间影响。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 3, 4};
auto boundary = std::stable_partition(values.begin(), values.end(),
                                      [](int x) { return x % 2 == 0; });
// values 为 {2,4,1,3}，boundary 指向 1
```

## std::lower_bound、std::upper_bound 与等价范围

`<algorithm>`，`template<class I,class T> I lower_bound(I first,I last,const T& value);`、upper_bound 同形；equal_range 返回 `pair<I,I>`，binary_search 返回 bool，均有比较器重载。

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> values{1, 2, 2, 4};
auto range = std::equal_range(values.begin(), values.end(), 2);
auto first = std::lower_bound(values.begin(), values.end(), 3); // 指向 4
bool found = std::binary_search(values.begin(), values.end(), 2); // true
```

返回边界不一定是命中。前向迭代器足够，O(log n) 比较而非随机访问的导航仍可 O(n)；逐接口的分区条件在后文保留。

## 有序集合算法

`<algorithm>`，两输入须按同一关系排序，输出空间足够且不与输入重叠。常用签名形状：

```cpp
namespace std {
    template<class I1, class I2, class O>
    O set_union(I1 first1, I1 last1, I2 first2, I2 last2, O out);
}
```

intersection、difference、symmetric_difference 同形，返回输出终点；`includes` 无输出参数，返回第一序列是否包含第二序列所需的重复计数。比较总量线性于两输入长度，允许重复值。

```cpp
// 需要 <algorithm>、<iterator>、<vector>；局部摘录
std::vector<int> a{1, 2, 2}, b{2, 3};
std::vector<int> common;
std::set_intersection(a.begin(), a.end(), b.begin(), b.end(),
                       std::back_inserter(common)); // {2}
std::vector<int> united;
std::set_union(a.begin(), a.end(), b.begin(), b.end(),
                std::back_inserter(united));        // {1,2,2,3}
```

union 对重复值保留较大计数，intersection 保留较小计数，difference 保留正的计数差，symmetric_difference 保留计数差的绝对值。这些是有序序列算法，不是哈希容器插入接口。

## 堆算法

`<algorithm>`，`template<class RandomIt> void make_heap(RandomIt first,RandomIt last);`，push_heap、pop_heap、sort_heap 参数同形并可带比较器；is_heap 返回 bool。常用操作短例：

```cpp
// 需要 <algorithm>、<vector>；局部摘录
std::vector<int> heap{4, 1, 7};
std::make_heap(heap.begin(), heap.end());
heap.push_back(9);
std::push_heap(heap.begin(), heap.end());
std::pop_heap(heap.begin(), heap.end());     // 原顶 9 到末尾
int best = heap.back();
heap.pop_back();                            // 算法不删除，容器删除
```
## 二分查找的分区条件

find／find_if 不要求有序，因为它逐个检查候选，最坏要看完整段。二分在中点判断后排除一侧，因此必须已有分区依据，算法本身不会先替你分区。对查询值 x，各接口的最低条件如下；“分区”表示谓词真值是一个连续前缀，随后全为假。

| 二分接口 | 要预先满足的分区 | 返回值解释 |
| --- | --- | --- |
| lower_bound | `comp(e,x)` | 首个不小于 x 的位置，或 last |
| upper_bound | `!comp(x,e)` | 首个大于 x 的位置，或 last |
| equal_range／binary_search | 以上两个分区，并使 `comp(e,x)` 蕴含 `!comp(x,e)` | 等价半开区间／是否存在等价值 |

这里的“大小”都按 comp 解释。整段按同一严格弱序排序可以使这些条件对各查询值成立；最低前提却不要求每一侧内部有序。只满足 lower_bound 的单个分区，不足以自动调用 binary_search；返回位置也不能自动解释为命中。确认存在等价值时需检查 != last，并满足所用等价判断的前提。[N4659 二分接口的逐项前提](https://timsong-cpp.github.io/cppwp/n4659/alg.binary.search)。

![同一数组的二分前提取决于查询值](../resources/R16-binary-partition.svg)

图16-2：`{2,1,3,4,7,6}` 对 x=4 满足 lower_bound 的真前缀／假后缀，结果在 4；对 x=2 出现“假后再真”，不满足前提。图中无效一行只用来判断条件，不执行非法调用。

```cpp
// 需要 <vector>、<algorithm>；局部摘录
std::vector<int> v{2, 1, 3, 4, 7, 6};
auto p = std::lower_bound(v.begin(), v.end(), 4); // 有效：p 指向下标 3 的 4
// lower_bound(..., 2) 不满足分区前提，不能以某次运行结果解释其语义。
```

二分最小化的是比较次数。随机访问序列可直接到中点；前向／双向迭代器需走到中点，导航总量可能 O(n)。有序 map 调用成员 lower_bound，才能使用树索引的对数查找；迭代器能力与访问成本见 R15 的迭代器类别条目。

## 堆的结构与操作条件

堆的父子关系与 priority_queue 接口见 R14 的 priority_queue 条目。常见实现把新增末尾值沿祖先上移；pop 则将原根送到末尾，再把留在根的候选向下调整，使剩余前缀恢复堆。一次路径高度为 O(log n)，但 make_heap 不等于逐个 push_heap：常见自底向上建堆先处理靠近叶子的短子树，多数节点只需很短的下沉，累计为 O(n)。这些上移／下沉是机制说明；标准给出 make_heap 至多 3n 次比较、push_heap 至多 log₂n、pop_heap 至多 2log₂n 次比较。[N4659 堆定义与操作界](https://timsong-cpp.github.io/cppwp/n4659/alg.heap.operations)、[libstdc++ GCC 10.3 的自底向上建堆实现](https://gcc.gnu.org/onlinedocs/gcc-10.3.0/libstdc++/api/a00608_source.html)。

| 接口 | 调用前的有效范围 | 成功后 |
| --- | --- | --- |
| make_heap(first,last,comp) | 可重排的随机访问区间 | 全区间是堆；没有完整排序 |
| push_heap(first,last,comp) | 非空，`[first,last−1)` 已是堆；末尾是新值 | 全区间恢复堆；不创建元素 |
| pop_heap(first,last,comp) | 非空全区间已是堆 | 原顶在 last−1，`[first,last−1)` 是堆；不删除元素 |
| sort_heap(first,last,comp) | 全区间已是堆 | 按 comp 排序；通常不再维持原堆关系 |

push 前先 push_back，再把扩大的区间交给 push_heap；pop 后先读取 back，再 pop_back。比较器在建堆、调整和检查时必须保持一致。算法对容器的结构没有直接访问权，这与 remove／erase 的分工一致。标准的比较次数界没有承诺这些算法的额外空间上界；常见实现原地调整并使用少量临时状态，若有硬性空间预算应检查所用实现。

排序前后都应保持同一比较关系：按某个字段排完序，再按另一个字段调用二分没有所需分区前提。若比较器有相等组，二分命中应用双向比较确认等价，不能无条件用 operator== 替换容器或排序定义的等价关系。is_sorted 可检查当前区间是否有序，is_partitioned 可检查某一谓词的分区；这些检查自身通常线性，适合边界校验，不能假定是免费断言。

## 排序、选择与分区的结果差异

| 需求 | 入口 | 结果与成本边界 |
| --- | --- | --- |
| 只找最小／最大位置 | min_element／max_element | 不重排；非空时 n−1 次比较 |
| 全部按序读取 | sort；等价项要稳定则 stable_sort | 全序列有序；O(n log n) 等相应比较界 |
| 只要某个排名位置 | nth_element | nth 处等于完全排序后的该排名值；无策略形式平均 O(n) |
| 最小 k 个且前缀要有序 | partial_sort | 前缀有序，后缀次序未规定；约 O(n log k)，k>1 |
| 只按谓词分两组 | partition | 真组在前；不建立组内顺序，也不求某个排名 |

nth_element 的两侧满足跨分界次序，却不保证各自排序，等价值也不保持身份顺序；取排名必须区分“位置上的值”和“同值对象是谁”。取最小 k 个后若还要顺序输出，可用 nth_element 划分后只 sort 前缀，但应处理 k=0、k=n 及 nth==last，避免解引用尾后位置。稳定排序解决等价元素的相对顺序，不会修正依赖易变外部字段的比较器。[N4659 排名选择](https://timsong-cpp.github.io/cppwp/n4659/alg.nth.element)、[partial_sort 与 stable_sort](https://timsong-cpp.github.io/cppwp/n4659/alg.sort)、[最小／最大值](https://timsong-cpp.github.io/cppwp/n4659/alg.min.max)。

这些复杂度通常计算比较／谓词调用，不能直接当作字节搬运量或内存预算。sort 的具体策略和工作空间不由其 O(n log n) 比较界推出；stable_sort 的比较界明确随额外内存是否足够变化。只需要某个排名时可避免全排序，减少建立无用顺序的工作，但这不承诺每份输入都更快。


## std::accumulate、std::inner_product 与 std::iota

**基础操作**。`<numeric>`，常用签名摘要：

```cpp
namespace std {
    template<class I, class T> T accumulate(I first, I last, T init);
    template<class I1, class I2, class T>
        T inner_product(I1 first, I1 last, I2 second, T init);
    template<class I, class T> void iota(I first, I last, T value);
}
```

accumulate 按序累计到 init 的类型，可自定义二元 op；inner_product 将两序列配对相乘再累计，第二输入至少足够长，也可自定义两个操作；iota 给已有范围赋连续递增值。调用/赋值量均线性。

```cpp
// 需要 <numeric>、<vector>；局部摘录
std::vector<int> values(4);
std::iota(values.begin(), values.end(), 1);   // {1,2,3,4}
long long sum = std::accumulate(values.begin(), values.end(), 0LL); // 10
long long squares = std::inner_product(values.begin(), values.end(),
                                        values.begin(), 0LL); // 30
```

`0` 使累计类型为 int，`0LL` 为 long long，仍须证明不溢出；inner_product 的默认乘法先按输入类型计算，累计类型不会自动扩宽乘法。

## std::reduce 与 std::transform_reduce

**C++17**。`<numeric>` 的 reduce 返回归约值，常用形状为 `template<class I,class T,class Op> T reduce(I first,I last,T init,Op op);`。transform_reduce 先映射或配对运算再归约；类型与操作须支持标准要求的各组合。

```cpp
// 需要 <numeric>、<vector>、<functional>；局部摘录
std::vector<int> values{1, 2, 3};
long long total = std::transform_reduce(values.begin(), values.end(), 0LL,
    std::plus<>{}, [](int x) { return static_cast<long long>(x) * x; }); // 14
```

即使不传执行策略也允许重新分组及排序。期望与顺序累计一致时，操作应满足所需结合/交换性质、类型闭合且不溢出；浮点加法不严格结合，不能承诺逐位相同结果。

## std::inclusive_scan 与 std::exclusive_scan

**C++17**。`<numeric>` 的 inclusive_scan 返回包含当前项的前缀结果；exclusive_scan 先输出 init，再累计当前项。常用形式省略重载：

```cpp
namespace std {
    template<class I, class O> O inclusive_scan(I first, I last, O out);
    template<class I, class O, class T>
        O exclusive_scan(I first, I last, O out, T init);
}
```

```cpp
// 需要 <numeric>、<vector>；局部摘录
std::vector<int> input{1, 2, 3};
std::vector<int> inclusive(3), exclusive(3);
std::inclusive_scan(input.begin(), input.end(), inclusive.begin()); // {1,3,6}
std::exclusive_scan(input.begin(), input.end(), exclusive.begin(), 0); // {0,1,3}
```

返回输出终点，目标至少与输入等长；一般可按对应规则就地扫描。标准允许广义和的不同分组，浮点结果不承诺固定舍入顺序；严格顺序需求另用明确循环。transform_inclusive_scan/transform_exclusive_scan 在累计前加入映射，只作相关接口索引。[N4659 numeric operations](https://timsong-cpp.github.io/cppwp/n4659/numeric.ops)。

## 执行策略


`<execution>` 的 seq、par、par_unseq 只适用于提供策略重载的算法；C++20 再增加 unseq。策略重载常需至少前向迭代器。par 允许并行，par_unseq 还允许向量化及非顺序执行；实现允许回退为顺序，传 par 不承诺启动多个线程。

回调不能依赖调用次序或共享无保护状态。par_unseq 中使用阻塞同步等向量化不安全操作不符合要求；不能把给每个回调加互斥锁视为通用补救。对标准策略重载，用户调用抛异常通常导致 terminate；内部分配失败可抛 bad_alloc，不能期待外层 catch 能恢复所有回调异常。[N4659 策略与异常](https://timsong-cpp.github.io/cppwp/n4659/algorithms.parallel.exec)。

部分标准库实现需要额外后端，语言版本开关不证明并行后端可用。线程安全、退出与资源上限见 R20 至 R22。


## 组合应用与参考资料

[过滤、排序与累计程序](../examples/r16-algorithms.cpp) 和 [查找、选择与堆程序](../examples/r16-search-selection-heap.cpp) 保留完整源码，供组合应用参考；不依赖 nth_element 的内部排列或具体堆布局。进一步接口查 [cppreference algorithms](https://en.cppreference.com/w/cpp/algorithm.html)。
