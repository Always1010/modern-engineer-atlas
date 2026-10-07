# 全书修订：核验与重建

日期：2026-10-08。分支codex/cpp-reference-handbook，目标WorkTree为C:/Users/always$$$/.codex/worktrees/cpp-reference-handbook/modern-engineer-atlas。版本路径manuscript/cpp-reference-handbook/v0.1。原checkout、complete-edition、cpp-quickstart源码未修改；一个误放原checkout的临时验证目录已移入本WorkTree的QA。

## 修订范围

7篇、32章、183个二级条目；数据结构原理融合R13–R16。新增R23异步执行、事件循环与任务调度，R27链接、装载与库；扩充R02/R07对象模型，R30改为构建、依赖与工程交付。目录、文件名、图号、交叉引用和附录按连续编号统一，catalog记录实际条目与机制后查小节。

44幅可编辑SVG；29个根目录单文件程序（含R13审阅片段程序），另有R30四文件静态库工程与R27六个代码/构建文件的STATIC/SHARED/MODULE关联工程。图中实现模型不作为标准布局保证；来源就近链接到相应版本公开草案、平台/工具官方文档。

## 历史首稿与本轮验证分别记录

2026-10-07首稿的26个单文件程序及原静态库工程在Windows TDM-GCC10.3.0环境通过，R13另以C++20检查erase_if。该历史记录不等于本轮重新运行全部程序。此次只运行新增或实质改变的例子/工程；编号迁移后的正文/源码由对应检查核对。

| 本轮范围 | 实际验证 |
| --- | --- |
| R02新增存储例子 | C++17，-Wall -Wextra -Wpedantic -Werror；copy=7 reused=23 destroyed=2，退出0 |
| R16新增查找/选择/堆例子 | C++17，-Wall -Wextra -pedantic；bound=4 rank2=3 popped=9 size=4，退出0；检查语义关系，不固定未规定排列 |
| R23有界执行器 | C++17，-pthread，-Wall -Wextra -Wpedantic -Werror；accepted=3 rejected=2 result=42 failures=1，退出0；门闩使满队列检查确定，不依赖sleep |
| R30安装导出 | 原静态库工程配置、构建和定向smoke1/1；安装到项目内stage；另建消费工程只用安装头和导出目标，运行退出0 |
| R27关联库工程 | 最终编号Windows x64静态/共享/插件CTest3/3；缺文件/缺入口/拒绝版本/缺参数退出3/4/5/2，缺入口和拒绝版本时均释放已加载句柄；中文空格路径退出0 |
| 正文对应 | 29根目录程序：28个完整代码块、R13的8个片段；R30四文件和R27接口摘录逐字核对 |
| 技术审查 | 修正委托构造清理例外、GetLastError先保存、Windows固定入口示例限制64位；其余新增内容未发现实质错误 |

TDM-GCC的插件默认运行库配置曾在释放DLL时出现SIGSEGV，改用共享libgcc/libstdc++并复制已有匹配DLL后通过。完整证据与判断边界见[库工程记录](examples/r27-libraries/README.md)。不能据此概括所有静态运行库或所有DLL。

本机美元字符路径触发CMake MinGW响应文件转义问题；QA消费工程在project之后关闭include/library响应文件，R27最终验证通过CMAKE_PROJECT_INCLUDE加载同一临时片段。只改变项目内验证配置，不修改系统软件、环境变量或PATH。

## 未实测范围

Linux库工程、epoll/映射/IPC/持久化、Windows真实IOCP/Winsock端点、TCP/TLS/HTTP，以及MSVC/Clang和sanitizer未在本轮运行。C++20/23 span/ranges/format/bit/时区/jthread/同步器/expected等继续明确为来源核验或历史有限范围；协程只给入口，未实现框架。未覆盖任意分配失败、任意任务挂起或并发销毁执行器，也没有运行未定义行为证明规则。

## 图解与阅读制品

独立生成器沿用审阅样章风格；不缩小正文以追求固定页数。HTML带章节、条目与索引跳转，SVG内嵌；PDF有可检索文字、页码、书签和链接。新图定向检查实际字体下文字边界/重叠并目视检查。新增章节和重编号影响整书重排，因此检查全书PDF页面；这不是重新运行原书全部程序测试。

生成器按catalog声明检查32个连续唯一章节、全部本地资源与引用、图像加载、锚点和布局边界。source摘录注释只用于核验，不显示给读者。最终PDF为134页，正文包含95张Markdown表；第1–32章齐全，越界字形、替换字符与待复核稀疏页均为0。全部页面经渲染目视复核，10幅新增SVG的边界与重叠定向检查通过；页面渲染与检查结果在ignored qa/fullbook。

output与qa不入Git，正文、图源、例子、目录和工具纳入Git。复制HTML/PDF不等于同时携带源码；源码链接指向本机文件，需要配套版本目录。

## 在已有环境重建

从仓库根目录执行；以下本机路径应换成读者已有依赖，不安装工具：

```powershell
node manuscript/cpp-reference-handbook/v0.1/tools/build-handbook.mjs 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node manuscript/cpp-reference-handbook/v0.1/tools/check-example-sources.mjs
node manuscript/cpp-reference-handbook/v0.1/tools/check-handbook-svg.mjs 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
pdftoppm -r 90 -png manuscript/cpp-reference-handbook/v0.1/output/pdf/Cpp-Reference-Handbook-v0.1.pdf manuscript/cpp-reference-handbook/v0.1/qa/fullbook/page
& 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' manuscript/cpp-reference-handbook/v0.1/tools/inspect-handbook-pdf.py --sheets
```

SVG检查可传第三个参数（文件名正则）只检查受改图。示例工具进行源码对应核查，不执行所有程序。完整平台构建入口见各章和库工程README；代码失败退出非零，不能运行旧exe冒充本次编译结果。
