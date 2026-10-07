# 第27章 链接、装载与库

调用一个已经声明的函数，还需要找到实现、建立机器地址，并让调用双方遵守同一种二进制契约。本章按目标文件、链接产物、进程映像三个观察点定位故障。

**基线**：示例 C++17、CMake 3.16；系统规则分别限定为 Linux ELF/glibc 与 Windows PE/COFF。配套 Windows 工程限定64位目标，实测x64；32位名称装饰另需处理。**先修**：R01 的声明、定义与翻译单元，R09 的资源所有权。**首次必读**：1—4 的基本产物、6 的部署搜索和7的插件关闭顺序；5的 GOT/PLT 和8的 ABI 细节用于后查。工具与平台资料核验于2026-10-08。构建依赖的 CMake 组织另见 R30。

## 1 目标文件：机器代码、数据、符号与重定位

目标文件是编译后的组合输入，通常尚不能独立运行。它不仅有指令，还保留“提供了什么、需要什么、地址怎样补齐”的元数据。

| 内容 | 解决的问题 | 检查时应区分 |
| --- | --- | --- |
| 机器代码与只读／可写数据 | 保存指令、常量和初始化数据 | 文件中保存的字节与运行时分配的空间 |
| 符号表 | 标记定义、未定义引用及绑定属性 | 局部／全局符号，普通／动态符号表 |
| 重定位项 | 说明某处数值依赖的符号、布局及计算方式 | 修改位置、重定位类型、符号和附加值 |
| 格式与架构信息 | 告诉工具怎样解释内容 | ELF/COFF、位数、机器类型、端序 |

