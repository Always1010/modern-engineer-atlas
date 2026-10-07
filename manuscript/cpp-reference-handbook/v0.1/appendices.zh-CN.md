# 附录：工作台速查

这些表是导航入口，不替代正文的使用条件。版本列是接口进入标准的版本，不是本机已执行验证的声明。

## A 关键词与语法

| 关键词或语法 | 先查 | 需要区分 |
| --- | --- | --- |
| const、constexpr、consteval、constinit | R03 | 只读约束、常量求值、立即函数、静态初始化；后两者 C++20 |
| auto、decltype、decltype(auto) | R03 | 按值推导、表达式类型、保留引用 |
| static_cast、dynamic_cast、const_cast、reinterpret_cast | R04 | 值转换、多态检查、cv 限定、表示层边界 |
| T*、T&、T&&、nullptr | R05 | 可空借用、引用绑定、右值引用和转发引用 |
| lambda 的 []、[&]、[=]、[this] | R06 | 捕获什么、谁存活、闭包何时被执行 |
| explicit、override、virtual、=default、=delete | R07 | 隐式转换、覆写约束、多态、特殊成员 |
| std::move、std::forward | R08 | 值类别转换，不是实际搬运资源 |
| typename、template、if constexpr、requires | R10 | 依赖名、实例化、分支丢弃、约束；requires C++20 |
| throw、catch、noexcept | R11 | 传播、异常匹配、不允许异常逃出的边界 |
| placement new、alignas、launder | R02 | 存储对齐、对象构造、受限的指针取得；不延长旧对象生命周期 |
| co_await、co_return | R23 | C++20挂起与结果入口；执行和取消由所用库约定 |

## B 标准库符号与头文件

| 符号族 | 头文件 | 版本入口 | 本书 |
| --- | --- | --- | --- |
| move、forward、pair、exchange | `<utility>` | C++11；exchange C++14 | R08、R17 |
| is_trivially_copyable、is_standard_layout、offsetof | `<type_traits>`、`<cstddef>` | C++11 traits；_v C++17 | R02 |
| unique_ptr、shared_ptr、weak_ptr | `<memory>` | C++11 | R09 |
| pmr::memory_resource、pmr 容器 | `<memory_resource>` 等 | C++17 | R09 |
| is_*、enable_if、integral_constant | `<type_traits>` | C++11；部分新增另查 | R10 |
| invoke、function | `<functional>` | invoke C++17；function C++11 | R06 |
| string、string_view、span | `<string>`、`<string_view>`、`<span>` | C++98、C++17、C++20 | R12 |
| array、vector、deque、list、forward_list | 各同名头文件 | array/forward_list C++11 | R13 |
| map/set、unordered_map/set | `<map>`/`<set>`、`<unordered_map>`/`<unordered_set>` | 无序容器 C++11 | R14 |
| stack、queue、priority_queue | `<stack>`、`<queue>` | C++98 | R14 |
| begin/end、iterator_traits、back_inserter | `<iterator>` | 一般成员早已存在；自由 begin/end C++11 | R15 |
| ranges、views、ranges::sort | `<ranges>`、`<algorithm>` | C++20 | R15、R16 |
| find、sort、lower_bound、remove_if | `<algorithm>` | C++98 | R16 |
| accumulate、reduce、inclusive_scan | `<numeric>` | C++98、C++17、C++17 | R16 |
| optional、variant、any | 各同名头文件 | C++17 | R17 |
| expected | `<expected>` | C++23 | R17 |
| from_chars、to_chars、format | `<charconv>`、`<format>` | C++17、C++20 | R18 |
| numeric_limits、mt19937、bitset | `<limits>`、`<random>`、`<bitset>` | C++98、C++11、C++98 | R18 |
| bit_cast、endian、popcount | `<bit>` | C++20 | R18、R24 |
| steady_clock、duration | `<chrono>` | C++11 | R19 |
| filesystem::path、error_code | `<filesystem>`、`<system_error>` | C++17、C++11 | R19 |
| thread、async、future、promise | `<thread>`、`<future>` | C++11 | R20 |
| jthread、stop_token | `<thread>`、`<stop_token>` | C++20 | R20 |
| mutex、lock_guard、unique_lock、scoped_lock | `<mutex>` | 前三 C++11；scoped_lock C++17 | R21 |
| condition_variable、shared_mutex | `<condition_variable>`、`<shared_mutex>` | C++11、C++17 | R21 |
| counting_semaphore、latch、barrier | `<semaphore>`、`<latch>`、`<barrier>` | C++20 | R21 |
| atomic、memory_order、atomic_flag | `<atomic>` | C++11 | R22 |

