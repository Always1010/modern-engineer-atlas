# 文件系统

文件系统库以路径表示名称，查询目录项，并执行目录创建、复制、删除和更名。它操作路径对应的文件系统状态，不负责内容解析；内容读写见 [R34](R34-streams-files.zh-CN.md)。

**基线**：C++17 `<filesystem>`。先查 `path`、状态和遍历，再查修改、符号链接与并发名称变化。

## std::filesystem::path

**基础操作**。路径在 `<filesystem>` 中保存平台路径规则下的名称。它不要求内部使用 UTF-8；Windows 与 POSIX 的根名称、分隔符和原生字符类型可以不同。公开声明摘要省略成员：

**声明摘要**。

```cpp
namespace std::filesystem { class path; }
```

### path 的构造与组件

**独立片段**。

```cpp
// 需要 <filesystem>；局部摘录
namespace fs = std::filesystem;
fs::path base("logs");
fs::path file = base / "run.txt";
auto name = file.filename();                // 路径组件 run.txt
auto parent = file.parent_path();           // 路径组件 logs
auto ext = file.extension();                // 路径组件 .txt
file.replace_extension(".log");            // logs/run.log，原生分隔符依平台
```

构造接受支持的字符源；`/`、`/=` 按路径规则拼接，`+=` 是字面连接。右侧绝对路径或带平台根语义时可能替换左侧基底，不能当沙箱检查。`stem/root_name/root_directory/relative_path` 查询其他组件；`empty/is_absolute/is_relative` 检查形式。

### path 的规范化与输出

**独立片段**。

```cpp
// 需要 <filesystem>；局部摘录
namespace fs = std::filesystem;
fs::path input("logs/../data/config.txt");
fs::path clean = input.lexically_normal();  // 仅词法处理，不查询文件系统
std::string portable = clean.generic_string(); // 使用通用分隔形式
```

`native/c_str` 访问原生表示，`string/generic_string` 进行对应字符表示转换；转换可能失败。C++17 `u8string()` 返回 `std::string`，C++20 返回 `std::u8string`，必须区分版本。

