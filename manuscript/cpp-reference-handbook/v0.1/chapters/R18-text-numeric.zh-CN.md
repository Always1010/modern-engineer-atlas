# 第18章 文本处理与数值工具

解析把字符转换成数值，格式化把数值转换成字符。边界、错误位置与数值范围都属于接口结果；只得到一个数字不足以证明输入已被完整接受。

**版本**：charconv 以 C++17 为准，format 与 bit 工具标 C++20，byteswap 标 C++23。**先修**：R12 字节与视图、R16 数值累计。首次查第1至2条；随机复现和协议字段再查第3至4条。

## 1 from_chars 与 to_chars（C++17）

`<charconv>` 的接口接收 [first,last) 字符区间，不依赖零结尾或全局 locale，不分配 string。

| 常用形式 | 参数、返回与边界 |
| --- | --- |
| `from_chars(first,last,T& value,int base=10)` | 整数解析，base 为2至36；返回 {ptr,ec} |
| `from_chars(first,last,Float& value,chars_format fmt=general)` | 浮点解析，fmt 控制语法 |
| `to_chars(first,last,T value,int base=10)` | 整数输出；返回输出尾位置与错误码 |
| `to_chars(first,last,Float value,fmt[,precision])` | 浮点输出；重载决定最短表示或精度 |

