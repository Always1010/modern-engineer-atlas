# 第13章样章核验与重建说明

样章范围为第三篇的顺序容器一章，不是第三篇全部八章。审阅正文以 chapters/R13-sequence-containers.zh-CN.md 为唯一编辑源；PDF 和 HTML 为生成制品，SVG 图源和 C++ 示例分别保存在 resources 与 examples 中。

## 本次核验

- Windows 上使用现有 TDM-GCC 10.3.0，分别按 C++17 与 C++20 编译，启用 -Wall -Wextra -Wpedantic -Werror -O2；两组运行均通过八组语义检查。
- 检查覆盖初始化结果、reserve 不改变长度、resize 的新增值与缩小结果、clear 保留容量、at 越界异常、遍历删除、批量删除、C++20 erase_if 的返回数量、deque 引用保留、list 节点转移、forward_list 前驱删除和 unique_ptr 所指对象地址。
- 正文八个代码片段与示例文件中 sample-01 至 sample-08 的标记区一致，忽略包装所需的缩进。摘录所需头文件由完整示例提供；第四个片段所用 v 在包装函数中初始化。
- 独立只读技术审查核对了复杂度、失效条件、异常边界及四图的语义；采纳了 vector<bool> 范围、下标越界、右值插入与 splice_after 位置契约等修正。
- 核心规则使用 C++17 N4659 草案；erase_if 使用 C++20 N4861 草案。正文提供对应条文链接；实现示意和工程检查方向与标准保证区分。
- 审阅版为 A4 八页。用现有 Edge 无头导出，并以 bundled Poppler 逐页渲染检查；四图均加载，桌面阅读版未检测到布局溢出，已检查全部页面的文字、表格、代码、图注和页码。

以上不代表已经验证 MSVC、Clang、所有分配器、异常注入、并发使用或整本书构建。没有安装工具或改变本机持久配置；未运行原书全量测试，也没有运行未定义行为示例。

## 阅读与审稿

优先阅读 [PDF](output/pdf/R13-sequence-containers-review.pdf) 或 [HTML](output/pdf/R13-sequence-containers-review.html)。修改建议可以使用页码，或直接指明正文小节与接口。优先审查知识密度、首次阅读能否跟上、查阅能否定位条件，以及图解是否说明机制。

生成的 PDF、HTML 和 QA 文件不入 Git；正文、图源、示例与独立生成脚本入 Git。不要直接编辑生成制品来修正文。

## 重建

在仓库根目录执行。两个绝对参数分别指向已存在的 Node 包目录和浏览器程序，本命令不安装依赖。若本机路径不同，应传入现有路径。

```powershell
node manuscript/cpp-reference-handbook/v0.1/tools/render-r13-review.mjs 'C:/Users/always$$$/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules' 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

检查示例时将输出程序放在本版本的 qa/r13 目录，分别编译 C++17 和 C++20，再运行核对 PASS 输出。要在 MSVC 下检查 C++20 条件分支，需正确设置标准选项并使 __cplusplus 反映所用标准，例如启用 /Zc:__cplusplus。
