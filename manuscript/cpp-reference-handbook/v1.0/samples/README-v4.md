# 蓝色样章 v4：按内容标注重点

2026-10-10，仅更新独立样章，保留 v3 的源稿、样式、工具及制品。

## 标注约定

- 中文概念在定义处使用深色加粗，普通复述不重复强调。
- 行内代码符号统一使用蓝色、Segoe UI、常规字重；定义和对比处在 Markdown 中显式标粗。
- 对比项同级处理；关键限制标注完整短语，保留否定词和限定条件。
- 英文译名不额外强调；版本提示继续使用细边框圆角标签。
- 代码块沿用浅蓝底色和语法着色，不套用正文标注规则。
- 删除“每个小节第一次命中词表就强调”的自动逻辑，以及单独突出 `return (local);` 的底色。

样章源稿：`R03-initialization-deduction.preview-v4.zh-CN.md`。样式：`preview-v4.css`。构建：`build-preview-v4.mjs`。

输出：`../output/pdf/R03-layout-preview-v4.html` 和 `../output/pdf/R03-layout-preview-v4.pdf`；QA：`../qa/layout-preview-v4/`。

全文与 v3 的差异仅为显式加粗标记，去除新增标记后文字逐字一致。13 个代码块与原章相同；生成过程确认英文字体处理和语法着色不改变文字。仅用已有环境进行文档检查，不编译运行 C++ 示例。

重建：

```powershell
node samples/build-preview-v4.mjs '已有 Node 包目录' '已有 Chromium 浏览器路径'
pdftoppm -r 100 -png output/pdf/R03-layout-preview-v4.pdf qa/layout-preview-v4/page
```