例如 `main.o` 中有对 `metric_open` 的引用，`metric.o` 中有它的定义；调用指令的地址相关字段可由重定位项关联到符号。符号不是源码变量的完整数据库，调试类型与行号是另一组信息。[ELF 符号表](https://gabi.xinuos.com/elf/05-symtab.html)、[ELF 重定位](https://gabi.xinuos.com/elf/06-reloc.html)。

Linux 常见目标文件使用 ELF；Windows 常见 `.obj` 使用 COFF，`.exe`、`.dll` 使用 PE 映像。换后缀不能改变格式；64位输入也不能直接链接进32位输出。LTO 工具链还可能保存中间表示，使代码生成延续到链接阶段，本表描述普通本机目标文件。[Microsoft PE/COFF 格式](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)。

**失败案例**：头文件声明存在，编译通过，但实现所在源文件没有加入 target。先确认相应目标文件存在、含预期定义且进入实际链接命令，不要先修改函数调用。

## 2 符号解析：名称修饰、未定义与重复定义

链接器把引用连接到可用定义，并组织输出布局。C++ 重载、命名空间和模板通常通过名称修饰编码为不同机器符号。反修饰用于阅读，原始名字才是比较输入身份的依据；MSVC 与 GNU 系列不能假定采用同一编码。[Microsoft 修饰名](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170)。

| 现象 | 常见原因 | 有效证据 |
| --- | --- | --- |
| undefined reference／unresolved external | 定义未链接；签名、语言链接或命名空间不一致 | 调用方未定义符号与提供方原始符号逐字比较 |
| multiple definition／already defined | 普通函数在多个单元定义；同一目标重复进入 | 定义来自哪些输入，是否错误地在头文件定义 |
| 库中可见，插件查不到 | 没有进入动态符号／导出表，或入口名不匹配 | 动态导出表，精确名称与大小写 |
| 链接成功后调用异常 | 布局、调用约定、运行库或生命周期不一致 | 第8条的 ABI 与所有权检查 |

`f(int)` 与 `f(long)` 即使在当前平台有同样宽度，仍是不同类型。`extern "C"` 为接口约定语言链接，便于确定入口名称；它不统一结构布局、位数、调用约定和分配器。[C++17 语言链接](https://timsong-cpp.github.io/cppwp/n4659/dcl.link)。

普通非 `inline` 函数的实现应放在一个源文件。`inline` 与模板允许多单元定义仍有一致性条件；弱符号、COMDAT 等合并机制也不能证明整个程序满足 ODR。不要用“允许重复定义”选项掩盖接口分歧。[C++17 ODR](https://timsong-cpp.github.io/cppwp/n4659/basic.def.odr)。

## 3 静态库：按成员抽取、库顺序与循环依赖

静态库通常是目标文件的归档。最终链接需要某个符号时，链接器选入能提供它的归档成员；一个成员选入后也会带来新的外部引用。抽取单位通常是目标文件，不是任意一个函数；后续节回收另有规则。生成归档成功不能证明它的所有外部依赖已满足。

![普通目标先提出引用，静态归档选择提供定义的成员，未被需要的成员不进入最终程序](../resources/R27-archive-extraction.svg)

图27-1：GNU ld 的归档扫描位置示意；其他链接器可能重访归档，不能把该顺序推广为所有工具的规则。

在 GNU ld 的通常行为中，库在命令行出现的位置被扫描；后来目标新增的引用不会自动触发对先前归档的再次扫描。若 main 引用 A，而 A 引用 B，常用顺序为 `main.o libA.a libB.a`。循环依赖可重列库，或在 GNU 系列使用组反复扫描；更优先检查模块依赖是否可以拆开。[GNU ld 库搜索与组扫描](https://sourceware.org/binutils/docs/ld/Options.html)。

```text
# GNU 驱动示意，未在本次 Windows 配套工程中执行
g++ main.o libA.a libB.a -o app
g++ main.o -Wl,--start-group libA.a libB.a -Wl,--end-group -o app
```

**失败案例**：归档中一个成员只靠全局对象构造函数注册插件，没有任何符号被程序引用，成员可能不被抽取。修复可以提供显式注册入口；确需整库保留才使用工具相应的 whole-archive 机制，并限定范围，避免无意引入重复定义或额外初始化。

“链接了一个静态库”也不等于“整个程序完全静态”：C++运行库、系统库及其他组件仍可能使用动态依赖。

## 4 动态库：共享对象、DLL、导入库与可见性

共享库包含运行时可装载的实现。程序可在构建时记录动态依赖，由启动路径加载；也可在运行中显式打开插件。链接成功仍需要部署正确的库及其传递依赖。

| 平台／产物 | 链接时的角色 | 运行时的角色 |
| --- | --- | --- |
| Linux ELF `.so` | 提供动态符号；可能记录 SONAME 为依赖名 | 动态链接器找到共享对象、处理绑定 |
| Windows `.dll` | 通常通过导入库完成普通链接 | 装载器读取导出、填充导入地址表 |
| Windows 导入库 `.lib`／MinGW `.dll.a` | 提供 DLL 导入所需信息 | 不能替代 DLL 中的实现 |
| 静态 `.lib`／`.a` | 归档实际目标代码 | 被选入的实现随链接产物部署 |

同名 `.lib` 可能是静态库或导入库，文件后缀不足以判断。ELF 的普通符号表包含一个名字，也不意味着动态查找能看到它；Windows 需要合适的导出声明或 `.def`。导出应限于公共协议，避免把内部实现偶然变成兼容承诺。[PE 导入与导出](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)、[GCC visibility](https://gcc.gnu.org/onlinedocs/gcc/Code-Gen-Options.html)。

配套工程同一份 `metric.cpp` 建成 `STATIC`、`SHARED`、`MODULE` 三个 target。MODULE 用于显式插件，主程序不链接它；Windows 的 SHARED 供普通链接并生成导入库。接口头根据 `METRIC_STATIC`、`METRIC_BUILD`、`METRIC_EXPLICIT` 选择无标注、导出或导入；Linux 使用隐藏默认可见性并显式开放 API。[CMake 3.16 add_library](https://cmake.org/cmake/help/v3.16/command/add_library.html)。

**失败案例**：程序链接 `.dll.a` 成功，只发布 `.exe` 和 `.dll.a`，启动仍缺 DLL。发布检查应列出真实动态依赖及其架构，不能把链接输入清单当成运行部署清单。

## 5 装载：进程映像、节／段、重定位与位置无关代码

装载器根据映像建立地址空间、权限与初始状态，动态链接器继续处理库依赖和地址绑定。入口通常先经过运行时启动代码，再到 C++ `main`；库和全局对象初始化可能在 `main` 前执行。

ELF **节**按链接与分析用途组织，如 `.text`、`.data`、`.bss`；**段**由程序头描述运行映射，一个 `PT_LOAD` 可以覆盖多个节。调试节可以留在文件而不装入内存。零初始化区域可以在内存中占空间，而不在文件中保存等量零字节。[ELF 程序装载](https://gabi.xinuos.com/elf/07-pheader.html)。

![文件里的链接组织与进程里的可装载映射](../resources/R27-image-mapping.svg)

图27-2：节与段的关系是用途关系，不是固定排列或一一对应。PE 使用自己的节表与映像目录；RVA 是相对于映像基址的虚拟地址，不是文件偏移。

重定位根据具体类型计算待修正字段。一个相对地址公式可示意为 `S + A - P`：S 为目标地址、A 为附加值、P 为修正位置；实际公式、位宽和溢出由目标 ABI 规定。静态链接可处理一部分，运行时根据加载基址或动态符号再处理一部分。PE 基址重定位与导入地址填充是不同工作，不能合称为“把所有地址加上基址”。

**后查**：PIC 是适应允许位置变化的代码生成方式；PIE 是相应的位置无关可执行形式，通常需要编译与链接选项配合。ASLR 是操作系统的地址随机化策略。位置无关不代表零重定位：保存指针和间接表项仍可能需要修正。[GCC PIC/PIE 代码生成](https://gcc.gnu.org/onlinedocs/gcc/Code-Gen-Options.html)。

ELF 常见实现以 GOT 保存地址等间接信息，以 PLT 支持某些外部函数调用绑定；延迟绑定可以把相关解析推迟到首次调用，立即绑定则更早暴露缺符号。实际路径依架构、链接选项与优化变化，不能假定每次调用必经过 PLT。[ELF 动态链接](https://gabi.xinuos.com/elf/08-dynamic.html)。

**失败案例**：共享库链接时提示某种 relocation 不适合共享对象，先核对对象是否按工具链要求生成 PIC；检查最终二进制类型，不能只看源文件或选项名字。

## 6 运行搜索：Linux 与 Windows 分别检查

编译时的 `-I`、链接时的 `-L`／库目录，与运行时搜索互不等价。排查顺序是：产物声明需要什么 → 候选文件在哪里 → 进程实际加载哪个版本。

**Linux ELF/glibc**：依赖字符串含 `/` 时按路径处理；不含时，通常依次考虑下表。特殊链接选项、硬件能力目录和安全执行模式会改变部分行为。[ld.so 搜索规则](https://man7.org/linux/man-pages/man8/ld.so.8.html)。

| 顺序 | 来源 | 关键限制 |
| --- | --- | --- |
| 1 | DT_RPATH | 只在没有 DT_RUNPATH 时采用；可影响依赖树后代搜索 |
| 2 | LD_LIBRARY_PATH | 安全执行模式忽略；不要当成永久部署方案 |
| 3 | DT_RUNPATH | 仅用于该对象的直接 DT_NEEDED 依赖，子依赖需自己的策略 |
| 4 | `/etc/ld.so.cache` | 缓存候选，受工具链与系统配置影响 |
| 5 | 系统默认库目录 | 如 `/lib`、`/usr/lib`，架构可能采用64位目录 |

`$ORIGIN` 表示含相关动态标签的程序或共享对象所在目录。设置时要防止 shell 提前展开；GNU 风格 `-Wl,-rpath,'$ORIGIN/../lib'` 的单引号有实际意义。最终生成 RPATH 还是 RUNPATH 取决于链接器配置／选项，应以 `readelf -d` 验证。

**失败案例**：app 的 RUNPATH 能找到 A，但 A 又依赖 B，B 放在同目录仍找不到。检查 A 的动态标签和 B 的依赖名，不能推断 app 的 RUNPATH 自动传播到所有子依赖。

**Windows**：非打包桌面程序、按名称加载、默认安全搜索模式时，先经过 DLL 重定向、API sets、SxS、已加载模块与 Known DLLs；Windows 11 21H2 起还考虑进程包依赖图，随后是程序目录、系统目录、16位系统目录、Windows目录、当前目录、PATH。关闭安全模式、打包程序或显式搜索标志会采用不同规则；当前目录不总是第一站。[Windows DLL 搜索顺序](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order)。

顶层 DLL 的完整路径不自动固定它的所有依赖。示例把路径转成绝对路径，以 `LoadLibraryExW` 的 `LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32` 限定依赖目录；Windows 8起支持，Windows 7需相关更新。仍应核对加载器的重定向／已加载模块等规则。路径使用UTF-16；入口名称使用精确的窄字符导出名。[LoadLibraryExW](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibraryexw)。

## 7 显式加载插件：查入口、错误、关闭与卸载

Linux 用 `<dlfcn.h>` 中的 `dlopen`、`dlsym`、`dlclose`；Windows 用 `LoadLibraryExW`、`GetProcAddress`、`FreeLibrary`。它们是平台 API，不属于 ISO C++标准库。

| 动作 | Linux 示例策略 | Windows 示例策略 |
| --- | --- | --- |
| 打开 | 指定绝对路径；RTLD_NOW 提前解析，RTLD_LOCAL 限制符号传播 | UTF-16 绝对路径；限定依赖目录 |
| 查入口 | 先清 dlerror，再 dlsym，再读取并保存 dlerror | 查精确名称；失败立即读取 GetLastError |
| 调用 | 按已约定类型转换函数指针；先检查版本与接口表 | 按包含调用约定的函数指针类型调用 |
| 关闭 | 业务句柄由库自己的 close 销毁，再 dlclose | 业务 close 完成后再 FreeLibrary |

仅看 `dlsym` 返回空值不足以判定所有查找错误；本例还拒绝无法调用的空入口。POSIX 支持该函数地址转换，不能把它推广为 ISO C++ 对任意数据／函数指针转换的保证。Windows 入口名大小写也须匹配。[dlsym](https://man7.org/linux/man-pages/man3/dlsym.3.html)、[GetProcAddress](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getprocaddress)。

![业务关闭先于装载句柄释放，释放后不再调用插件指针](../resources/R27-plugin-lifetime.svg)

图27-3：库句柄覆盖入口表、业务对象和全部在途调用的生命周期。示例同步、单线程；真实异步插件还须停止新调用、等待工作线程、撤销回调，并销毁依赖库代码的对象。库句柄的引用计数不跟踪应用自己的函数指针。

配套 `metric_api.h` 的关键接口逐字摘录如下，不是独立翻译单元；完整导出宏、调用约定、`METRIC_NOEXCEPT` 和 C 语言链接包装见源码。v1接口要求同一平台ABI、相同接口表布局；失败返回非零且不写输出。业务句柄只能由 `metric_close` 销毁，关闭后不可再用，空句柄关闭无操作。版本不支持时入口返回空指针。

<!-- source: examples/r27-libraries/metric_api.h -->
```cpp
METRIC_API metric_context* METRIC_CALL metric_open(void) METRIC_NOEXCEPT;
METRIC_API int32_t METRIC_CALL metric_clamp_percent(
    metric_context*, int32_t value, int32_t* output) METRIC_NOEXCEPT;
METRIC_API void METRIC_CALL metric_close(metric_context*) METRIC_NOEXCEPT;
METRIC_API const metric_api* METRIC_CALL metric_get_api(uint32_t version) METRIC_NOEXCEPT;
```

static_app 与 shared_app 普通链接同一接口；plugin_host 只查 `metric_get_api`，检查接口表再通过函数指针执行同一业务。输入−1、42、101分别得到0、42、100；还检查空句柄／空输出失败。Windows 命令行通过 `CommandLineToArgvW` 保留Unicode路径，并以 `LocalFree` 释放解析结果。[Unicode 参数](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-commandlinetoargvw)。

**错误与生命周期**：缺库退出3，缺入口退出4，版本／接口表不匹配退出5；后两者已获得库句柄，仍按作用域清理。库关闭失败单独报告。`dlclose` 成功或 `FreeLibrary` 释放引用，都不能作为之后仍可调用旧地址的保证；其他引用可能让映像暂时存在，程序仍应停止使用旧指针。[dlopen/dlclose](https://man7.org/linux/man-pages/man3/dlopen.3.html)、[FreeLibrary](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-freelibrary)。

可复现构建入口从配套目录执行；选用已存在的合适工具链：

```text
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build -C Release -R r27_ --output-on-failure
```

`--test-dir` 要求 CTest 3.20 或更新；若使用最低基线3.16，先进入 build 目录，再执行 `ctest -C Release -R r27_ --output-on-failure`。本机实测3.29.2，不声称最低版本已运行验证。[CTest版本条件](https://cmake.org/cmake/help/latest/manual/ctest.1.html#cmdoption-ctest-test-dir)。

Windows TDM-GCC 10.3.0／CMake 3.29.2 实测三项通过，失败路径也按预期退出；该工具链需显式共享运行库及匹配DLL放在构建目录，具体命令、初始卸载失败和修复结果见配套记录。Linux 分支已按文档核验，未在本轮编译或运行。[构建与验证记录](../examples/r27-libraries/README.md)。

## 8 ABI 边界与工具排障

ABI 包括机器调用约定、类型布局、符号和运行库等契约。能找到函数地址，只证明查找成功；不证明参数在正确寄存器、结构成员在正确偏移或对象由正确运行库释放。

| 边界 | 应约定与检查 | 典型故障 |
| --- | --- | --- |
| 调用约定 | 参数／返回值方式、栈、寄存器、函数指针类型 | 地址正确，第一次调用就出错 |
| 数据布局 | 位数、宽度、对齐、字段偏移、packing、结构版本 | 新字段覆盖旧调用者缓冲区 |
| C++运行时 | STL ABI、异常、RTTI与构建选项 | 容器解释错误，跨模块析构崩溃 |
| 所有权与CRT | 谁分配谁释放；FILE、locale等状态属于哪个运行库 | DLL分配、调用方用另一堆释放 |

Microsoft x64 常规前四个参数位置使用寄存器槽，整数与浮点采用不同寄存器，并要求调用方准备影子空间；更多参数可放栈上，聚合体和可变参数另有规则。这属于特定ABI，不能外推到所有64位平台。[Microsoft x64 调用约定](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170)。

C接口、不透明句柄、固定宽度字段、版本入口和配对销毁能缩小兼容面，不能单独保证永久ABI稳定。异常应在边界内转换为错误；`noexcept` 只限制传播，未捕获异常会终止程序。本例实现只做无异常算术和 `new(std::nothrow)`，不跨模块传STL或异常。不同CRT副本交换对象有明确风险，应按实际工具链支持范围检查。[DLL与CRT对象](https://learn.microsoft.com/en-us/cpp/c-runtime-library/potential-errors-passing-crt-objects-across-dll-boundaries?view=msvc-170)。

以下命令是工具检索入口，除配套README明确记录者外未执行；文件名须替换为故障现场的真实产物。

| 问题 | GNU／ELF工具 | Windows MSVC工具 |
| --- | --- | --- |
| 谁定义或引用该符号 | `nm -C libmetric_static.a`；`nm --undefined-only main.o` | `dumpbin /symbols file.obj` |
| 实际导出什么 | `readelf --dyn-syms libmetric.so` | `dumpbin /exports metric.dll` |
| 依赖、搜索标签与架构 | `readelf -h -d app` | `dumpbin /headers /dependents app.exe` |
| 节、段和重定位 | `readelf -S -l -r app` | `dumpbin /headers /relocations file.obj` |
| 指令附近引用哪个符号 | `objdump -dr main.o` | `dumpbin /disasm file.obj` |

`readelf` 专用于ELF；MinGW PE/COFF 可用其适配的 `objdump -p` 检查导入／导出，不能照搬 ELF 输出字段。`nm -C`便于阅读，但比较签名时同时保留未反修饰名字。[nm](https://sourceware.org/binutils/docs/binutils/nm.html)、[readelf](https://sourceware.org/binutils/docs/binutils/readelf.html)、[objdump](https://sourceware.org/binutils/docs/binutils/objdump.html)、[DUMPBIN](https://learn.microsoft.com/en-us/cpp/build/reference/dumpbin-reference?view=msvc-170)。

排障时保存实际编译／链接命令、产物身份、动态依赖和已加载路径，再比较符号与ABI。只重编译旧源码可能掩盖旧二进制不兼容；若承诺二进制兼容，必须保留旧调用者产物验证。崩溃位置可能只是发现损坏的地方，需回溯最早违反布局、所有权或关闭契约的操作。

完整工程：[CMakeLists.txt](../examples/r27-libraries/CMakeLists.txt)、[接口与导出宏](../examples/r27-libraries/metric_api.h)、[库实现](../examples/r27-libraries/metric.cpp)、[普通链接调用者](../examples/r27-libraries/linked_main.cpp)、[共同业务核对](../examples/r27-libraries/metric_check.h)、[显式插件调用者](../examples/r27-libraries/plugin_main.cpp)。工程构建见R30，调试证据见R31。
