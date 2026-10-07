# 第8章 拷贝与移动

**版本**：C++17；返回同类型 prvalue 的直接构造保证以 C++17 为准。**先修**：R04、R05、R07。首次阅读 move 的含义与移动后契约，模板转发用于包装接口后查。拷贝与移动都是初始化或赋值所选择的操作，能否转移资源取决于类型实现和重载匹配，不能单看实参是否写了 move。

## 1 构造与赋值是两类操作

| 操作 | 常见签名 | 目标状态与责任 |
| --- | --- | --- |
| 拷贝构造 | `T(const T&)` | 创建新对象，按类型契约复制状态 |
| 拷贝赋值 | `T& operator=(const T&)` | 替换已有对象状态，处理原资源与失败路径 |
| 移动构造 | `T(T&&)` | 创建新对象，允许取走源资源 |
| 移动赋值 | `T& operator=(T&&)` | 处理目标旧资源，再按契约接收源状态 |

默认操作逐个处理基类与成员，裸指针成员会复制指针值，不会自动深拷贝所指对象。已有对象赋值与构造不能相互替代；拥有资源的类型尤其要明确目标旧资源如何释放。用户声明特殊成员会影响隐式移动生成，删除移动与没有移动也不同：删除函数仍参与重载，可能使右值调用直接非法。[拷贝与移动](https://timsong-cpp.github.io/cppwp/n4659/class.copy)。

共享句柄的拷贝可以增加共享所有权，独占拥有者的拷贝则通常被禁止；“拷贝一定很慢、移动一定便宜”不是语言保证。内嵌固定数组的移动可能逐元素移动，其工作量仍随数组长度增长；小字符串优化也可能让移动搬运少量内嵌字节。先建立正确契约，再通过真实负载测量成本。

当右值传给 const T& 拷贝构造且没有适用移动时，仍可能拷贝。`const T x; T y(std::move(x));` 产生 const T&&，通常不能绑定要求 T&& 的移动构造，因而选择拷贝或报错。类型特征 is_move_constructible 为 true 只表示可从相应右值构造，也可能通过拷贝完成。

## 2 move 是转换，移动后状态来自契约

`std::move` 在 `<utility>` 中把表达式转换为相应右值引用，不搬内存、不调用构造函数、不结束源对象寿命。移动操作接手资源之后，源仍是一个对象，仍会析构。[move 与 forward](https://timsong-cpp.github.io/cppwp/n4659/forward)。

![所有权转移与源对象存活](../resources/R08-resource-transfer.svg)

图8-1：unique_ptr 的移动保证源变空、目标接管同一对象；这不是所有类型的统一移动后布局。std::move 箭头只改变传给重载的表达式类别，资源转移发生于移动构造。

标准库对象通常在移动后处于“有效但未指定的状态”，除非具体接口规定更多。它仍满足不变量，可销毁、可赋值，并可调用不依赖未满足前置条件的操作；不能无条件 front、pop_back 或读取原内容。string 移动后不保证为空，unique_ptr 则明确保证所有权转移后源为空。自定义类型不自动取得所有标准库的移动后保证，必须给出自身契约。[库类型移动后状态](https://timsong-cpp.github.io/cppwp/n4659/lib.types.movedfrom)、[unique_ptr 转移](https://timsong-cpp.github.io/cppwp/n4659/unique.ptr)。

允许自移动赋值与其结果也要查类型契约。对自定义资源类，应至少不泄漏、不双重释放并维持承诺的不变量；不要从普通移动赋值的正常路径推导自移动安全。

移动并不普遍使源对象的外部借用安全地“跟随”目标。某些容器移动在特定分配器条件下保留元素地址，另一些路径可能重新分配并逐元素迁移；借用指向的是源对象本身、内嵌成员还是单独分配的目标，也会改变结论。移动后要按具体操作的失效规则核对所有长期借用，不能只看到目标接收了数据就忽略旧句柄。

## 3 转发引用与 std::forward

函数模板中形如 `template<class T> void f(T&&)`，且 T 是推导的无 cv 模板参数时，T&& 可是转发引用：传左值推导 T 为引用，引用折叠得到 T&；传右值则保留 T&&。引用折叠中只有 && 与 && 组合仍为 &&，其他组合为 &。类模板已经确定的 T&&、const T&& 以及普通非模板参数，不能套用此推导。

参数名 value 无论声明为何种引用，在函数体中都是左值表达式；`std::forward<T>(value)` 按 T 恢复调用者的类别。对明确要消费的具名对象用 move，对转发包装的推导参数用 forward。反复 forward 同一个右值可能多次消费其状态；“完美转发”也不能推导花括号列表、消除重载集歧义或访问不合法的位域引用。[模板调用推导](https://timsong-cpp.github.io/cppwp/n4659/temp.deduct.call)、[引用折叠](https://timsong-cpp.github.io/cppwp/n4659/dcl.ref)。

只观察参数的函数不应为了使代码看起来现代而强行 move。转交所有权的接口应在命名、参数与后置条件上表达消费意图，调用者消费后只做契约允许的操作。保留原状态用于重试或日志时，先复制必要信息，再执行可能消费的调用；不能在调用之后从未指定状态中重建原请求。

## 4 返回对象、消除复制与 noexcept

C++17 从同类型 prvalue 初始化结果对象，例如 `return T{};`，可以直接构造返回结果，不要求先建立独立对象再移动；析构函数仍必须可访问且未删除。返回命名局部 `return local;` 的 NRVO 则允许但不强制，不能把它当作同样保证。[初始化与 prvalue](https://timsong-cpp.github.io/cppwp/n4659/dcl.init)、[拷贝消除](https://timsong-cpp.github.io/cppwp/n4659/class.copy.elision)。

符合条件的命名局部在不进行消除时仍可能按隐式移动规则处理，通常直接 return local。写 `return std::move(local);` 往往妨碍 NRVO，不能作为返回对象的通用优化。借用返回不因 copy elision 获得保活。

容器重分配要处理旧元素。移动构造真实不抛时更易维持强保证；std::move_if_noexcept 在移动可能抛且可拷贝时提供 const 引用路径，否则给出右值引用。但不能承诺每个容器操作一律采用它，不同插入位置、分配器和元素操作有各自条件。不可拷贝且移动可能抛的元素，vector 某些操作失败时保证会弱化，见 R13。[move_if_noexcept](https://timsong-cpp.github.io/cppwp/n4659/forward)、[vector 异常条件](https://timsong-cpp.github.io/cppwp/n4659/vector.capacity)。

## 5 工作例子与错误边界

与 `examples/r08-copy-move.cpp` 一致；预期 `forward=1,2 owner=42`，检查失败非零。Immovable 删除复制和移动仍可由同类型 prvalue 返回，展示 C++17 保证；不要将它改成返回命名局部后仍要求所有编译器接受。

```cpp
#include <iostream>
#include <memory>
#include <utility>

int category(int&) { return 1; }
int category(int&&) { return 2; }

template<class T>
int relay(T&& value) {
    return category(std::forward<T>(value));
}

struct Immovable {
    Immovable() = default;
    Immovable(const Immovable&) = delete;
    Immovable(Immovable&&) = delete;
};
Immovable make_value() { return Immovable{}; }

int main() {
    int value = 7;
    if (relay(value) != 1 || relay(7) != 2) return 1;
    auto owner = std::make_unique<int>(42);
    int* address = owner.get();
    auto next = std::move(owner);
    if (owner || next.get() != address || *next != 42) return 2;
    [[maybe_unused]] auto fixed = make_value();
    std::cout << "forward=1,2 owner=42\n";
}
```

例子保存的是 unique_ptr 所指对象的地址，所有权搬迁不搬迁该 int。若保存的是 owner 对象自身的引用，则该引用不代表 next。程序只检查 unique_ptr 明确承诺的空状态，不测试任意 string 的移动后内容。不要给可能抛出的移动函数随意添加 noexcept：异常逃出会终止程序，见 R11。
