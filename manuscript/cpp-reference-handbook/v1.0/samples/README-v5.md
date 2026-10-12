# 蓝色样章 v5：收紧重点标注

2026-10-10，仅生成独立样章，保留 v4 和全书现有内容。

## 本轮规则

- 表格正文采用普通字重和深色文字，取消名称列加粗与代码列蓝色；表头保留结构层级。
- 正文加粗仅用于正在定义的概念或符号，以及明确对比中的同级项目。
- 普通解释、重复提及、必要条件与限制说明统一为普通字重，不按“重要程度”挑选加粗。
- 普通正文中的行内代码仍为蓝色常规字重；在定义或对比位置才显式标粗。
- 标题、版本标签与代码块语法着色分别遵循既定结构样式，不作为正文重点判断。

源稿：`R03-initialization-deduction.preview-v5.zh-CN.md`；样式：`preview-v5.css`；构建：`build-preview-v5.mjs`。

输出为 `../output/pdf/R03-layout-preview-v5.html` 与 `../output/pdf/R03-layout-preview-v5.pdf`，共 7 页。

## 验证

与 v4 相比仅改变加粗标记和样式，移除标记后文字逐字一致。13 个代码片段与原章相同。全部页图已检查，未发现裁切、乱码或小节标题与首个短例分离。HTML 导航与图片检查通过；打印模式下表格正文所有单元格与行内代码均为普通字重和同一深色，表格正文无 strong 元素。具体报告与页图位于 `../qa/layout-preview-v5/`。

重建仅使用已有依赖与无头浏览器，不编译运行 C++ 示例：

```powershell
node samples/build-preview-v5.mjs '已有 Node 包目录' '已有 Chromium 浏览器路径'
pdftoppm -r 90 -png output/pdf/R03-layout-preview-v5.pdf qa/layout-preview-v5/page
```
