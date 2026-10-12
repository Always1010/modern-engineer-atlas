# 蓝色样章 v3

2026-10-10，本轮仅调整独立样章，保留第二版源稿、样式、构建工具和制品。

样章包含第 1 章的章首页与 1.3 节“初始化与类型推导”的完整正文，共 7 页。使用 `R03-initialization-deduction.preview-v3.zh-CN.md`、`preview-v3.css` 和 `build-preview-v3.mjs` 重建。

## 本轮视觉调整

- 取消青绿配色，恢复浅蓝代码背景与蓝灰边框。
- 节号与标题并排；小节编号与标题同字号、同黑体及同字重。
- 代码中的基本类型采用柔和紫色，语言关键字采用蓝色，注释采用中性灰。
- 正文英文和行内符号使用 Segoe UI；完整代码块继续使用 Consolas。首次出现的核心行内术语适度强调，关键表达式使用浅蓝底色。
- 正文里的 C++17、C++20 等版本名称使用一致的英文字体；段首版本提示使用蓝灰边框、轻微圆角的小标签。
- 保留已确定的章/节/小节层级和正文精简，不恢复片段标签或段末外部参考链接。

## 输出与验证

新版 HTML/PDF：`../output/pdf/R03-layout-preview-v3.html`、`../output/pdf/R03-layout-preview-v3.pdf`。

上一版 HTML/PDF：`../output/pdf/R03-layout-preview.html`、`../output/pdf/R03-layout-preview.pdf`，本轮没有覆盖。

QA：`../qa/layout-preview-v3/`，含全页 PNG、联系图、HTML 布局与 PDF 文字边界报告。13 个代码片段与原章完全一致；字体与高亮处理不改变正文文字。全部 7 页已检查，没有发现裁切、替换字符、失效导航或小节标题与首个短例分离。PDF 实际包含 Segoe UI 与 Segoe UI Semibold 字体。

重建仅使用已有运行时与无头浏览器，不安装依赖，不编译运行 C++ 示例：

```powershell
node samples/build-preview-v3.mjs '已有 Node 包目录' '已有 Chromium 浏览器路径'
pdftoppm -r 100 -png output/pdf/R03-layout-preview-v3.pdf qa/layout-preview-v3/page
```

HTML 内嵌样式和图示；跨节链接仍指向本地完整手册，单独复制样章不会携带跨节目标。
