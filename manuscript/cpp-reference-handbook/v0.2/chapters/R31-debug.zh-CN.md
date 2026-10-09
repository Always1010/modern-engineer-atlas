# 调试与正确性检查

调试器用于暂停程序、查看变量及调用关系；检查器用于发现特定类别的错误。本章先演示一次确定可复现的逻辑错误，再给工具和故障现场的查阅入口。

**基线**：C++17；GDB 命令与 Clang 检查器分别标明。**先修**：函数、循环及基本构建。基础阅读：调试信息、GDB 会话、断点与单步；崩溃现场和多线程检查属于机制与后查。

## 调试信息与构建

调试信息把机器指令映射到源文件、行号、类型和变量。GCC/Clang 的 `-g` 生成调试信息；`-O0` 关闭大部分优化，适合第一次观察源代码。程序仍要使用与符号匹配的二进制。

```text
g++ -std=c++17 -g -O0 r31-debug-session.cpp -o debug-demo
gdb ./debug-demo
```

Windows 下产物通常为 `debug-demo.exe`，启动可用 `gdb debug-demo.exe`。命令从保存示例文件的目录执行；完整源码见 [r31-debug-session.cpp](../examples/r31-debug-session.cpp)。优化版也能保留调试信息，但内联、变量消除和指令调整会影响步进及变量显示。

## GDB：一次最小调试会话

任务是计算 `{1,2,3}` 的和。预期为 6，示例因初始值错误输出 `sum=7`。这是可安全执行的逻辑错误。

以下是源码中的待检查函数，头文件和 main 在配套文件中：

**承接上文**。

<!-- source: examples/r31-debug-session.cpp -->
```cpp
int sum_values(const std::array<int, 3>& values) {
    int total = 1; // Deliberate logic error: an empty sum should start at zero.
    for (int value : values) {
        total += value;
    }
    return total;
}
```

在 GDB 提示符下输入：

```text
(gdb) break sum_values
(gdb) run
(gdb) next
(gdb) print total
$1 = 1
(gdb) bt
(gdb) continue
sum=7
(gdb) quit
```

`break` 设置断点；`run` 启动程序并停在断点。停住时标记的源码行通常尚未执行，因此 `next` 执行初始化后再检查 total。`print` 的 `$1` 是结果编号，不是变量名；`bt` 显示 sum_values 由 main 调用。地址、线程提示及栈的格式随平台变化。

根因是累加器初值为 1。将源码改为 `int total = 0;`，重新编译，输出应变为 `sum=6`。调试器里临时修改变量可以帮助验证假设，但源码修复和重新验证仍是最终动作。[启动程序](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Starting.html)、[单步](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Continuing-and-Stepping.html)、[查看数据](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Data.html)。

## 断点、步进与继续

| GDB 命令 | 操作 | 结果 |
| --- | --- | --- |
| `break f` / `break file.cpp:20` | 函数或行断点 | 到达位置时暂停 |
| `run` | 启动程序 | 执行至断点、信号或结束 |
| `next` | 按源码单步，不进入普通调用 | 停在当前栈帧的下一行 |
| `step` | 按源码单步，可进入有符号的函数 | 观察被调用函数 |
| `finish` | 运行到当前函数返回 | 回到调用方 |
| `continue` | 恢复执行 | 停在下一个事件或结束 |

条件断点可用 `break file.cpp:20 if index == 3` 缩小观察范围；条件中的变量必须在该位置可见。`info breakpoints` 列出断点编号，`delete 1` 删除编号 1 的断点。源码行可能对应多条或没有机器指令，行号不是精确指令地址。[断点](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Breaks.html)。

## 变量、调用栈与线程

| 查看对象 | GDB | LLDB |
| --- | --- | --- |
| 表达式/局部变量 | `print x` / `info locals` | `expression x` / `frame variable` |
| 调用栈/选择栈帧 | `bt` / `frame 1` | `bt` / `frame select 1` |
| 线程/全部线程栈 | `info threads` / `thread apply all bt` | `thread list` / `thread backtrace all` |

