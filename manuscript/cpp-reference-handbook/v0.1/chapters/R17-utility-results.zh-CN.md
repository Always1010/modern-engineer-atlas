# 第17章 通用工具与结果类型

这些类型把多个值、缺失状态或类型选择放入一个对象。先写清楚业务状态，再挑表示方式；一个“有无值”的标志不能代替全部错误信息。

**版本**：pair/tuple 以 C++17 使用；optional、variant、any 与结构化绑定从17起；expected 从23起。**先修**：R07 生命周期、R11 错误策略。首次查第1至3条；开放类型边界与结果传播再查第4至5条。

## 1 pair、tuple 与结构化绑定

| 类型或形式 | 头文件、用途与返回 |
| --- | --- |
| `pair<T,U>{a,b}` | `<utility>`，两个固定类型值；first、second |
| `tuple<Ts…>{args…}` | `<tuple>`，固定个数、不同类型的值 |
| `get<I>(t)` / `get<T>(t)` | 引用类别随 t；类型形式要求 T 仅出现一次 |
| `make_tuple(args…)` | 通常衰减、保存值；reference_wrapper 另有解包语义 |
| `tie(a,b)` | 引用元组；不拥有被绑定对象，赋值可逐项写回 |
| `apply(f,t)`，17 | 将元组元素作为参数调用 f；返回调用结果 |

