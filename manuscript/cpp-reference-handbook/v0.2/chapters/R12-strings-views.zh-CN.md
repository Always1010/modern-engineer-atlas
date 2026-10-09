# 字符串与非拥有视图

`string` 保存字符，`string_view` 借用字符，`span` 借用任意类型的连续元素。本章分别介绍对象及操作，再说明零结尾与编码。借用是访问外部对象的关系，定义见 [R05](R05-pointers-references.zh-CN.md)。

**基线**：C++17；`string_view` 从 C++17 引入，`span` 从 C++20 引入。先查构造、访问与截取，再查所有者修改造成的失效。

## 字符串与视图分类

| 类型与头文件 | 保存内容 | 长度与修改 |
| --- | --- | --- |
| `std::string` · `<string>` | 拥有连续 `char` 序列，末尾另有零字符 | 动态长度，可修改字符及序列 |
| `std::string_view` · `<string_view>` | 借用连续 `const char` 序列 | 保存指针和长度，只修改描述范围 |
| `std::span<T,N>` · `<span>`，C++20 | 借用连续 `T` 序列 | 长度固定或动态，写权限取决于 `T` |
| 零结尾 `const char*` | 借用字符；指针本身不带长度 | 依约定扫描至零字符 |

![string 拥有存储，视图圈定区间](../resources/R12-string-view-ownership.svg)

图：字符位置与描述符的关系；短字符串优化和具体存储位置不由标准规定。视图复制只复制描述符，不复制字符。

## std::string

**基础操作**。字符串拥有可变长的字符序列。`string` 是 `basic_string<char>` 的别名；其他字符类型有 `wstring`、`u16string`、`u32string`，C++20 增加 `u8string`。公开声明摘要省略成员与约束：

**声明摘要**。

```cpp
namespace std {
    template<class CharT, class Traits = char_traits<CharT>,
             class Allocator = allocator<CharT>> class basic_string;
    using string = basic_string<char>;
}
```

`CharT` 是字符类型，`Traits` 定义字符比较等操作，`Allocator` 管理字符存储。本节展开 `string` 的常用形式，不覆盖自定义 traits/分配器的全部重载。

### string 的构造与初始化

**独立片段**。

```cpp
// 需要 <string>；局部摘录
std::string empty;
std::string name("Ada");                    // 扫描至零并复制
std::string bytes("ab\0cd", 5);            // 复制五个字符，含内嵌零
std::string fill(3, 'x');                    // "xxx"
std::string copy(name);                     // 独立字符序列
```

指针长度构造要求输入的指定范围有效；单指针构造要求有效零结尾序列，长度计算需要扫描。复制建立独立内容，移动后源是有效但未指定状态，不能依赖旧指针仍有效。范围构造 `string(first,last)` 复制有效输入区间；两个整数的含义不能用它推断。

### string 的访问与遍历

常用成员形式为 `size_type size() const`、`bool empty() const`、`char& operator[](size_type)`、`char& at(size_type)`、`char& front()`、`char& back()`，此处省略 const 重载与异常规格。

**独立片段**。

```cpp
// 需要 <string>；局部摘录
std::string text("Ada");
text.at(0) = 'I';                           // "Ida"
char last = text.back();                    // 'a'
for (char& c : text) {
    if (c == 'a') c = 'A';
}                                          // "IdA"
```

`size()` 不含结尾零；下标通常要求 `i < size()`，`at(i)` 越界抛 `out_of_range`，`front/back` 要求非空。`operator[](size())` 在 `string` 上可读取结尾零，但不能将它改成非零；这项例外不适用于视图。

### string 的容量与修改

| 常用成员形式 | 输入与状态变化 | 返回 |
| --- | --- | --- |
| `reserve(n)`、`capacity()` | 预留存储/查询容量，预留不增加字符 | `void` / `size_type` |
| `resize(n,c)` | 缩短或补字符 `c`；单参数形式补零 | `void` |
| `append(s)`、`insert(pos,s)` | 追加/在位置前插入字符串 | `string&` |
| `erase(pos,count)` | 从位置删除，数量裁到剩余长度 | `string&` |
| `replace(pos,count,s)` | 以字符串替换指定子段 | `string&` |
| `push_back(c)`、`pop_back()`、`clear()` | 加一个字符/删末字符/清空 | `void` |

