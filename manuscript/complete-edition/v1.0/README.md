# 现代软件工程师能力地图：完整正文第一版

本书含13篇、58章、232个主题，配有154幅原创机制图及10张按独立许可使用的照片。技术资料核验日期为2026年10月3日；C++20为主线，C++23与C++26固定版本补充分别注明。

## 维护入口

- [chapters/](chapters/)：58份独立章节Markdown，是正文的唯一编辑源；每章文件以稳定编号C01至C58开头
- [book-order.json](book-order.json)：明确前言、13篇、58章与附录的顺序；篇目录和全书目录由章节标题自动生成
- front-matter/：书名页与前言
- back-matter/：术语、照片署名、版本边界与字体许可正文
- resources/：原创SVG机制图和有来源许可的JPEG照片
- asset-manifest.json：每张图的用途、相对路径及完整性校验
- photo-license-manifest.json、FONT-LICENSES.txt：照片和字体的署名与使用条件
- COVERAGE.md、EDITION-NOTES.md：目录覆盖与读者应了解的使用边界

修改一章时，只编辑对应的chapters/Cxx*.md。合并Markdown不在本目录维护，也不提交Git；运行仓库根目录的build_book.py后，build/book.md、PDF与EPUB会自动反映当前分章源稿。前后文修改在对应front-matter/或back-matter/文件中进行。

章节与篇的增删、排序和图片变更应同步维护book-order.json或图片清单；普通正文与代码修改不需要更新内容冻结锁。每次构建记录当前输入快照，并验证生成内容与当前源稿一致。

## 阅读与使用边界

PDF、EPUB与合并Markdown均由同一组章节源生成。图片、长代码在不同阅读器中可能需要横屏或放大，复制代码优先使用分章Markdown。构建和格式检查不执行书中的教学代码，也不替代模型服务、性能基准、硬件实验或真实阅读器实机测试。

照片遵从各自许可与署名，不把单张图片的许可延伸到整本书。字体许可随源稿及阅读制品保留；项目尚未指定整本书的统一再授权条款。
