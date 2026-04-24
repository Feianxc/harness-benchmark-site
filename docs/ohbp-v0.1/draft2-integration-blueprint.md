# OHBP / harnessbench v0.1-draft2 主控整合蓝图

> 状态：基于 A/B/C/D/E 五个 repair packet 的主控整合提纲  
> 日期：2026-04-20  
> 用途：指导将 `v0.1-draft1` 修订为 `v0.1-draft2`

---

## 1. 结论先说

**第一轮修订团队已全部完成，当前已经具备进入 `ohbp-v0.1-draft2.md` 主控整合阶段的条件。**

本轮已落盘的五份修订包：

1. `repair-a-terminology-canonical-objects.md`
2. `repair-b-registration-completeness.md`
3. `repair-c-bundle-cli-contract.md`
4. `repair-d-governance-hardening.md`
5. `repair-e-adoption-launch.md`

### 当前判断

- 第一轮设计：完成
- 第一轮审核：完成
- 第二阶段修订输入：完成
- **下一步：主控整合为 `draft2`**

---

## 2. draft2 必须冻结的核心决策

以下决策应视为 `draft2` 的主控冻结项；除非整合过程中出现明确冲突，否则不再反复争论。

### D2-01. 信任层与公开状态分离

冻结三套正交字段：

- `requested_trust_tier`
- `trust_tier`
- `publication_state`

其中：

- `trust_tier` 是唯一权威分层字段
- storage enum 统一为：
  - `community`
  - `reproduced`
  - `verified`
- `Self-reported` 不再作为 tier enum，只保留为历史兼容 alias / 来源描述

### D2-02. `ranking_eligibility` 不再作为 M2 的裁决字段

处理方式：

- 从 M2 中移出权威裁决语义
- 如保留，改为 advisory hint
- 真正的 board admission / ranking policy 归属 M4

### D2-03. run-group 必须从“声明”升级为“注册 + 完整性证明”

新增双对象链：

1. `run-group-registration.json`
2. `completeness-proof.json`

作用：

- 前者冻结运行计划
- 后者由平台或 intake 侧证明“全量 attempts 已披露”

### D2-04. tolerance policy 只有一个权威挂载点

冻结规则：

- 唯一真源挂在 `Execution Contract.verification_policy.tolerance_policy`
- 其他模块只引用 digest / id，不重复定义另一套规则

### D2-05. 分母与状态机必须闭环

必须补足：

- task disposition / terminal states
- `declared_task_denominator`
- `scorable_task_denominator`
- 各状态进入 numerator / denominator 的规则

### D2-06. Verified 默认不混入 pseudo repeated

冻结原则：

- `true_seeded` 与 `pseudo_repeated` 默认分切片
- `true_seeded` 才是 Verified 的默认标准路径
- `pseudo_repeated` 若允许进入 Verified，必须附更严格门槛、单独标记或单独切片

### D2-07. 取消规范核心中的抽象 `score(...)`

对 `harness_lift` / `model_lift` 的处理：

- 从规范核心降级为 research / analysis 视图概念
- 主规范改为 “paired delta panel” 与多指标比较

### D2-08. final bundle 必须冻结为唯一 canonical layout

至少冻结：

- `manifest.json`
- `aggregate.json`
- `task-results.ndjson`
- `artifact-manifest.json`
- `checksums.sha256`
- `reports/evaluator-report.json`
- `trace/`
- `artifacts/`

并明确：

- raw run workspace ≠ final bundle
- `manifest.json` 是 runtime identity 单一真源

### D2-09. 高信任治理从声明式升级为证据式

必须吸收：

- public bundle / sealed audit bundle 双通道
- 高信任环境完整性要求
- trace 防篡改要求
- human interaction telemetry
- memory / cache / external KB 的隔离与证明机制

### D2-10. 协议必须补最小生态飞轮，而不是只定义真相生产

必须吸收：

- uploader / framework author / reproducer 三角色
- `community-light` / `reproducible-standard` / `verified-full`
- 主榜空心期过渡策略
- persona → recommended lane
- `scorecard view` / `research view`

