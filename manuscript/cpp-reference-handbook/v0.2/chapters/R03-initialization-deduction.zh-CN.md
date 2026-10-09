# 初始化与类型推导

初始化（initialization）建立新对象的初始状态；赋值修改已有对象。初始化类别描述所采用的语法或语义过程，类别会相互关联，例如直接列表初始化可执行聚合初始化。

**版本**：核心为 C++17，指定成员初始化、`consteval` 和 `constinit` 单独标 C++20。**先修**：[类型与对象](R02-types-objects.zh-CN.md)。先查初始化类别和常用写法，再查类型推导、常量求值与静态初始化。

## 初始化类别

**基础操作**。下表以类别为入口，不把“结果相同”当作“类别相同”。`T` 表示目标类型，`arg/args` 表示适用初值。

| 初始化类别 | 常见语法 | 主要含义 |
| --- | --- | --- |
| 默认初始化 | `T object;` | 类通常调用默认构造；自动局部标量不被初始化 |
| 值初始化 | `T()`；适用的 `T{}` | 标量得到零值；类按构造及预先零初始化规则处理 |
| 直接初始化 | `T object(arg);` | 直接以实参构造，可考虑 explicit 构造 |
| 拷贝初始化 | `T object = arg;` | 按拷贝初始化规则选择转换，不代表必有额外拷贝 |
| 直接列表初始化 | `T object{args};` | 使用花括号，拒绝规定窄化 |
| 拷贝列表初始化 | `T object = {args};` | 花括号选择后若选中 explicit 构造则非法 |
| 聚合初始化 | 适用聚合类型的 `{args}` | 按顺序初始化元素及成员 |
| 零初始化 | 静态初始化等语义过程的一部分 | 标量得到相应零值，子对象按规则递归处理 |

