# C++ 与计算机基础图解参考手册

v0.1 完整首稿已经完成，按已审阅的第13章组织全书：先给查阅入口，再给规则、接口条件、机制图和工作中的失败边界。它是精简参考手册，不是 cppreference 的全量翻译，也不要求首次顺读全部内容。

## 阅读入口

- [完整阅读版 PDF](output/pdf/Cpp-Reference-Handbook-v0.1.pdf)：A4共110页，带页码、书签和可检索文字。
- [完整阅读版 HTML](output/pdf/Cpp-Reference-Handbook-v0.1.html)：侧边目录、章节/索引跳转，全部SVG图内嵌。
- [实际正文目录](TOC.md)：7篇、30章、159个二级查阅条目。
- [使用指南与快速阅读路径](reading-guide.zh-CN.md)：第一次阅读和工作中按问题检索。
- [附录 A–F](appendices.zh-CN.md)：语法、符号与头文件、容器算法、故障、术语及工具命令。
- [核验范围与重建说明](BUILD-NOTES.md)：实际运行环境、未实测边界、独立生成与检查入口。

阅读制品由源码生成，output与qa不入Git。全新检出时需要按核验说明在已存在的依赖环境中重建，不会自动安装工具。

## 内容规模

| 内容 | 已完成 |
| --- | --- |
| 语言与对象 | R01–R11；类型、初始化、表达式、借用、函数、类、移动、RAII、模板、异常 |
| 标准库与数据结构 | R12–R19；文本/视图、顺序/关联容器、堆、迭代器、算法、结果类型、解析、时间/文件 |
| 并发与内存模型 | R20–R22；执行资源、锁/条件变量、原子与发布/回收边界 |
| 组成与系统 | R23–R25；缓存、端序、虚拟内存、RSS、句柄/I/O、持久化、epoll/IOCP |
| 网络 | R26–R27；DNS/TCP/UDP/TLS/HTTP、分帧、背压、期限、重试与幂等 |
| 工程排障 | R28–R30；CMake、链接/ABI、调试器/检查器、性能与资源证据 |
| 图与规则表 | 34幅原创SVG机制图、72张正文/附录表；标准保证与常见实现分别标明 |
| 配套例子 | 26个单文件程序，另有1个4文件CMake工程；明确结果与非零失败检查 |

完整程序以C++17为基线；C++20/23新设施单独标注。26个单文件程序及CMake工程均在本机对应环境编译运行通过；R13另已按C++20验证erase_if。正文/源码逐字核对，全部图与PDF页面已经过渲染检查。

这不表示MSVC/Clang、所有平台、sanitizer或全部新标准接口都已经运行验证。系统API、真实网络栈、持久化和无锁回收的验证范围详见BUILD-NOTES；不能把短例子直接当生产组件。

## 编辑与隔离

唯一版本路径：manuscript/cpp-reference-handbook/v0.1。独立worktree与分支 codex/cpp-reference-handbook；不修改原checkout、complete-edition或cpp-quickstart版本。

正文在chapters，图源在resources，完整例子在examples，独立工具在tools。[catalog.json](catalog.json)同时记录覆盖主题、实际正文文件与小节。只编辑源文件，不直接修生成的HTML/PDF。

[EDITORIAL-SPEC.md](EDITORIAL-SPEC.md)保留写作规范。[SAMPLE-NOTES.md](SAMPLE-NOTES.md)是第13章原审阅阶段的历史核验记录；现在的全书状态以本文和BUILD-NOTES为准。第13章原正文、四图及八组示例未改。
