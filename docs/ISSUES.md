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
