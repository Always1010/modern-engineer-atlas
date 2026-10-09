# 已确认问题记录

本文件记录已确认的书稿语义错误、失效导航和影响使用的实现不足。普通内容扩展和编辑优化由正文与提交记录维护。

## HB-001：删除的移动函数规则缺少例外

- 日期：2026-10-09
- 状态：已解决
- 现象：拷贝移动章将所有删除的移动成员都描述为仍参与重载，可能使读者误判默认化移动被删除后的拷贝回退。
- 原因：未区分显式 `= delete` 与默认化后被定义为删除。
- 解决方案：补充移动构造及赋值的忽略规则、对照表与独立例子，并收紧特殊成员章措辞。
- 验证：对照 C++17 草案 class.copy.ctor/10、class.copy.assign/7；相关章节链接、围栏与表格静态检查通过；未编译运行 C++ 示例。
- 相关文件：[拷贝与移动](../manuscript/cpp-reference-handbook/v0.2/chapters/R08-copy-move.zh-CN.md)、[特殊成员](../manuscript/cpp-reference-handbook/v0.2/chapters/R07-classes-lifetime.zh-CN.md)。

## HB-002：结构化绑定的类型范围和回链不准确

- 日期：2026-10-09
- 状态：已解决
- 现象：正文把类成员拆解限制为聚合，结果类型章则引向没有该条目的语句函数章。
- 原因：混淆聚合初始化和结构化绑定，迁移条目时未同步语义回链。
- 解决方案：按数组、tuple 协议、成员三条路径说明，并给非聚合类例子；回链指向具体条目。
- 验证：对照 C++17 草案 dcl.struct.bind；R02、R17 静态检查通过，未编译运行 C++ 示例。
- 相关文件：[类型与对象](../manuscript/cpp-reference-handbook/v0.2/chapters/R02-types-objects.zh-CN.md)、[结果类型](../manuscript/cpp-reference-handbook/v0.2/chapters/R17-utility-results.zh-CN.md)。

## HB-003：运算符重载引用缺少落点

- 日期：2026-10-09
- 状态：已解决
- 现象：表达式章让读者在类章查运算符重载，但类章没有相应说明。
- 原因：入口承诺与章节覆盖范围不一致。
- 解决方案：补齐成员、非成员、friend 的最小条目，给出 +、+=、== 例子及 C++17 限制，入口指向条目锚点。
- 验证：对照 C++17 草案 over.oper、class.friend；相关章节静态检查通过，目录重新生成。
- 相关文件：[类与对象](../manuscript/cpp-reference-handbook/v0.2/chapters/R07-classes-lifetime.zh-CN.md)、[表达式](../manuscript/cpp-reference-handbook/v0.2/chapters/R04-expressions-conversions.zh-CN.md)。

## HB-004：原子共享指针的版本说明缺失

- 日期：2026-10-09
- 状态：已解决
- 现象：共享所有权章让读者去原子章查版本边界，但未提供 C++17 自由函数与 C++20 特化的区别。
- 原因：普通原子指针与共享句柄槽位的接口覆盖没有分开。
- 解决方案：新增原子共享指针条目、两种版本短例，说明句柄同步、目标寿命、可变内容同步和非无锁保证。
- 验证：对照 C++17/20 草案 smartptr 原子接口；R09、R22 静态检查通过，目录重新生成。
- 相关文件：[共享所有权](../manuscript/cpp-reference-handbook/v0.2/chapters/R09-raii-memory.zh-CN.md)、[原子对象](../manuscript/cpp-reference-handbook/v0.2/chapters/R22-atomics-memory-order.zh-CN.md)。
