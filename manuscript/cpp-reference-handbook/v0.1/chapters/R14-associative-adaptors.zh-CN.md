# 第14章 关联容器与容器适配器

关联容器用键定位元素，适配器限制可执行的访问方式。先确定“键相同”的契约，再选择有序查找、哈希查找或仅访问首尾的接口。

**版本**：本章以 C++17 为准，`try_emplace`、`insert_or_assign`、节点句柄从17起；`contains` 从20起。**先修**：R13 容器借用、R16 比较器。首次读取第1至3条，批处理和优先队列查第4至5条。

## 1 有序关系与哈希契约

| 类型与头文件 | 键与遍历 | 单键查找成本 |
| --- | --- | --- |
| `map<Key,T,Compare>` · `<map>` | 唯一键，元素是 `pair<const Key,T>` | O(log n) |
| `set<Key,Compare>` · `<set>` | 唯一键，迭代不能直接改键 | O(log n) |
| `multimap` / `multiset` | 允许等价键 | O(log n)，取全部匹配另计 k |
| `unordered_map<Key,T,Hash,Pred>` · `<unordered_map>` | 唯一键，无排序遍历保证 | 平均 O(1)，最坏 O(n) |
| `unordered_set` · `<unordered_set>` | 仅键；另有 unordered_multi… | 平均 O(1)，最坏 O(n) |

