# 第二十七章 运行可靠性与平台工程 资料与核验说明

核验日期：2026-10-03。本章四项规划主题均有完整正文，已完成与作者自审分开的事实和阅读复核。技术示例未编译、未执行，构造案例和算式不作实测或生产适用证明。图片有原创记录或逐项来源与使用条件。章节校样已经检查，部分术语和引用格式修改仍需随全书合版复核；最终PDF与EPUB尚未验收。

## 来源与阅读边界

以下资料于2026-10-03打开核验。所有数量例子均为教学假设，未运行负载测试、修改集群、部署配置或进行事故演练。官方机制随版本与平台存在差异，本章未声称某个滚动文档标题对应当前已部署环境。

- S1：[Google SRE Workbook Implementing SLOs](https://sre.google/workbook/implementing-slos/)，用户指标与错误预算
- S2：[Prometheus Histograms and summaries](https://prometheus.io/docs/practices/histograms/)，分布聚合与分位数边界
- S3：[Google SRE Workbook Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)，预算消耗和多窗口告警
- S4：[OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)，日志、指标与追踪
- S5：[Prometheus Metric and label naming](https://prometheus.io/docs/practices/naming/)，单位与标签基数
- S6：[OpenTelemetry Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)，跨执行边界关联
- S7：[Google SRE Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)，用户症状与可行动监控
- S8：[Google SRE Workbook Incident Response](https://sre.google/workbook/incident-response/)，事故角色与处置
- S9：[Google SRE Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)，系统性复盘与行动
- S10：[Docker What is a container](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)，容器与运行环境
- S11：[Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)，持久卷生命周期
- S12：[Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)，requests、limits及资源差异
- S13：[Kubernetes Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)，启动、就绪与存活检查
- S14：[Kubernetes Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)，终止与进程生命周期
- S15：[Kubernetes ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)，不同消费方式的更新行为
- S16：[Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)，控制循环与指标
- S17：[CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)，面向使用者的平台能力
- S18：[FinOps Unit Economics](https://www.finops.org/framework/capabilities/unit-economics/)，成本与业务单位
- S19：[Kubernetes Multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/)，控制面与数据面隔离
- S20：[Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)，策略与网络实现前提
- S21：[OpenTelemetry Collector Resiliency](https://opentelemetry.io/docs/collector/resiliency/)，队列、重试与持久化的丢失边界
- S22：[OpenTelemetry Sampling](https://opentelemetry.io/docs/concepts/sampling/)，头部与尾部采样的范围
- S23：[Gil Tene wrk2原始项目说明](https://github.com/giltene/wrk2)，计划到达与协调遗漏；未运行该工具

[S1]: https://sre.google/workbook/implementing-slos/
[S2]: https://prometheus.io/docs/practices/histograms/
[S3]: https://sre.google/workbook/alerting-on-slos/
[S4]: https://opentelemetry.io/docs/concepts/signals/
[S5]: https://prometheus.io/docs/practices/naming/
[S6]: https://opentelemetry.io/docs/concepts/context-propagation/
[S7]: https://sre.google/sre-book/monitoring-distributed-systems/
[S8]: https://sre.google/workbook/incident-response/
[S9]: https://sre.google/sre-book/postmortem-culture/
[S10]: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
[S11]: https://kubernetes.io/docs/concepts/storage/persistent-volumes/
[S12]: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
[S13]: https://kubernetes.io/docs/concepts/workloads/pods/probes/
[S14]: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
[S15]: https://kubernetes.io/docs/concepts/configuration/configmap/
[S16]: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
[S17]: https://tag-app-delivery.cncf.io/whitepapers/platforms/
[S18]: https://www.finops.org/framework/capabilities/unit-economics/
[S19]: https://kubernetes.io/docs/concepts/security/multi-tenancy/
[S20]: https://kubernetes.io/docs/concepts/services-networking/network-policies/
[S21]: https://opentelemetry.io/docs/collector/resiliency/
[S22]: https://opentelemetry.io/docs/concepts/sampling/
[S23]: https://github.com/giltene/wrk2