---

## 3. draft2 整合的推荐章节结构

建议 `ohbp-v0.1-draft2.md` 在保持 draft1 骨架的前提下，按下列结构收敛。

### 3.1 总纲部分

保留并强化：

- 本稿定位
- 目标 / 非目标
- 设计原则
- 对象边界

新增：

- canonical state separation（trust / publication / admission）
- single source of truth 原则

### 3.2 Object Model 总表

建议在 draft2 增加一个显式对象清单，至少列出：

- Benchmark Card
- Task Package
- Execution Contract
- Lane
- Benchmark Health Record
- Run Manifest / Evidence Bundle
- Verification Record
- Run-group Registration
- Completeness Proof
- Ranking / Board Admission Policy

### 3.3 Verification & Governance 总表

建议新增一节，集中写：

- trust tier
- publication state
- autonomy mode
- admission policy
- sealed/public evidence policy

避免散在 M2/M4/M5/M6 之间。

### 3.4 Submission / Product Surface 总表

建议新增一节，集中写：

- submission profile
- uploader / reproducer / framework author
- scorecard view vs research view
- launch staging

---

## 4. 各模块的具体整合任务

## 4.1 M1 `foundations.md`

需要吸收：

- canonical trust tier 口径
- state separation（`requested_trust_tier` / `trust_tier` / `publication_state`）
- protocol / benchmark / ranking policy 边界再强调一次
- “wrapper 只能把人带入协议，不得发明第二套语义”
- 增加 submission profile / presentation view 的上位原则

### 建议新增小节

1. `Canonical State Separation`
2. `Single Source of Truth for Protocol Fields`
3. `Submission Profile vs Trust Tier vs Presentation View`

## 4.2 M2 `benchmark-execution.md`

需要吸收：

- `ranking_eligibility` 降级或迁出
- task disposition / denominator 规则挂钩
- `Execution Contract.verification_policy.tolerance_policy`
- `repeatability_class`（`true_seeded` / `pseudo_repeated`）
- board slice 发布门槛的输入字段

### 建议新增 / 调整

1. `Verification Policy` 子对象
2. `Repeatability Class`
3. `Task Disposition Interface`
4. `Lane Governance Hint`（若保留 advisory）

## 4.3 M3 `run-data-evidence.md`

需要吸收：

- final bundle canonical layout
- `manifest.json` identity fields
- `run-group-registration.json`
- `completeness-proof.json`
- public / sealed 双通道
- interaction telemetry
- environment / cache / state reset 报告

### 建议新增文件与对象表

- `run-group-registration.json`
- `completeness-proof.json`
- `interaction-log.jsonl`
- `reports/environment-report.json`
- `reports/trace-integrity.json`
- `reports/state-reset-report.json`
- `reports/cache-report.json`

## 4.4 M4 `trust-governance-ranking.md`

需要吸收：

- `verification_record` 或等价权威对象
- trust tier / publication state / board admission policy
- tolerance policy 的引用方式
- completeness verdict 与 tier eligibility 的关系
- `true_seeded` / `pseudo_repeated` 的 Verified 准入
- public / sealed 证据模型
- autonomy 审计边界

### 建议新增表格

1. tier 授予表
2. publication state 状态迁移表
3. board admission / display policy 表
4. evidence channel policy 表

## 4.5 M5 `cli-adapter.md`

需要吸收：

- raw run workspace 与 final bundle 分离
- 本地生命周期与平台治理状态分离
- adapter intermediate output → normalizer → final bundle
- `init` 阶段生成 registration
- `pack` 阶段生成 canonical bundle
- `upload` 阶段触发 completeness / verification 流程

### 需要特别改写的地方

- 去掉把 `reproduced` / `provisional` 混入本地生命周期的写法
- 把 CLI 语言改为 artifact lifecycle / command lifecycle

## 4.6 M6 `metrics-uncertainty.md`

需要吸收：

