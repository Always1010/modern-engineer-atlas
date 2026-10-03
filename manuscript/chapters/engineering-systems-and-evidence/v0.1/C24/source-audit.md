# 第二十四章 协作版本与发布工程 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

以下主要来源于2026-10-03打开核验。所有Git与发布流程为教学解释，未实际执行恢复、推送、签名、漏洞扫描或部署；许可证讨论仅作工程识别方法。

- S1：Git merge 官方手册，快进与合并关系
- S2：Git rebase 官方手册，重新应用与历史改写
- S3：Git restore 官方手册，文件恢复范围
- S4：Git reset 官方手册，引用、暂存与工作区的不同模式
- S5：Git revert 官方手册，以新提交撤回及合并父关系
- S6：Git reflog 官方手册，本地引用记录与过期
- S7：Git bisect 官方手册，好坏判据与跳过
- S8：Michael Nygard，Documenting Architecture Decisions，ADR原始说明
- S9：Semantic Versioning 2.0.0，公开API与版本语义
- S10：Google SRE Workbook Canarying Releases，渐进发布与判据
- S11：GitHub Secure use reference，工作流权限与第三方执行风险
- S12：Open Source Initiative MIT License，许可原文
- S13：Apache Software Foundation Apache License 2.0，许可原文
- S14：SPDX Overview，物料与相关信息表达
- S15：CycloneDX SBOM，组件关系与物料清单
- S16：CycloneDX VEX，产品漏洞影响状态表达
- S17：SLSA v1.0 About，供应链保障概念
- S18：SLSA v1.0 Provenance，来源证明结构与语义
- S19：Sigstore Verifying Signatures，签名与身份验证

[S1]: https://git-scm.com/docs/git-merge
[S2]: https://git-scm.com/docs/git-rebase
[S3]: https://git-scm.com/docs/git-restore
[S4]: https://git-scm.com/docs/git-reset
[S5]: https://git-scm.com/docs/git-revert
[S6]: https://git-scm.com/docs/git-reflog
[S7]: https://git-scm.com/docs/git-bisect
[S8]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[S9]: https://semver.org/
[S10]: https://sre.google/workbook/canarying-releases/
[S11]: https://docs.github.com/en/actions/reference/security/secure-use
[S12]: https://opensource.org/license/mit
[S13]: https://www.apache.org/licenses/LICENSE-2.0
[S14]: https://spdx.dev/learn/overview/
[S15]: https://cyclonedx.org/capabilities/sbom/
[S16]: https://cyclonedx.org/capabilities/vex/
[S17]: https://slsa.dev/spec/v1.0/about
[S18]: https://slsa.dev/spec/v1.0/provenance
[S19]: https://docs.sigstore.dev/cosign/verifying/verify/
