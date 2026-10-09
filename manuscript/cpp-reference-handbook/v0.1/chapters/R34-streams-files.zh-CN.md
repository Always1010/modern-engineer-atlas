# 流与文件读写

流把字符输入输出组织成格式化操作、无格式读写和状态报告。`ifstream`、`ofstream`、`fstream` 连接文件，`istringstream`、`ostringstream`、`stringstream` 连接内存字符串。路径操作见 [R35](R35-filesystem.zh-CN.md)。

**基线**：C++17。先查文件打开、按行读写与状态，再查定位、二进制格式和持久化；本章采用标准库通用写法，平台 I/O 见 [R26](R26-syscalls-file-io.zh-CN.md)。

## 流的类型与状态

| 类型组 | 头文件 | 用途 |
| --- | --- | --- |
| `istream`、`ostream`、`iostream` | `<istream>`、`<ostream>`、`<iostream>` | 输入、输出、双向流接口；`cin/cout/cerr` 是标准对象 |
| `ifstream`、`ofstream`、`fstream` | `<fstream>` | 文件输入、文件输出、文件双向读写 |
| `istringstream`、`ostringstream`、`stringstream` | `<sstream>` | 内存字符串输入、输出与双向读写 |

`basic_istream<CharT,Traits>` 等模板定义字符型流，上表名称是 `char` 别名。公开声明摘要省略成员：

```cpp
namespace std {
    template<class CharT, class Traits = char_traits<CharT>> class basic_istream;
    template<class CharT, class Traits = char_traits<CharT>> class basic_ostream;
    using istream = basic_istream<char>;
    using ostream = basic_ostream<char>;
}
```

### iostate 与输入循环

| 状态/查询 | 含义 | 操作条件 |
| --- | --- | --- |
| `goodbit` / `good()` | 状态位全零 | `good()` 比布尔检查更严格 |
| `eofbit` / `eof()` | 某次输入遇到尾端 | 不预告下一次读取 |
| `failbit` / `fail()` | 格式/提取失败；`fail` 也检查 `badbit` | 不能使用失败提取的值 |
| `badbit` / `bad()` | 底层 I/O 等严重错误 | 根据接口决定终止或恢复 |
| `operator bool()` | 等于 `!fail()` | 仅 `eofbit` 不一定为假 |

```cpp
// 需要 <sstream>；局部摘录
std::istringstream input("10 20");
int value = 0;
int sum = 0;
while (input >> value) sum += value;        // sum 为 30
bool normal_end = input.eof() && !input.bad();
```

用本次提取结果决定是否处理数据，不能写 `while (!input.eof())`。最后一个合法数可能同时设置 `eofbit` 而提取成功，下一次才失败。仅据 `eof` 也不能验证输入语法完全正确，例如不完整数字可在尾端同时造成失败；要求严格字段校验时先提取字符串，再按 [R18](R18-text-numeric.zh-CN.md) 检查完整解析。

