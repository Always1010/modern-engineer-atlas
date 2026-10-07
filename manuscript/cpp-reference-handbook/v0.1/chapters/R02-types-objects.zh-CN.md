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

## 5 类型性质：字节复制和布局是不同问题

`<type_traits>` 的类型性质回答特定语言问题，不给类型盖一个“底层安全”的总印章。优先让编译器通过 `static_assert` 核查实际类型，不能从“成员很简单”推断全部条件。

| 性质或操作 | 可以据此判断什么 | 仍不能据此判断什么 |
| --- | --- | --- |
| `is_trivially_copyable_v<T>` | 对符合条件的现存对象可使用标准规定的字节复制保证 | 任意输入字节合法、指针能跨进程、磁盘格式稳定 |
| `is_standard_layout_v<T>` | 满足规定的成员/基类布局条件；可按要求使用 `offsetof` | 无填充、大小固定、任意编译器 ABI 一致 |
| `is_trivial_v<T>` | 满足平凡默认构造等更强的条件 | 初始化自动得到业务有效值 |
| 普通拷贝构造或赋值 | 按类型自己的操作复制值或资源 | 机器字节必然相同、所有指针都指向独立目标 |

平凡可复制与标准布局是不同性质，不能互换。带自定义析构的简单记录可能仍是标准布局，却不满足平凡可复制；保存一个裸指针的简单结构可能是平凡可复制，复制后两者仍借用同一个目标。类型性质不替代所有权协议。[C++17 类型性质](https://timsong-cpp.github.io/cppwp/n4659/class)、[类型特征](https://timsong-cpp.github.io/cppwp/n4659/meta.unary.prop)。

对象表示是 `sizeof(T)` 个字节；值表示是其中参与表示值的位，填充可能不参与。C++17 对符合条件的平凡可复制对象规定了复制到底层字符/字节数组再恢复、以及在两个现存同类型对象间复制的保证，基类子对象等情况有排除条件。这里采用完整对象，且不涉及 volatile。不把该保证扩展到 `string`、`vector` 或多态对象；它们的普通复制应走类型提供的操作。[字节复制条件](https://timsong-cpp.github.io/cppwp/n4659/basic.types)。

## 6 placement new：先有存储，再创建对象

普通 `new T(...)` 同时安排分配与初始化；标准 placement new `::new (address) T(...)` 在调用者提供的地址创建对象，不自行取得这块存储。需要 `<new>`，地址必须有足够大小与正确对齐。仅把地址转换成 `T*` 不执行构造，也不能作为对象已经存在的证据。

![同一存储中前后两个对象的生命周期](../resources/R02-storage-reuse.svg)

图2-2：两次构造返回的新指针分别用于当次对象；中间阶段没有存活的 Cell。图中的存储由字节数组提供，并没有在析构时释放。

| 步骤 | 应履行的责任 | 典型错误 |
| --- | --- | --- |
| 准备存储 | 大小至少 `sizeof(T)`，对齐至少 `alignof(T)`，存储期覆盖使用 | 用任意网络缓冲区冒充对象槽 |
| placement 构造 | 保存 new 表达式返回的指针，处理可能的构造失败 | 认为地址可访问就表示构造成功 |
| 使用对象 | 满足类型访问、生命周期与同步条件 | 在未构造/已析构阶段调用成员 |
| 结束对象 | 对需清理的类型执行对应析构；禁止后续借用 | 让函数指针或引用继续访问旧对象 |
| 重用或释放 | 按存储来源处理；重用时重新建立对象 | 对数组内 placement 对象直接 `delete` |

一般代码优先使用容器和 RAII。手工管理槽位时，构造失败与异常退出也必须维护“该槽位是否有活对象”的状态；placement 构造不能消除这些责任。C++17 存储重用与旧指针可自动指向新对象的条件较细，涉及 const、完整对象与子对象等；本例每次直接使用新构造返回的指针。`std::launder` 只在满足规定前提时获得指向新对象的指针，不创建对象、不修正对齐，也不使悬垂借用重新有效。[生命周期与重用](https://timsong-cpp.github.io/cppwp/n4659/basic.life)、[字节数组提供存储](https://timsong-cpp.github.io/cppwp/n4659/intro.object)、[launder](https://timsong-cpp.github.io/cppwp/n4659/ptr.launder)。

以下完整配套程序只展示确定的合法路径。`Record` 在复制前后都已构造；`Cell` 构造不抛异常，槽位在离开作用域前完成清理。

```cpp
#include <cstddef>
#include <cstring>
#include <iostream>
#include <new>
#include <type_traits>

struct Record { int value; unsigned char tag; };
struct Cell {
    int value;
    inline static int destroyed = 0;
    explicit Cell(int v) noexcept : value(v) {}
    ~Cell() noexcept { ++destroyed; }
};

int main() {
    static_assert(std::is_trivially_copyable_v<Record>);
    static_assert(std::is_standard_layout_v<Record>);
    Record source{7, 2}, copy{};
    std::memcpy(&copy, &source, sizeof source);
    if (copy.value != 7 || copy.tag != 2) return 1;
    alignas(Cell) std::byte storage[sizeof(Cell)];
    Cell* first = ::new (static_cast<void*>(storage)) Cell(11);
    const bool first_ok = first->value == 11;
    first->~Cell();
    Cell* second = ::new (static_cast<void*>(storage)) Cell(23);
    const bool second_ok = second->value == 23;
    second->~Cell();
    if (!first_ok || !second_ok || Cell::destroyed != 2) return 2;
    std::cout << "copy=7 reused=23 destroyed=2\n";
    return std::cout ? 0 : 3;
}
```

配套文件：[r02-object-storage.cpp](../examples/r02-object-storage.cpp)，C++17。预期 `copy=7 reused=23 destroyed=2`。不固定 Record 的大小、字段偏移或填充字节，也不读取生命周期结束后的指针。它是机制例子，不是具有异常安全的通用对象池。

## 7 对象复制与序列化：先确定接收方需要什么

| 需求 | 操作方式 | 必须核查 |
| --- | --- | --- |
| 当前程序中复制业务对象 | 拷贝构造/赋值或明确 clone | 值语义、所有权、异常安全 |
| 同实现下复制符合条件的完整记录 | 按语言保证进行字节复制 | 类型性质、对象存在、大小和重叠条件 |
| 文件、网络或进程间传递数据 | 逐字段编码与解码 | 字段宽度、字节序、长度、单位、版本、非法值 |

原生结构的填充、指针、位域及 ABI 布局都不应未经约定进入外部格式。即使结构只有整数且平凡可复制，也不能由此得出“可直接跨平台保存”。序列化后的长度属于协议，不由 `sizeof` 决定；解码要先验证输入边界与字段，再建立业务对象。端序见 R18/R24，流式分帧见 R29，跨库布局与版本见 R27。

## 8 工作例子与拆解边界

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