**独立片段**。

```cpp
// 需要 <string>；局部摘录
std::string text("red");
text.append(" blue");                       // "red blue"
text.insert(0, "dark ");                    // "dark red blue"
text.replace(5, 3, "green");                // "dark green blue"
text.erase(0, 5);                           // "green blue"
text.resize(5);                             // "green"
```

位置参数超过 `size()` 通常抛 `out_of_range`；尾部位置 `size()` 可用于插入。`pop_back` 要求非空。修改可能移动后缀或重新分配，其成本随修改和剩余字符数变化。C++17 的 `reserve(n)` 对小于当前容量的请求允许作为非约束缩容请求；C++20 的该重载不因较小请求缩容。`shrink_to_fit` 始终是非约束请求。[N4659 string capacity](https://timsong-cpp.github.io/cppwp/n4659/string.capacity)、[N4861 string capacity](https://timsong-cpp.github.io/cppwp/n4861/string.capacity)。

### string 的查找、比较与截取

常用形式为 `size_type find(s,pos=0) const`、`rfind(s,pos=npos)`、`int compare(s) const`、`string substr(pos=0,count=npos) const`；字符及指针长度重载也可用。

**独立片段**。

```cpp
// 需要 <string>；局部摘录
std::string text("red blue");
auto pos = text.find("blue");
if (pos != std::string::npos) {
    std::string word = text.substr(pos);    // 独立的 "blue"
}
bool before = text.compare("yellow") < 0;  // 字典序，不是长度比较
```

未找到返回 `npos`，应先比较再用于下标/运算。`substr` 的数量裁到剩余长度，位置超出仍抛异常；拷贝成本随结果长度增长。`compare` 返回负、零或正值，不能依赖精确数值。C++20 增加 `starts_with/ends_with`，C++23 增加 `contains`。[N4659 string operations](https://timsong-cpp.github.io/cppwp/n4659/string.ops)。

### string 的缓冲与失效

`c_str()` 提供零结尾只读指针；C++17 的非 const `data()` 提供可修改字符指针，只能改写 `[0,size())`。给 C API 写入时先 `resize` 建立元素，不能以 `capacity` 代替合法长度。内嵌零会使只扫描至零的 C API 提前停止。

**机制解释**。所有者销毁或存储重分配会使指针、引用与视图失效；某些非 const 字符串操作也允许使它们失效。不能搬用 `vector` 的“未扩容时前缀稳定”规则；跨过结构修改后重新取得视图。[N4659 string requirements](https://timsong-cpp.github.io/cppwp/n4659/string.require)。

## std::string_view

**基础操作，C++17**。视图只描述一段外部字符。公开声明摘要省略成员：

**声明摘要**。

```cpp
namespace std {
    template<class CharT, class Traits = char_traits<CharT>>
        class basic_string_view;
    using string_view = basic_string_view<char>;
}
```

`CharT`、`Traits` 与字符串含义对应；没有分配器，也没有字符所有权。

### string_view 的构造、访问与遍历

**独立片段**。

```cpp
// 需要 <string>、<string_view>；局部摘录
std::string owner("Ada");
std::string_view all(owner);                // owner 必须持续存活
std::string_view first(owner.data(), 1);    // "A"，输入范围须有效
char ch = all.at(1);                        // 'd'
for (char c : all) { (void)c; }             // 按值读取字符
```

指针长度构造是常数时间；单指针构造需扫描零结尾。`size/empty/data` 查询描述信息；`operator[]` 要求合法下标，`at` 越界抛异常，`front/back` 要求非空。读取逐元素进行，不复制字符。

### string_view 的截取、查找与比较

常用形式为 `string_view substr(pos=0,count=npos) const`、`void remove_prefix(n)`、`void remove_suffix(n)`；`find/rfind/compare` 按字符内容工作。

**独立片段**。

```cpp
// 需要 <string>、<string_view>；局部摘录
std::string owner("red blue");
std::string_view words(owner);
auto tail = words.substr(4);                // 借用 "blue"，常数时间
words.remove_suffix(5);                     // words 只描述 "red"
owner[4] = 'B';                             // tail 观察到 "Blue"
std::string saved(tail);                    // 独立保存内容
```

`substr` 位置越界抛异常，数量裁剪；prefix/suffix 的数量必须不超过当前长度。它们改变视图范围，不改变所有者。`data()` 不保证视图末尾有零；调用 C 字符串接口可先复制成 `string`。

### string_view 的借用条件

**机制解释**。`string_view view = owner.substr(...)` 会借用临时 `string`，完整表达式结束后悬垂；正确做法是先借用 `owner`，再在视图上截取。返回子视图时须说明它借用输入；跨调用保存、放入任务或异步回调需要所有者保活，或复制内容。

移动所有者不保证旧视图有效，短字符串可位于对象内部。视图作关联容器键时，字符必须长期存活且比较/哈希相关内容保持稳定；容器保存视图对象并不拥有字符。[N4659 string_view](https://timsong-cpp.github.io/cppwp/n4659/string.view)。

## std::span

**基础操作，C++20**。连续元素视图在 `<span>` 中表示连续缓冲。声明摘要：

**声明摘要**。

```cpp
namespace std {
    template<class T, size_t Extent = dynamic_extent> class span;
}
```

`T` 是元素类型；`Extent` 为编译期固定元素数或 `dynamic_extent`，默认是动态长度。它没有字符零结尾规则。

### span 的构造与访问

**独立片段**。

```cpp
// C++20；需要 <span>；局部摘录
int values[]{1, 2, 3};
std::span<int, 3> fixed(values);
std::span<int> all(values, 3);
const std::span<int> descriptor = all;
descriptor[1] = 9;                          // 描述符 const，元素可写
std::span<const int> read_only(all);         // 经此视图只读
```

指针/数量构造要求有效范围；固定 extent 要求长度匹配。数组、`array` 和满足条件的连续范围可用作输入，`list` 与一般 `deque` 不可。`size()` 返回元素数，`size_bytes()` 返回字节数；C++20 下标没有边界检查成员 `at`，要求下标合法。

### span 的子范围与失效

**独立片段**。

```cpp
// C++20；需要 <span>；局部摘录
int values[]{1, 2, 3, 4};
std::span<int> all(values);
auto middle = all.subspan(1, 2);            // {2, 3}
middle.front() = 8;                         // values[1] 成为 8
auto head = all.first(2);                   // {1, 8}
auto tail = all.last(1);                    // {4}
```

`first/last/subspan` 常数时间产生子视图，数量/偏移必须落在原范围。编译期参数形式还可保留固定 extent。span 不扩容、不释放存储；所有者销毁、容器重分配或相关元素删除会影响借用。[N4861 span](https://timsong-cpp.github.io/cppwp/n4861/views.span)。

## C 字符串与 UTF-8

**基础操作**。C 字符串是以零字符结束的字符序列，不是一种自带长度和所有权的类型。字符串转换接口必须说明是否接受内嵌零、输入长度和保存策略。

UTF-8 使用一至四个八位字节编码一个 Unicode 标量值；`string` 不验证 UTF-8，`size/substr` 按 `char` 元素工作。一个显示字符可能由多个码点组成，字节数量、码点数量和显示宽度不是同一单位。[RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)。C++20 的 `u8"…"` 元素类型是 `char8_t`，不能直接当成 `const char*` 接口的输入；编码转换、规范化和字素分割需要专门库契约。

## 组合应用与参考资料

[配套 C++17 程序](../examples/r12-strings-views.cpp) 演示内嵌零、共享字符、检查访问和保存副本，修改所有者后不再读取旧视图。字符串转换见 [R18](R18-text-numeric.zh-CN.md)，连续容器失效见 [R13](R13-sequence-containers.zh-CN.md)。相关重载查 [cppreference string](https://en.cppreference.com/w/cpp/string/basic_string.html)。
