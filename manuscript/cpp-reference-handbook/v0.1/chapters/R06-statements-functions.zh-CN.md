# 第6章 语句与函数

**版本**：C++17；本章使用 if 初始化器、初始化捕获与 std::invoke。**先修**：R03至R05。首次阅读控制流、传参和捕获；std::function 与重载细节用于接口后查。函数调用不仅是“执行一段代码”，它还建立参数对象、选择重载并约定返回结果的寿命。

## 1 控制流与局部作用域

| 语句 | 工作用法 | 需要检查的边界 |
| --- | --- | --- |
| `if (auto x=f(); condition)` | 将检查所需变量限制在分支范围 | x 在两个分支可见，结束后销毁 |
| switch | 对整数或枚举分派 | case 默认可贯穿；需要贯穿时标 [[fallthrough]] |
| for / while | 明确递增、停止和失败路径 | break 只退出最近的循环或 switch |
| range-for | 逐元素扫描 | auto 复制；auto& 借用；循环体修改容器可能失效 |
| return | 结束当前函数并形成返回结果 | 不能返回已销毁局部对象的借用 |

switch 的 case 标签不创建独立作用域；跨越带初始化声明跳到另一个 case 可能非法，用花括号围住该分支的局部变量。range-for 对范围表达式建立隐含绑定，但在 C++17/20 不能假定其中所有嵌套临时都被延长。例如从临时所有者取得子对象引用再作为范围，可能先毁掉所有者；先给所有者命名再迭代。[语句](https://timsong-cpp.github.io/cppwp/n4659/stmt.stmt)、[range-for](https://timsong-cpp.github.io/cppwp/n4659/stmt.ranged)。

## 2 参数、返回值与默认实参

传值建立独立参数对象，适合便宜值或需要自己的副本；const T& 避免复制但借用调用者；T& 表示可修改借用；T* 适合可选对象。按值接收后再移动进成员常适合“函数要保留一份”的接口，代价需要按真实调用路径核对。别把 const 引用理解为无成本：间接访问和别名会影响优化。[函数调用](https://timsong-cpp.github.io/cppwp/n4659/expr.call)。

返回普通值通常是建立清晰所有权的起点，C++17 可消除规定的复制；引用返回要写出保活条件。默认参数在调用点使用，必须对调用处可见，既不是函数类型的一部分，也不参与选择重载。虚函数的实现选择可动态分派，但默认参数依调用处的静态类型取值，这种组合容易误读。[默认参数](https://timsong-cpp.github.io/cppwp/n4659/dcl.fct.default)。

重载先收集候选，再检查可行性与转换等级，最后选最佳匹配。`f(int)` 和 `f(double)` 不以返回类型区分；两者都同样合适时是歧义，不能指望源码顺序决定。模板和非模板之间也不能脱离转换质量概括成“总选非模板”。隐式转换链越复杂，接口越难预测。[重载决议](https://timsong-cpp.github.io/cppwp/n4659/over.match)。

默认参数虽方便，也可能让两个重载对同样的调用都可行，例如一个接收一参数，另一个接收两参数但第二参数有默认值。调用方不知道该选哪一个时，应重构接口或明确提供参数，不能以返回变量的类型来替编译器选函数。整数常量、空指针常量和 enum class 的转换规则也会影响候选，优先让接口区分有意义的类型。

## 3 lambda 捕获的是值还是借用

| 捕获 | 闭包保存什么 | 回调延后运行的条件 |
| --- | --- | --- |
| `[x]` | x 的副本 | 副本自己的引用或指针成员仍可能借用外部对象 |
| `[&x]` | 对原 x 的引用 | 原对象必须存活，跨线程还需同步 |
| `[this]` | this 指针 | 对象销毁后调用悬垂；不是复制整个对象 |
| C++17 `[*this]` | 当前对象的副本 | 是否真正自足取决于成员所有权 |
| `[p=std::move(owner)]` | 初始化捕获的对象 | 可将资源所有权转入闭包；闭包可能不可拷贝 |

默认捕获 `[=]` 中使用成员可能仍隐式捕获 this；不要据“按值捕获”认定延后回调能保活当前对象。按值捕获的调用运算符默认 const，mutable 允许修改闭包里的副本，也不会修改原 x。引用捕获允许修改引用指向的对象，但不解决数据竞争。[lambda 捕获与闭包](https://timsong-cpp.github.io/cppwp/n4659/expr.prim.lambda)。

闭包复制会复制其捕获成员：整数产生另一份值，引用和裸指针仍借用同一目标，shared_ptr 则增加共享所有权。mutable 闭包若有内部累计状态，复制后可能产生两个各自演进的计数器；多个线程调用同一闭包又可能争用同一状态。因此“可拷贝回调”是存储能力，不保证重复调用或并发调用满足业务要求。

![值捕获与引用捕获的所有权差异](../resources/R06-capture-ownership.svg)

图6-1：闭包中的整数副本可独立存活，引用捕获随原局部对象销毁而失效。箭头表示借用关系；闭包内部布局是示意，语言未规定其地址排列。

## 4 函数对象、invoke 与类型擦除

lambda、定义 operator() 的类和函数指针都是可调用对象。C++17 `std::invoke`（`<functional>`）统一调用普通可调用对象与成员指针，并处理相应对象或引用包装器；它不延长被调用对象寿命。[invoke](https://timsong-cpp.github.io/cppwp/n4659/func.invoke)。

`std::function<R(Args...)>` 保存指定签名的可调用目标，目标需要可拷贝；调用空 std::function 抛 bad_function_call。它提供类型擦除，但可能分配内存，不能假定零成本，也不能在 C++17 直接接收捕获 unique_ptr 的不可拷贝闭包。模板参数可直接接收这类闭包；如果只需局部使用，auto 保留原闭包类型更直接。[function](https://timsong-cpp.github.io/cppwp/n4659/func.wrap.func)。

函数指针适合无需状态的接口，无捕获 lambda 可按规则转换为相应函数指针；带捕获闭包通常不能这样转换。把回调传给只保存裸函数指针的 C 接口，若接口另有用户上下文指针，应把闭包或状态的寿命与注销协议一起设计。不能先取局部闭包地址、函数退出后仍让外部继续回调。

## 5 工作例子与异步边界

本例与 `examples/r06-statements-functions.cpp` 一致。make_adder 将整数副本放进闭包，返回后仍有效；owned 将唯一所有权转入闭包，直接用 invoke 调用。

```cpp
#include <functional>
#include <iostream>
#include <memory>
#include <vector>

std::function<int(int)> make_adder(int base) {
    return [base](int value) { return base + value; };
}

int main() {
    std::vector<int> values{1, 2, 3};
    int total = 0;
    for (int value : values) total += value;
    auto add = make_adder(total);
    auto owned = [p = std::make_unique<int>(5)](int value) {
        return *p + value;
    };
    if (std::invoke(add, 4) != 10 || std::invoke(owned, 7) != 12) {
        return 1;
    }
    std::cout << "callback=10 owned=12\n";
}
```

预期 `callback=10 owned=12`，语义检查失败返回 1。若将 make_adder 的捕获改为 `[&base]`，base 在函数返回时结束生命周期，延后调用便非法；本例不执行它。若把 owned 存入 std::function，本基线因不可拷贝目标而编译失败，不能用裸指针代替所有权后假定已解决问题。

登记回调时还要约定谁保存它、取消后是否仍可能执行、销毁对象前如何等待正在运行的回调。捕获 shared_ptr 可保活对象，却可能与对象保存的回调形成循环。所有权见 R09，线程退出见 R20，异常传播见 R11。

回调异常也要有接收方：同步 invoke 会向调用者传播目标抛出的异常，线程或 C 回调边界则有额外限制。回调包装器不能仅因类型擦除就自动保存异常结果；需要任务框架或明确捕获并转换协议。设计接口时把执行次数、执行线程、失败传播和取消确认一起写出，比只给一个函数签名更完整。