- 取消抽象 `score(...)`
- 引入 paired delta panel
- 分离 declared denominator 与 scorable denominator
- board slice 发布状态机：
  - `insufficient_evidence`
  - `comparison_only`
  - `ranked_tiered`
  - `ranked_ordinal`
- `true_seeded` / `pseudo_repeated` 默认分切片
- `scorecard view` / `research view`

---

## 5. 推荐整合顺序

为避免改到一半再次混乱，建议按以下顺序整合：

### Step 1：先整合 A（术语与边界）

先统一：

- `trust_tier`
- `publication_state`
- `requested_trust_tier`
- `ranking_eligibility` 的归属

**理由：** 不先统一术语，后续 B/C/D/E 的对象都可能挂错位置。

### Step 2：整合 B（registration / tolerance / statistical gates）

把最关键的“可比较性闭环”钉死：

- registration
- completeness proof
- tolerance policy
- task disposition
- board slice 发布门槛

### Step 3：整合 C（bundle / manifest / CLI contract）

冻结：

- final bundle layout
- manifest identity fields
- raw → normalized → final 的流

### Step 4：整合 D（治理硬化）

把高信任 tier 的“审计硬门槛”写入：

- public/sealed
- env integrity
- trace integrity
- interaction telemetry
- cache / memory proof

### Step 5：整合 E（adoption / launch）

最后补：

- submission profile
- persona 路径
- dual view
- staged launch

**理由：** E 依赖 A/B/C/D 给出的硬对象，但不应反过来影响底层规范。

---

## 6. draft2 必须显式新增的对象 / 字段 / 概念

### 6.1 对象

- `verification_record`
- `run-group-registration.json`
- `completeness-proof.json`
- `tolerance_policy`
- `lane_governance_hint`（若保留 advisory）
- `public bundle`
- `sealed audit bundle`
- `submission profile`

### 6.2 字段

- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `repeatability_class`
- `tolerance_policy_digest`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `trace_root_hash`
- `official_runner_attested`
- `memory_scope`
- `cache_namespace`
- `state_reset_proof`
- `human_event_count`
- `approval_event_count`
- `manual_file_write_detected`

### 6.3 视图 / 状态

- `scorecard view`
- `research view`
- `insufficient_evidence`
- `comparison_only`
- `ranked_tiered`
- `ranked_ordinal`

---

## 7. 仍需在 draft2 中显式记录的 trade-off

以下问题即使进入 draft2，也应保留为“结构性权衡”，而不是伪装成已完美解决。

### T-01. `pseudo_repeated` 能否进入 Verified

建议：

- 允许，但不作为默认路径
- 必须单独标记 / 单独切片 / 提高 run 数门槛

### T-02. Public vs Sealed 公开度

建议：

- 默认优先保 benchmark 健康
- 允许公众看到审计摘要与 digest
- 不强行公开会泄漏 hidden split 的完整内容

### T-03. Submission profile 是否进入协议核心

建议：

- 进入协议核心，但只定义 profile 概念与最低负担
- 不把运营奖励参数写死进规范

### T-04. `verification_record` 是否显式新建对象

建议：

- 最好显式新建
- 若不新建，至少也要在 M4 给出等价权威字段组与 owner 表

---

## 8. 建议的产物顺序

### 立即产物

1. 基于本蓝图起草：
   - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft2.md`

2. 起草时优先插入两个总表：
   - `Canonical State & Ownership Table`
   - `Canonical Bundle & Verification Object Table`

### draft2 完成后

3. 再拉起全新 reviewer 团队进行第二轮审核
4. 用同一 rubric 重新打分
5. 若仍有 P1，继续进入下一轮修订

---

## 9. 当前主控判断

当前项目已经从“想法验证 + 第一轮建模”进入了真正的协议工程阶段。

此时最关键的不是再增加更多新概念，而是：

> **把 A/B/C/D/E 五个 repair packet 收敛成一份没有命名冲突、对象冲突、状态冲突的 draft2。**

只要这个整合动作做得好，第二轮评审的目标就不再是“证明方向对”，而会变成：

> **验证 draft2 是否终于从 prose-first 迈入 object-first / rule-first。**
