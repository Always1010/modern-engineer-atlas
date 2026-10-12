# 初始化与类型推导：第二版排版样章

2026-10-10，供正文与排版风格评阅。样章源稿独立维护，原章、全书制品及公共样式保持原状。

- `R03-initialization-deduction.preview.zh-CN.md`：完整样章，删除 12 处“基础操作”标签和 1 处“机制解释”标签；进一步删除全部“独立片段”标签、冗余的片段引导语及正文末尾外部参考链接。保留原有主题、13 个代码片段、图示和版本条件；原章中的技术来源保持原状。
- `preview.css`：在公共 CSS 上叠加候选样式；使用墨蓝、青绿配色，黑体标题、宋体正文与等宽代码；增加章首页、章内各节目录、章/节/小节编号和语法着色，组合小节标题、首段与首个短例进行分页。
- `build-preview.mjs`：使用现有 marked、Playwright 和浏览器生成 HTML/PDF，核对代码与标题一致性、资源、导航及屏幕/打印边界。

输出位于 `../output/pdf/R03-layout-preview.html` 与 `../output/pdf/R03-layout-preview.pdf`，QA 位于 `../qa/layout-preview/`。HTML 内嵌图示和样式；跨章链接指向同目录的完整手册 HTML，单独复制样章仍可阅读正文，但不会携带跨章目标。

重建命令（仅使用已有环境，不安装依赖）：

```powershell
node samples/build-preview.mjs '已有 Node 包目录' '已有 Chromium 浏览器路径'
pdftoppm -r 110 -png output/pdf/R03-layout-preview.pdf qa/layout-preview/page
```

验证限于样章文字、文档结构、导航和排版，不编译运行 C++ 示例。

第二版制品为 7 页：第 1 页展示章首页，第 2 页起为 1.3 节完整正文。全书结构只在样章中预览，不修改全书 catalog、目录或正文。代码文本与原章完全相同；HTML 导航、图片、屏幕及打印边界通过检查，PDF 全部页图已复核，未发现越界字形、替换字符或小节标题与首例分离。
