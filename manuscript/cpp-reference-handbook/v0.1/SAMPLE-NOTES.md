# 局部审阅制品生成

样章与全书共用正文、标题模型、生成器及CSS。局部制品用于审查对象条目和分页，不另维护一套内容或样式。R13仍可单独输出；跨领域模板选择R04、R17、R26、R31。

## 生成入口

在本版本目录执行，两个参数使用已有Node包目录与Chromium浏览器程序。本命令只导出HTML/PDF，不安装依赖，不编译运行C++。

```powershell
node tools/render-r13-review.mjs $nodeModules $browserExe
node tools/build-handbook.mjs $nodeModules $browserExe --chapters=R04,R17,R26,R31
```

R13输出为 [PDF](output/pdf/R13-sequence-containers-review.pdf) 和 [HTML](output/pdf/R13-sequence-containers-review.html)。跨领域模板输出为output/pdf/Handbook-template-samples.pdf与同名HTML。正式整书入口和检查口径见 [BUILD-NOTES](BUILD-NOTES.md)，此处不重复记录历史运行结果。

## 审阅对象

关注类型/规则是否先定义、基本操作是否明确、参数与结果是否就地可查、必要条件是否清楚，以及图表是否承担正确职责。代码是短摘录，完整组合源码在examples；不以是否含main或能否在当前机器执行判断正文质量。

检查版面时关注标题与后文、短代码完整性、续表表头、图注、长行和空白页。局部制品不能代替全书排版检查；生成文件与页图不提交Git，改正文或公共样式后重建。
