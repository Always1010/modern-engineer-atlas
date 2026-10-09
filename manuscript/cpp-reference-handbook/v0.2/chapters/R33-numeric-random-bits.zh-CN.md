# 数值、随机与位工具

数值界限描述类型的表示能力，数学函数执行数值运算；随机引擎提供状态序列，分布把它映射到目标概率模型；位工具处理位集合和对象表示。累计与扫描见 [R16](R16-algorithms.zh-CN.md)。

**基线**：C++17；`<bit>` 为 C++20，`byteswap` 为 C++23。先修为 [表达式](R04-expressions-conversions.zh-CN.md) 和 [对象表示](R24-cpu-memory-cost.zh-CN.md)。新版短例需要对应版本的标准库。

## std::numeric_limits

**基础操作**。`<limits>` 的 `template<class T> class numeric_limits;` 为数值类型提供静态属性；声明摘要省略成员。`T` 是待查询类型，先看 `is_specialized` 是否有适用特化。

**独立片段**。

```cpp
// 需要 <limits>；局部摘录
int highest = std::numeric_limits<int>::max();
int lowest = std::numeric_limits<int>::lowest();
double smallest_normal = std::numeric_limits<double>::min();
double negative_limit = std::numeric_limits<double>::lowest();
double near_one_step = std::numeric_limits<double>::epsilon();
```