成功 ec 为 `std::errc{}`，ptr 是首个未解析字符；整字段校验还须 ptr == last。无匹配时为 invalid_argument，ptr == first；结果超范围为 result_out_of_range，原 value 不改变，但 ptr 仍反映已扫描匹配部分。整数不跳过前导空白，不接受前导 +；负号仅对有符号类型允许，base16 也不自动吞掉 0x。浮点同样不跳过空白，十六进制形式不带 0x 前缀。[N4659 charconv](https://timsong-cpp.github.io/cppwp/n4659/charconv)。

to_chars 不补零结尾；成功后用 ptr−first 构造 string_view，不能把缓冲直接交给 strlen。缓冲不足时 ec 为 value_too_large，输出内容不能作为有效结果使用。需要 C 字符串就另留一个字符并在成功位置写零，前提仍是位置在可写范围内。

![字符区间、解析位置与最终提交](../resources/R18-parse-range.svg)

图18-1：解析“42x”能取得数字42但留下 x，整字段策略拒绝；超范围和无匹配另走错误分支。先解析到候选值再提交是工程策略，避免失败后污染调用者结果。

对日志字段可能允许部分消费，对配置项通常要求完整消费。把这两种策略写成独立接口，避免上层忘记检查 ptr。charconv 虽已在标准中提供浮点接口，旧标准库可能尚未实现；本章例子只运行整数重载，浮点接受规则按草案定位。

## 2 format 与数值边界

C++20 `<format>` 的常用族为 `format(fmt,args…)` 返回 string、`format_to(out,fmt,args…)` 返回输出迭代器、`format_to_n(out,n,fmt,args…)` 返回实际终点与完整结果大小、`formatted_size(fmt,args…)` 返回所需字符数。宽度一般是最小宽度，不是最大写入长度；format_to 的裸缓冲需自己保证空间。

N4861 以格式串解析和 format_error 描述错误；后续缺陷修正使许多实现对字面量进行编译期格式检查，不能把当前编译器诊断方式当原始 C++20 的一律保证。动态格式可通过 vformat 与 make_format_args 路径处理。字符编码、区域设置和对齐含义须按具体格式器判断；格式化成功不意味着输出可当协议中的固定宽度字段。[N4861 格式化](https://timsong-cpp.github.io/cppwp/n4861/format)。

语法摘录（C++20，`<format>`）：`auto text = std::format("id={:04d}", 7);`，结果 `id=0007`。当前 g++10.3 标准库不作为 format 验证环境，本章未运行此摘录。

`<limits>` 的 `numeric_limits<T>::max()` 给最大有限值，`lowest()` 给最低有限值；浮点 min() 是最小正规正值，不是最负数。`epsilon()` 是1附近相邻表示的差，不是适用于任意量级的通用误差阈值。比较误差通常同时约束绝对误差与相对误差，业务还须决定 NaN、无穷和舍入的处理。[N4659 numeric_limits](https://timsong-cpp.github.io/cppwp/n4659/numeric.limits)。

整数扩宽前要注意表达式已经按原类型计算；把溢出结果再 cast 为大类型不能补救。解析后检查业务范围也不能替代表示范围检查。整数转换、单位转换与累计分别核对，见 R04、R16。

## 3 随机引擎、分布与复现

`<random>` 将引擎与分布分开：`mt19937 engine(seed)` 生成伪随机位序列；`uniform_int_distribution<int> d(a,b)` 生成闭区间 [a,b] 的整数，要求 a ≤ b；`uniform_real_distribution<double>(a,b)` 定义 [a,b) 上的实数分布。调用 `d(engine)` 消耗引擎状态，其消耗量由分布算法决定。

固定引擎类型与种子可复现规定的引擎序列；不能据此保证所有标准库的分布输出逐项一致。normal_distribution 等还可能缓存状态，重置引擎不等于重置分布；必要时调用分布 reset。记录引擎、种子、分布参数、实现版本和调用次序，才能解释实验的复现边界。[N4659 随机库](https://timsong-cpp.github.io/cppwp/n4659/rand)。

random_device 可以依赖真实非确定源，也可以在实现缺乏来源时以伪随机实现，调用也可能失败；不能将它无条件称为密码学随机接口。mt19937 亦不适合生成密码、令牌或密钥。工程中一次播种后保留引擎，避免每次采样都用时钟重新播种导致相关序列；多线程共享引擎仍须同步或独立状态策略。

## 4 bit、bitset、字节与端序

`<bitset>` 的 `bitset<N>` 以固定 N 表示位集合，支持 set/reset/test、按位操作、count 与字符串转换；test 越界抛 out_of_range，下标形式的边界由调用方保证。to_ulong/to_ullong 在无法表示时抛 overflow_error。位编号0是最低有效位，字符串表示从最高位开始，不等于对象在内存中的字节布局。[N4659 bitset](https://timsong-cpp.github.io/cppwp/n4659/template.bitset)。

C++20 `<bit>` 的常用族包括 popcount、countl_zero、countr_zero、rotl/rotr、has_single_bit、bit_floor/ceil、bit_cast、endian。`bit_cast<To>(from)` 要求大小相等并满足 trivially copyable 等条件；它复制对象表示，不作数值转换，也不保证任意字节都能构成目标类型合法值。bit_ceil 的结果必须可表示，不能把它当任意整数的无条件扩容量函数。[N4861 位工具](https://timsong-cpp.github.io/cppwp/n4861/bit)。

`std::byte` 在 `<cstddef>`（C++17）表示原始字节，不是一般算术整数；用 to_integer 显式取值。char 的一个元素占一个 C++ 字节，CHAR_BIT 不由语言保证是8。协议若定义八位字节，应先核验此平台条件，再使用无符号整数移位组合；位移量必须小于类型宽度，提升类型也应明确。

endian::native 可等于 little、big，也有不属于二者的混合情况；端序枚举只描述平台表示，不执行转换。C++23 byteswap 交换整数的字节表示，同样不替你定义协议字段宽度。不能 `reinterpret_cast<unsigned*>` 直接读取不对齐网络缓冲，这同时涉及对齐、别名、对象生命周期与端序。逐字节组装或合法 memcpy 后再转换更易审核，协议字节序见 R28。[N4950 byteswap，C++23](https://timsong-cpp.github.io/cppwp/n4950/bit.byteswap)。

固定宽度的协议数字需要单独核验格式：例如字段限定四个十进制字符，to_chars 不会自动补零，format 的宽度也不会截断五位数。先检查业务数值范围，再编码到足够空间，最后核对输出长度。解析时允许哪些符号、空白和进制同样应写成协议，而不是让两个端点各自按默认转换猜测。

位操作尽量使用明确宽度的无符号类型。对 char 直接左移会先做整数提升，平台 char 的有符号性还可能使高位字节被解释成负数；先转成足够宽的无符号值再移位。按位交换不能代替数值范围校验，也不能修复越界读取。

## 5 完整例子与检索入口

```cpp
#include <array>
#include <charconv>
#include <climits>
#include <cstdint>
#include <iostream>
#include <random>
#include <string_view>
#include <system_error>

bool parse(std::string_view s, int& value) {
    if (s.empty()) return false;
    int candidate = 0;
    auto r = std::from_chars(s.data(), s.data() + s.size(), candidate);
    if (r.ec != std::errc{} || r.ptr != s.data() + s.size()) return false;
    value = candidate;
    return true;
}

int main() {
    int value = 9;
    if (!parse("42", value) || value != 42) return 1;
    if (parse("42x", value) || value != 42) return 2;
    if (parse("999999999999999999999999", value)) return 3;
    std::array<char, 16> buffer{};
    auto r = std::to_chars(buffer.data(), buffer.data() + buffer.size(), value);
    if (r.ec != std::errc{} || std::string_view(buffer.data(), r.ptr - buffer.data()) != "42") return 4;
    std::mt19937 a(123), b(123);
    if (a() != b()) return 5;
    static_assert(CHAR_BIT == 8, "This wire example requires 8-bit bytes");
    const unsigned char wire[]{0x12, 0x34};
    auto field = (std::uint32_t{wire[0]} << 8) | wire[1];
    if (field != 0x1234) return 6;
    std::cout << "parse=42 suffix=rejected overflow=rejected wire=4660\n";
}
```

配套文件：[`r18-text-numeric.cpp`](../examples/r18-text-numeric.cpp)，C++17。预期输出 `parse=42 suffix=rejected overflow=rejected wire=4660`；检查失败非零。Windows g++10.3，以 `-std=c++17 -Wall -Wextra -pedantic` 核验。明确假设 CHAR_BIT==8；未运行浮点 charconv、C++20 format/bit 或 C++23 byteswap 摘录。

速查：数字后有垃圾查 ptr；缓冲不足查 to_chars.ec；最负数查 lowest；复现差异查引擎／分布状态；网络字段查无符号移位与端序。累计见 R16，编码单位见 R12。
