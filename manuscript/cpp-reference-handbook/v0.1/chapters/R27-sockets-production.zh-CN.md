# 第27章 socket 编程与线上故障

socket 把传输端点暴露为平台资源；TCP 流只有字节顺序，应用还要负责消息定界、收发进度、资源上限和操作最终状态。稳定服务依赖完整状态机，而不只是一对 send/recv。

**平台与版本**：Linux socket API 与 Windows Winsock 分开说明；分帧例子是 C++17 可移植解析演示，**不是完整 socket 或 TLS 程序**。**先修**：RAII、字节序、非阻塞 I/O、TCP、截止时间。首次读第1至3节；故障与重试查第4、5节。

## 1 客户端与服务端的资源流程

Linux 客户端经地址解析、socket、connect、收发、shutdown／close；服务端经 socket、bind、listen，在循环 accept 中取得每条连接的新 fd。监听 fd 继续用于接受连接，不能拿它当已连接的数据 fd。Linux accept 返回的新 fd 不自动继承监听 fd 的 O_NONBLOCK；可用 accept4 的标志或显式设置。[connect](https://man7.org/linux/man-pages/man2/connect.2.html)、[accept](https://man7.org/linux/man-pages/man2/accept.2.html)。

非阻塞 TCP connect 返回 EINPROGRESS 后，等待可写等完成迹象，再读取 SO_ERROR 确认结果；可写不等于成功。连接失败后的 socket 状态不宜作为可移植重试基础，关闭后重新建立。连接、解析、TLS握手与业务响应各要有期限，不能把 OS 可能很长的连接等待当业务期限。

Windows 先 WSAStartup，结束使用后 WSACleanup；socket 返回 SOCKET，失败为 INVALID_SOCKET，收发错误返回 SOCKET_ERROR 后用 WSAGetLastError。资源由 closesocket 释放，不能用 close/CloseHandle；非阻塞、事件或 IOCP 的流程按 Winsock 文档实现。[Winsock 初始化](https://learn.microsoft.com/en-us/windows/win32/winsock/initialization-2)、[Windows send](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-send)。

shutdown 可以关闭一个方向，close 释放本地资源；不能把它们当业务确认。停止服务时要停止接入、处理已在途请求、取消或等待 I/O 完成，再销毁连接状态和缓冲。

## 2 send/recv：把进度保存到连接状态

TCP send 成功只表示本地接受了相应字节，不证明远端应用执行。返回正数后只推进该前缀；非阻塞待发余量留到下次可写继续。对同一连接并行写多个业务消息，还要协调字节次序，否则各部分可能交织。

正长度 recv 返回正数表示字节数，0表示 TCP 对端有序结束发送；负值按平台错误处理。EAGAIN/EWOULDBLOCK 是暂不能进展，EINTR 需结合取消和截止时间处理。Linux send 到失效的流可能产生 EPIPE 和 SIGPIPE，可按 API 使用 MSG_NOSIGNAL 等机制；不是捕获 C++ 异常就能处理。[Linux send](https://man7.org/linux/man-pages/man2/send.2.html)、[Linux recv](https://man7.org/linux/man-pages/man2/recv.2.html)。

TLS 库在 socket 之上另有握手、记录、内部缓冲和错误状态，可能需要继续读或写；不能把明文 recv 状态机直接套上。Windows recv 同样有 TCP EOF 与 UDP零长度报文的区别，SOCKET_ERROR 不是“读取了负数字节”。[Windows recv](https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-recv)。

## 3 流式分帧与背压：长度必须先验证

常用分帧是固定长度、分隔符加转义或长度前缀。长度前缀需规定字节序、字段宽度、最大消息、零长度含义；收到头后先校验长度，再申请或积累内容。TCP“拆包／粘包”是应用对读取分段的描述，不是协议异常。

![读取片段如何恢复两个消息](../resources/R27-stream-framing.svg)

图27-1：一次读取既可只含半个头，也可含前一消息尾和下一消息；解析状态跨调用保存。完整性按业务格式判断，EOF 时未完成帧不能当成功。

下面以两字节大端长度、最大8字节、允许空帧演示。它检查头拆分、两帧同批输入、空帧、超长与截断，错误对象应丢弃。完成消息按本次 feed 返回，演示调用者把结果汇总；真实服务还要限制汇总队列与每次处理预算。

```cpp
#include <exception>
#include <climits>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Decoder {
    unsigned header_bytes_ = 0;
    unsigned length_ = 0;
    std::string payload_;
    static constexpr unsigned max_length_ = 8;
public:
    std::vector<std::string> feed(const std::vector<unsigned char>& bytes) {
        std::vector<std::string> completed;
        for (unsigned char byte : bytes) {
            if (header_bytes_ < 2) {
                length_ = (length_ << 8) | byte;
                ++header_bytes_;
                if (header_bytes_ == 2) {
                    if (length_ > max_length_)
                        throw std::runtime_error("frame too large");
                    if (length_ == 0) {
                        completed.emplace_back();
                        header_bytes_ = 0;
                        length_ = 0;
                    }
                }
            } else {
                payload_.push_back(static_cast<char>(byte));
                if (payload_.size() == length_) {
                    completed.push_back(payload_);
                    payload_.clear();
                    header_bytes_ = 0;
                    length_ = 0;
                }
            }
        }
        return completed;
    }
    void finish() const {
        if (header_bytes_ != 0 || !payload_.empty())
            throw std::runtime_error("truncated frame");
    }
};

int main() {
    static_assert(CHAR_BIT == 8, "this wire format needs 8-bit bytes");
    try {
        Decoder decoder;
        std::vector<std::string> messages;
        const std::vector<std::vector<unsigned char>> chunks{
            {0}, {2, 'A'}, {'B', 0, 3, 'x', 'y', 'z'}, {0, 0}
        };
        for (const auto& chunk : chunks) {
            for (const auto& message : decoder.feed(chunk))
                messages.push_back(message);
        }
        decoder.finish();
        if (messages != std::vector<std::string>{"AB", "xyz", ""}) return 1;
        bool oversized = false, truncated = false;
        try {
            Decoder bad;
            (void)bad.feed({0, 9});
        } catch (const std::runtime_error&) { oversized = true; }
        try {
            Decoder bad;
            (void)bad.feed({0, 3, 'z'});
            bad.finish();
        } catch (const std::runtime_error&) { truncated = true; }
        if (!oversized || !truncated) return 2;
        std::cout << "frames=3 oversize=checked EOF=checked\n";
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';
        return 3;
    }
}
```

源文件：[r27-length-framing.cpp](../examples/r27-length-framing.cpp)。构建：`g++ -std=c++17 -Wall -Wextra -pedantic r27-length-framing.cpp -o r27-length-framing`。预期：`frames=3 oversize=checked EOF=checked`。此格式是本例自定义，不是 HTTP/TLS，未发起网络连接。

收发缓冲、待办队列、连接数和单消息大小都要有上限。输出积压时暂停进一步生产或读取，在低水位恢复；同时设置滞留期限，避免慢连接长期占用资源。TCP窗口能提供传输背压，却不会约束应用已经复制进无界队列的消息。见 R21、R25。

生产解析器还要区分语法错误、消息过大、内存不足与业务拒绝。过大消息在分配前拒绝，半帧到达可合法等待到截止时间；解析失败后若无法确定下一帧起点，通常需要断开，不能猜测跳过字节。事件循环可给每连接单次处理字节或帧数预算，避免一个持续有数据的连接占满执行时间。

发送队列保留消息所有权与当前偏移。大消息只发送前缀时，下次继续同一消息后缀，完成后才处理下一消息。重建连接是另一条字节流，不能沿用旧偏移重发残片；需按完整请求与最终状态重作业务判断。

## 4 超时与重试：失败可能是不知道结果

使用 steady_clock 的总截止时间，把 DNS、池等待、连接、握手、发送和响应纳入预算；每次重试重新给完整期限会放大延迟。空闲超时、总超时和单阶段超时含义不同。超时后应使连接状态和待办操作收敛，不能只放弃 future 而让后台任务继续堆积。

请求已发、响应丢失时，服务端可能已经成功。重试同一“创建订单”可能重复执行；幂等表示重复执行的预期效果与一次相同，不表示每次响应相同。HTTP 定义 PUT、DELETE 等幂等语义；POST 需接口明确去重或其他保证，不能仅凭方法名称判任意服务实现安全。[HTTP 幂等与自动重试 RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)。

| 失败所处位置 | 可能已执行吗 | 重试前检查 |
| --- | --- | --- |
| 解析／连接尚未发送请求 | 通常未发该请求 | 候选地址与期限；防止重复建连洪峰 |
| 发送部分请求后断开 | 取决于协议与服务端 | 是否识别完整请求；不能只重发尾部到新连接 |
| 请求完整发出，等响应超时 | 可能已成功 | 幂等键、查询最终状态、去重保存期限 |
| 收到明确业务拒绝 | 依据接口状态 | 是否可重试，避免无效放大 |
| 返回损坏／截断响应 | 可能已执行 | 丢弃连接，分别处理结果未知与解析失败 |

限制尝试次数和总预算；指数退避加抖动用于减少集中重试，具体参数由业务负载决定。取消重试不是撤销已提交事务。去重键的范围、并发一致性和记录保存时间也是服务端契约。

## 5 线上故障的最小证据

记录阶段时间、目标地址、连接／请求 ID、已发送／收到字节、错误码与剩余预算，避免日志只剩“socket failed”。连接池取出失效连接、服务过载和DNS候选失败会表现相似，需要分段证据。

| 现象 | 优先检查 |
| --- | --- |
| 消息偶尔解析失败 | 头／体状态是否跨 recv 保存；长度与 EOF |
| 发送 CPU 很高 | 是否反复 EAGAIN；空队列仍关注可写 |
| 超时后资源持续增加 | 在途操作、缓冲所有权、取消与完成清理 |
| 服务恢复后立刻又崩 | 重试数量、退避、总并发与排队上限 |
| 重复业务结果 | 幂等键、请求最终状态、去重事务 |

本轮只实测可移植解析器，不宣称 Linux／Winsock／TLS 端点已运行验证。协议保证见 R26，I/O与平台完成模型见 R25，执行资源退出见 R20。
