# 系统调用与文件 I/O

常规 C++ 文件读写先查 [标准流与文件接口](R34-streams-files.zh-CN.md)。本章维护 OS 层实体、调用机制与平台 API：描述符/句柄、显式偏移、持久化及异步完成；平台接口适用于需要这些能力的程序。

**平台与先修**：示例使用 C++17 调用 OS API；POSIX 接口标为 Linux/POSIX，epoll 为 Linux，Win32 为 Windows。先修为错误处理与 RAII。基础阅读从文件实体到同步读写；缓冲持久化和异步机制可随后查阅。

## 系统调用与打开文件实体

**基础概念**。系统调用（system call）是程序请求内核服务的入口，例如打开文件、取得字节或建立映射。应用通常调用 C 库或 Win32 函数；库函数可能在用户态完成，也可能调用一次或多次内核服务。成功读取也可能由缓存满足，不必每次访问磁盘。

路径是查找文件的名称；打开后，后续操作使用文件描述符或句柄。路径、文件内容、一次打开保存的状态是不同实体。顺序 I/O 的正常过程是：

1. 按路径和访问方式打开文件，取得描述符或句柄。
2. 读取或写入字节，依据返回的实际数量推进。
3. 随机访问时指定或改变文件偏移。
4. 业务要求持久化时执行相应刷新，并检查结果。
5. 关闭本次打开持有的资源。

| 平台实体 | 表示与有效值 | 本次打开保存的状态 |
| --- | --- | --- |
| POSIX 文件描述符（file descriptor，fd） | 进程中的非负整数；0 也有效 | 引用打开文件描述（open file description），其中含文件偏移与状态标志 |
| Windows 文件句柄（file handle） | `HANDLE` 不透明值；`CreateFileW` 失败为 `INVALID_HANDLE_VALUE` | 指向内核文件对象，记录访问模式、文件位置等状态 |