`canonical(p)` 查询真实路径并解析符号链接，目标必须存在；`weakly_canonical` 可以保留未存在的后缀。`absolute` 依当前目录补全相对路径，`relative/proximate` 与指定基底计算关系。词法规范化不确认权限、不验证链接目标，也不保证后续打开访问同一对象。[N4659 path](https://timsong-cpp.github.io/cppwp/n4659/fs.class.path)。

## 文件状态与错误报告

**基础操作**。`file_status` 表示文件类型和权限；`status(p[,ec])` 通常跟随符号链接，`symlink_status(p[,ec])` 查询链接本身。`exists/is_regular_file/is_directory/is_symlink` 按状态或路径查询。

**独立片段**。

```cpp
// 需要 <filesystem>、<system_error>；局部摘录
namespace fs = std::filesystem;
std::error_code ec;
auto state = fs::status("settings.txt", ec);
if (ec) {
    // 保留 ec 和执行的操作，区分查询失败
} else if (fs::is_regular_file(state)) {
    auto bytes = fs::file_size("settings.txt", ec);
    if (!ec) { /* bytes 是 uintmax_t 大小 */ }
}
```

`file_size` 失败的错误码重载返回哨兵数值，先检查 `ec`；不要把返回值误当真实大小。不带 `ec` 的相关操作通常抛 `filesystem_error`，提供错误码、路径和诊断；带 `ec` 的重载报告文件系统错误并在成功时清除错误码，但不能泛称全部 `noexcept`，分配失败等仍按实际签名处理。[N4659 filesystem errors](https://timsong-cpp.github.io/cppwp/n4659/fs.err.report)。

`exists` 为假可能表示不存在，也可能与状态查询失败相关，须检查诊断；`exists` 之后再打开有时间窗口，其他进程可替换名称。可靠权限或同一对象身份需要平台打开句柄与对应选项，见 [R26](R26-syscalls-file-io.zh-CN.md)。

## std::filesystem::directory_entry

**基础操作**。目录项在 `<filesystem>` 中关联一个路径，可缓存部分属性。声明摘要为 `class directory_entry;`，位于 `std::filesystem`，省略成员。

**独立片段**。

```cpp
// 需要 <filesystem>、<system_error>；局部摘录
namespace fs = std::filesystem;
std::error_code ec;
fs::directory_entry entry("settings.txt", ec);
if (!ec) {
    auto file = entry.path();               // const path&，此处复制为局部值
    bool regular = entry.is_regular_file(ec);
}
```

`assign(path[,ec])` 更换路径，`refresh([ec])` 刷新缓存；状态、大小、修改时间查询依成员支持。缓存不是文件身份或并发一致性保证，路径对应对象可能在查询之间变化。

## std::filesystem::directory_iterator

**基础操作**。目录迭代器在 `<filesystem>` 中提供单次输入遍历，顺序未规定；默认构造为结束位置。声明摘要为 `class directory_iterator;`，位于 `std::filesystem`。

**独立片段**。

```cpp
// 需要 <filesystem>、<system_error>；局部摘录
namespace fs = std::filesystem;
std::error_code ec;
fs::directory_iterator it("logs", ec), end;
while (!ec && it != end) {
    fs::path current = it->path();          // 复制路径供本次处理
    it.increment(ec);                      // 递增同样可能失败
}
if (ec) { /* 报告遍历失败 */ }
```

解引用取得目录项，`++it` 形式用异常报告失败，`increment(ec)` 用错误码；构造成功不保证递增成功。`directory_options::skip_permission_denied` 可改变权限失败处理，使用时说明会跳过哪些内容。不要依赖遍历期间新增或删除的目录项一定出现或一定隐藏。[N4659 directory_iterator](https://timsong-cpp.github.io/cppwp/n4659/fs.class.directory_iterator)。

## std::filesystem::recursive_directory_iterator

**基础操作**。递归迭代器遍历子目录，声明摘要为 `class recursive_directory_iterator;`，位于 `std::filesystem`。默认构造为结束位置；路径构造开始遍历，默认不跟随目录符号链接。

**独立片段**。

```cpp
// 需要 <filesystem>、<system_error>；局部摘录
namespace fs = std::filesystem;
std::error_code ec;
fs::recursive_directory_iterator it("data", ec), end;
while (!ec && it != end) {
    if (it.depth() >= 2) it.disable_recursion_pending();
    fs::path current = it->path();
    it.increment(ec);
}
```

`depth()` 返回当前深度，`disable_recursion_pending()` 禁止下一步递归到当前目录；`pop([ec])` 返回上一层。显式启用 `follow_directory_symlink` 可能遇到环，遍历不保证自然终止，需要明确限制。[N4659 recursive iterator](https://timsong-cpp.github.io/cppwp/n4659/fs.class.rec.dir.itr)。

## 目录创建、复制、删除与更名

**基础操作**。以下自由函数在 `std::filesystem` 中；签名列常用形式并省略异常与错误码重载：

| 常用形式 | 返回与结果 | 条件 |
| --- | --- | --- |
| `bool create_directory(path)` | 是否新建一个目录 | 父目录必须适用 |
| `bool create_directories(path)` | 是否新建至少一个目录 | 创建缺失的中间目录 |
| `bool copy_file(from,to,options)` | 是否复制文件 | 覆盖/跳过按 `copy_options` 指定 |
| `bool remove(path)` | 是否删除一个目录项 | 目录需为空；链接删除链接本身 |
| `uintmax_t remove_all(path)` | 删除项数量 | 递归破坏性操作，确认目标范围 |
| `void rename(from,to)` | 更名/符合条件的替换 | 权限、类别、占用与文件系统边界可失败 |

**独立片段**。

```cpp
// 需要 <filesystem>、<system_error>；局部摘录；路径由应用提供
namespace fs = std::filesystem;
std::error_code ec;
fs::create_directories("output", ec);
if (!ec) {
    fs::copy_file("source.txt", "output/copy.txt",
                  fs::copy_options::overwrite_existing, ec);
}
```

`create_directories` 返回假也可能因为目录已经存在，先看错误码。`copy` 支持目录与链接策略，选项须符合标准允许组合，不能混合互斥组。`rename` 不同文件系统等情形可能失败；符号链接更名作用于链接本身，不自动提供介质持久化。[N4659 filesystem operations](https://timsong-cpp.github.io/cppwp/n4659/fs.op.funcs)。

**进阶后查**。`permissions` 修改权限，`last_write_time` 使用 `file_time_type`，其时钟不能在 C++17 中默认等同 `system_clock`；`space` 查询容量，`equivalent` 查询是否同一文件，`create_symlink/read_symlink` 操作链接。本章只为这些较低频接口建立索引，未展开全部平台差异。

## 文件更新与组合应用

**进阶后查**。写临时文件后更名的提交策略及流错误处理见 [R34](R34-streams-files.zh-CN.md)。目录查询与后续文件访问不是一项原子事务；词法清理和 canonical 均不能单独防止后续名称替换。

[原配套程序](../examples/r19-time-files.cpp) 包含路径拼接和状态查询，供组合应用参考。进一步接口分类见 [cppreference filesystem](https://en.cppreference.com/w/cpp/filesystem.html)。
