# 错误处理与异常安全

错误处理定义失败的表示、传播和恢复方式；异常安全定义操作失败后仍承诺的状态。本章先给 throw/try/catch 的正常流程，再介绍错误类型、noexcept 和保证等级。

**版本**：C++17；C++23 expected 由[结果类型](R17-utility-results.zh-CN.md)展开。**先修**：[类](R07-classes-lifetime.zh-CN.md)、[移动](R08-copy-move.zh-CN.md)、[RAII](R09-raii-memory.zh-CN.md)。

## throw 与异常对象

**基础操作**。throw 表达式初始化异常对象，并寻找匹配处理器；异常对象保存传播的失败信息。下面的函数要求输入为偶数，失败抛出 invalid_argument；需 `<stdexcept>`：

**独立片段**。

```cpp
int half_even(int value) {
    if (value % 2 != 0) throw std::invalid_argument("even value required");
    return value / 2;
}
```

`half_even(8)` 正常返回 4，`half_even(7)` 产生异常，调用点需要由适用处理器接收或继续传播。异常对象不必派生 std::exception，但使用标准异常层次便于统一捕获和提供 what 描述。[C++17 throw](https://timsong-cpp.github.io/cppwp/n4659/except.throw)。

## try、catch 与重新抛出

**基础操作**。try 包围需要处理的操作，catch 根据异常类型匹配；推荐按 const 引用观察异常，避免拷贝与切片。以下为函数体内片段，已有前述 half_even，另需 `<string>`：

**承接上文**。

```cpp
std::string message;
try {
    int result = half_even(7);
} catch (const std::invalid_argument& error) {
    message = error.what();
}
```

此处 message 得到失败说明。处理器按书写顺序匹配，派生异常应放在基类异常前。`catch (...)` 匹配任意异常，适用于明确的边界处理；不能无条件吞掉失败后继续依赖没有保证的状态。

**机制解释**。处理器内 `throw;` 重新抛出当前异常；`throw error;` 按表达式静态类型初始化另一个异常，可能切片。重新抛出形状：

**承接上文**。

```cpp
try {
    half_even(7);
} catch (const std::exception&) {
    throw;                    // 保留当前异常类型和对象关系
}
```

`throw;` 必须有当前处理中的异常，否则终止。处理器自身也可抛出，例如记录字符串分配失败；资源释放由 RAII 保证，错误报告和恢复路径需保持明确。[处理器规则](https://timsong-cpp.github.io/cppwp/n4659/except.handle)。

## 栈展开与构造失败

**机制解释**。栈展开（stack unwinding）在寻找处理器、退出作用域时销毁已经完成构造的自动对象。下面用状态恢复展示这一关系；需 `<stdexcept>`。Active 是类定义；整个片段可放在函数体内，count 与 try/catch 是该函数的局部声明和语句：

**独立片段**。

```cpp
struct Active {
    int& count;
    explicit Active(int& value) : count(value) { ++count; }
    ~Active() noexcept { --count; }
};
int count = 0;
try {
    Active active(count);
    throw std::runtime_error("failure");
} catch (const std::runtime_error&) {
    // active 已销毁，count 为 0
}
```

非委托构造失败只清理已经完成构造的基类和成员，不调用失败完整对象析构；委托目标完成后抛出的差异见[构造与销毁顺序](R07-classes-lifetime.zh-CN.md#构造与销毁顺序)。栈展开负责对象清理，不自动回滚已经发生的文件、数据库或网络副作用。[展开与构造清理](https://timsong-cpp.github.io/cppwp/n4659/except.ctor)。

## 标准异常类型

**基础操作**。what 返回描述字符串的只读指针，不以某个固定英文文本作为跨实现协议。常见类型按失败类别查阅：

| 类型 | 头文件 | 常见含义 |
| --- | --- | --- |
| `std::exception` | `<exception>` | 标准异常公共基类与 what 接口 |
| `std::invalid_argument` | `<stdexcept>` | 参数不满足要求 |
| `std::out_of_range` | `<stdexcept>` | 值或访问超出约定范围 |
| `std::runtime_error` | `<stdexcept>` | 运行期失败类接口 |
| `std::bad_alloc` | `<new>` | 适用存储分配失败 |
| `std::bad_cast` | `<typeinfo>` | 适用引用 dynamic_cast 失败 |
| `std::system_error` | `<system_error>` | 保存平台/库错误码的异常 |

logic_error/runtime_error 的派生类型按接口意义选用，不以“可捕获”推断失败后对象可恢复。future_error 等设施特定异常由所属库条目维护。[标准异常](https://timsong-cpp.github.io/cppwp/n4659/support.exception)、[标准逻辑/运行期异常](https://timsong-cpp.github.io/cppwp/n4659/std.exceptions)。

## noexcept 说明符

**基础操作**。`noexcept` 或 `noexcept(true)` 声明异常不能逃出函数；`noexcept(false)` 允许异常传播。它是失败传播契约，不是保证总成功。

**独立片段**。

```cpp
struct Point { int x; int y; };
void clear(Point& point) noexcept {
    point.x = 0;
    point.y = 0;
}
```

C++17 起异常说明参与函数类型；声明定义必须一致，适用的函数指针转换也受不抛类型规则约束。异常逃出 noexcept 函数会调用 std::terminate；在终止前是否完全、部分或不展开栈有实现空间，不能靠最终析构作为清理方案。[异常说明](https://timsong-cpp.github.io/cppwp/n4659/except.spec)、[异常终止](https://timsong-cpp.github.io/cppwp/n4659/except.terminate)。

## noexcept 运算符

**基础操作**。`noexcept(expression)` 是不求值查询，返回 bool 常量，反映表达式是否具有潜在抛出属性。

**独立片段**。

```cpp
int guaranteed() noexcept { return 7; }
int may_throw() { return 7; }
static_assert(noexcept(guaranteed()));
static_assert(!noexcept(may_throw()));
```

第二个函数即使此实现体没有 throw，未声明不抛仍具有潜在抛出属性。查询不执行调用，也不检查所有数据前提；无异常不等于无越界、无未定义行为。泛型条件异常说明常写 `noexcept(noexcept(operation))`，外层是说明符，内层是查询，要核对整个函数实际可能失败步骤。[noexcept 运算符](https://timsong-cpp.github.io/cppwp/n4659/expr.unary.noexcept)。

## 析构与终止边界

**机制解释**。析构通常依成员及基类的异常属性隐式不抛；即使某析构允许抛，在已有异常展开时又让异常逃出会导致终止。清理责任应保持不抛，需要向调用者报告的 flush/close/commit 单独提供显式操作。

跨 C ABI、线程入口或明确禁止异常跨越的模块，须按接口捕获并转换或终止；转换/日志自身的失败也要处理。同步 invoke 向调用方传播异常，future 则按其共享状态机制保存，分别见[函数](R06-statements-functions.zh-CN.md#stdinvoke)与[异步任务](R20-threads-async.zh-CN.md)。

## error_code 与状态返回

**基础操作 · `<system_error>`**。`std::error_code` 由整数值与错误类别共同解释，bool 转换表示是否非零错误，不把相同整数跨类别混为同一个错误。

**独立片段**。

```cpp
std::error_code error = std::make_error_code(std::errc::invalid_argument);
bool failed = static_cast<bool>(error); // true
int value = error.value();
const std::error_category& category = error.category();
error.clear();                         // 无错误状态
```

常用接口为 value/category/message/clear；message 生成文字可能分配，不保证不抛。error_condition 表达适用的可移植条件映射，系统接口如何转换由具体类别决定。每次操作检查新结果，避免读取过期状态；合法空结果与失败应有独立表示。[error_code](https://timsong-cpp.github.io/cppwp/n4659/syserr.errcode)。

## 错误表示比较

**机制解释**。先决定调用者需要哪些信息和失败后的状态，再选择表示；返回错误也可能因字符串或错误对象构造而抛出。

| 表示方式 | 主要用途 | 调用方操作 |
| --- | --- | --- |
| 异常 | 跨多层传播，到适当边界处理 | 捕获类型、恢复或终结操作 |
| error_code/状态码 | 平台接口、明确状态返回 | 每次检查值及类别 |
| optional | 缺值足以说明结果 | 检查再取值，不用于区分多种错误原因 |
| variant/自定义结果 | 值或带信息失败 | 处理全部可达分支 |
| C++23 expected | 值或错误直接建模 | 查明错误 E 及失败状态契约 |

optional/variant/expected 的构造和访问由[结果类型](R17-utility-results.zh-CN.md)展开。输入非法、暂时资源不足、当前状态不适用和不变量损坏通常要求不同处理动作；不能让重试策略只取决于一个笼统“失败”布尔值。

## 异常安全保证

**机制解释**。保证描述失败后状态，不由“捕获了异常”或“改成错误码”自动建立。

| 保证 | 失败后的承诺 | 典型设计条件 |
| --- | --- | --- |
| 基本保证 | 不泄漏，不变量保持，状态可以变化 | 部分修改后仍可销毁并按契约使用 |
| 强保证 | 对约定状态无效果 | 可能失败步骤先完成，提交不可失败 |
| 不抛保证 | 不向外传播异常 | 所有内部操作和失败路径适用 |
| 无明确保证 | 不能推断保留何种状态 | 调用方需先取得契约 |

明确保证覆盖对象值、资源数量还是外部效果。大型批量操作可提供基本保证和完成进度，不必复制全部状态实现强保证；部分状态仍需满足不变量。释放锁等清理则常需要真实不抛。

## 暂存与强保证提交

**进阶后查**。下面用默认分配器的 vector<int> 先修改副本，再不抛交换提交；需要 `<vector>`。完整[失败注入源码](../examples/r11-errors-exception-safety.cpp)另展示作用域清理。

**独立片段**。

```cpp
void append_strong(std::vector<int>& target, int value) {
    auto staged = target;     // 复制失败，target 不变
    staged.push_back(value);  // 追加失败，target 不变
    target.swap(staged);      // 适用的不抛提交
}
```

成功后 target 多一个元素，失败前 target 原值保持。若提交可能抛、分配器不满足交换条件，或副本共享可变外部状态，该结构不自动成立；回滚本身也须能完成。[vector swap](https://timsong-cpp.github.io/cppwp/n4659/vector.special)、[容器交换条件](https://timsong-cpp.github.io/cppwp/n4659/container.requirements.general)。

![暂存、失败清理与提交](../resources/R11-rollback-sequence.svg)

图：副本失败被销毁，成功才交换提交；不保证任意类型或分配器都具有同样条件。