Linux 的 `dup` 与继承的描述符可引用同一打开文件描述，共享文件位置；分别 `open` 通常建立各自的位置。fd 关闭后数值可复用，保存整数不延长资源寿命。[Linux open](https://man7.org/linux/man-pages/man2/open.2.html)

## Linux/POSIX：open 与 close

**基础操作**。头文件为 `<fcntl.h>`、`<unistd.h>`；错误码使用 `<cerrno>`。常用声明摘要如下，`mode` 只在创建文件等相应形式中提供：

```cpp
int open(const char* path, int flags, ... /* mode_t mode */);
int close(int fd);
```

`path` 是以空字符结束的路径；相对路径按进程当前目录解析。`flags` 必须包含一种访问模式，再用按位或组合创建与状态标志。

| 标志 | 操作效果 | 条件 |
| --- | --- | --- |
| `O_RDONLY` / `O_WRONLY` / `O_RDWR` | 只读 / 只写 / 读写 | 三者选一种；`O_RDONLY` 通常为 0 |
| `O_CREAT` | 不存在时创建 | 提供 `mode`，例如 `0600`；权限还受 umask 与 ACL 影响 |
| `O_EXCL` 与 `O_CREAT` | 只创建新文件 | 已存在即失败，避免覆盖已有内容 |
| `O_TRUNC` | 将现有普通文件截为零长度 | 用于有写权限的打开，原内容会改变 |
| `O_APPEND` | 每次写从当时文件尾开始 | 多次写仍不组成应用事务 |
| `O_CLOEXEC` | 执行新程序时自动关闭 | 在支持该标志的环境使用 |

使用已有路径打开只读文件，再关闭本次打开。局部摘录需 `<fcntl.h>`、`<unistd.h>`、`<cerrno>`；`path` 是以空字符结尾的路径，`report` 为调用方错误处理函数。

```cpp
int fd = open(path, O_RDONLY | O_CLOEXEC);
if (fd == -1) report(errno);
else if (close(fd) == -1) report(errno);
```

`open` 成功返回 fd，失败返回 `-1` 并设置 `errno`；`close` 成功为 0，失败为 `-1`。错误应立即保存，以免后续清理覆盖。Linux 通常在报告关闭错误之前已释放 fd，盲目重试可能关闭其他线程复用的新描述符；`EINTR` 的关闭语义须按目标平台核对，不能把 Linux 方式推广为所有 POSIX 实现。[open](https://man7.org/linux/man-pages/man2/open.2.html)、[close](https://man7.org/linux/man-pages/man2/close.2.html)

## Linux/POSIX：read、write 与文件偏移

**基础操作**。`read` 取得原始字节，`write` 交付原始字节，不做文本编码或格式化。头文件 `<unistd.h>`，声明摘要：

```cpp
ssize_t read(int fd, void* buffer, size_t count);
ssize_t write(int fd, const void* buffer, size_t count);
off_t lseek(int fd, off_t offset, int whence);
ssize_t pread(int fd, void* buffer, size_t count, off_t offset);
ssize_t pwrite(int fd, const void* buffer, size_t count, off_t offset);
```

`buffer` 至少提供 `count` 字节；读缓冲可写，写缓冲可读。`read/write` 从当前位置操作，按实际完成量推进位置。正返回值是本次字节数；`read` 对正长度请求返回 0 表示普通文件末尾；`-1` 后读取 `errno`。请求长度应限制在 `ssize_t` 可表达范围内。[read](https://man7.org/linux/man-pages/man2/read.2.html)、[write](https://man7.org/linux/man-pages/man2/write.2.html)

下面读取至多 64 字节。`fd` 是已打开的只读普通文件，`consume` 是调用方提供的处理函数，接收指针与长度；片段需要 `<unistd.h>`。

```cpp
char buffer[64];
ssize_t n = read(fd, buffer, sizeof buffer);
if (n > 0) consume(buffer, static_cast<size_t>(n));
else if (n == 0) { /* 文件末尾 */ }
else { /* 保存 errno 并报告失败或按规则重试 */ }
```

缓冲不自动补 `\0`，文本也应按实际长度处理。写入使用 `write(fd, data, length)`；返回不足 `length` 时只继续未写完后缀，完整循环见“部分完成与错误”。

`lseek` 的 `whence` 为 `SEEK_SET`（从文件头）、`SEEK_CUR`（从当前位置）、`SEEK_END`（从文件尾）；成功返回新位置，失败为 `-1`。例如 `lseek(fd, 0, SEEK_SET)` 回到开头。管道不能定位。`pread/pwrite` 按显式偏移操作，不改变当前位置，仍可能短读写，重叠区间仍需同步。Linux 在 `O_APPEND` fd 上的 `pwrite` 存在追加行为，不能依赖它忽略追加标志。[lseek](https://man7.org/linux/man-pages/man2/lseek.2.html)、[pread/pwrite](https://man7.org/linux/man-pages/man2/pread.2.html)

## Windows：CreateFileW 与 CloseHandle

**基础操作**。头文件 `<windows.h>`；`W` 接口接收 UTF-16 宽字符路径。完整参数形状如下，修饰与注解从略：

```cpp
HANDLE CreateFileW(LPCWSTR path, DWORD access, DWORD share,
    LPSECURITY_ATTRIBUTES security, DWORD disposition,
    DWORD flagsAndAttributes, HANDLE templateFile);
BOOL CloseHandle(HANDLE handle);
```

| 参数 | 常用值与意义 | 条件 |
| --- | --- | --- |
| `access` | `GENERIC_READ/GENERIC_WRITE`，或两者按位或 | 请求读取/写入/读写权限 |
| `share` | `FILE_SHARE_READ/WRITE/DELETE` 的组合 | 允许其他打开请求相应访问；0 使用独占共享模式 |
| `security` | `nullptr` | 默认安全属性，默认不继承句柄 |
| `disposition` | `OPEN_EXISTING`、`CREATE_NEW`、`CREATE_ALWAYS` | 打开现有 / 只创建新文件 / 创建并截断现有文件 |
| `flagsAndAttributes` | `FILE_ATTRIBUTE_NORMAL` | 普通同步文件；异步另加 `FILE_FLAG_OVERLAPPED` |
| `templateFile` | `nullptr` | 不使用模板文件属性 |

使用已有 UTF-16 路径打开只读文件再关闭。局部摘录需 `<windows.h>`，`path` 是宽字符路径，`report` 为调用方错误处理函数。

```cpp
HANDLE h = CreateFileW(path, GENERIC_READ, FILE_SHARE_READ,
    nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
if (h == INVALID_HANDLE_VALUE) report(GetLastError());
else if (!CloseHandle(h)) report(GetLastError());
```

`CreateFileW` 成功返回句柄，失败为 `INVALID_HANDLE_VALUE`，此时用 `GetLastError()` 取得错误。共享模式与已有打开请求不兼容时会出现共享冲突。`CloseHandle` 成功为非零，失败为零；它关闭内核句柄，Winsock socket 另用 `closesocket`。[CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)、[CloseHandle](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle)

## Windows：ReadFile、WriteFile 与文件位置

**基础操作**。先用没有 `FILE_FLAG_OVERLAPPED` 的同步文件句柄。声明摘要：

```cpp
BOOL ReadFile(HANDLE h, void* buffer, DWORD requested,
              DWORD* transferred, OVERLAPPED* operation);
BOOL WriteFile(HANDLE h, const void* buffer, DWORD requested,
               DWORD* transferred, OVERLAPPED* operation);
BOOL SetFilePointerEx(HANDLE h, LARGE_INTEGER distance,
                      LARGE_INTEGER* newPosition, DWORD method);
```

`requested` 为请求字节数，不能超过缓冲及 `DWORD` 范围；`transferred` 接收实际数量。同步形式使用 `operation == nullptr`，提供有效的 `transferred` 指针。成功为非零；失败为零，立即保存 `GetLastError()`。普通同步文件读到末尾成功且数量为 0；短读是正常结果。[ReadFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile)、[WriteFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile)

从已打开的同步只读句柄 `h` 取得至多 64 字节。`consume` 接收指针与长度，`report` 接收错误码，均由调用方提供；片段需要 `<windows.h>`。

```cpp
char buffer[64];
DWORD n = 0;
if (!ReadFile(h, buffer, sizeof buffer, &n, nullptr)) {
    DWORD error = GetLastError();
    report(error);
} else if (n != 0) {
    consume(buffer, n);
} // n == 0 表示这个普通文件已到末尾
```

`WriteFile(h, data, length, &n, nullptr)` 写入当前位置，成功后根据 `n` 推进应用偏移。`SetFilePointerEx` 的 `method` 为 `FILE_BEGIN`、`FILE_CURRENT`、`FILE_END`，`distance.QuadPart` 是有符号位移。`LARGE_INTEGER zero{};` 配合 `SetFilePointerEx(h, zero, nullptr, FILE_BEGIN)` 回到文件头；`newPosition` 可空。共享句柄上“定位后再读”是两个操作，并行调用需协调。[SetFilePointerEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilepointerex)

下面向已打开的同步可写句柄 `h` 写入三字节，再回到文件头；片段需要 `<windows.h>`，`report` 由调用方提供。`n` 小于请求量时按下一节继续写入剩余部分。

```cpp
const char text[] = "abc";
DWORD n = 0;
if (!WriteFile(h, text, 3, &n, nullptr)) report(GetLastError());
LARGE_INTEGER zero{};
if (!SetFilePointerEx(h, zero, nullptr, FILE_BEGIN)) report(GetLastError());
```

## 部分完成与错误

**机制解释**。短读/短写（partial read/write）表示一次操作只完成请求的一部分。返回数量是进度，重试起点是未完成后缀；错误不回滚之前成功的写入。

| Linux 返回或错误 | 状态 | 后续操作 |
| --- | --- | --- |
| 正字节数 | 完成该前缀 | 推进偏移，仅提交剩余部分 |
| 正长度 `read` 返回 0 | 普通文件 EOF | 结束读取；socket 语义见 [网络收发](R29-sockets-production.zh-CN.md) |
| `-1` 且 `EINTR` | 本次未完成，受到信号中断 | 按规则重试，或响应取消/期限 |
| `-1` 且 `EAGAIN/EWOULDBLOCK` | 非阻塞对象暂不可进展 | 等待就绪或交还调用方 |
| `-1` 且 `ENOSPC/EIO` 等 | 本次失败 | 保存错误和累计量，停止或执行恢复策略 |

下面是 Linux 写完全部字节的局部例。假定 `fd` 为已打开的阻塞普通文件，`data` 有 `size` 字节；`done` 输出累计量，`error` 输出错误码。片段需要 `<unistd.h>`、`<cerrno>`，置于返回 `bool` 的函数内，请求量受 `ssize_t` 范围限制。

```cpp
done = 0;
error = 0;
while (done < size) {
    ssize_t n = write(fd, data + done, size - done);
    if (n > 0) done += static_cast<size_t>(n);
    else if (n == -1 && errno == EINTR) continue;
    else { error = n == -1 ? errno : EIO; return false; }
}
return true;
```

零进展也退出，避免无限循环；此例将零进展映射为应用错误 `EIO`。非阻塞对象不能在 `EAGAIN` 时忙等。[Linux write](https://man7.org/linux/man-pages/man2/write.2.html)

Windows 同步形式按 `BOOL` 判断成功，按 `DWORD n` 推进数量；失败保存 `GetLastError()`。异步提交返回零且错误为 `ERROR_IO_PENDING` 表示仍在执行。文件 EOF、管道结束、socket 关闭的状态不同，要先明确对象类别。[Windows 同步与异步 I/O](https://learn.microsoft.com/en-us/windows/win32/fileio/synchronous-and-asynchronous-i-o)

## 描述符与句柄所有权

**机制解释**。所有者负责关闭；借用者只能在所有者保证有效期间操作。复制 `int` 或 `HANDLE` 不复制所有权。C++ RAII 封装通常禁止复制、允许移动，用析构兜底释放；需要报告关闭/刷新失败时提供显式结束操作，析构保持不抛异常。

`dup` 取得新的 fd，可独立关闭，但仍共享打开文件描述。Windows `DuplicateHandle` 也是显式取得另一句柄。回调只保存原数值无法保活对象，关闭后的旧 fd 可能已代表别的文件。

异步 I/O 还借用缓冲与操作状态；应先确认活动操作全部结束，再释放对象和句柄。跨线程关闭 fd 不能作为通用可靠取消协议；请求取消也不立即证明内核已停止访问缓冲。[Linux close](https://man7.org/linux/man-pages/man2/close.2.html)、[CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex)

## 用户缓冲、页缓存与持久化

**机制解释**。用户缓冲是库在进程内积累的数据，例如 iostream 流缓冲；页缓存是内核保存的文件页；持久化是达到相应存储保证。三个边界不能由同一个“写成功”代替。

![写入的缓冲与持久化边界](../resources/R26-io-durability.svg)

图26-1：常见 buffered I/O 写入路径，不覆盖 direct I/O 或所有文件系统。流 `flush` 将库缓冲交给下层，Linux 常见 `write` 将数据交入内核缓存，写回再提交设备。每层成功仅说明其接口保证；断电故障模型受设备、文件系统和远端存储影响。

### Linux：fsync 与 fdatasync

接口为 `int fsync(int fd);`、`int fdatasync(int fd);`，头文件 `<unistd.h>`。成功为 0，失败为 `-1` 并设置 `errno`。`fsync` 刷新文件内容及相关元数据；`fdatasync` 可省去不影响随后正确读取的元数据更新。[Linux fsync/fdatasync](https://man7.org/linux/man-pages/man2/fsync.2.html)

完整文件写入的确认顺序为：循环写完 → `fsync(fd)` 并检查 → 显式关闭并检查。新建/重命名目录项的持久化通常还要打开父目录并对目录 fd 执行 `fsync`；刷新文件不自动保证目录项。事务式替换需进一步定义临时文件、完整写入、刷新、替换与目录刷新流程。

### Windows：FlushFileBuffers

`BOOL FlushFileBuffers(HANDLE h);` 刷新指定文件的缓冲信息；成功为非零，失败为零并提供 `GetLastError()`。普通文件句柄应有相应写访问权限。循环写完后调用，再检查关闭结果；根据业务持久化边界决定频率，逐小块刷新可能产生明显成本。[FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)

映射通过内存访问修改文件页，仍有缺页、写回与寿命约束。Linux `MAP_SHARED` 可使用 `msync`；Windows `FlushViewOfFile` 与 `FlushFileBuffers` 覆盖不同层，须按文档组合。映射建立/解除接口见 [进程与虚拟内存](R25-process-virtual-memory.zh-CN.md)。[msync](https://man7.org/linux/man-pages/man2/msync.2.html)、[FlushViewOfFile](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-flushviewoffile)

## 阻塞、非阻塞与异步操作

**机制解释**。阻塞调用可以等待取得进展；非阻塞调用无法立即进展时返回相应状态。异步操作先提交，再从其他入口取得完成结果；异步提交并不保证必定立刻返回，完成顺序也不保证等于提交顺序。

| 模型 | 通知内容 | 应用下一步 |
| --- | --- | --- |
| 就绪（readiness） | 对象当前可能可读/可写 | 再调用读写接口，以实际结果为准 |
| 完成（completion） | 已提交操作的状态与字节数 | 消费结果，结束或复用该操作对象 |

Linux `O_NONBLOCK` 主要用于 socket、管道等；普通磁盘文件不会因此自动成为 epoll 可监测的异步文件操作。Windows 用 `FILE_FLAG_OVERLAPPED` 打开句柄，每个在途操作使用独立 `OVERLAPPED`，文件操作可在 `Offset/OffsetHigh` 指定位置。缓冲和结构须有效至完成。[epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)、[Windows 同步与异步 I/O](https://learn.microsoft.com/en-us/windows/win32/fileio/synchronous-and-asynchronous-i-o)

单操作完成可用 `GetOverlappedResult(h, &op, &n, TRUE)` 等待并取得实际数量；`FALSE` 形式不等待，未完成给出对应状态。`CancelIoEx(h, &op)` 请求取消，随后仍须观察最终完成，结果可能成功、取消或其他错误。[GetOverlappedResult](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getoverlappedresult)、[CancelIoEx](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex)

## Linux：epoll 就绪集合

**进阶后查**。epoll 是内核维护的关注集合与就绪事件队列，头文件 `<sys/epoll.h>`。它监测对象能否进展，不替应用提交读写。

```cpp
int epoll_create1(int flags);
int epoll_ctl(int epfd, int operation, int fd, epoll_event* event);
int epoll_wait(int epfd, epoll_event* events, int capacity, int timeout);
```

1. `epoll_create1(EPOLL_CLOEXEC)` 创建 epoll fd，失败为 `-1`。
2. `epoll_ctl` 添加 `EPOLL_CTL_ADD`、修改 `EPOLL_CTL_MOD`、删除 `EPOLL_CTL_DEL`。`event.events` 指定 `EPOLLIN/EPOLLOUT` 等关注项，`event.data` 携带应用标识；成功为 0，失败为 `-1`。
3. `epoll_wait` 取得至多 `capacity` 项；正返回值是数量，0 表示超时，`-1` 表示错误。`timeout` 单位毫秒，0 立即返回，-1 无限等待。
4. 检查事件与连接寿命，再执行读写；结束时关闭 epoll fd 和目标资源。

默认水平触发（level-triggered，LT）在仍就绪时可继续报告。`EPOLLET` 开启边沿触发（edge-triggered，ET），常配非阻塞 fd：处理到 `EAGAIN`，或主动保存未排空工作供下一轮继续，不能只读一块便等待必然的新通知。`EPOLLOUT` 通常只在有待发数据时关注，避免持续唤醒。普通磁盘文件不是 epoll 通用完成来源。[epoll 模式](https://man7.org/linux/man-pages/man7/epoll.7.html)、[epoll_wait](https://man7.org/linux/man-pages/man2/epoll_wait.2.html)

## Windows：I/O 完成端口

**进阶后查**。I/O 完成端口（I/O completion port，IOCP）是异步操作完成包的队列及工作线程调度机制。应用关联支持重叠 I/O 的文件或 socket，再取得完成结果。声明摘要：

```cpp
HANDLE CreateIoCompletionPort(HANDLE file, HANDLE existingPort,
                             ULONG_PTR key, DWORD concurrency);
BOOL GetQueuedCompletionStatus(HANDLE port, DWORD* bytes,
    ULONG_PTR* key, OVERLAPPED** operation, DWORD timeout);
```

1. `CreateIoCompletionPort(INVALID_HANDLE_VALUE, nullptr, 0, 0)` 创建端口，失败为 `nullptr`；`concurrency == 0` 使用系统默认并发值。
2. `CreateIoCompletionPort(file, port, key, 0)` 关联重叠 I/O 文件句柄，`key` 用于识别来源。通过 `ReadFile/WriteFile` 与各自 `OVERLAPPED` 提交操作。
3. `GetQueuedCompletionStatus` 等待完成包，`timeout` 单位毫秒，`INFINITE` 无限等待，输出字节数、关联键和原操作指针。
4. 非零表示成功取得成功操作的包。零且操作指针非空表示取得失败操作的包，保存 `GetLastError()` 并处理该操作；零且指针为空表示未取得操作包，例如超时，此时不能使用字节数与键作为结果。
5. 处理全部在途完成后释放缓冲和操作对象，最后关闭文件与端口句柄。

包可表示成功、取消或失败，也可通过 `PostQueuedCompletionStatus` 投递应用控制包。队列顺序与线程获得执行的顺序不同，不能依赖操作按提交顺序交付。默认关联策略下立即成功的重叠 I/O 也会通知；若启用跳过完成通知等选项，须同步调整操作寿命协议。[CreateIoCompletionPort](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-createiocompletionport)、[GetQueuedCompletionStatus](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus)、[IOCP 调度](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports)

## I/O 调查入口

| 现象 | 先检查的接口状态 | 调查方向 |
| --- | --- | --- |
| 文件尾部缺失 | 每次写量、累计量、刷新与关闭结果 | 短写后是否正确继续，持久化是否满足 |
| 退出后内容缺失 | 用户流状态、显式 flush 结果 | 异常退出是否跳过缓冲交付 |
| epoll 返回后读仍 EAGAIN | read 结果、竞争读取 | 通知到操作之间状态可改变 |
| ET 后续数据不再处理 | 是否排空或保留待处理工作 | 排空规则与事件注册是否一致 |
| IOCP 缓冲损坏 | 完成前是否复用或销毁 | 操作寿命与取消完成是否闭合 |
| 写入延迟上升 | 写入、刷新各自耗时 | 区分缓存、写回、设备与文件系统成本 |
