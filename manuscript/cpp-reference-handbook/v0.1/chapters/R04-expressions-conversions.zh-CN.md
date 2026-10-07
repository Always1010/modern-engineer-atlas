# 第4章 表达式与类型转换

**版本**：C++17，求值顺序说明以该版本为准。**先修**：R02、R03。首次阅读短路、整数边界与值类别；显式转换在实际接口需要时查阅。表达式同时具有类型和值类别，还可能产生副作用；只按运算符的外形判断执行次序，会遗漏决定正确性的规则。

## 1 优先级不决定所有求值顺序

优先级决定语法分组，例如 `a+b*c` 按 `a+(b*c)` 组合；它不承诺先计算 a 还是 b。结合性回答多个同级运算如何分组，也不能替代求值先后。内建 `&&`、`||` 从左到右求值并短路；`p && *p>0` 因此可先检查非空。重载这两个运算符会变成函数调用，两边都要作为参数求值，不再具有同样的短路行为。[执行与序列](https://timsong-cpp.github.io/cppwp/n4659/intro.execution)、[逻辑与](https://timsong-cpp.github.io/cppwp/n4659/expr.log.and)。

C++17 中函数各参数初始化彼此是不确定先后但有序的：`f(i++, i++)` 的两个修改不再因彼此未排序而造成原先那种未定义行为，但不能依赖哪一个实参取得较小值。`i++ + i++` 仍存在未排序的冲突，不应写。赋值的右操作数先于左操作数求值；这条新增保证也不能推广到所有二元运算符。[函数调用](https://timsong-cpp.github.io/cppwp/n4659/expr.call)、[赋值](https://timsong-cpp.github.io/cppwp/n4659/expr.ass)。

工作中把多次修改同一变量拆成几条语句，比记住所有特例更易审查。条件表达式只执行选中的分支；逗号运算符保证左后右，但函数实参间的逗号只是分隔符，不是逗号运算符。

遇到“不确定结果”还要分类。未指定行为表示实现可以在标准允许的若干行为中选择，不一定记录选择；实现定义行为要求实现说明选择，例如普通 char 的有符号性。未定义行为则没有相同的行为约束。把参数执行次序未指定与越界访问混为一谈，会误判能否通过测试固定某种行为。应先确定程序是否处于标准允许的范围，再讨论允许结果的集合。

## 2 值类别描述表达式，不是变量的永久标签

| 类别 | 含义与常见例子 | 对接口选择的影响 |
| --- | --- | --- |
| lvalue | 标识对象或函数；变量名、解引用、返回 T& 的调用 | 常绑定 T& 或 const T& |
| xvalue | 标识资源可被复用的对象；std::move(x)、返回 T&& 的调用 | 参与右值引用重载 |
| prvalue | 计算值或初始化结果对象；42、T{}、返回 T 的调用 | C++17 必要时物化临时对象 |
| glvalue | lvalue 与 xvalue 的并集 | 共同具有身份 |
| rvalue | xvalue 与 prvalue 的并集 | 不等于“必定已经移动” |

命名的右值引用变量在表达式中仍是左值。`std::move(x)` 给出 xvalue，既不执行资源转移，也不延长生命周期；是否移动由后续重载决定。C++17 的 prvalue 模型允许直接初始化结果对象，不能假定每个 prvalue 都先创建一个需要拷贝的独立临时。[表达式规则](https://timsong-cpp.github.io/cppwp/n4659/expr)、[值类别定义](https://timsong-cpp.github.io/cppwp/n4659/basic.lval)、[临时物化](https://timsong-cpp.github.io/cppwp/n4659/conv.rval)。

![表达式值类别的交叉分类](../resources/R04-value-categories.svg)

图4-1：身份维度把左值与将亡值归为 glvalue，右值维度把将亡值与纯右值归为 rvalue。图是语义分类，不表示内存区域，也不承诺对象一定被移动。

## 3 整数提升、混合运算与窄化

小整数常先提升为 int 或 unsigned int，再参与通常算术转换。结果类型依赖两边的等级、符号和可表示范围；`-1 < 1u` 可能按无符号比较得到 false。把结果存入宽类型发生在运算之后，例如 `long long n=a*b;` 不能防止两个 int 先相乘溢出，应在运算前提升并核对宽类型范围。[整数提升](https://timsong-cpp.github.io/cppwp/n4659/conv.prom)、[通常算术转换](https://timsong-cpp.github.io/cppwp/n4659/expr)。

无符号回绕有定义，但未必符合长度、余额或索引的业务要求；有符号加减乘溢出行为未定义。浮点转整数会截断小数，截断结果不可表示时行为未定义，不要先 cast 再检查。列表初始化拒绝规定的窄化，普通赋值和 static_cast 并无同样的保护。

整数除法也有边界：除数零非法，最小有符号值除以负一若商不可表示同样不能执行。取模不会替这个除法组合消除溢出。移位前先检查位数非负且小于提升后左操作数的位宽；C++17 的有符号左移还受值和可表示性条件限制，协议字段与位掩码优先使用经过范围检查的无符号类型。[除法与余数](https://timsong-cpp.github.io/cppwp/n4659/expr.mul)、[移位](https://timsong-cpp.github.io/cppwp/n4659/expr.shift)。

在条件中把无符号长度减一再与零比较，空集合时可能先发生回绕。较清楚的写法先判断非空，再访问最后位置；构造字节长度时也应在乘法前检查上界，不能让已回绕的结果再通过一个较小范围的检查。转换与运算的检查顺序属于接口正确性，而非仅是编译器警告的处理方法。

## 4 四种 cast 的责任边界

| 转换 | 典型用途 | 不能据此保证 |
| --- | --- | --- |
| static_cast | 已验证的数值转换、相关类转换、转为 void | 不检查数值范围；基类向下转换需真实派生对象 |
| dynamic_cast | 多态层次中检查向下或跨层转换 | 指针失败返回空，引用失败抛 bad_cast；有相关多态条件 |
| const_cast | 调整 cv 限定 | 若原对象本来是 const，写入仍为未定义行为 |
| reinterpret_cast | 明确平台或低层表示接口 | 不建立任意目标对象，也不消除别名、对齐、生命周期限制 |

C 风格转换会混合多种能力，审查时难以判断意图。优先明确 cast，并把成立条件写在接口附近。字节缓冲解析见 R02、R18；多态对象见 R07。[显式转换](https://timsong-cpp.github.io/cppwp/n4659/expr.cast)。

dynamic_cast 成功仅证明这次类型关系适用，不转交所有权，也不提供跨线程安全。static_cast 向下转换没有相同的动态检查，调用者要证明基类子对象确实属于适用派生对象。const_cast 常用于适配历史接口，但若被调函数实际写入，应追溯原始对象是否可修改；参数表面上的 const 不能提供这项证明。

## 5 工作例子：先检查，后执行运算

例子与 `examples/r04-expressions-conversions.cpp` 一致，成功输出 `sum=42 overflow=rejected`。它用不会越界的 hi-b、lo-b 判断加法是否可表示；拒绝路径保持 result 原值，检查失败非零。

```cpp
#include <iostream>
#include <limits>
#include <type_traits>
#include <utility>

bool checked_add(int a, int b, int& result) {
    const int hi = std::numeric_limits<int>::max();
    const int lo = std::numeric_limits<int>::min();
    if ((b > 0 && a > hi - b) || (b < 0 && a < lo - b)) {
        return false;
    }
    result = a + b;
    return true;
}

int main() {
    int value = 7;
    static_assert(std::is_same_v<decltype((value)), int&>);
    static_assert(std::is_same_v<decltype(std::move(value)), int&&>);
    int sum = 0;
    if (!checked_add(20, 22, sum) || sum != 42) return 1;
    if (checked_add(std::numeric_limits<int>::max(), 1, sum)) return 2;
    if (sum != 42) return 3;
    std::cout << "sum=42 overflow=rejected\n";
}
```

这里绝不执行溢出的加法来观察“是否回绕”。该检查只覆盖 int 加法，不能直接拿去验证乘法、移位或浮点转换。除零、非法移位、越界与失效对象访问分别有自己的前提；编译器优化可能利用“合法程序不发生未定义行为”的假设，调试版的一次输出不是规则证据。引用绑定见 R05，move 与 forward 见 R08。