栈帧保存一次函数调用的执行上下文，`frame 1` 选择上一级调用方后，可以查看该帧中的变量。Visual Studio 对应“调用堆栈”“局部变量/监视”“线程”窗口。

卡死时查看所有相关线程：一个线程可能等锁，另一个线程可能持锁又等待第一个线程。仅看主线程不能还原关系。借用失效和数据竞争的规则分别见指针/引用、资源管理与原子内存序条目。[GDB 栈](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Backtrace.html)、[线程](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Threads.html)、[LLDB 对照](https://lldb.llvm.org/use/map.html)。

## Sanitizer：内存与未定义行为检查

Sanitizer 是编译器插入的运行时检查，覆盖实际执行路径；它与断点调试互补。

| 检查器 | 主要用途 | 重要边界 |
| --- | --- | --- |
| AddressSanitizer（ASan） | 越界、释放后使用等 | 检查范围受工具和执行路径限制 |
| UndefinedBehaviorSanitizer（UBSan） | 部分溢出、非法转换等 | 不是所有 UB 的判定器 |
| ThreadSanitizer（TSan） | 数据竞争 | 不证明无死锁或协议正确 |

以下是使用已有 Clang 工具链的构建形状，`program.cpp` 替换为自己的源码：

```text
clang++ -std=c++17 -g -O1 -fsanitize=address -fno-omit-frame-pointer program.cpp -o asan-demo
clang++ -std=c++17 -g -O1 -fsanitize=undefined program.cpp -o ubsan-demo
clang++ -std=c++17 -g -O1 -fsanitize=thread program.cpp -o tsan-demo
```

最后链接步骤也需保留选项。TSan 单独构建，不与 ASan 混入同一程序；平台支持须查工具文档。MSVC 的 ASan 使用 `/fsanitize=address`，不能据此推断所有检查器都支持 Windows。

阅读报告时先看错误类别和首次相关访问，再检查分配/释放位置及调用链；修复后重跑触发输入。检查器的运行成本不能用作生产性能数据。[ASan](https://clang.llvm.org/docs/AddressSanitizer.html)、[UBSan](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)、[TSan](https://clang.llvm.org/docs/ThreadSanitizer.html)、[MSVC ASan](https://learn.microsoft.com/en-us/cpp/sanitizers/asan?view=msvc-170)。

## 崩溃现场与证据

**机制解释。** core/minidump 保存故障时的部分进程状态。匹配的程序、符号、输入和构建身份是分析前提；dump 可能没有包含全部内存。

| 现象 | 收集材料 | 首先定位 |
| --- | --- | --- |
| 编译/链接失败 | 命令、首条诊断、相关符号 | 阶段、声明或依赖 |
| 崩溃 | dump/core、二进制、符号、输入 | 栈、参数和所有者 |
| 卡死/偶发错误 | 全线程栈、日志、输入 | 等待关系和同步协议 |

![按失败阶段收集故障证据](../resources/R31-evidence-path.svg)

图31-1：从现象选择证据，再回到具体规则。保留触发条件，不能用删掉并发后的“最小程序正常”证明原程序正确。现场可能含业务和个人数据，保存或分享按实际权限处理。[Windows dump](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/user-mode-dump-files)。

## 边界验证与回归

输入检查用可执行条件表达，不能依赖可能被 NDEBUG 关闭的 assert。边界任务包括空输入、最后合法位置、第一个非法位置、最大最小值及失败后的资源状态。

配套 [r31-debug.cpp](../examples/r31-debug.cpp) 用 optional 验证下标与倍增边界，预期输出 `PASS normal, overflow, underflow, index`；其算术条件见表达式与转换，optional 用法见通用工具条目。该程序用于边界检查，调试操作由本章的最小会话承担。

修复完成时说明原因、触发输入、改变的规则及验证配置。非确定性故障还要核对线程关系；重复运行无故障只是一条观察。构建身份见构建章，性能调查见性能章。
