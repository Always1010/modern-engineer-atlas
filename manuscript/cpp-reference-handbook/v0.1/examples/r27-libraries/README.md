# 静态库、共享库与显式插件的同一业务接口

C++17，CMake最低3.16。面向Windows 64位与Linux；本轮实测Windows x64、TDM-GCC10.3.0、CMake3.29.2、GNU Make3.82.90。Linux、MSVC、其他架构和最低CMake版本未实测。CMake拒绝Windows32位目标：固定入口名没有处理Win32名称修饰，不把x64成功推广到Win32。[Microsoft名称修饰](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)。

## 接口与生命周期

同一metric.cpp构建STATIC、SHARED、MODULE。static_app/shared_app普通链接，plugin_host显式加载MODULE并查metric_get_api。共同C风格接口带调用约定、导出宏、不透明句柄和v1版本表；要求同一目标ABI及相同表布局，不承诺任意结构扩展自动兼容。

metric_context由库分配并由库的metric_close销毁。clamp_percent输入-1、42、101得到0、42、100；空句柄或空输出返回-1且不修改输出。关闭空句柄无操作，已关闭句柄不能再用。先关闭业务，再清除入口借用，最后释放装载句柄。只验证同步单线程插件，异步工作/回调另需关闭协议。

Windows用CommandLineToArgvW取得Unicode参数，以LocalFree释放；路径转为绝对路径，LoadLibraryExW限定DLL目录与System32搜索标志（还受加载器其他规则影响）。Linux使用带斜杠路径和RTLD_NOW | RTLD_LOCAL，函数地址转换依POSIX契约；CMAKE_DL_LIBS传递所需链接库。构建RPATH不等于安装策略。

一般入口（已有且适合的工具链）：

```text
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build -C Release -R '^r27_' --output-on-failure
```

`--test-dir` 需要CTest3.20或更新；使用3.16时进入build目录后运行 `ctest -C Release -R '^r27_' --output-on-failure`。最低版本未实测，本机实际命令使用3.29.2。[官方版本说明](https://cmake.org/cmake/help/latest/manual/ctest.1.html#cmdoption-ctest-test-dir)。

## 2026-10-08 实际验证与运行库条件

最终编号的源码、构建目录和验证制品均在codex/cpp-reference-handbook对应WorkTree。下列命令从仓库根目录执行，既有本机路径只是此次核验环境。

本机用户名含美元字符；CMake MinGW生成的响应文件曾把include路径中的美元字符加倍，导致安装消费例子找不到头。仅在本WorkTree的QA中提供项目语言初始化后的配置片段，关闭include/library响应文件生成；没有修改CMake安装、PATH或系统配置：

```cmake
# qa/disable-response-files.cmake，临时验证配置，不是工程接口要求。
set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_INCLUDES OFF)
set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_LIBRARIES OFF)
```

实际配置与构建（qa配置片段已存在）：

```powershell
cmake -S manuscript/cpp-reference-handbook/v0.1/examples/r27-libraries -B manuscript/cpp-reference-handbook/v0.1/qa/r27-libraries-build -G 'MinGW Makefiles' -DCMAKE_CXX_COMPILER=D:/tdmgcc/bin/g++.exe -DCMAKE_MAKE_PROGRAM=D:/tdmgcc/bin/mingw32-make.exe -DCMAKE_BUILD_TYPE=Release '-DCMAKE_CXX_FLAGS=-shared-libgcc -shared-libstdc++' '-DCMAKE_PROJECT_INCLUDE=C:/Users/always$$$/.codex/worktrees/cpp-reference-handbook/modern-engineer-atlas/manuscript/cpp-reference-handbook/v0.1/qa/disable-response-files.cmake'
cmake --build manuscript/cpp-reference-handbook/v0.1/qa/r27-libraries-build --parallel 2
Copy-Item -LiteralPath 'D:/tdmgcc/bin/libgcc_s_seh_64-1.dll','D:/tdmgcc/bin/libstdc++_64-6.dll','D:/tdmgcc/bin/libwinpthread_64-1.dll' -Destination 'manuscript/cpp-reference-handbook/v0.1/qa/r27-libraries-build'
ctest --test-dir manuscript/cpp-reference-handbook/v0.1/qa/r27-libraries-build -R '^r27_' --output-on-failure -V
```

配置/构建退出0，CTest3/3通过。三个调用者分别核对夹值及空参数拒绝，插件打印CLOSED metric context、RELEASED library handle，再报告PASS。所有DLL从已有工具链复制到项目内QA，没有安装软件。

早期验证采用TDM默认运行库配置时，静态和普通DLL调用通过，插件在释放DLL时出现SIGSEGV；缺入口/版本拒绝的清理也失败。改显式共享libgcc/libstdc++并部署匹配DLL后通过。TDM官方说明默认静态运行库及共享配置，这是一项本机观察，未确定某个runtime函数的根因，也不推出所有静态运行库都不能卸载。[TDM64说明](https://github.com/jmeubank/tdm-distrib/blob/master/tdm64/core/README-gcc-tdm64.md)。早期临时构建已移至本WorkTree的qa/r27-libraries-legacy，只保留取证，不把旧缓存用于重建。

## 失败与Unicode路径

在最终构建目录调用plugin_host并核对退出码：

| 路径 | 诊断与清理 | 实际退出码 |
| --- | --- | --- |
| 不存在的DLL路径 | LOAD error 126，无装载句柄 | 3 |
| 正确DLL加--missing-entry | ENTRY error 127，释放装载句柄 | 4 |
| 正确DLL加--bad-version | ABI version or table rejected，释放句柄 | 5 |
| 不提供路径 | usage | 2 |
| DLL复制到“插件 包”子目录 | 业务关闭、句柄释放、PASS | 0 |

四处Windows失败都先保存GetLastError，再输出诊断。标准输出/标准错误合并时可能交错，不能由日志显示顺序推断业务顺序。以上失败路径及Unicode路径已在最终编号工程重测。释放句柄成功不保证系统立刻解除映射，也不允许之后继续调用旧入口。

## 源码、二进制与范围

正文唯一cpp块为metric_api.h四个声明的连续逐字摘录，带source标记并由check-example-sources.mjs核对；它不是独立翻译单元。完整工程通过源码链接提供。三份图以无头浏览器检查文字边界、重叠和可读性。

nm/objdump对早期产物的只读检查显示四个导出入口metric_open、metric_clamp_percent、metric_close、metric_get_api，格式pei-x86-64。插件直接导入KERNEL32.dll、msvcrt.dll及libstdc++_64-6.dll；不能从直接导入表推断整个依赖闭包。

没有执行不兼容ABI调用、重复关闭业务句柄或卸载后调用旧函数指针。Linux搜索标签、MSVC、安装包迁移和任意异步插件仍未实测；RELEASED只报告装载引用释放。