访问 get 的位置是编译期常量，不能用运行期下标遍历异构元组。`auto [a,b] = record;` 为绑定创建隐藏对象，通常先复制 record；`auto& [a,b] = record;` 绑定原对象。`const auto&` 限制经此绑定修改。绑定不是把对象变成两个独立的局部所有者，引用形式仍受原对象生命周期约束。[N4659 tuple](https://timsong-cpp.github.io/cppwp/n4659/tuple)。

`forward_as_tuple` 保存转发引用，不适合缓存临时值；函数调用表达式结束后相应临时值可能销毁。接口含义明确时，命名 struct 通常比返回四五个无名位置更便于维护；pair 适合“位置＋是否插入”这种已形成惯例的二元返回。

## 2 optional：存在或缺失

`std::optional<T>` 在 `<optional>`，保存零个或一个 T，内部管理 T 的构造与析构，不表示单独分配的 T。T 不能是引用类型；如需借用可显式用 reference_wrapper，并另行说明寿命。

| 常用形式 | 前提、返回与错误 |
| --- | --- |
| `optional<T>{}` / `nullopt` | 空状态；默认不构造 T |
| `has_value()` / `operator bool()` | bool；只判断存在，不判断 T 的真假 |
| `operator*()` / `operator->()` | 取得 T 借用；要求有值，不检查空 |
| `value()` | 引用；空时抛 bad_optional_access |
| `value_or(default_value)` | 返回 T 值；空时转换备用值，有值时复制／移动值 |
| `emplace(args…)` / `reset()` | 重建并返回 T&／清空；旧 T 借用失效 |

`optional<bool>`{false} 仍有值。value_or 的备用表达式在调用前求值，不是惰性工厂；它返回新 T，不能用来取得原对象引用。emplace 会先结束旧值生命周期，新构造抛异常时可留下空 optional；对状态更新需要强保证时，先构造候选值并核对提交操作条件。[N4659 optional](https://timsong-cpp.github.io/cppwp/n4659/optional)。

缺失若是正常状态可用 optional，例如查询未命中；若要区分解析失败、权限不足与无记录，optional 已不足够。用 −1、空字符串或 nullptr 充当暗含错误标志，容易与合法业务值混淆。

## 3 variant：封闭的候选集合

`std::variant<Ts…>` 在 `<variant>`，通常恰有一个活动候选，默认构造第一个候选（要求它可默认构造）。`monostate` 可作为显式空候选；类型重复时用索引构造和 get，按类型形式要求唯一。

`holds_alternative<T>(v)` 判断候选；`get<I/T>(v)` 返回借用，候选不匹配抛 bad_variant_access；`get_if<I/T>(&v)` 返回指针，不匹配或传空指针时为 nullptr。`index()` 返回活动索引，异常无值状态为 variant_npos。

`visit(visitor,v…)` 将活动候选交给访问器，访问器须对全部候选组合可调用；C++17 的返回类型与值类别须满足统一要求。一个 variant 的访问器分派具有常数时间要求，多 variant 的一般情形没有相同复杂度承诺。类型改变的赋值或 emplace 可能因异常使对象 valueless_by_exception；此时 visit/get 会抛 bad_variant_access，而非访问某个默认候选。[N4659 variant](https://timsong-cpp.github.io/cppwp/n4659/variant)。

候选切换会结束旧对象生命周期，使该候选的引用失效。保存 variant 自身地址不保证内部候选地址或身份稳定。工程上先用枚举化的候选解释状态，再让 visit 覆盖全部情况；新增类型后编译诊断可以提示调用方遗漏，这正是封闭集合的价值。

![值、空值与类型集合的状态模型](../resources/R17-result-states.svg)

图17-1：状态语义示意，不描绘实际内存布局。expected 的两支代表成功／失败；variant 还可能有异常导致的无值状态，不能将它当普通业务空值。

## 4 any：开放类型与运行期检查

`std::any` 在 `<any>`，可保存空状态或一个满足可拷贝构造要求的类型；不保存纯移动类型的值。它通过类型擦除隐藏类型，由运行期检查恢复。小对象是否在 any 内存储属于实现选择，不能据此承诺无分配。

`has_value()` 判断空，`type()` 返回 type_info；`any_cast<T>(&a)` 在类型不匹配时返回 nullptr，值／引用形式失败抛 bad_any_cast。转换要求精确类型匹配，不会把内部 int 自动数值转换成 double。reset、emplace、赋值可能结束内部对象寿命，使原借用失效。[N4659 any](https://timsong-cpp.github.io/cppwp/n4659/any)。

any 适合边界处少量开放数据，不提供统一的业务访问或序列化协议。若类型集合已知，variant 往往能让缺失分支更早被发现；若行为是主要抽象，可考虑接口多态。错误诊断最好记录预期类型与实际来源，不只 catch 后返回空结果。

## 5 expected 与比较／哈希的版本边界

C++23 的 `std::expected<T,E>` 在 `<expected>`，保存成功 T 或失败 E，可用 `std::unexpected<E>` 构造失败。`expected<void,E>` 表示成功不携带数据。`has_value()`/bool 判断成功；`*`、`->` 要求成功；`error()` 要求失败；`value()` 失败时抛 `bad_expected_access<E>`。它不提供 variant 式的 valueless 状态，但类型及操作仍有构造、转换、异常约束。[N4950 expected，C++23](https://timsong-cpp.github.io/cppwp/n4950/expected)。

语法摘录（C++23，已包含 `<expected>`、`<string>`）：`std::expected<int,std::string> r = std::unexpected(std::string("invalid"));`；检查 !r 后可读取 r.error()。`and_then` 链接返回 expected 的操作，`transform` 映射成功值，`or_else`、`transform_error` 对失败分支操作；这些单子接口按 C++23 定位，不能直接套在 C++17 optional 上。

结果类型不替用户决定重试、记录日志或异常策略。工程错误 E 应保存稳定的错误分类和必要上下文，避免让调用方只能匹配描述文本。移动出成功值之后，对象状态仍须按 T 的移动后规则解释；有值并不承诺原内容完整。

比较与哈希先遵守 R14 的等价契约。tuple、optional、variant 有按标准规定的比较形式；不能假定任何这些类型都有可用 std::hash，tuple 在 C++17 没有通用标准哈希特化。只对允许的用户定义类型合法定制，不为标准库类型随意增加特化；任何自定义哈希都须保证等价对象哈希相同。any 不提供一般业务相等，expected 也不意味着自动适合有序键。

查找与解析两类接口可作为状态建模对照：查找没有记录时，`optional<Record>` 的空值表达正常缺失；解析失败时，`expected<Record,ParseError>` 能保留错误位置与分类。`variant<Record,ParseError>` 也能表示两支，但不会自动赋予“第一支必为成功”的命名契约，应通过领域类型或命名包装清楚表达。

这些包装自身通常拥有内部值，不意味着内部值又拥有所有来源。例如 `optional<string_view>` 有值后仍只是借用字符；`tuple<int&>` 仍需原整数存活；any 中的裸指针也不保活其对象。复制包装复制的是内部类型定义的状态，复制一个视图或指针不会变成深拷贝。审查生命周期时一路检查到实际所有者。

## 6 完整例子与检索入口

```cpp
#include <any>
#include <iostream>
#include <optional>
#include <string>
#include <tuple>
#include <type_traits>
#include <variant>

int main() {
    std::tuple<int, std::string> record{7, "Ada"};
    auto& [id, name] = record;
    id = 8;
    std::optional<int> missing;
    if (missing || missing.value_or(42) != 42) return 1;
    missing.emplace(id);
    std::variant<int, std::string> result = name;
    auto text = std::visit([](const auto& x) -> std::string {
        using T = std::decay_t<decltype(x)>;
        if constexpr (std::is_same_v<T, int>) return std::to_string(x);
        else return x;
    }, result);
    std::any box = id;
    auto p = std::any_cast<int>(&box);
    if (!p || *p != 8 || std::any_cast<double>(&box) != nullptr) return 2;
    if (*missing != 8 || text != "Ada" || std::get<0>(record) != 8) return 3;
    std::cout << "id=8 optional=8 variant=Ada any=8\n";
}
```

配套文件：[`r17-utility-results.cpp`](../examples/r17-utility-results.cpp)，C++17；预期输出 `id=8 optional=8 variant=Ada any=8`，检查失败非零。Windows g++10.3，以 `-std=c++17 -Wall -Wextra -pedantic` 核验。expected 与单子接口是 C++23 语法说明，当前工具链未运行，未为此更换工具链。

速查：固定多值查 tuple；正常缺失查 optional；封闭候选查 variant；开放类型查 any；失败载荷查 expected；借用更新查各类型 emplace。异常策略见 R11，键契约见 R14。
