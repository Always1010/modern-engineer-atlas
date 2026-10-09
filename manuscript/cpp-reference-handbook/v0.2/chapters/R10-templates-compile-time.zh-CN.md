# 模板与编译期编程

模板（template）描述一族函数或类型；模板实参替换参数后形成具体实例。编译期编程使用类型、常量表达式及约束，在翻译时选择适用实现。

**版本**：核心为 C++17；concepts/requires 标 C++20。**先修**：[类型推导](R03-initialization-deduction.zh-CN.md)、[函数](R06-statements-functions.zh-CN.md)、[转发](R08-copy-move.zh-CN.md)。基础入口是函数模板、类模板和参数；查找、SFINAE 与约束供泛型库后查。

## 函数模板

**基础操作**。形状是 `template<class T> 返回类型 函数名(参数)`；模板参数 T 在定义中代表待确定的类型。

**独立片段**。

```cpp
template<class T>
T twice(T value) { return value + value; }
// 使用片段
int integer = twice(3);        // T 推导为 int，结果 6
double real = twice(1.5);      // T 为 double，结果 3.0
long explicit_type = twice<long>(3); // 显式给 T
```

同一模板可生成多个适用函数，不是运行时根据类型切换。示例选用可表示结果；模板能实例化不表示任意数值输入都有效。类型为具体使用提供所需操作，本模板要求 `value + value` 及返回转换适用。[函数模板](https://timsong-cpp.github.io/cppwp/n4659/temp.fct)。

## 类模板

**基础操作**。形状为 `template<class T> class Name { ... };`，类名后通常写实参。

**独立片段**。

```cpp
template<class T>
struct Box {
    using value_type = T;
    T value;
    explicit Box(T initial) : value(initial) {}
    const T& read() const { return value; }
};
Box<int> integer{7};
Box<double> real{2.5};
```

Box<int> 与 Box<double> 是不同类型；成员操作依赖 T。隐式实例化类不意味着所有成员函数体立即实例化，能声明某类型的 Box 不代表其所有操作都可用。

## 模板参数类别

**基础操作**。类型参数用 class/typename，非类型参数接收规定种类的常量，模板模板参数接收适用的模板。

| 类别 | 声明形状 | 常见作用 |
| --- | --- | --- |
| 类型参数 | `template<class T>` | 元素或操作对象类型 |
| 非类型参数 | `template<std::size_t N>` | 固定长度、编译期选项 |
| 模板模板参数 | `template<template<class> class C>` | 接收符合参数形状的模板 |
| 参数包 | `template<class... T>` | 零个或多个类型 |

需要 `<cstddef>` 的类模板例子：

**独立片段**。

```cpp
template<class T, std::size_t N>
struct Buffer {
    static_assert(N > 0, "positive extent required");
    T elements[N];
};
Buffer<int, 3> values{{1, 2, 3}};
```

参数可有适用默认值；C++17 非类型模板参数可用 auto 推导其类型，类类型参数等后续扩展按版本查阅，不混入本章基线。

## 模板实参推导

**机制解释**。函数调用通常从实参推导模板参数，返回类型通常不能单独帮助一次函数调用推导。形参是值还是引用影响顶层 const、引用与数组转换，见[auto](R03-initialization-deduction.zh-CN.md#auto)及[转发引用](R08-copy-move.zh-CN.md#转发引用与引用折叠)。

**独立片段**。

```cpp
template<class T> T choose(T first, T second) { return first; }
int chosen = choose(3, 7);     // T 为 int
// choose(3, 2.5);             // 两侧推导不一致，不自动找共同类型
double real = choose<double>(3, 2.5); // 显式 T，普通转换适用
```

模板推导与后续转换是不同步骤。重载集、花括号和不推导上下文会限制推导，不能由目标返回变量类型随意猜测所有参数。[函数模板推导](https://timsong-cpp.github.io/cppwp/n4659/temp.deduct.call)。

## 类模板实参推导

**基础操作 · C++17**。类模板实参推导（Class Template Argument Deduction，CTAD）根据适用构造和推导指引省略模板实参。使用前述带构造的 Box：

**承接上文**。

```cpp
Box inferred{7};              // 推导为 Box<int>
```

推导指引描述构造参数与目标实例的关系，不是构造函数实现。C++17 聚合不能随意依赖 C++20 的聚合推导候选；必要时提供显式指引或写出实参。[类模板推导](https://timsong-cpp.github.io/cppwp/n4659/over.match.class.deduct)。

## 实例化与定义可见性

**机制解释**。实例化（instantiation）用具体实参形成所需声明/定义。隐式实例化通常需要调用处看见模板定义，故模板常放在头文件；只放声明在头而把通用定义藏在源文件，其他单元使用新类型时可能缺定义。

![模板使用与诊断关系](../resources/R10-template-instantiation.svg)

图：先检查可以确定的语法和非依赖名字，使用时进行推导、匹配及所需实例化；不表示所有成员立刻生成机器码。

**进阶后查**。有限的已知类型集合可用显式实例化集中生成；以下示意应放在已经能看见前述 twice 定义的实现位置：

**承接上文**。

```cpp
template int twice<int>(int); // 显式实例化定义
// 接口中的对应声明可写 extern template int twice<int>(int);
```

extern template 抑制相应隐式实例化，但需要程序中提供所需实例化定义；它不是任意隐藏通用实现的方式。重复解析会影响构建时间，稳定的非泛型部分可移出模板。头受不同宏影响形成不同定义还可能违反[ODR](R01-program-build.zh-CN.md#单一定义规则与多文件程序)。[实例化](https://timsong-cpp.github.io/cppwp/n4659/temp.inst)、[显式实例化](https://timsong-cpp.github.io/cppwp/n4659/temp.explicit)。

## 全特化与偏特化

**进阶后查**。全特化为确定实参提供专用定义，类模板偏特化为一族实参形状提供定义。

**独立片段**。

```cpp
template<class T> struct Tag { static constexpr int kind = 0; };
template<> struct Tag<int> { static constexpr int kind = 1; };
template<class T> struct Tag<T*> { static constexpr int kind = 2; };
int ordinary = Tag<double>::kind; // 0
int integer = Tag<int>::kind;     // 1
int pointer = Tag<int*>::kind;    // 2
```

特化应在触发相应隐式实例化前可见。函数模板不能偏特化，通常用函数重载或其他定制方式；不要任意向 std 添加普通重载，标准允许的定制需逐个核对。[全特化](https://timsong-cpp.github.io/cppwp/n4659/temp.expl.spec)、[类偏特化](https://timsong-cpp.github.io/cppwp/n4659/temp.class.spec)。

## 依赖名、typename 与 template

**进阶后查**。依赖名（dependent name）依赖模板参数，例如 `T::value_type`。typename 告知解析器相应限定名是类型，template 告知相应依赖成员是模板；它们不创建缺失接口。

**独立片段**。

```cpp
template<class B>
typename B::value_type read(const B& box) { return box.value; }

template<class T>
auto request(T& object) { return object.template get<int>(); }
```

read 要求 B 有适用 value_type 和可返回 value；request 要求 T 提供适用成员模板 get。非依赖名字通常在模板定义处查找，依赖名字按相应定义/实例化规则处理，不能把所有名字查找都推迟到使用处。[依赖名](https://timsong-cpp.github.io/cppwp/n4659/temp.dep)、[模板名字解析](https://timsong-cpp.github.io/cppwp/n4659/temp.res)。

## 实参相关查找

**机制解释**。实参相关查找（Argument-Dependent Lookup，ADL）为适用的未限定函数调用加入实参关联类及命名空间中的候选。通用 swap 常把标准后备与定制共同纳入：

**独立片段**。

```cpp
// 需 <utility>；模板要求 a、b 满足适用交换条件
template<class T>
void exchange(T& a, T& b) {
    using std::swap;
    swap(a, b);
}
```

直接限定 std::swap 会关闭这个未限定查找路径；ADL 也不是在所有命名空间搜索同名函数。[ADL](https://timsong-cpp.github.io/cppwp/n4659/basic.lookup.argdep)。

## 参数包与折叠表达式

**基础操作 · C++17 折叠**。参数包表示零个或多个参数，包展开把一个模式应用到各元素。二元左折叠用显式起点支持空包：

**独立片段**。

```cpp
template<class... T>
auto sum(T... values) { return (0 + ... + values); }
int empty = sum();            // 0
int total = sum(1, 2, 3);      // 6
```

起点类型参与通常算术转换，不是任意精度求和。一元空包仅对规定运算符有单位结果，不是所有运算符都能省略起点。折叠结合方向与求值顺序仍按相应运算符规则判断。[参数包](https://timsong-cpp.github.io/cppwp/n4659/temp.variadic)、[折叠](https://timsong-cpp.github.io/cppwp/n4659/expr.prim.fold)。

## if constexpr 与 static_assert

**基础操作 · C++17**。if constexpr 在适用实例化中按常量条件丢弃分支。需要 `<cstddef>`、`<type_traits>`：

**独立片段**。

```cpp
template<class T>
std::size_t extent(const T& value) {
    if constexpr (std::is_integral_v<T>) return 1;
    else return value.size();
}
```

整数路径不要求 size；其他类型需有可转换为 size_t 的 size()。丢弃分支仍需能解析，非依赖错误不能任意隐藏；模板外也不能把分支视作注释。

`static_assert(条件, "诊断")` 在翻译时验证常量条件。C++17 中不支持类型的断言宜依赖模板参数，使诊断在相应实例化发生；类型特征只判断类型属性，不验证运行时输入或数值边界。[constexpr if](https://timsong-cpp.github.io/cppwp/n4659/stmt.if)。

## SFINAE 与 enable_if

**进阶后查 · C++17 · `<type_traits>`**。SFINAE（Substitution Failure Is Not An Error，替换失败并非错误）在规定直接上下文替换失败时移除候选，不立即把该候选变为整个程序硬错误。

**独立片段**。

```cpp
template<class T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
T double_integer(T value) { return value + value; }
int answer = double_integer(3); // 6
// double_integer(1.5);        // 此候选被移除
```

它不吞掉函数体里的任意错误，也不吞掉替换触发其他实例化的所有错误；不能用运行期 catch 处理模板编译失败。enable_if 控制候选资格，static_assert 则可说明实现要求，两者角色不同。[推导与替换失败](https://timsong-cpp.github.io/cppwp/n4659/temp.deduct)。

## concepts 与 requires

**基础操作 · C++20 · `<concepts>`**。concept 为一组约束命名，约束参与模板候选可行性和偏序。

**独立片段**。

```cpp
template<std::integral T>
T increment(T value) { return value + T{1}; }
```

std::integral 依据类型特征，bool 也满足；有符号最大值加一的边界仍需要数据检查。

**C++20 机制解释**。requires 表达式检查类型、表达式及结果约束，不执行运行时操作；以下另需 `<cstddef>`：

**独立片段**。

```cpp
template<class T>
concept Sized = requires(const T& object) {
    typename T::value_type;
    { object.size() } -> std::convertible_to<std::size_t>;
};
template<Sized T>
std::size_t extent_of(const T& object) { return object.size(); }
```

复合要求还可指定 noexcept，嵌套要求可检查约束表达式。约束归一化使看似等价布尔式未必具有相同包含关系，修改概念可能改变最佳重载。[C++20 约束](https://timsong-cpp.github.io/cppwp/n4861/temp.constr)、[requires 表达式](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.req)。

## 模板诊断与配套例子

**进阶后查**。阅读诊断先找自己的调用、实际模板实参及首个未满足操作，实例化栈展示依赖路径。缩减类型和转发层数可区分接口要求失败与版本支持限制。

完整[求和、类型选择与 Box 程序](../examples/r10-templates-compile-time.cpp)保留 C++17 折叠、if constexpr 和 typename 组合；原 Box 是带 value_type 的简单记录，与本章用于 CTAD 的带构造 Box 展示不同任务。算法要求见[算法库](R16-algorithms.zh-CN.md)。
