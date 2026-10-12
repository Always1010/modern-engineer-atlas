# 学习依赖审查与三组衔接样稿

历史样稿：此包记录 v0.2 阶段的审查、样章和当时的冻结基线；旧标题定位与哈希不用于检查当前正文。正式 v1.0 的处理结果见[学习顺序修订记录](../../LEARNING-REVISION.zh-CN.md)及[主题迁移台账](../../learning-revision-migration.json)。

评审对象：C++ 与计算机基础图解参考手册 v0.2。日期：2026-10-10。本轮完成当前7章35节及阅读指南的学习依赖审查，并写出三组可以连续阅读的局部样稿。所有新稿单独存放，正式正文、目录、索引及公共样式没有替换。

建议先读[三组样稿合并PDF](../../output/pdf/Handbook-learning-sequence-samples.pdf)（16页，含独立封面），感受解释是否容易跟上；[HTML阅读版](../../output/pdf/Handbook-learning-sequence-samples.html)提供侧边目录和组间跳转。样稿编号独立于正式手册。

| 样稿 | 读者完成的知识链 | 可编辑源稿 |
| --- | --- | --- |
| 初始化与类型推导 | 建立对象、赋值、常用初始化、auto/const、引用、两个decltype例 | [样稿01](01-initialization-deduction.zh-CN.md) |
| 对象生命周期与RAII | 借用有效时间、简单类、构造析构、自动清理、动态对象、独占责任转交、异常展开 | [样稿02](02-lifetime-raii.zh-CN.md) |
| 容器与迭代器 | 元素/长度/容量、位置/尾后/半开区间、插删、失效、算法返回位置 | [样稿03](03-containers-iterators.zh-CN.md) |

每组先列明阅读前需要的知识，再在具体例子之前解释当前操作所需的概念。样稿02仍需要指针与普通函数等先修，样稿03仍需要分支循环；这三组只验证局部链，不覆盖从零入门的全部内容。

[全书审查报告](dependency-audit.zh-CN.md)包含35节覆盖表、43条原文定位记录、依赖链和建议学习路线。其中38条需处理、3条定义缺口候选、2条经复核排除。记录是编辑任务，不把所有前向引用都算作错误，也不把导航双向链接直接算作先修循环。

[迁移对照](migration-plan.zh-CN.md)列明样稿的覆盖边界，以及10个直接相关源节、147个现有二级/三级条目的保留位置和进入时机。完整规则、特殊条件、接口和版本扩展继续有自己的维护位置。其余25节参照审查的逐节建议，完整内容默认保留。

资料与检查结果见[参考来源](references.json)、[验证记录](verification.zh-CN.md)。本轮做了技术语义静态核对、独立复审、链接检查和HTML/PDF渲染检查，未编译或运行C++。仍需读者试读检验是否真正降低理解难度。

## 复现与维护

- [build-audit.mjs](build-audit.mjs)核对43个原始文件哈希、35节覆盖、43条真实标题/原句及定义落点，然后生成审查报告与[结构化记录](dependency-audit.json)。
- [build-migration.mjs](build-migration.mjs)从现有标题生成迁移表与[保留清单](migration-inventory.json)，未知标题会报错。
- [build-samples.mjs](build-samples.mjs)使用共享文档模型、排版模块与CSS，生成独立阅读版。调用参数依次为包含marked/playwright的现有Node模块目录、已有Chrome可执行文件；不安装依赖。
- [check-review.mjs](check-review.mjs)核对本目录的本地链接、原稿哈希、迁移覆盖、样稿与阅读版的哈希一致性、渲染记录。

初始源状态记录在[source-baseline.json](source-baseline.json)。审查报告和迁移表是生成稿，修改对应生成脚本后再生成；三组样稿与SVG图是直接维护的源文件。生成的HTML、PDF和QA记录位于现有忽略目录，正式构建脚本没有改动。
