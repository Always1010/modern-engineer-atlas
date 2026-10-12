# 章、节分页样章

历史样稿：此包记录 v0.2 阶段的审查、样章和当时的冻结基线；旧标题定位与哈希不用于检查当前正文。正式 v1.0 的处理结果见[学习顺序修订记录](../../LEARNING-REVISION.zh-CN.md)及[主题迁移台账](../../learning-revision-migration.json)。

2026-10-10，根据本次反馈生成。使用原来三组衔接样稿的知识顺序，重点评审章、节分页和正文衔接。

本次确认的分页规则是：每章、每节从新页开始；1.2.1这样的编号小节不强制换页，随内容自然排版。章首页保留章名和本章目录；节末允许留下自然空白，不使用缩字号或压行距来挤满页面。小节标题仍与后续内容保持连接；末尾简短自检的题目和解释尽量保持在一起。

阅读：[新版PDF](../../output/pdf/Handbook-learning-sequence-paged.pdf)、[HTML](../../output/pdf/Handbook-learning-sequence-paged.html)。PDF共18页：

| 内容 | 起始页 |
| --- | --- |
| 第1章 基础概念的衔接样稿 | 1 |
| 1.1 初始化与类型推导 | 2 |
| 1.2 对象生命周期与RAII | 7 |
| 1.3 容器与迭代器 | 13 |

可编辑正文：[初始化与类型推导](01-initialization-deduction.zh-CN.md)、[对象生命周期与RAII](02-lifetime-raii.zh-CN.md)、[容器与迭代器](03-containers-iterators.zh-CN.md)。本版将重复的头文件提示改为首次使用时的具体准备说明，删去“新的局部例子”这类泛化提示，用操作目的连接例子。头文件名与元素类型的区别在首次vector例前解释。技术内容仍按原样稿的C++17范围，来源沿用[原评审来源](../learning-sequence/references.json)。

本次是独立样章；原评审包、正式正文、目录、索引、公共样式和通用规范未覆盖。已确认的分页规则记录在本文件，并由[打印布局规则](print-layout.css)执行，优先于共享样式原有的节连续排版方式。后续推广时应将这一规则同步到正式共用样式与相应规范。

## 构建与验证

[构建脚本](build-samples.mjs)复用公共文档模型、字体排版与CSS，再加载打印布局规则；传入现有Node模块目录和Chrome程序路径，不安装依赖。输出到已有output/pdf目录，QA结果位于qa/learning-sequence-paged。

桌面、移动和打印媒体检查通过：无重复ID、失效内链、缺图或正文横向溢出。30段渲染代码与本版源稿逐字符一致。打印样式检查确认章/节break-before为page、30个小节为auto。

全部18页已渲染检查；没有替换字符、文字越出纸面或空白页。实际PDF的三个节标题均位于新页正文起点，30个小节中19个位于页内，说明它们没有被强制分页。11个字体子集全部嵌入。

机器记录：[渲染检查](../../qa/learning-sequence-paged/render-checks.json)、[PDF检查](../../qa/learning-sequence-paged/pdf-inspection.json)、[实际分页和字体检查](../../qa/learning-sequence-paged/pagination-review.json)。实际分页由[inspect-pagination.py](inspect-pagination.py)验证。未编译或运行C++例子。