不要依赖别的头文件顺便包含所用符号；这类传递包含不是稳定接口。表中的 <...> 是编译期头文件名，不是模块导入名。

## C 容器与算法入口

n 是元素数；复杂度不是运行时间或内存上限。下表只列代表性动作，完整失效规则必须查正文。

| 需求 | 首选考察对象 | 关键边界 |
| --- | --- | --- |
| 连续存储、尾部增长、随机访问 | vector（R13） | 尾插均摊 O(1)；扩容使全部元素借用失效 |
| 固定大小、嵌入对象 | array（R13） | 大小属于类型；不会动态增长 |
| 两端增长、随机访问 | deque（R13） | 通常分段；引用与迭代器失效不是同一规则 |
| 已有位置的节点插删/转移 | list、forward_list（R13） | 定位仍有成本；节点与指针追踪开销 |
| 有序键、范围遍历 | map、set（R14） | 查找 O(log n)；比较器定义等价 |
| 无序键查找 | unordered_*（R14） | 平均常数、最坏线性；rehash 失效边界 |
| 最大/最小候选反复取出 | priority_queue（R14） | 堆顶 O(1)，push/pop O(log n)；不支持任意有序遍历 |
| 一次找存在/位置 | find、find_if（R16） | 线性扫描；返回 end 必须检查 |
| 多次二分查询 | lower_bound（R16） | 满足分区前提；非随机访问迭代器仍有步进成本 |
| 删除符合条件的元素 | erase-remove、erase_if（R16） | remove 不改变容器 size；erase_if C++20 |
| 求和、变换归约 | accumulate、reduce（R16） | 初值类型决定累计类型；reduce 可重排，运算契约不同 |

## D 错误与故障索引

| 观测 | 第一步找证据 | 首查 |
| --- | --- | --- |
| 未初始化、转换后值变化 | 编译警告、实际类型、范围 | R02–R04 |
| string_view 内容偶尔乱码 | 所有者是否销毁、重分配或并发修改 | R05、R12 |
| 遍历中插删后崩溃 | 操作前后迭代器/引用失效规则 | R13–R16 |
| shared_ptr 内存不释放 | 引用环、长期持有、分配器缓存，不只看 RSS | R09、R25 |
| optional/variant 使用抛异常 | 空状态、活动类型、失败状态路径 | R17 |
| 解析部分成功仍当全部成功 | 错误码、终止位置、溢出范围 | R18 |
| 超时预算越重试越长 | 同一 steady_clock 截止时间与剩余预算 | R19、R29 |
| thread 析构时终止进程 | 是否仍 joinable；异常路径和退出策略 | R20 |
| condition_variable 偶尔卡死 | 谓词、锁、通知、关闭分支 | R21 |
| atomic 计数丢增量 | 是否独立 load+store；复合不变量 | R22 |
| 热点伴随多核扩展变差 | 共享写入、缓存争用、锁竞争证据 | R24、R32 |
| write 成功但重启后数据缺失 | 缓冲层、fsync/平台持久化承诺 | R19、R26 |
| recv 数据不足/多个消息一起到 | 字节流分帧、短读写、长度上限 | R29 |
| 请求超时后重复扣费 | 服务端结果未知、幂等键与原子提交 | R29 |
| undefined reference / unresolved external | 原始符号、目标文件、库顺序与链接命令 | R27、R30 |
| 找不到DLL／共享库 | 实际装载路径、运行依赖和搜索规则 | R27 |
| 插件第一次调用或卸载崩溃 | ABI、运行库、业务close与在途访问 | R27、R23 |
| 队列满／关闭后任务仍进入 | 接受状态、队列上限、结果终态 | R23 |
| Release 崩溃、Debug 正常 | 最小复现、UB、线程竞争、精确符号 | R31 |
| 平均延迟好但 p99 变坏 | 相同负载的尾延迟、排队、资源上限 | R32 |

## E 术语与分层

