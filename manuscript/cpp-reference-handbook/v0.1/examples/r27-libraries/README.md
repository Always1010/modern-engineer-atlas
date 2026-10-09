# 静态库、共享库与显式插件示例

本目录为 R27 的组合应用。C++17，同一业务实现生成静态库、普通共享库及显式插件；CMake 项目最低版本 3.16。基础机制、平台 API 与参数维护于 [R27 正文](../../chapters/R27-linking-loading-libraries.zh-CN.md)，此处只说明源码组织与配套工程范围。

## 源码与接口

- `metric_api.h`：C 风格入口、导出与调用约定宏、不透明句柄、v1 函数表。
- `metric.cpp`：创建/关闭业务对象，将整数夹入 0—100。
- `linked_main.cpp`：普通静态或共享链接的调用者。
- `plugin_main.cpp`：显式装载，查询 metric_get_api，再使用相同业务。
- `metric_check.h`：共同调用示例，说明正确与失败参数的结果。
- `CMakeLists.txt`：STATIC、SHARED、MODULE target 及调用者组织。

metric_context 由库分配，并由 metric_close 释放；关闭空句柄无操作，已关闭句柄不能复用。clamp_percent 的输入 -1、42、101 分别得到 0、42、100；空句柄或空输出返回 -1，失败不修改输出。版本不支持时 metric_get_api 返回空。

库装载引用必须覆盖函数表、业务对象及在途调用；先关闭业务，清除入口借用，最后释放装载引用。示例为同步单线程插件，异步回调和工作者需要额外停止与完成协议。

## 平台范围

Linux 使用 dlopen/dlsym/dlclose，RTLD_NOW 与 RTLD_LOCAL；函数地址转换依 POSIX 契约，CMAKE_DL_LIBS 传递需要的加载库。构建目录 RPATH 不等于安装部署策略。

Windows 分支使用 UTF-16 路径，LoadLibraryExW 选择 DLL 目录与 System32 的搜索标志；命令行由 CommandLineToArgvW 解析并用 LocalFree 释放。该工程限定 Windows 64 位，固定导出名未处理 Win32 名称装饰，CMake 对 32 位目标明确拒绝。平台 API 的一般机制不受此组合工程限制。

跨模块调用要求同一目标 ABI 与相同接口表布局；示例不跨边界交付 STL 或异常，也不承诺任意字段扩展自动二进制兼容。运行库部署须按使用的工具链契约匹配，不能由此示例推定所有编译器互通。

## 工程入口

在本目录使用已存在且适合目标平台的工具链配置与构建：

```text
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

构建生成 static_app、shared_app 与 plugin_host，以及对应库产物。普通调用者在链接时取得实现，plugin_host 在运行时接收插件路径；详细构建参数及 target 关系见 [R30 构建工程](../../chapters/R30-build.zh-CN.md)。平台、版本与历史验证范围由 [构建说明](../../BUILD-NOTES.md) 维护，此文件不重复保存本机命令、QA 配置或测试日志。
