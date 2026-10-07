# 第2章 类型与对象

**版本**：C++17；结构化绑定和 `std::byte` 从 C++17 提供。**先修**：R01。首次阅读第1、2、4节，处理二进制接口时再查对象表示。类型规定值与允许的操作；对象是具有类型、占用存储并处于某段生命周期内的实体。引用提供别名，函数提供可调用行为，它们不是对象类型。

## 1 基础类型先看范围，再看名字

| 类型族 | 适用场景 | 规则与限制 |
| --- | --- | --- |
| `int`、`long`、`long long` | 有符号计数与整数运算 | 宽度由实现决定；有符号溢出行为未定义 |
| 对应 unsigned 类型 | 位模式及明确定义的模运算 | 按模 2 的位数次幂运算；混合有符号值可能改变比较结果 |
| `float`、`double` | 近似实数计算 | 精度、范围查 numeric_limits；十进制小数通常不能精确表示 |
| `char`、`signed char`、`unsigned char` | 字符或字节 | 三种不同类型；普通 char 的有符号性由实现决定 |
| `bool` | 逻辑条件 | 值为 true 或 false，不用对象字节表示推断协议格式 |
| `enum class` | 状态与选项 | 枚举名位于枚举作用域，不隐式转换成整数 |

标准只给整数类型的最低范围和大小关系，不能把 Windows 上 long 的宽度推广到所有平台。需要精确宽度时查看 `<cstdint>` 的 `int32_t` 等；精确宽度类型只有实现存在相应类型时才提供。范围与精度使用 `<limits>` 的 `std::numeric_limits<T>` 查询，浮点比较策略必须与业务误差模型一致。[基础类型](https://timsong-cpp.github.io/cppwp/n4659/basic.fundamental)、[numeric_limits](https://timsong-cpp.github.io/cppwp/n4659/numeric.limits)。

字符不是显示字符的通用计数单位。一个 char 只占一个 C++ 字节，`sizeof(char)==1`；字节包含多少位查 CHAR_BIT，不能只从 sizeof 推断一定八位。字符串与 Unicode 见 R12。enum class 的底层类型可显式指定，转换回整数应在接口边界使用显式转换，避免用非法状态绕过校验。

浮点的 epsilon 描述一附近相邻可表示值的距离，不是任意数量级上的统一误差容限。数值比较可按业务同时设定绝对误差与相对误差，并检查输入的有限性；NaN 等特殊值会使通常的相等和大小比较不成立。若把浮点用作有序容器键，比较器仍必须满足严格弱序，不能简单加一个近似相等判断就宣称安全，详见 R14。

## 2 存储、对象、作用域是三条不同的轴

存储是可用内存区域；对象生命周期一般从获得合适大小和对齐的存储且完成初始化时开始，到析构开始、存储释放或被重用等规定时刻结束。类的构造析构阶段还有专门规则。名字离开作用域不总意味着对应对象被销毁，例如局部 static 对象会继续存在；保存一个地址也不延长对象寿命。[对象生命周期](https://timsong-cpp.github.io/cppwp/n4659/basic.life)。

![存储覆盖范围与对象有效期](../resources/R02-object-storage.svg)

图2-1：阴影存储存在时间可包含多个对象的生命周期；这是语言关系图，未规定堆栈地址、分配器布局或 placement new 的具体实现。普通代码优先由构造、析构和 RAII 管理这些边界。

自动存储期对象通常在进入声明处创建、离开块时销毁；静态存储期覆盖程序执行，线程存储期对应线程，动态存储期由分配释放控制。不要把“局部对象”直接等同于“硬件栈上的字节”：物理布局和优化属于实现，语言规则仍必须满足。生命周期结束后的旧指针可能保留原数值，但不能据此继续访问旧对象。

作用域还决定名字隐藏：内层的同名变量可以遮蔽外层名字，却不会销毁外层对象。引用自身的存储期与被引用对象的存储期也可以不同；把短寿对象的引用保存进静态容器，只延长保存位置的寿命，不延长被借用者。排查错误时分别标出名字的可见区间、对象有效区间和实际所有者，往往比只看地址更有效。

## 3 sizeof、alignof 与对象表示

`sizeof(T)` 给出对象占用的字节数，包含必要填充；`alignof(T)` 给出对齐要求。结构体成员之间和末尾可能有填充，因此各成员 sizeof 的和不必等于结构体 sizeof。不同平台 ABI 可以给同一声明不同布局。[对象表示](https://timsong-cpp.github.io/cppwp/n4659/basic.types)、[对齐要求](https://timsong-cpp.github.io/cppwp/n4659/basic.align)。

可通过 char、unsigned char 或 std::byte 观察对象表示；可平凡复制对象的字节复制另有保证。不应把任意缓冲 reinterpret_cast 成结构体后直接解引用：还需要对齐、对象生命周期和类型访问条件，协议端序与填充也未解决。序列化应逐字段编码，不能用 memcmp 给普通结构体实现语义相等，填充字节可能不同。

## 4 数组、退化与类型别名

`T a[N]` 含 N 个连续 T 对象。许多表达式中数组转换成首元素指针，转换后指针不携带长度；但 sizeof、取地址和绑定数组引用等场合可保留数组身份。函数参数 `int a[3]` 被调整为指针参数，不保证调用者传来三个元素。按值的 auto 也会发生数组退化。[数组到指针转换](https://timsong-cpp.github.io/cppwp/n4659/conv.array)、[数组声明](https://timsong-cpp.github.io/cppwp/n4659/dcl.array)。

`using Count = unsigned long;` 是已有类型的别名，不制造一个防混用的新类型；需要区分用户 ID 与订单 ID 时，可使用各自的包装类。长度固定且需要整体赋值、传递和接口便利时先看 std::array；动态序列见 R13。指针运算的合法区间见 R05。

数组元素类型可以是类，每个元素都有自己的构造与析构。数组整体无法像普通标量那样直接赋值；将数组传入调整为指针的形参也不复制全部元素。若函数需要知道固定长度，可采用数组引用模板参数；若长度运行时确定，明确传入长度或范围。不要让函数在没有长度信息时扫描任意内存来寻找终点，除非接口本身规定且调用者保证存在有效终止符。

## 5 工作例子与拆解边界

本例同时保留整个数组引用、首元素指针，并拆解一个聚合对象。代码与 `examples/r02-types-objects.cpp` 一致。

```cpp
#include <iostream>
#include <limits>
#include <type_traits>

enum class State : unsigned char { idle, ready };
struct Record { int id; double weight; };

int main() {
    int values[]{3, 5, 7};
    int (&whole)[3] = values;
    int* first = values;
    auto [id, weight] = Record{9, 2.5};
    static_assert(std::is_same_v<decltype(whole), int (&)[3]>);
    static_assert(sizeof(values) == 3 * sizeof(int));
    if (first != &values[0] || whole[2] != 7 ||
        id != 9 || weight != 2.5 ||
        std::numeric_limits<int>::max() < 32767) {
        return 1;
    }
    std::cout << "array=3 record=9,2.5\n";
}
```

预期输出 `array=3 record=9,2.5`，失败返回 1。编译命令沿用 R01，将输入与输出改为本章文件名。结构化绑定 `auto [id, weight]` 先持有一个隐含对象，绑定名关联其成员；这里不会修改其他 Record。若写 `auto& [a,b]=record` 才是借用既有对象，必须保证它活着。[结构化绑定](https://timsong-cpp.github.io/cppwp/n4659/dcl.struct.bind)。

典型错误是把 `sizeof(first)/sizeof(*first)` 当数组长度：得到的是指针大小与 int 大小的比值，与原数组长度无关。另一个边界是创建 Record 后直接读取未初始化的标量成员；存储已存在不能替代有效初始化。初始化与推导见 R03，别名与借用见 R05。