`rdstate()` 取得状态，`clear(state=goodbit)` 重新设置状态；清状态不消费错误字符。`exceptions(mask)` 设置异常掩码，命中时抛 `ios_base::failure`，设置掩码时也可能立即抛。[N4659 stream state](https://timsong-cpp.github.io/cppwp/n4659/iostate.flags)。

## std::ifstream

**基础操作**。输入文件流在 `<fstream>` 中拥有文件缓冲资源。声明摘要为 `template<class CharT, class Traits = char_traits<CharT>> class basic_ifstream; using ifstream = basic_ifstream<char>;`，省略成员与重载。

### ifstream 的打开与按行读取

默认构造未打开文件；路径构造尝试打开，输入模式默认为 `ios::in`。`open(path,mode=in)` 对已有流打开文件，`is_open()` 查询是否关联文件，`close()` 关闭文件，失败可设置状态位。

```cpp
// 需要 <fstream>、<string>；局部摘录
std::ifstream input("settings.txt");
if (input) {
    std::string line;
    while (std::getline(input, line)) {
        // 处理本次读到的 line；getline 移除换行，不移除其他空白
    }
    bool device_error = input.bad();
}
```

`getline` 返回流引用，按分隔符或文件尾停止；最后一行没有换行仍可成功得到内容。文件路径由环境提供，打开成功不保证后续读取成功。文本编码和长度限制由应用规定，流不自动验证 UTF-8。

### ifstream 的提取与无格式读取

```cpp
// 需要 <fstream>；局部摘录
std::ifstream input("data.bin", std::ios::binary);
char buffer[64];
if (input) {
    input.read(buffer, sizeof buffer);
    std::streamsize received = input.gcount();
    // 仅处理 buffer[0..received)，不足请求量时还须检查 eof/fail/bad
}
```

`read(char*,streamsize)` 提取指定数量字符，`gcount()` 返回最近一次相应无格式输入实际提取数。请求范围必须可写，数量非负；短读设置错误状态但已提取的前缀仍存在。格式化 `operator>>` 使用 locale 规则并通常跳过空白，`get` 逐字符读取，`ignore` 跳过字符。读写后状态与实际数量分别检查。[N4659 input streams](https://timsong-cpp.github.io/cppwp/n4659/istream)。

## std::ofstream

**基础操作**。输出文件流在 `<fstream>` 中管理文件输出。声明摘要为 `template<class CharT, class Traits = char_traits<CharT>> class basic_ofstream; using ofstream = basic_ofstream<char>;`，省略成员。

### ofstream 的打开与输出

默认构造未打开；路径构造默认 `ios::out`，普通输出打开通常截断旧内容，不能用于保留已有文件。追加选择 `ios::app`。基本模式如下：

| openmode | 作用 | 常见组合 |
| --- | --- | --- |
| `in` / `out` | 输入/输出能力 | 输入输出时显式组合 |
| `trunc` | 打开时清空已有内容 | 新建结果文件 |
| `app` | 每次写入定位到末尾 | 追加记录 |
| `ate` | 打开后初始定位到末尾 | 随后仍可另行定位 |
| `binary` | 按二进制模式打开 | 避免平台文本转换 |

```cpp
// 需要 <fstream>；局部摘录
std::ofstream output("result.txt", std::ios::out | std::ios::trunc);
if (output) {
    output << "count=" << 3 << '\n';
    output.flush();                        // 向下层提交流缓冲
    output.close();
    bool saved = static_cast<bool>(output); // 核对输出及关闭状态
}
```

`operator<<` 返回流引用，支持连写；`write(const char*,streamsize)` 输出指定字符范围，数量非负且范围有效。`flush()`、`close()` 也可能失败；关键输出显式调用并检查状态，析构释放资源不提供调用者可查询的关闭错误结果。

### ofstream 的格式控制

```cpp
// 需要 <sstream>、<iomanip>；局部摘录
std::ostringstream output;
output << std::fixed << std::setprecision(2) << 3.5;
auto text = output.str();                   // "3.50"（示例使用初始标准 locale）
```

`fixed`、进制等标志持续影响后续操作；`setprecision` 对 `fixed` 表示小数位数，对默认浮点格式含义不同。`setw(n)` 通常只作用于下一次对应格式化操作，是最小宽度，不限制最大输出；`setfill` 设置补齐字符。`endl` 写换行并刷新，普通换行可以用 `'\n'`。[N4659 output streams](https://timsong-cpp.github.io/cppwp/n4659/ostream)。

## std::fstream

**基础操作**。双向文件流在 `<fstream>` 中提供读写接口。声明摘要为 `template<class CharT, class Traits = char_traits<CharT>> class basic_fstream; using fstream = basic_fstream<char>;`。默认路径构造模式为 `in|out`，与单向输出创建/截断行为不同。

```cpp
// 需要 <fstream>；局部摘录；假设 record.bin 是可读写的既有文件
std::fstream file("record.bin", std::ios::in | std::ios::out | std::ios::binary);
if (file) {
    char first = 0;
    file.read(&first, 1);
    if (file) {
        file.seekp(0, std::ios::beg);        // 切换操作并定位输出位置
        file.write("X", 1);
        file.flush();
    }
}
```

`tellg/tellp` 返回流位置，失败位置可为 `pos_type(-1)`；`seekg/seekp` 接受位置或偏移加起点（`beg/cur/end`）。状态失败时要先明确恢复策略，不能忽略失败后直接定位。读写切换遵守文件缓冲关联的 C 流限制，通常通过必要的定位或刷新操作切换；文本模式的任意字节偏移不保证对应字符位置。[N4659 filebuf](https://timsong-cpp.github.io/cppwp/n4659/filebuf)。

## std::istringstream

**基础操作**。字符串输入流在 `<sstream>` 中把已有文本交给流提取。声明摘要是 `template<class CharT, class Traits = char_traits<CharT>, class Allocator = allocator<CharT>> class basic_istringstream;`，`istringstream` 是 `char` 别名。

```cpp
// 需要 <sstream>、<string>；局部摘录
std::istringstream input("7 Ada");
int id = 0;
std::string name;
if (input >> id >> name) { /* id=7，name="Ada" */ }
input.clear();
input.str("8 Lin");                         // 替换文本，状态由 clear 单独处理
```

`str()` 返回底层字符串副本；`str(text)` 替换内容。先 `>>` 再 `getline` 要处理残留换行，例如用 `ignore` 按策略丢弃本行剩余字符，而非无条件丢失有意义空白。

## std::ostringstream

**基础操作**。字符串输出流在 `<sstream>` 中累积格式化文本。声明摘要为 `template<class CharT, class Traits = char_traits<CharT>, class Allocator = allocator<CharT>> class basic_ostringstream;`，`ostringstream` 是 `char` 别名。

```cpp
// 需要 <sstream>、<string>；局部摘录
std::ostringstream output;
output << "id=" << 7;
std::string text = output.str();             // "id=7"
output.str(std::string{});                   // 清空内容
output.clear();                             // 清理错误状态，另一步操作
```

输出内容与状态是不同层面的数据；复用前分别处理。`str()` 的 C++17 形式复制内容，不能将字符串缓冲当成无限无成本的对象。[N4659 string streams](https://timsong-cpp.github.io/cppwp/n4659/string.streams)。

## std::stringstream

**基础操作**。双向字符串流默认模式为 `in|out`。声明摘要为 `template<class CharT, class Traits = char_traits<CharT>, class Allocator = allocator<CharT>> class basic_stringstream;`，`stringstream` 是 `char` 别名。

```cpp
// 需要 <sstream>；局部摘录
std::stringstream buffer;
buffer << 12 << ' ' << 34;
buffer.seekg(0);
int first = 0, second = 0;
if (buffer >> first >> second) { /* 得到 12、34 */ }
```

输入与输出位置分开查询和定位。流对象通常不可复制，可移动；移动、替换底层字符串后不要保留旧缓冲借用。

## 二进制格式与文件提交

**进阶后查**。二进制模式避免文本转换，不建立对象序列化规则。直接写 `struct` 的 `sizeof` 字节带有 padding、字节序与对象表示差异，不能重建指针或动态资源；应定义字段宽度、长度和编码。字节工具见 [R33](R33-numeric-random-bits.zh-CN.md)，对象表示见 [R24](R24-cpu-memory-cost.zh-CN.md)。

写同目录临时文件、检查全部输出及关闭、再更名目标是常见提交策略，但 `flush/rename` 不等于掉电持久化。崩溃一致性需要平台同步文件/目录与失败处理，并定义多个写者的行为；更名规则见 [R35](R35-filesystem.zh-CN.md)，平台文件 I/O 见 R26。

## 组合应用与参考资料

[原配套程序](../examples/r19-time-files.cpp) 演示字符串流的格式失败与恢复，同时包含时间和路径操作，供组合应用参考。流重载索引见 [cppreference I/O library](https://en.cppreference.com/w/cpp/io.html)。
