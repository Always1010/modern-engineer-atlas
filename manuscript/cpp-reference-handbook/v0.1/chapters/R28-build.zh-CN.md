# 第28章 编译链接与工程边界

编译成功只说明各翻译单元通过了当前检查；链接、动态装载和跨模块协议还有独立的失败点。工程中应把“怎么构建”与“谁能依赖谁”同时写清。

**基线**：C++17，CMake 示例最低版本3.16。**先修**：R01的声明、定义与翻译单元，R09的所有权。命令只是对应工具链的入口，不要求读者安装新环境。

## 1 构建阶段与失败位置

| 阶段 | 输入与产物 | 常见问题 | 首先核对 |
| --- | --- | --- | --- |
| 预处理 | 头文件、宏 → 翻译单元 | 找不到头文件、宏改变声明 | 实际 include 路径、宏定义与预处理结果 |
| 编译 | 翻译单元 → 目标文件 | 类型、模板、约束不满足 | 第一条有效诊断与实例化链 |
| 链接 | 目标文件、库 → 程序／动态库 | 未定义符号、重复定义 | 定义是否参加构建、签名、库与架构 |
| 装载 | 程序与运行时库 → 进程 | 找不到动态库、符号或依赖 | 搜索位置、实际加载版本与依赖链 |

静态库主要是目标文件的归档，不会因“生成了静态库”就证明全部外部符号可解析；动态库在运行时还依赖加载器。include 到一个声明也不代表其定义已经链接进来。[CMake 构建模型](https://cmake.org/cmake/help/latest/manual/cmake-buildsystem.7.html)。

![编译归档链接与运行时装载的边界](../resources/R28-build-boundaries.svg)

图28-1：目标文件与静态库参与链接，动态库还参与运行时装载。图是构建路径示意，不规定对象文件格式或加载搜索顺序。

## 2 用 target 表达依赖

CMake 的 target 是可执行文件、库或其他构建对象的名字。把包含目录、标准要求、编译选项和依赖附在 target 上，避免一个全局开关无意影响所有目标。

| 范围 | 目标本身使用 | 下游使用者继承 | 典型场景 |
| --- | --- | --- | --- |
| PRIVATE | 是 | 否 | 只被实现使用的头文件与编译要求 |
| PUBLIC | 是 | 是 | 公共头文件要求的类型、包含目录与标准 |
| INTERFACE | 否 | 是 | 头文件库传给使用者的要求 |

这里描述使用要求的传播。静态库的私有链接依赖仍可能为完成最终链接而传播，不能把 PRIVATE 理解为“最终程序永远不链接该依赖”。[链接范围](https://cmake.org/cmake/help/v3.29/command/target_link_libraries.html)、[包含目录](https://cmake.org/cmake/help/v3.29/command/target_include_directories.html)。

## 3 可构建的最小库工程

以下四个文件位于配套 examples/r28-project 中。metric.h 是声明，metric.cpp 提供唯一的普通函数定义，main.cpp 是使用者；CMakeLists.txt 描述构建依赖。

metric.h：

```cpp
#ifndef HANDBOOK_R28_METRIC_H
#define HANDBOOK_R28_METRIC_H
int clamp_percent(int value) noexcept;
#endif
```

metric.cpp：

```cpp
#include "metric.h"
int clamp_percent(int value) noexcept {
    return value < 0 ? 0 : (value > 100 ? 100 : value);
}
```

main.cpp：

```cpp
#include "metric.h"
#include <iostream>
int main() {
    if (clamp_percent(-1) != 0 || clamp_percent(42) != 42 ||
        clamp_percent(101) != 100) return 1;
    std::cout << "PASS clamp_percent\n";
    return std::cout ? 0 : 2;
}
```

CMakeLists.txt：

```cmake
cmake_minimum_required(VERSION 3.16)
project(r28 LANGUAGES CXX)
add_library(metric STATIC metric.cpp)
target_include_directories(metric PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_features(metric PUBLIC cxx_std_17)
add_executable(app main.cpp)
target_link_libraries(app PRIVATE metric)
set_target_properties(metric app PROPERTIES CXX_EXTENSIONS OFF)
enable_testing()
add_test(NAME r28_smoke COMMAND app)
```

`cxx_std_17` 表示至少需要 C++17；这不等于所有编译器都实现全部标准库设施。`CXX_EXTENSIONS OFF` 避免主动选择某些编译器扩展模式，仍不能证明代码已跨平台。运行目标应输出 PASS clamp_percent；失败返回非零。[编译特性](https://cmake.org/cmake/help/latest/manual/cmake-compile-features.7.html)、[标准属性](https://cmake.org/cmake/help/v3.29/prop_tgt/CXX_STANDARD.html)。

构建命令从 r28-project 目录执行，选择已经存在且适合工具链的 generator：

```text
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build -C Release -R r28_smoke --output-on-failure
```

单配置 generator 通常在配置时使用 CMAKE_BUILD_TYPE；多配置 generator 在构建时选择 --config。不要把两套选择机制混为一谈。构建目录与源码目录分离，换编译器时使用新的构建目录，不拿旧缓存当证据。

## 4 ODR 与 ABI 是不同的边界

ODR 约束定义的一致性。普通非 inline 函数不要直接在被多个源文件包含的头文件中定义；模板和 inline 定义可以出现于多个翻译单元，但仍有一致性条件。“链接没报错”不能证明没有 ODR 违规。[单一定义规则](https://timsong-cpp.github.io/cppwp/n4659/basic.def.odr)。

ABI 是二进制相互调用约定，包括符号、布局、调用约定及运行时约定。C++ 标准没有保证任意编译器、版本、标准库或构建选项的二进制都兼容。`extern "C"` 提供语言链接形式，不自动解决结构布局、异常、分配器、位数或运行库兼容。[语言链接](https://timsong-cpp.github.io/cppwp/n4659/dcl.link)。

跨模块接口应约定谁分配谁释放、所有权何时转移、错误怎样返回。插件边界尽量不用未经约定的 STL 容器和 C++ 异常直接穿越；可使用不透明句柄、固定宽度字段、明确长度与版本的接口。它是工程设计策略，不是 C ABI 的万能安全证明。

## 5 发布前检查

| 现象 | 检查 | 不能代替检查的说法 |
| --- | --- | --- |
| 调试可运行，发布失败 | 配置差异、未初始化值、条件编译、优化暴露的 UB | “优化器有问题” |
| 本机能运行，目标机缺库 | 动态依赖、架构、搜索策略、运行库版本 | “编译已成功” |
| 某些头文件能单独用，换顺序报错 | 直接包含所需声明，避免依赖偶然传递包含 | “它包含了一个大总头” |
| 新版本 API 编译失败 | 编译器、标准库版本和特性检测 | 只改 -std=c++23 |

特性检测需区分语言宏与库的 feature-test macro；宏值按实际最低需求检查，不能仅看 __cplusplus。C++20 可通过 `<version>` 查询标准库宏，也可按目标设施的头文件查询；`__has_include` 只说明头文件可被找到，不能证明所需接口和语义完整。MSVC 的 `/Zc:__cplusplus` 控制 __cplusplus 是否报告选定语言版本，未开启时还可查看 `_MSVC_LANG`。检测结果应进入配置诊断，而不是靠悄悄回退掩盖缺少能力。[库特性检测](https://timsong-cpp.github.io/cppwp/n4861/version.syn)、[MSVC 版本宏](https://learn.microsoft.com/en-us/cpp/build/reference/zc-cplusplus?view=msvc-170)。

Debug 与 Release 是构建配置名称，不是语言定义的两种正确性。优化级别、调试符号、宏和运行库选项均由工具链与项目决定；Release 也可保留符号。用 assert 承担输入检查会受 NDEBUG 影响，安全边界应是明确的可执行接口检查。发布诊断记录配置和完整命令，不能只记录“Release”一个词。

配套工程：[CMakeLists.txt](../examples/r28-project/CMakeLists.txt)、[metric.h](../examples/r28-project/metric.h)、[metric.cpp](../examples/r28-project/metric.cpp)、[main.cpp](../examples/r28-project/main.cpp)。版本与平台术语见附录E；诊断与故障证据见R29。
