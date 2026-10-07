# N15 Windows与Linux部署修订

## 版本和范围

- 新章稳定标识：N15
- 文稿版本：完整候选版0.9；保留初稿至候选版的具体修订，不把排版导出日期当技术复核日期
- 原书基准：book-v1.1.0，固定提交0842f624995d2fd99f46c68426c9a33a73610cbb
- 依据：已接受的24章实施方案、N11样章与共同案例契约
- 核对日期：2026-10-06
- 本报告对应正文：N15-windows-linux-deployment.zh-CN.md
- 生成本报告时正文字符数：11,852；字数不是实测页数，正式页码另由排版核准

## 原文读取范围与身份

本轮以本地固定提交的完整源文件核对，不使用早期仅前30行的摘录。C25、C31、C33、C34、C35、C48、C57已完整阅读；C58仅完整阅读58.2.1至58.2.13及其相关来源条目，不声称已完整阅读C58其他项目。表内引用的原小节均已实际核对。

- [C25 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C25-architecture-and-long-term-evolution.zh-CN.md)；SHA-256：c884f23407fd592c329eba306d386613917948e3f2535871ab2819a775933448
- [C31 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C31-windows-qt-and-device-host-applications.zh-CN.md)；SHA-256：f007d17dba6b090f381406a33e788923ec408922015fcc50584d2a3773965c23
- [C35 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C35-storage-engines-and-durability.zh-CN.md)；SHA-256：a75fc953e2a4200942a1e0856637686b03f0cb308c13dc4f4a9868ca91addcef
- [C58 固定原章](https://github.com/Always1010/modern-engineer-atlas/blob/0842f624995d2fd99f46c68426c9a33a73610cbb/manuscript/complete-edition/v1.0/chapters/C58-cross-layer-projects-and-portfolios.zh-CN.md)；SHA-256：4c4e53ccd6424e196c15ec8cf12b14aed78d075e50f98bfa40e3484061546569

## 精确逐节对应

| 新节 | 原节精确定位 | 处置与理由 |
| --- | --- | --- |
| 15.1 发布身份必须比文件名更具体 | C31 31.4.3 安装包是运行环境的一部分；C31 31.4.7 跨平台验收要包含平台失败方式；C25 25.3.1 兼容性有方向与维度 | 扩写发布身份与兼容方向，Qt API/补丁/平台目标和实际验证分开。 |
| 15.2 Windows部署从依赖集合开始 | C31 31.4.3 安装包是运行环境的一部分 | 核心扩写Windows依赖、windeployqt范围、运行库、目录分区、插件信任；未执行命令。 |
| 15.3 Linux部署不只是换一个可执行文件 | C31 31.4.7 跨平台验收要包含平台失败方式；C25 25.1.6 部署边界要承担它引入的失败 | 扩写真实第二平台：ELF/系统ABI/显示后端/设备权限/udev/后台服务边界，未改权限。 |
| 15.4 配置迁移首先保护可解释性 | C31 31.4.6 文件保存要定义失败时留下什么；C25 25.3.1 兼容性有方向与维度；C25 25.3.2 迁移先建立可逆过渡 再删除旧路径 | 重写配置类别与迁移；新增QSaveFile教学片段并明确direct-write fallback及非断电通用保证。 |
| 15.5 更新要同时管理程序和数据 | C31 31.4.4 更新程序应保护已运行版本与数据；C25 25.3.2 迁移先建立可逆过渡 再删除旧路径；C25 25.3.7 用迁移状态表检验遗漏；C58 58.2.11 烧录与升级记录仍要面对断电和版本兼容 | 核心合并。程序和数据两条更新链、回退后的新记录、未确认动作与安全关闭。 |
| 15.6 DPI 字体和操作方式也是功能验收 | C31 31.4.1 DPI 决定逻辑尺寸怎样落到像素；C31 31.4.2 可访问性需要语义而不只是颜色 | 保留重写DPI/布局/单位/键盘扫码，安全与身份确认不由按钮外观替代。 |
| 15.7 诊断材料要能对应同一个发布版本 | C31 31.4.5 崩溃报告必须与符号和隐私同时匹配；C35 35.4.4 复制不能替代具有时间隔离的备份；C35 35.4.5 恢复目标决定备份链如何保留 | 扩写符号、构建、隐私、日志与质量记录不同保留、隔离恢复。 |
| 15.8 一份可核验的交付应回答什么 | C31 31.4.7 跨平台验收要包含平台失败方式；C25 25.4.8 交付以可运行 可维护和可解释为结束条件 | 重写可核验交付矩阵；待验证与已通过明确分开。 |
| 15.9 从交付故障回到可区分的证据 | C31 31.4.3 安装包是运行环境的一部分；C31 31.4.7 跨平台验收要包含平台失败方式；C25 25.3.7 用迁移状态表检验遗漏 | 新增插件失败、Linux权限、更新后找不到数据三条完整故障和已回答追问。 |

## 新增 合并 重写与移出

- 新增Windows主讲和Linux第二目标的具体依赖、权限、显示、数据和更新分区。
- 命令仅教学；QSaveFile、运行库、udev均未实际执行或安装。
- 合并：同一概念只有一个主要解释位置，跨章使用用明确身份和引用衔接；不以同义反复补篇幅。
- 重写：先定义与背景，再说明结构、机制、用途、失败与有答案的追问；不沿用原书固定四主题结构。
- 移出：构建与Git细节留N05/N09，不新增通用平台工程或自动更新产品路线；驱动安装和权限修改不作为已执行步骤。

## 官方资料与核验边界

[15-1] Qt，[Qt for Windows Deployment](https://doc.qt.io/qt-6.8/windows-deployment.html)。windeployqt 与第三方依赖边界。

[15-2] Qt，[Deploying Plugins](https://doc.qt.io/qt-6.8/deployment-plugins.html)。插件布局、查找与兼容。

[15-3] Microsoft，[Latest supported Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)。架构和工具链运行库要求，实际发布须固定当时适用版本。

[15-4] Qt，[QStandardPaths](https://doc.qt.io/qt-6.8/qstandardpaths.html)。平台数据位置接口。

[15-5] Qt，[Qt for Linux/X11 Deployment](https://doc.qt.io/qt-6.8/linux-deployment.html)。共享库与目标环境；不是任意发行版兼容承诺。

[15-6] systemd，[udev官方手册源文](https://raw.githubusercontent.com/systemd/systemd/main/man/udev.xml)。设备事件、规则、权限与符号链接；具体策略由发行版决定。

[15-7] Qt，[QSaveFile](https://doc.qt.io/qt-6.8/qsavefile.html)。提交与直接写回退边界。

[15-8] Qt，[High DPI](https://doc.qt.io/qt-6.8/highdpi.html)。逻辑坐标、设备像素与多屏。

[15-9] Microsoft，[Symbols and Symbol Files](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/symbols-and-symbol-files)。符号与二进制匹配；Linux具体工具链另行固定。

资料核对日期2026-10-06。没有执行部署命令、安装驱动或运行库、改变权限、升级、回退或恢复。Qt许可及第三方分发义务须按实际使用组件和协议核查，本章不提供法律结论。交付与验收清单是待实施标准，不是已经通过的测试报告。

## 本章图像和许可

- ../assets/fig15-1.svg：只读程序目录、可写配置、质量数据和诊断数据分开，更新器不覆盖质量记录。
- ../assets/fig15-2.svg：程序版本切换和数据模式迁移分别有确认与回退条件，换回可执行文件不能自动恢复数据兼容。
- 原创机制图按host-figures.md规格重建；非运行截图，非实测波形。图的最终可读尺寸及页码由整合版视觉检查确认。

## 已完成的文稿静态检查

- 已检查本章字段与共同案例的语义，不把generation、boot_id、source_time或raw_count私自加到type01基础帧。
- 已检查代码行的显示宽度上限80个等宽列、表格最多四列、章节号与源码路径。此为文稿检查，不是代码编译。
- 已检查三种确认：测量判定、本地持久化、MES业务接纳不相互替代；现场放行依批准策略。
- 保留C++20和Qt6.8 API边界；N11的Qt6.8.3收尾结论不扩张到任意TLS或SDK尾部。

## 未执行与尚需验收

- 所有C++、Qt、SQL、命令和故障注入均未运行；没有创建Codex任务，没有修改仓库、构建或发行管线。
- 未编译、未执行主机测试、未接真实板卡/PLC/仪器、未烧录、未校准、未提交MES、未改变权限或安装软件。
- 目标平台与具体设备/工具链尚需冻结；代码中的辅助函数、资源失败与完整应用集成仍需实现。
- 排版、图像、链接与页面检查属于文档验收，不能转写为协议、硬件、计量或生产验收通过。

## 独立审校后的具体修订 2026-10-06

- udev页面工具读取失败，改用systemd官方仓库手册源文；未执行任何udev规则或权限更改。
