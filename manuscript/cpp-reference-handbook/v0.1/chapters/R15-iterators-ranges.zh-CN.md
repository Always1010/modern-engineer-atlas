# 第15章 迭代器与 ranges

迭代器描述访问位置，区间描述算法能走到哪里。它们本身通常不拥有元素；类别决定可执行的操作，生命周期决定这些操作此刻是否合法。

**版本**：传统迭代器与算法以 C++17 为准；ranges、views、sentinel、投影以 C++20 N4861 为准。**先修**：R05 借用、R13 容器失效。首次读取第1至3条，C++20 项目再查第4至5条。

## 1 半开区间与尾后位置

普通区间 `[first,last)` 包含 first 所指元素，不包含 last。first == last 表示空区间；last 通常等于 end，却不一定是容器的 end。合法区间要求从 first 按允许的递增操作可到达 last，不能把不同容器的两个迭代器拼在一起。

end 是尾后哨兵，不能解引用；对非空双向区间可先 --end 再解引用。begin 在空容器中也等于 end。默认构造或已经失效的迭代器并不因此成为可递增位置。调用 find 后必须先判断结果 != last；未命中也不是空指针。[N4659 迭代器要求](https://timsong-cpp.github.io/cppwp/n4659/iterator.requirements)。

![半开区间与惰性遍历的访问点](../resources/R15-interval-lazy-view.svg)

图15-1：上半图的箭头是可递增位置；下半图表示 filter/transform 遍历时访问基底的机制，不规定缓存布局。视图构造不物化结果，生命周期仍由底部所有者支撑。

返回迭代器的接口同时返回了一份借用。跨过容器修改后，即使比较两个旧迭代器看似还能工作，也不能用它证明有效性。保存下标可避免存储地址失效，但插删后下标可能指向另一业务对象；稳定位置、稳定地址和稳定身份是三种需求。

## 2 类别、成本与算法要求

| 类别 | 增加的主要能力 | 常见入口与限制 |
| --- | --- | --- |
| 输入 | 读取、向前、单遍 | istream_iterator；不能假定复制后可独立多遍扫描 |
| 输出 | 写入、向前 | back_insert_iterator；不提供一般读取 |
| 前向 | 可多遍扫描 | forward_list；不要求 -- |
| 双向 | 后退 -- | list；不要求下标或相减 |
| 随机访问 | +=n、相减、下标、位置比较 | vector/deque；std::sort 需要此类 |
| 连续，20 概念 | 元素地址连续对应 | 一般 vector、array；deque 不满足 |

`iterator_traits<I>` 提供 value_type、difference_type、iterator_category 等传统类型信息；C++20 的迭代器概念表达更细的语义，不能只靠某个 tag 推断全部现代概念。迭代器 category 和容器类型也不必一一对应，例如 const 迭代器限制写入而不必降低导航能力。

`advance(it,n)` 原地移动，不返回新位置；`next(it,n)`、`prev(it,n)` 返回副本。`distance(first,last)` 返回差值类型：随机访问通常常数时间，其他输入迭代器线性。负 advance 要求双向能力，最终位置仍须在有效导航范围；distance 对单遍输入区间可能消费输入，不能算完再假设数据可重读。

线性 distance 往往是隐藏的性能来源。对 list 在循环中反复从 begin 计算距离，累计可能平方；要计数时随遍历维护计数。随机访问不等于可跨不同分配段做裸指针运算，deque 的迭代器能够相减不授予 data 指针形式的连续保证。

接口若只需读取一次，不必要求随机访问迭代器；过高的类别要求会排除流输入或链表。反过来，算法确实需要多遍扫描时，不能把输入迭代器复制一份当成前向迭代器。类别是语义能力，不是“这个类型编译时有哪个操作符”的简单清单。

距离类型通常有符号，容器 size_type 通常无符号；混合比较或把负距离转成 size_t 都可能得到巨大的值。对同一随机访问序列内、顺序正确的 first/last，差值才适合转为长度。C++20 ranges::distance 还可利用 sized sentinel，复杂度取决于终止器能力，不能仅按迭代器类别一刀切。

## 3 反向与输出适配器

`reverse_iterator<I>(base)` 的解引用相当于取得 base 的前一位置，所以 rbegin().base() == end()、rend().base() == begin()。base 指向反向所指元素之后的正向位置。将反向查找结果直接交给 erase(base()) 会删错位置或把 end 当元素；先确认命中，再转换到真正所指位置。[N4659 反向迭代器](https://timsong-cpp.github.io/cppwp/n4659/reverse.iterators)。

`back_inserter(c)` 生成输出适配器，写入转换成 push_back；`front_inserter(c)` 调用 push_front，顺序会反转；`inserter(c,pos)` 围绕给定位置 insert。头文件是 `<iterator>`。适配器不会绕过底层容器的类型、异常与失效要求。

`copy(first,last,out)` 不知道目标缓冲是否足够。用 dest.begin() 前需建立足够元素，单独 reserve 仍不够；用 back_inserter 则由每次写入创建元素。自重叠复制须满足具体算法的方向条件，不能把普通 copy 当任意 memmove。[N4659 插入迭代器](https://timsong-cpp.github.io/cppwp/n4659/insert.iterators)。

## 4 ranges 算法、sentinel 与投影（C++20）

`std::ranges` 算法在 `<algorithm>`，视图在 `<ranges>`。常用形式是 `ranges::find(range,value,proj)`、`ranges::sort(range,comp,proj)`。与传统算法相比，它们提供 range 重载、约束和投影；不能免除排序、写入与边界前提。

range 需要 begin/end；end 可以是与迭代器不同类型的 sentinel，负责判断终止，不一定能递减或相减。sized_range 提供可取的大小，common_range 的迭代器与 sentinel 同类型；这些概念各自表达一种能力，不能从 range 推断全部满足。[N4861 range 概念](https://timsong-cpp.github.io/cppwp/n4861/range.range)。

语法摘录（C++20，假设 `struct Item{int key;}; std::vector<Item> items;` 且已包含相关头文件）：`std::ranges::sort(items, std::less<>{}, &Item::key);`，按 key 排序。投影在比较前提取字段，比较器比较投影后的值；这比在每个算法里重写成员 lambda 更便于保持排序与查找一致。投影若读悬垂对象或有不符合语义的副作用，约束诊断不能替代运行期正确性。此摘录未运行。

## 5 view、惰性求值与借用边界（C++20）

view 是适合廉价移动、作为管线组件的 range 类型，不等价于“永远不拥有”，也不等价于“借用一定安全”。例如 ref_view 借用现有范围，span 与 string_view 借用外部元素；iota_view 可按值保存生成所需状态。N4861 的 viewable_range 对临时非 view 容器有约束，不能把较新实现允许的临时 vector 管线反填为原始 C++20 规则。

语法摘录（C++20，`values` 是持续存在的 `vector<int>`）：
`auto v = values | std::views::filter([](int x){ return x%2==0; }) | std::views::transform([](int x){ return x*10; });`
构造管线不生成 vector；遍历才筛选和计算。filter::begin 可能扫描并缓存首个匹配，递增仍可能扫描多个输入；随机访问与已知长度能力可能因此丢失。反复遍历可重复计算，不能把构建管线当计算已经完成。[N4861 filter_view](https://timsong-cpp.github.io/cppwp/n4861/range.filter)。

保活要检查三处：基底所有者、视图对象、闭包捕获。返回引用局部容器的管线会悬垂；返回捕获局部变量引用的谓词同样会悬垂。遍历期间结构性修改基底会影响底层迭代器和缓存，应重新建立管线并按容器规则判断。

borrowed_range 表示迭代器可在该范围对象销毁后保留所需语义，前提仍是元素来源有效；它不延长外部所有者生命周期。range 重载在会返回悬垂借用的场景可返回 `ranges::dangling`，帮助阻止误用，却不能检测你提前构造出的坏 span 或坏 string_view。[N4861 dangling](https://timsong-cpp.github.io/cppwp/n4861/range.dangling)。

## 6 完整例子与检索入口

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <list>
#include <vector>

int main() {
    std::list<int> source{10, 20, 30};
    auto it = source.begin();
    std::advance(it, 2);
    if (*it != 30 || std::distance(source.begin(), source.end()) != 3) return 1;
    std::vector<int> out;
    std::copy(source.rbegin(), source.rend(), std::back_inserter(out));
    if (out != std::vector<int>{30, 20, 10}) return 2;
    if (source.rbegin().base() != source.end()) return 3;
    auto empty = std::find(source.begin(), source.end(), 99);
    if (empty != source.end()) return 4;
    std::cout << "distance=3 reverse=30,20,10 miss=end\n";
}
```

配套文件：[`r15-iterators-ranges.cpp`](../examples/r15-iterators-ranges.cpp)。C++17；预期输出 `distance=3 reverse=30,20,10 miss=end`，检查失败非零。Windows g++10.3，以 `-std=c++17 -Wall -Wextra -pedantic` 核验。C++20 摘录为版本定位的接口说明，未编译运行。

速查：end 与空区间查第1条；advance/distance 与 sort 能力查第2条；base 与追加目标查第3条；成员排序查投影；返回管线查第5条。连续借用见 R12，失效细表见 R13、R14，算法条件见 R16。
