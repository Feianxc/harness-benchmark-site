# OHBP / Harness 评测研究 Agent Team

## 一句话目标

为 `E:/工作区/10_Projects_项目/harness测评网站` 提供一套**长期可复用**的多 Agent 研究团队，用来持续研究：

- harness 评测维度
- 排名与统计方法
- 上传与真实性保证
- benchmark 污染与治理
- consumer 导购层与 verifier-backed evidence 层的边界

这套团队的默认目标不是“写一份漂亮总分”，而是：

> **把 OHBP 从 curated demo 逐步推进成 verifier-backed benchmark authority。**

---

## 团队编制

| 角色 | 文件 | 核心职责 | 默认边界 |
| --- | --- | --- | --- |
| Harness 算法审计官 | `.codex/agents/harness_algo_auditor.toml` | 审计本地代码中的分数来源、公式、排序逻辑、文案边界 | 只读，本地审计 |
| 公开方法研究员 | `.codex/agents/public_benchmark_methodologist.toml` | 调研 HELM、SWE-bench、WebArena、GAIA、Arena、LiveBench 等方法 | 一手来源优先 |
| 提交流程架构师 | `.codex/agents/submission_authenticity_architect.toml` | 设计 bundle、upload、复算、复跑、分层发布、争议治理 | 面向协议与后端 |
| 治理红队 | `.codex/agents/governance_redteam.toml` | 批判刷榜、过拟合、污染、误导用户等攻击面 | 只做风险放大与底线校验 |
| 统计仲裁官 | `.codex/agents/statistical_arbiter.toml` | CI、rank spread、paired delta、slice、tier/rank band | 只裁决统计语义 |
| 研究主席 | `.codex/agents/research_synthesis_chair.toml` | 汇总各方结论、形成路线图与阶段决策 | 保留最终综合权 |

---

## 默认辩论工作流

### Round 1 — 本地现实审计

由 **Harness 算法审计官** 先回答：

1. 当前 consumer 排名到底是不是静态策展；
2. 当前公式、维度、host fit、top card 是如何生成的；
3. 当前 verifier-core / mock-intake / hb-cli 已经具备哪些真实性骨架；
4. 文档目标与实现落差在哪里。

### Round 2 — 外部方法引入

由 **公开方法研究员** 输出：

1. 可借鉴的方法来源；
2. 核心机制；
3. 可映射到 OHBP 的规则；
4. 不适用点。

### Round 3 — 真相链设计

由 **提交流程架构师** 回答：

1. 上传对象模型；
2. intake / recompute / rerun 的分工；
3. trust tier 与 publication state；
4. hidden split / sealed evidence / artifact store 的最小方案。

### Round 4 — 红队拆解

由 **治理红队** 专门攻击：

- selective reporting
- benchmark tuning
- hidden human assistance
- contamination
- environment mismatch
- 微小差距被过度排名
- consumer 视觉权威先于真实验证落地

### Round 5 — 统计裁决

由 **统计仲裁官** 决定：

- 何时能给 rank
- 何时只能给 tier
- 什么是 headline metric
- 哪些 UI 必须常驻 uncertainty

### Round 6 — 主席收敛

由 **研究主席** 输出：

1. 最终结论
2. 已验证事实
3. 工程推断
4. 风险边界
5. 路线图

---

## 默认研究议题清单

### A. 当前算法层

1. 当前 consumer 维度是否合理；
2. 当前 55/45 公式是否只适合作为 cold-start prior；
3. top cards 是否应继续作为 editorial layer；
4. host fit 是否应该迁移成 empirical host slice。

### B. 真榜层

1. Official Board 的最小 slice 是什么；
2. 是否先只做 `fixed_model_compare_harness`；
3. repeated-run 最低门槛；
4. CI / rank spread / top-k probability 的展示策略。

### C. 上传与真实性

1. upload 是否必须带 bundle_path / immutable artifact ref；
2. 平台何时只复算，何时必须复跑；
3. sealed evidence 由谁持有；
4. dispute / invalidation 如何落地。

### D. 污染与治理

1. hidden / rotating split 策略；
2. freshness / contamination / validity 的 health snapshot；
3. benchmark-tuned 与 general-purpose 的分榜；
4. support count / popularity 是否允许进入 UI。

---

## 证据优先级

### 一级证据

- 本仓库真实代码与文档
- 论文
- 官方 benchmark / leaderboard 方法页
- 官方 submission / audit / rules 文档

### 二级证据

- 官方博客
- 官方 changelog
- 官方 discussion / FAQ

### 三级证据

- 社区讨论
- 非官方综述

默认要求：

1. 本地事实先看代码；
2. 外部方法先看一手来源；
3. 任何工程建议都要标注是“已验证事实”还是“推断”。

---

## 输出契约

每轮研究默认至少输出 5 段：

1. **结论**
2. **已确认事实**
3. **推断**
4. **风险**
5. **建议**

禁止输出：

- 只给总分，不给依据
- 对未读取代码做行为推测
- 把 consumer demo 包装成已验证真榜

---

## Stop Condition

当且仅当以下问题都已有明确答案时，本团队可认为一个研究轮次完成：

1. 当前问题属于 consumer demo、Evidence Board、还是 protocol/runtime；
2. 该问题需要本地审计、外部调研、还是两者结合；
3. 已给出至少一个可执行下一步；
4. 已明确哪些仍未验证。

---

## 当前推荐优先级

1. **先做 Evidence Board 的真榜语义**，不要继续强化 consumer 假榜感；
2. **先做平台复跑与 artifact store**，不要只停留在 bundle 校验；
3. **先把统计字段名实一致**，再公开更多指标；
4. **先禁用 Evidence 层 demo fallback**，再谈官方结论层传播。

---

## 备注

本文件是项目级研究团队编排说明，不替代根目录 `AGENTS.md`。  
`AGENTS.md` 继续负责仓库通用规范；本文件只负责**harness / benchmark 研究团队**的角色分工与辩论流程。
