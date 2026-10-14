# 协作与分支维护

## 选择修改位置

| 修改内容 | 目标分支 |
| --- | --- |
| 仓库首页、书籍介绍、阅读入口与本协作约定 | `main` |
| C++ 与计算机基础图解参考手册的正文、示例、素材、编辑规范和工具 | `codex/cpp-reference-handbook` |
| 现代软件工程师能力地图的正文、素材、构建工具和维护文档 | `codex/modern-engineer-atlas` |

书籍分支是长期维护分支。书稿改动直接在对应分支提交，或通过以对应分支为目标的 Pull Request 审阅。为书籍创建工作分支时，从该书籍分支开始；为导航创建工作分支时，从 `main` 开始。

## 更新导航

更新书名、简介、阅读路径或已发布版本时，同步修改首页入口。跨分支链接使用包含完整分支名的 GitHub URL；发行链接指向对应书籍的具体版本。提交前检查链接、书名、版本号和维护分支是否一致。

新增书籍时，在首页说明定位、适合的读者、维护分支、阅读入口和已有发行版本。当前首页收录 C++ 与计算机基础图解参考手册、现代软件工程师能力地图两本书。

## 编辑与发布书籍

编辑前阅读对应书籍分支中的编辑、构建和核验说明：

- [参考手册维护入口](https://github.com/Always1010/modern-engineer-atlas/blob/codex/cpp-reference-handbook/manuscript/cpp-reference-handbook/v1.0/README.md)
- [能力地图维护入口](https://github.com/Always1010/modern-engineer-atlas/blob/codex/modern-engineer-atlas/README.md)

书籍发行标签指向对应书籍分支中已核验的最终提交。参考手册使用 `cpp-handbook-vMAJOR.MINOR.PATCH`，能力地图使用 `book-vMAJOR.MINOR.PATCH`；具体可用版本范围与附件规则以各书的发布说明为准。既有发行标签保留原指向。

默认分支 `main` 只维护导航，不包含书籍构建工作流。能力地图目前采用本地完整构建与标签发布，暂不提供 GitHub 手动构建入口；参考手册使用自己的分支推送核验与标签发布工作流。

## 导航历史与本地同步

2026-10-14 的迁移将原 `main` 完整保存在 `codex/modern-engineer-atlas`，随后用独立根提交建立新的 `main`。各书籍分支保留自己的原有历史，书稿改动不整批合并回 `main`。

已有克隆中的旧 `main` 与新的导航分支没有共同祖先。同步前保存旧 `main` 上的本地改动和独有提交，再从 `origin/main` 对齐导航分支；不要通过合并旧书历史来同步新的 `main`。书籍工作区继续跟踪对应书籍分支。