| 术语 | 核心区分 | 本书 |
| --- | --- | --- |
| 作用域 / 生命周期 / 存储期 | 名字可见 / 对象存活 / 存储保留；不能互相替代 | R02、R05 |
| 所有权 / 借用 | 负责释放 / 临时访问；地址有效不代表有释放权 | R09、R12 |
| iterator / pointer / reference | 访问机制不同；失效规则分别判断 | R13、R15 |
| 原子性 / 同步 / 无锁 | 单次操作 / 顺序关系 / 进展与实现属性 | R22 |
| 局部性 / 一致性 | 访问成本 / 多核共享观察的机制；都不是语言同步证明 | R24 |
| 虚拟地址 / RSS / 活对象大小 | 地址空间 / 驻留页统计 / 程序逻辑对象；不可直接画等号 | R25 |
| 就绪 / 完成 | 操作可能可进行 / 操作已结束；事件循环模型不同 | R26 |
| 流量控制 / 拥塞控制 | 接收端承受能力 / 网络路径承受能力 | R28 |
| 超时 / 取消 / 操作失败 | 等待预算结束 / 停止请求 / 结果语义；超时常是结果未知 | R29 |
| API / ABI | 源码接口 / 编译后二进制约定 | R27 |
| 静态归档 / 共享库 / 导入库 | 链接输入集合 / 运行映像 / DLL链接时描述 | R27 |
| 节 / 段 | 链接组织 / ELF装载映射；PE另按其格式 | R27 |
| 任务 / 线程 / 执行器 | 工作状态 / 执行载体 / 调度与关闭协议 | R23 |
| 排队 / 执行 / 完成 | 等资源 / 实际推进 / 协议终态与结果交付 | R23、R32 |
| benchmark / profiling | 受控测量 / 热点及调用证据 | R32 |

Linux 文件描述符、epoll、/proc、perf 与 Windows HANDLE、IOCP、minidump、WPR 不是同名跨平台标准接口。标准 C++ 没有 C++17/20 通用 socket 库；网络两章会明确协议、系统接口与纯解析示例的边界。

## F 编译与检查命令

在已安装的工具链中使用；本书脚本不安装工具。下列路径占位为自己项目文件，不要把尖括号写进 Shell。完整项目和平台条件见 R30、R31。

| 场景 | 命令/入口 | 条件 |
| --- | --- | --- |
| GCC/Clang 最小程序 | g++ -std=c++17 -Wall -Wextra -Wpedantic main.cpp -o app | 使用自己的编译器版本；线程例子通常加 -pthread |
| 调试符号与适量优化 | g++ -std=c++17 -g -Og main.cpp -o app | 复现依赖优化时保留对应发布优化条件 |
| MSVC 最小程序 | cl /std:c++17 /EHsc /W4 main.cpp | 在已配置开发者环境中 |
| CMake 配置 | cmake -S . -B build -DCMAKE_BUILD_TYPE=Release | 单配置生成器；多配置见下一行 |
| CMake 构建 | cmake --build build --config Release | --config 对多配置生成器选择配置 |
| 项目测试 | ctest --test-dir build -C Release --output-on-failure | --test-dir需3.20；3.16进入build再ctest；R30有smoke测试 |
| GDB | gdb ./app；run；bt；thread apply all bt | 匹配程序、符号和复现输入 |
| LLDB | lldb ./app；run；bt；thread backtrace all | 平台与目标可调试 |
| ASan + UBSan | clang++ -std=c++17 -g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined main.cpp -o app | 已支持的平台与运行库；不能和 TSan 合并 |
| TSan 单独构建 | clang++ -std=c++17 -g -O1 -fsanitize=thread main.cpp -o app | 已支持的平台；不宣称 Windows 可用 |
| Linux 热点采样 | perf record -g -- ./app；perf report | 现有工具、权限与匹配符号；可能改变被测行为 |
| GNU符号定义与引用 | nm -C libmetric_static.a；nm --undefined-only main.o | 反修饰便于阅读，比较原始名字；对应目标格式 |
| ELF依赖与装载信息 | readelf -h -d -S -l -r app | 仅ELF；-S为节，-l为装载段，-r为重定位 |
| 指令与引用／PE导入导出 | objdump -dr main.o；objdump -p metric.dll | 由所用工具适配的目标格式决定 |
| MSVC导出与依赖 | dumpbin /exports metric.dll；dumpbin /dependents app.exe | 现有MSVC开发环境，未在本轮实测 |
| 项目内安装 | cmake --install build --config Release --prefix stage | R30导出目标；不改系统目录 |
| Windows 性能记录 | WPR/WPA | 工具可用且有适当权限；记录负载及采样条件 |

命令只是入口。诊断产物可能含用户数据、凭证和内存内容；导出 core、dump、跟踪日志前检查访问权限与脱敏范围。
