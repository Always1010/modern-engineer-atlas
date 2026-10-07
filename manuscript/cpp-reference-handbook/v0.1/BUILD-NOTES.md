# 全书首稿：核验与重建

日期：2026-10-07。版本位于独立 worktree 的 manuscript/cpp-reference-handbook/v0.1，分支为 codex/cpp-reference-handbook。原版 complete-edition、之前的 cpp-quickstart 和原 checkout 未修改。本记录描述实际检查，不将来源查阅等同于运行验证。

## 内容与编辑范围

7篇、30章、159个二级查阅条目，另有快速阅读路径和附录A–F。34幅原创SVG机制图，72张正文/附录规则与接口表。C++17是完整程序基线；C++20/23设施就近标注。R13保留已通过审阅的正文、四图与八组片段，其余章节以相同规则密度和图解方式编写。

按 adaptive-workflow 分工完成语言/对象、标准库、并发/系统/网络三组内容，主编辑完成工程排障、索引、交叉核对及导出。write-page 的准确、紧凑要求落实为接口条件与失败边界；targeted-testing 将验证限定在本版本；pdf 的渲染复核用于发现分页与布局问题。没有安装软件、改变系统配置、运行原书全量测试或推送远端。

技术说明就近链接到相应标准版本的公开草案条文、RFC、CMake/调试器官方文档、Linux man-pages/Kernel Documentation、Microsoft Learn。草案是公开版本定位依据，不冒充付费正式标准全文。实现图明确区分标准要求与常见布局。

## 程序验证

现有工具：Windows PowerShell、TDM-GCC 10.3.0；CMake 3.29.2 与 MinGW Makefiles。26个单文件程序和1个包含4个文件的CMake工程，覆盖27章。R24–R26以系统/协议机制条目为主，没有用伪模拟程序宣称验证了OS或网络栈。

| 范围 | 实际检查 |
| --- | --- |
| R01–R11 | 11例，C++17，-Wall -Wextra -Wpedantic；各自编译运行，退出0、无警告，核对固定语义结果 |
| R12、R14–R19 | 7例，C++17，-Wall -Wextra -pedantic；各自编译运行和结果检查 |
| R13 | 原样章已分别C++17/20编译，-Werror -O2；8组语义检查通过，包括C++20 erase_if |
| R20、R21、R22、R23、R27 | 5例，C++17，-pthread；每程序15秒运行上限，各自退出0并核对结果 |
| R28 | CMake Release配置、构建、ctest -R r28_smoke；1/1通过，检查库函数三个边界输入 |
| R29、R30 | C++17、-Werror -O2；正常值/越界/溢出拒绝，或固定校验和536741920与非负计时 |
| 最后修改复测 | R16补iterator，R20/R21/R22/R27补直接依赖头；主编辑为R21/R29/R30补cstddef后仅复编复测这些受改程序 |

正文25个完整程序逐字匹配单文件源码；R13的8个标记区匹配片段（只去除包装缩进）；R28四个文件分别匹配正文。所有检查失败显式返回非零，不依赖assert；没有为演示而执行UB。计时例子不声称防优化完备，也不固定纳秒输出。

未实测范围：MSVC/Clang、多操作系统运行、sanitizer、异常分配点全覆盖、浮点charconv、执行策略后端、C++20 span/ranges/format/bit/时区/jthread/同步器，以及C++23 expected/byteswap。Linux映射、IPC、epoll、持久化；Windows IOCP、Winsock；真实TCP/TLS/HTTP均为来源核对，未宣称端点运行通过。源码条目已经写出这些边界；没有为扩展接口更换工具链。

## 图解、排版与生成

独立生成器沿用R13样章的正文/表格/代码字号、配色与A4版式。HTML有侧边目录、章节与索引跳转，SVG以data URI内嵌；PDF有页码、可检索文字、链接与书签。源码与例子链接指向本机文件，复制HTML/PDF到另一台机器不意味着例子文件也被携带。

生成器检查30个唯一章节、全部本地资源与引用、静态SVG的title/desc、图像加载、章节锚点与布局边界。raw HTML按文本转义，避免头文件或模板尖括号被吞掉。长代码允许分段；短代码、图注与图组合保留。R09/R12/R18只收紧段落间隔，不缩小正文。最终A4阅读版110页，包括封面、目录、1页使用指南、103页正文与4页附录；普通章主要为3至4页，R13为8页，长程序分段使R21/R27为4页。

34SVG经XML与920px宽检查，浏览器实际字体加载后检查每个text的画布边界及文字两两重叠，0问题。全部图组目检，修正过标签、迁移箭头与虚拟页连线。全PDF用Poppler逐页渲染，全部页组检查分页、表格、代码、图注与页码；图与长代码、dense表格另外放大抽查。PDF文字提取确认1–30章全部存在、没有U+FFFD，所有字形在页面范围内。详细检查结果和PNG在ignored qa/fullbook。

输出与QA不纳入Git，避免提交可再生成的PDF、HTML、exe与截图。正文、SVG、例子、索引、catalog与构建/检查脚本纳入Git。直接编辑生成制品不能修复源稿。

## 在现有环境重建

从仓库根目录执行。本机绝对路径是已存在的依赖；换机器时替换为自己的现有路径。脚本不安装Node包、浏览器、编译器或PDF工具。

生成HTML/PDF：

~~~powershell
node manuscript/cpp-reference-handbook/v0.1/tools/build-handbook.mjs 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
~~~

源码与正文对应检查（不运行程序）：

~~~powershell
node manuscript/cpp-reference-handbook/v0.1/tools/check-example-sources.mjs
~~~

图解边界、重叠检查与PNG生成：

~~~powershell
node manuscript/cpp-reference-handbook/v0.1/tools/check-handbook-svg.mjs 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
~~~

PDF逐页渲染和文本/版面检查：

~~~powershell
& 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe' -r 90 -png manuscript/cpp-reference-handbook/v0.1/output/pdf/Cpp-Reference-Handbook-v0.1.pdf manuscript/cpp-reference-handbook/v0.1/qa/fullbook/page
& 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' manuscript/cpp-reference-handbook/v0.1/tools/inspect-handbook-pdf.py --sheets
~~~

qa/fullbook/build-report.json记录源文件SHA-256、实际章路径、加载与锚点结果；source-example-report.json记录正文/源码匹配；diagrams/svg-inspection.json记录文字几何；pdf-inspection.json记录页数、章位置、异常字符与边界。不要把“0越界”当成语义正确证明，仍需人工审稿。

## 后续审稿

定位用Rxx及小节标题，阅读制品也可用页码。优先检查三个维度：入门者能否沿路径形成正确规则；工作时能否立即查到条件；图是否说明机制而非重复正文。本版是完整首稿，不宣称取代cppreference的全量细目或目标平台的实测。