列表、聚合、值初始化不是互斥的三种标点符号：空列表初始化标量常执行值初始化，列表初始化聚合按聚合规则处理。`int n{};` 是直接列表初始化，`int n = 0;` 是拷贝初始化，二者此处都得到零。[C++17 初始化](https://timsong-cpp.github.io/cppwp/n4659/dcl.init)、[列表初始化](https://timsong-cpp.github.io/cppwp/n4659/dcl.init.list)。

## 默认初始化与值初始化

**基础操作**。以下为函数体内片段，刻意保留未初始化声明以说明语义，不读取它：

```cpp
int uninitialized;            // 自动局部标量没有确定初值，不读取
int zero{};                   // 0
int another = int();          // 0
struct Point { int x; int y; };
Point point{};                // 聚合的两个成员均为 0
```

默认初始化类通常调用可用默认构造函数，默认初始化数组则逐元素执行。值初始化标量得到零；类值初始化若选中的默认构造不是用户提供，会按规则先零初始化再默认初始化。用户提供默认构造不保证所有标量成员归零：

```cpp
struct Record {
    int value;
    Record() {}               // 用户提供构造，不初始化 value
};
Record record{};              // 不读取 record.value
```

静态存储期标量没有显式初值也先经历零初始化，不能把这项保证移用于普通自动局部变量。`T object();` 被解析成函数声明，不是一个值初始化变量；可按意图使用 `T object{};`。

## 直接初始化与拷贝初始化

**基础操作**。下面用 `explicit` 构造函数显示差异；类定义放在命名空间作用域，变量声明放在函数体内：

```cpp
struct Count {
    int value;
    explicit Count(int n) : value(n) {}
};
// 以下是使用片段
Count direct(3);              // 合法，value 为 3
Count listed{3};              // 合法，直接列表初始化
// Count implicit = 3;        // 非法，不采用该 explicit 构造
```

普通 `int copied = 3;` 是拷贝初始化，但此处没有“另一个 int 对象再复制一次”的要求。C++17 的同类型类 prvalue 可直接构造结果对象，详见[拷贝消除](R08-copy-move.zh-CN.md)。初始化阶段与构造体中的赋值不同，成员初始化见[类](R07-classes-lifetime.zh-CN.md)。

## 列表初始化与窄化

**基础操作**。花括号限制可能丢失信息的转换，称为窄化（narrowing）。局部片段：

```cpp
int exact{12};                // 12
unsigned char small{42};      // 常量可表示，合法
// int fractional{2.5};       // 浮点到整数，必须诊断
int source = 42;
// unsigned char narrowed{source}; // 非常量，不适用常量可表示豁免
```

C++17 的主要窄化情况为浮点到整数；较高精度浮点到较低精度浮点（可表示的适用常量表达式有例外）；整数/非作用域枚举到浮点（精确可表示常量有例外）；不能表示源全部值的整数类型转换（实际可表示常量有例外）。具体结果范围仍由类型决定。

类的列表初始化通常优先考虑 `std::initializer_list` 构造重载，再考虑其他构造；空列表且有适用默认构造等存在专门路径。拷贝列表初始化也会参与选择 `explicit`，但若最终选中它则非法，不能靠换成 `=` 只改变代码外观。

## initializer_list 与构造选择

**基础操作**。`std::initializer_list<T>`（`<initializer_list>`）提供对一个底层 `const T` 数组的轻量访问。容器中圆括号与花括号可以选择完全不同的构造；以下需 `<vector>`，放在函数体内：

```cpp
std::vector<int> repeated(3, 7); // 数量和值：三个 7
std::vector<int> listed{3, 7};   // 初始列表：两个元素 3、7
```

列表元素是 `const`，用列表构造容器通常需要从这些元素复制；列出多个 `unique_ptr` 不能通过 `std::move` 绕过不可拷贝限制。逐个 `emplace_back` 等移动方式见[顺序容器](R13-sequence-containers.zh-CN.md)。复制 `initializer_list` 描述不复制底层元素，也不会无条件延长原数组寿命；不能长期保存一个由局部临时列表产生的视图。[初始化列表规则](https://timsong-cpp.github.io/cppwp/n4659/dcl.init.list)。

## 聚合初始化与成员默认值

**基础操作**。聚合（aggregate）包括数组和满足规定条件的类。下面的 `Point` 是 C++17 聚合；成员初值按声明顺序对应：

```cpp
struct Point { int x; int y = 5; int z; };
Point point{2};               // x 为 2，y 使用默认值 5，z 为 0
Point other{1, 3, 7};         // 分别为 1、3、7
```

省略成员先采用默认成员初始化器；没有默认成员初始化器则按规定从空列表初始化，引用成员等仍可能导致非法程序。C++17 聚合不能具有用户提供、继承或 `explicit` 构造函数，不能有私有/受保护非静态数据成员、虚函数、虚基类或私有/受保护基类；它可以具有适用的基类。C++20 将构造相关条件改为不具有用户声明或继承构造，版本升级可能改变同一类是否为聚合。

**C++20 基础操作**。指定成员初始化适用于聚合，指定顺序须按声明顺序，不能直接照搬 C 的任意顺序或混合写法：

```cpp
struct Point { int x; int y; };
Point point{.x = 2, .y = 5};  // C++20
```

成员默认值提供统一缺省状态；具有跨字段不变量的类应由构造函数建立可用状态，而非依赖调用者事后调用 `init`。[C++17 聚合](https://timsong-cpp.github.io/cppwp/n4659/dcl.init.aggr)、[C++20 聚合](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.aggr)。

## auto

**基础操作**。`auto` 根据初值推导类型，常见形状是 `auto name = expression`、`auto& name = expression`、`auto&& name = expression`。需要初值，不能仅声明 `auto object;`。

```cpp
const int source = 4;
auto copy = source;           // int，按值副本
const auto constant = source; // const int
auto& alias = source;         // const int&
auto&& reference = source;    // const int&，初值是左值
const int* pointer = &source;
auto pointer_copy = pointer; // const int*，底层 const 保留
```

按值推导通常移除引用和顶层 `const`，数组/函数也可能转换为指针；引用推导保留相关 const 和数组身份。`auto&&` 在这里按转发引用规则推导，详见[移动与转发](R08-copy-move.zh-CN.md)。需要借用时写出引用，避免不必要地复制容器。

![不同声明形状的推导结果](../resources/R03-deduction-rules.svg)

图：以 `const int` 左值为初值，推导的复制/借用关系不同；图不规定优化后是否实际保存副本。

C++17 `auto a{1};` 推导为 `int`；`auto b = {1};` 推导为 `std::initializer_list<int>`，需要相应头文件。直接列表推导要求单个元素；拷贝列表各元素需能推导同一种元素类型，不能凭列表自动创造某种容器。[auto 推导](https://timsong-cpp.github.io/cppwp/n4659/dcl.spec.auto)。

## decltype 与 decltype(auto)

**基础操作**。`decltype(expression)` 查询类型，不求值表达式。对未加括号的名字或成员访问，取得实体的声明类型；其他表达式按[值类别](R04-expressions-conversions.zh-CN.md#值类别)得到 `T`、`T&` 或 `T&&`。

```cpp
const int source = 4;
decltype(source) copy = 7;     // const int
decltype((source)) alias = source; // const int&
decltype(source + 1) value = 5; // int，prvalue
decltype(auto) borrowed = (source); // const int&
```

括号改变是否适用名字的特殊规则；`decltype(auto)` 使用这套规则保留类型属性，不使用普通按值 `auto` 的规则。函数返回 `decltype(auto)` 时，`return (local);` 可推导为引用，函数退出后悬垂；`return local;` 可推导为值。先确定返回所有权，避免用括号偶然决定接口。[decltype](https://timsong-cpp.github.io/cppwp/n4659/dcl.type.simple)。

## 推导返回类型

**基础操作**。函数可以从返回表达式推导返回类型：

```cpp
auto twice(int value) { return value * 2; } // 返回 int
```

多个未被丢弃的返回语句必须按规则得到相同类型，编译器不会额外寻找一个共同转换类型；使用这种返回类型前通常要看到相应定义。跨模块接口的显式返回类型更便于说明所有权和兼容性，泛型辅助函数可按需要推导。返回引用与借用条件见[指针与引用](R05-pointers-references.zh-CN.md)。

## const 与 constexpr

**基础操作**。`const` 限制通过该对象修改值，初始化可以在运行期；对指针需区分指针自身与所指对象的 const。`constexpr` 变量要求常量初始化并具有 const 属性，`constexpr` 函数允许适用调用参与常量表达式。

```cpp
constexpr int square(int n) { return n * n; }
constexpr int known = square(3); // 9，常量表达式
// 假设 input 是已经初始化的 int 变量
// int runtime = square(input); // 同一函数也能接受运行期输入
```

`constexpr` 函数不保证每次调用都在编译期执行；结果仍须满足常量表达式规则，包括不进行禁止的操作。`const` 也不自动使任意对象可用于常量表达式。[C++17 constexpr](https://timsong-cpp.github.io/cppwp/n4659/dcl.constexpr)。

## consteval 与 constinit

**基础操作 · C++20**。`consteval` 声明立即函数（immediate function），适用的立即调用须形成常量表达式；`constinit` 要求静态或线程存储期变量满足静态初始化，不把变量变为 const。

```cpp
consteval int twice(int value) { return value * 2; }
constexpr int known = twice(21);       // 42
constinit int global_count = 0;        // 命名空间作用域，可在运行期修改
```

`constinit` 不保证变量可用作常量表达式，且不能与 `constexpr` 在同一声明中组合。上例的立即函数输入有界；概念或常量求值不能替代任意运行时数据的验证。[C++20 常量声明](https://timsong-cpp.github.io/cppwp/n4861/dcl.constexpr)、[constinit](https://timsong-cpp.github.io/cppwp/n4861/dcl.constinit)。

## 静态初始化与局部 static

**机制解释**。静态存储期对象先进行静态初始化（常量初始化或零初始化），必要时再动态初始化。跨翻译单元动态初始化的排序具有复杂条件，不能把源文件排列当作依赖机制。

```cpp
int& counter() {
    static int value = 0;
    return value;
}
```

函数内静态对象在首次控制经过声明时按规则初始化；C++11 起并发首次初始化有同步保证，之后对对象的业务访问仍需相应同步。初始化抛异常时下次经过会重试；递归重入正在初始化的声明具有未定义行为。依赖应由构造参数或明确入口表达，并考虑退出时的销毁顺序；类成员顺序由[构造与析构](R07-classes-lifetime.zh-CN.md)维护。

参考资料：[静态初始化](https://timsong-cpp.github.io/cppwp/n4659/basic.start.static)、[动态初始化](https://timsong-cpp.github.io/cppwp/n4659/basic.start.dynamic)、[局部静态声明](https://timsong-cpp.github.io/cppwp/n4659/stmt.dcl)。完整[初始化与推导组合程序](../examples/r03-initialization-deduction.cpp)保留 vector 构造差异与类型断言。