有序容器以 `!comp(a,b) && !comp(b,a)` 判断键等价，不一定调用 operator==。comp 必须给出严格弱序：不允许 comp(x,x)，顺序应传递，由“不互相小于”形成的等价也应传递。比较结果不能因外部可变配置而在存储期间漂移；用 ≤ 比较器或按变化中的字段比较，会破坏契约。[N4659 有序关联要求](https://timsong-cpp.github.io/cppwp/n4659/associative.reqmts)。

哈希容器要求 Pred 为等价关系，且 Pred(a,b) 为真时 Hash(a) == Hash(b)。反方向不成立，碰撞是正常情况。键存放期间，其哈希和相等判断必须稳定。大小写不敏感相等若搭配大小写敏感哈希，属于契约错误，不能靠测试数据没碰到来证明可用。字符串哈希通常还需扫描键，平均 O(1) 说的是容器规模上的访问次数，非任意长键的一次操作耗时。[N4659 无序关联要求](https://timsong-cpp.github.io/cppwp/n4659/unord.req)。

![树、桶与堆各自保持的关系](../resources/R14-tree-hash-heap.svg)

图14-1：树与链式桶是常见实现示意，不规定平衡树种类、桶节点布局；堆图表示父子优先关系，不表示整段已排序。

### 有序索引：查找路径为什么取决于树高

二叉搜索树的教学模型在每个节点用键关系选择左／右分支；一次查找访问的节点数受树高 h 限制，而不是因为结构叫“树”就自动 O(log n)。若顺序插入导致普通未平衡树退化成链，h 可达 O(n)。常见标准库使用平衡搜索树，靠旋转等维护动作约束树高；例如 libstdc++ GCC 14.3 用红黑树实现这组容器。**标准保证的是有序遍历、相关接口复杂度与借用规则，未指定红黑树、颜色或旋转方式**。[N4659 有序关联接口要求](https://timsong-cpp.github.io/cppwp/n4659/associative.reqmts)、[libstdc++ GCC 14.3 树实现](https://gcc.gnu.org/onlinedocs/gcc-14.3.0/libstdc++/api/a00401_source.html)。

这个索引支持按键 find，也支持按序 lower_bound／upper_bound；获得边界后按迭代器扫描 k 个结果，总成本通常为 O(log n+k)。它不提供“第 k 小元素”的常数下标：有序容器的迭代器只有双向导航能力，从 begin 走到第 k 个仍需逐个递增。比较器若每次处理长度为 m 的键，O(log n) 次比较也须乘入单次比较的实际代价；节点链接和分配则是额外空间成本。

## 2 查找、插入与更新的接口

以 map 和 unordered_map 的唯一键形式为例；下列形式省略转发重载。

| 常用形式 | 返回与副作用 |
| --- | --- |
| `find(key)` | iterator；未找到为 end，无插入 |
| `count(key)` / `contains(key)`，20 | 唯一键返回0或1／bool；多键 count 返回匹配数 |
| `at(key)` | T&；缺失抛 out_of_range，不插入 |
| `operator[](key)` | T&；缺失时插入并值初始化 T |
| `insert(value)` / `emplace(args…)` | `pair<iterator,bool>`；已有键不覆盖 |
| `try_emplace(key,args…)`，17 | `pair<iterator,bool>`；已有键不构造新 T |
| `insert_or_assign(key,value)`，17 | `pair<iterator,bool>`；已有键赋值，bool 表示是否新插入 |
| `erase(it)` / `erase(key)` | 下一迭代器／删除数；it 必须可解引用 |
| `equal_range(key)` | `pair<iterator,iterator>`；匹配半开区间 |

“读取”用下标会使缺失键出现，且要求对应插入可构造 T；诊断计数膨胀时先查 operator[]。map 的 lower_bound 返回首个不小于键的位置，upper_bound 返回首个严格大于位置；unordered 容器没有这些排序成员。查找成本按上表；删除已知有序位置摊还常数，按键删除还要查找。多键容器删除键会删除全部匹配，而不是一个。[N4659 map 访问](https://timsong-cpp.github.io/cppwp/n4659/map.access)。

try_emplace 不代表参数表达式延迟求值：传入昂贵的 `make_value()` 仍会先执行，只是键存在时不以其结果构造 mapped 对象。若确需延迟，应先 find 或设计工厂层。emplace 在发现重复前可能已构造候选对象；异常和用户函数的副作用也不能用“未插入”来消除。

## 3 失效、rehash 与预留

| 成功操作 | 有序关联容器 | unordered 容器 |
| --- | --- | --- |
| 插入／emplace | 既有元素引用、迭代器保留 | 无 rehash 时保留；rehash 使迭代器失效 |
| erase | 只使被删元素借用失效 | 同左；其他元素次序按要求保留 |
| rehash／reserve | 无这些成员 | 迭代器失效；元素指针、引用保留 |
| clear／销毁 | 元素借用全部失效 | 同左 |

`load_factor()` 是 size/bucket_count；`max_load_factor(z)` 要求 z 为正，标准允许实现将其作为修改最大装载因子的提示，实际阈值应通过无参数 `max_load_factor()` 读取。`reserve(n)` 表示计划容纳 n 个元素，按当前阈值安排桶；`rehash(b)` 是请求桶数，实际值还须满足装载约束。rehash 平均为线性工作，标准最坏可到平方级；不能把批量预留理解成一次常数操作。[N4659 装载与重建](https://timsong-cpp.github.io/cppwp/n4659/unord.req)。

### 桶、冲突与装载不是同一个指标

查找先计算 Hash(key)，再确定桶，在候选元素中用 Pred 判等。同哈希值必须落入同桶；不同哈希值也可能映射到同桶。常见实现将桶内元素组织成节点链，但标准未规定冲突链的布局或桶号必须按取模求得。查找成本要包含哈希键、访问候选元素和相等比较；桶内候选很多时会从平均常数退化到最坏线性。[N4659 无序容器桶与查找](https://timsong-cpp.github.io/cppwp/n4659/unord.req)。

装载因子 α=n/B 是**平均每桶元素数**，不限制某一个桶的长度。降低 α 往往要增加桶索引的空间，且只能在哈希分布合理时减少候选；若 Hash 对所有键都返回同一个值，扩大桶数仍不能拆开这些同哈希值元素。`bucket(key)`、`bucket_size(i)` 可用于诊断实际分布，不能仅看 α 就断言查找不会退化。`max_load_factor` 的设置与 `rehash` 是不同操作；若需立即按新阈值安排桶，应显式 rehash／reserve。

![装载因子相同也可能有不同的冲突分布](../resources/R14-hash-bucket-distribution.svg)

图14-2：两边均有 6 个元素、4 个桶，α=1.5；右边只命中一个桶。节点链是教学示意，桶内排列、哈希到桶的映射和桶数策略不作可移植保证。

rehash 重建桶组织并重新分配元素的桶归属；它不是重新排序成有序索引。常见节点实现可以保留元素地址而更新桶链接，因此引用保留与迭代器失效并不矛盾。应把哈希容器的预算分为元素存储、桶索引和重建时可能并存的工作存储；标准没有给出每元素固定字节数。

unordered 插入不失效迭代器的标准条件可写为 (N+n) ≤ z×B：原元素数、插入数、最大装载因子与桶数共同决定。指针或引用在 rehash 后保留，不意味着原迭代器还能递增；本章例子只保存 mapped 对象地址。桶顺序、增长策略和哈希值跨进程稳定均无一般保证。[N4659 桶、装载与失效](https://timsong-cpp.github.io/cppwp/n4659/unord.req)。

需要按字符串键查找而不临时创建 string 时，有序容器可选透明比较器，例如 `map<string,int,std::less<>>`；它使相应异构 find、lower_bound 等重载可参与调用。不同参与类型之间也必须建立一致的严格弱序。C++17 的 unordered_map 不因此自动获得透明异构查找；相关能力需按 C++20 及具体重载定位。透明比较器是减少临时构造的入口，不是改变键等价的权限。

批量导入时先预估总元素数并 reserve，有助于控制哈希容器重建次数。估计错误只影响成本与后续失效，不应影响结果正确性；正确代码仍须在每次可能 rehash 后重新取得迭代器。若要删除并继续扫描，使用 erase 返回的下一位置，不能删除后再递增旧位置。循环内插入还可能使 unordered 的整个遍历路径失效，最好先收集待新增键，再分阶段修改。

查找失败和构造失败也应分开：find == end 是正常未命中；分配或用户哈希抛异常是调用失败。记录容器规模、装载因子和键分布可以帮助判断哈希退化，但不能仅凭一次慢请求就宣称发生攻击或实现错误。性能结论须结合实际键代价与负载测量。

## 4 节点句柄与失败边界

C++17 的 `extract(it)` 从容器摘出节点，返回拥有节点的句柄；`insert(std::move(node))` 尝试接入目标，唯一键冲突时需检查返回对象中的 node。节点非空时可用 node.key() 修改 map 的键；普通 map 迭代器不能改 const Key。转移要求分配器满足相等条件，跨容器还要满足相应类型及比较／哈希兼容条件。

被摘节点的旧迭代器失效。旧引用虽有特殊保留规则，在节点句柄拥有期间不能据此继续访问元素；用句柄自身接口，重新插入后重新建立借用，便于避免条件混淆。merge 遇重复键会留下源节点，调用后源容器未必为空。[N4659 节点句柄](https://timsong-cpp.github.io/cppwp/n4659/container.node)。

分配、键与值的构造、比较器、哈希器都可能抛异常。单元素插入的保证受容器及异常来源约束；更新已有 mapped 值则还受 T 的赋值异常保证影响。需要强事务效果时先构造候选结果，再安排能满足保证的提交步骤，不能把全部关联操作都标成 noexcept。

## 5 stack、queue 与 priority_queue

| 类型与头文件 | 观察与修改 | 常用默认成本 |
| --- | --- | --- |
| `stack<T>` · `<stack>`，默认 deque | top；push/emplace；pop | 观察、两端修改 O(1) |
| `queue<T>` · `<queue>`，默认 deque | front/back；push/emplace；pop | 同上，先进先出 |
| `priority_queue<T>` · `<queue>`，默认 vector、less | top；push/emplace；pop | top O(1)，堆调整 O(log n) |

观察首尾和 pop 要求非空；pop 返回 void，需要先取值再删除。适配器不提供一般 begin/end、查找或任意删除；借用还须按底层容器及堆值重排判断。stack/queue 的成本随底层容器而变。

默认 priority_queue 的 top 是最大值；改用 `greater<T>` 得到最小值。比较器仍须严格弱序，它表示先后关系，不能直觉地把“返回 true”当“更高优先级”。区间构造用 make_heap，建堆是线性比较次数。一次 push 还可能触发 vector 重分配，不能把整次调用最坏成本都写成 O(log n)。top 返回 const 引用；改优先级通常需重新插入或另用支持更新的结构。[N4659 priority_queue](https://timsong-cpp.github.io/cppwp/n4659/priority.queue)。

### 堆：只维护足够取得优先值的关系

堆把随机访问序列视为一棵完全二叉树：下标 i>0 的父节点在 (i−1)/2 的整数商位置，孩子在 2i+1、2i+2（存在时）。它要求 `comp(parent, child)` 为假；默认 less 因而使最大值在根。兄弟与不同分支没有完整排序关系，不能对其底层序列直接二分查找。树高为 O(log n)，新末尾值沿祖先上移、取出根后沿孩子向下调整，各只涉及一条高度量级的路径；具体交换和移动步骤可因实现而变。[N4659 堆的下标关系](https://timsong-cpp.github.io/cppwp/n4659/alg.heap.operations)。

priority_queue 的 push 对应底层 push_back 后 push_heap；pop 对应 pop_heap 后 pop_back。这里只能取得最优先值，不能按任意键查找、稳定定位或就地更新。若保存 top 的引用，后续堆调整可能使那个槽位的值换成另一个业务对象；即使 vector 未扩容也不能把它当稳定身份。需要前 k 个优先值可重复弹出，是否允许破坏原队列须由业务决定；独立堆算法与建堆成本见 R16 第3条。

## 6 完整例子与检索入口

```cpp
#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    std::map<std::string, int> counts;
    auto a = counts.try_emplace("red", 1);
    auto b = counts.try_emplace("red", 9);
    if (!a.second || b.second || counts.at("red") != 1) return 1;
    counts.insert_or_assign("red", 3);
    if (counts.find("missing") != counts.end() || counts.size() != 1) return 2;
    std::unordered_map<int, std::string> names{{7, "seven"}};
    const auto* saved = &names.at(7);
    names.rehash(names.bucket_count() * 2 + 1);
    if (*saved != "seven") return 3;
    std::priority_queue<int, std::vector<int>, std::greater<int>> q;
    q.push(9); q.push(2); q.push(5);
    std::vector<int> out;
    while (!q.empty()) { out.push_back(q.top()); q.pop(); }
    if (out != std::vector<int>{2, 5, 9}) return 4;
    std::cout << "red=3 reference=seven heap=2,5,9\n";
}
```

配套文件：[`r14-associative-adaptors.cpp`](../examples/r14-associative-adaptors.cpp)，C++17。预期输出：`red=3 reference=seven heap=2,5,9`；检查失败返回非零。Windows g++10.3，以 `-std=c++17 -Wall -Wextra -pedantic` 核验。

速查：等价查第1条；缺失键与覆盖查第2条；桶与 rehash 查第3条；改键查 extract；先进先出查 queue；最小优先查 greater。删除遍历见 R13，比较器与堆算法见 R16。