整数 min/lowest 都是最低值；浮点 min 是最小正规正值，lowest 是最低有限值。`epsilon` 是 1 附近的表示步长，不是所有量级通用误差容限。`digits` 表示无符号部分的 radix 位数，`digits10/max_digits10` 说明十进制精度；`is_integer/is_signed/is_iec559` 查询类别或性质。NaN、无穷、次正规支持按成员核对，不假定所有浮点实现相同。[N4659 numeric_limits](https://timsong-cpp.github.io/cppwp/n4659/numeric.limits)。

## 数学函数与舍入

**基础操作**。`<cmath>` 的常用 double 重载如下，省略 float/long double 与整数重载：

**声明摘要**。

```cpp
namespace std {
    double abs(double x);
    double sqrt(double x);
    double pow(double x, double y);
    double floor(double x);
    double ceil(double x);
    double trunc(double x);
    double round(double x);
    bool isfinite(double x);
    bool isnan(double x);
}
```

**独立片段**。

```cpp
// 需要 <cmath>；局部摘录
double root = std::sqrt(9.0);                // 3.0
double down = std::floor(-1.2);              // -2.0
double toward_zero = std::trunc(-1.2);       // -1.0
double rounded = std::round(2.5);            // 3.0，中点远离零
```

sqrt 的实数域要求非负，pow 的域依底数/指数而定；域错误、范围错误通过 `math_errhandling` 所指的 errno/浮点异常设施等报告，不统一保证抛 C++ 异常。整数 abs 的最小负数可能没有可表示正值，不能直接对它取绝对值。浮点转整数前须检查有限性和表示范围，先 cast 再检查不能补救越界转换。

浮点比较常结合绝对与相对误差，并明确 NaN/无穷策略；`epsilon` 单独不能定义业务误差。`gcd/lcm` 在 `<numeric>`（C++17），输入绝对值和结果必须满足表示条件，尤其注意最小负数与乘积溢出。[N4659 numerics](https://timsong-cpp.github.io/cppwp/n4659/numerics)。

## std::mt19937

**基础操作**。`<random>` 的梅森旋转伪随机引擎保存状态，每次 `operator()()` 推进序列。`mt19937` 是具有标准参数的 `mersenne_twister_engine` 别名；公开形状可理解为 `class` 型引擎，有 `result_type`、`seed`、`discard` 和取样操作，具体别名参数后查标准。

**独立片段**。

```cpp
// 需要 <random>；局部摘录
std::mt19937 engine(123u);                   // 固定种子
std::mt19937 same(123u);
auto a = engine();
auto b = same();                            // a 与 b 相同
engine.discard(10);                         // 推进十次结果，不返回样本
```

默认构造使用规定的默认种子，可由整数或种子序列构造/重新 seed。固定引擎类型与种子可复现规定的引擎序列，但 mt19937 不用于密码、令牌或密钥。`discard(n)` 结果等价于丢弃 n 次取样，不承诺常数工作。[N4659 engines](https://timsong-cpp.github.io/cppwp/n4659/rand.eng)。

## std::random_device 与 std::seed_seq

**基础操作**。`random_device` 在 `<random>` 中向实现提供的随机来源请求结果，不能复制；默认或 token 字符串构造，`operator()()` 返回 result_type，调用/构造可失败，`entropy()` 报告估计值。实现没有非确定来源时可使用伪随机来源，不能把它无条件当密码学接口。

**独立片段**。

```cpp
// 需要 <random>；局部摘录
std::random_device source;
std::seed_seq seeds{source(), source(), source(), source()};
std::mt19937 engine(seeds);
```

`seed_seq` 将多个整数转换为引擎所需初始化状态，可从区间或初始化列表构造；它不自行增加熵。固定 seed_seq 输入提供确定初始化，记录输入与引擎类型可帮助复现。[N4659 random_device](https://timsong-cpp.github.io/cppwp/n4659/rand.device)、[seed sequences](https://timsong-cpp.github.io/cppwp/n4659/rand.util.seedseq)。

## std::uniform_int_distribution

**基础操作**。`<random>`，公开声明摘要为 `template<class IntType = int> class uniform_int_distribution;`，省略成员。`IntType` 须是标准允许的整数类型（不能随意用 bool/char）；参数 a、b 定义闭区间 `[a,b]`，要求 a≤b。

**独立片段**。

```cpp
// 需要 <random>；局部摘录
std::mt19937 engine(123u);
std::uniform_int_distribution<int> die(1, 6);
int face = die(engine);                     // 1 至 6，推进 engine
int low = die.min(), high = die.max();      // 1、6
```

默认参数为零至 IntType 的最大值；`a/b` 读取参数，`param()` 查询/替换 param_type，`reset()` 清理内部采样状态。`operator()(engine)` 返回 IntType，消耗引擎结果数取决于分布实现。

## std::uniform_real_distribution

**基础操作**。`<random>`，声明摘要为 `template<class RealType = double> class uniform_real_distribution;`，省略成员。类型为 float/double/long double，参数 a、b 描述 `[a,b)` 上的均匀实数分布，要求 a≤b 且范围差在规定表示条件内。

**独立片段**。

```cpp
// 需要 <random>；局部摘录
std::mt19937 engine(123u);
std::uniform_real_distribution<double> unit(0.0, 1.0);
double sample = unit(engine);               // 分布定义为 [0,1)
```

浮点舍入及实现问题可能影响端点处理，要求严格业务界限时仍显式校验。参数、reset 和 param_type 的用法与其他分布对应；不据数学分布定义承诺每个输出位模式的相同概率。

## std::normal_distribution

**基础操作**。`<random>`，声明摘要为 `template<class RealType = double> class normal_distribution;`。参数 mean、stddev 分别为均值和标准差，要求 stddev>0。

**独立片段**。

```cpp
// 需要 <random>；局部摘录
std::mt19937 engine(123u);
std::normal_distribution<double> measurement(10.0, 2.0);
double sample = measurement(engine);
measurement.reset();                       // 清除可能缓存的采样状态
```

分布可缓存状态，重新 seed 引擎不等于重置分布。同一引擎/种子不保证跨标准库实现的分布样本逐项一致；记录分布参数、实现与调用顺序。共享引擎或分布跨线程使用需要同步或独立状态。[N4659 distributions](https://timsong-cpp.github.io/cppwp/n4659/rand.dist)。

## std::bitset

**基础操作**。`<bitset>` 中的固定长度位集合。声明摘要为 `template<size_t N> class bitset;`，省略成员；N 是位数，不由对象字节大小定义。

**独立片段**。

```cpp
// 需要 <bitset>、<string>；局部摘录
std::bitset<8> flags;                       // 全零
std::bitset<8> value(5);                    // 00000101
flags.set(1).set(3);                        // 00001010
bool present = flags.test(3);               // true
flags.flip(1);                             // 00001000
auto n = flags.count();                    // 1
std::string text = value.to_string();       // "00000101"
```

默认、整数、字符串/字符源构造可用。`set(pos,value)/reset(pos)/flip(pos)` 修改指定位置，无位置重载修改全部位；`test(pos)` 越界抛 out_of_range，下标要求合法。`any/none/all/count` 查询，`&|^~` 与移位返回位集合，移位移出的位丢弃。`to_ulong/to_ullong` 不可表示时抛 overflow_error。编号零为最低有效位，字符串从最高位输出，不描述内存字节序。[N4659 bitset](https://timsong-cpp.github.io/cppwp/n4659/template.bitset)。

## std::byte

**基础操作，C++17**。`<cstddef>` 的 `enum class byte : unsigned char {};` 表示原始字节；只提供按位/移位操作和显式转换，不是普通算术整数。

**独立片段**。

```cpp
// 需要 <cstddef>；局部摘录
std::byte value{0x0f};
value |= std::byte{0x80};
unsigned number = std::to_integer<unsigned>(value); // 143
```

`to_integer<IntegerType>(byte)` 要求整数类型；移位量须满足语言规则。C++ 字节位数由 CHAR_BIT 查询，不保证八位；八位协议应核验前提，使用明确宽度的无符号类型组装字段。

## 位计数、旋转与二的幂

**C++20**。`<bit>` 的 popcount、countl_zero、countr_zero、rotl/rotr、has_single_bit、bit_floor/bit_ceil 主要接收无符号整数，按各函数允许类型及表示条件使用。

**独立片段**。

```cpp
// C++20；需要 <bit>；局部摘录
unsigned x = 10u;                           // 二进制 1010
int ones = std::popcount(x);                // 2
bool power = std::has_single_bit(x);        // false
unsigned down = std::bit_floor(x);          // 8
unsigned up = std::bit_ceil(x);             // 16
unsigned rotated = std::rotl(x, 1);
```

计数返回 int，旋转和幂工具返回输入类型。`countl_zero/countr_zero(0)` 返回类型位宽；bit_floor(0) 为零，bit_ceil(0) 为一；bit_ceil 的结果不可表示时越出有效条件。旋转位宽不是 sizeof 的十进制位数，`rotl/rotr` 按标准规则处理正负旋转数。[N4861 bit](https://timsong-cpp.github.io/cppwp/n4861/bit)。

## std::bit_cast

**C++20**。`<bit>` 的 `template<class To,class From> constexpr To bit_cast(const From& from) noexcept;`，摘要省略约束；两类型大小相等且都 trivially copyable。它按对象表示复制，不作数值转换。

**独立片段**。

```cpp
// C++20；需要 <bit>、<array>；局部摘录
unsigned value = 42;
auto bytes = std::bit_cast<std::array<unsigned char, sizeof(unsigned)>>(value);
// bytes 保存对象表示；内容依表示/字节序，不规定某一布局
```

表示中的 padding 和目标是否有有效值仍受版本规则限制，不能把任意字节都 cast 成任意对象。对协议字段仍使用明确的编码规则，而非本机布局。

## std::endian 与 std::byteswap

**C++20**。`<bit>` 的 endian 枚举给出 little/big/native；native 可不等于前两者，不自动执行转换。

**C++23**。`template<class T> constexpr T byteswap(T value) noexcept;` 要求 T 为整数且无填充位，交换对象表示的字节顺序。

**独立片段**。

```cpp
// C++23；需要 <bit>、<cstdint>；局部摘录；假设 uint32_t 可用
std::uint32_t field = 0x12345678u;
auto swapped = std::byteswap(field);         // 八位字节条件下为 0x78563412
```

标准固定宽度 typedef 的存在是条件性的，协议另有八位字节前提。不能对不对齐缓冲 `reinterpret_cast<unsigned*>` 后直接读字段；对齐、别名、对象寿命与端序机制见 [R24](R24-cpu-memory-cost.zh-CN.md)。逐字节无符号组装或合法复制后转换仍需检查范围。[N4950 byteswap](https://timsong-cpp.github.io/cppwp/n4950/bit.byteswap)。

## 组合应用与参考资料

[原配套源码](../examples/r18-text-numeric.cpp) 保留固定引擎种子与两字节字段组装示例，解析部分归 [R18](R18-text-numeric.zh-CN.md)。随机与位接口索引见 [cppreference numerics](https://en.cppreference.com/w/cpp/numeric.html)、[bit manipulation](https://en.cppreference.com/w/cpp/utility/bit.html)。
