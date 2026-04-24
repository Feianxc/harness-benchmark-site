# OHBP / harnessbench v0.1-draft1 问题台账（Issue Register）

> 状态：基于第一轮独立审核汇总，作为 draft2 修订输入  
> 日期：2026-04-20  
> 输入依据：`ohbp-v0.1-draft1.md` + `reviews/*.md`

---

## 1. 结论先说

**draft1 已完成第一轮设计与第一轮独立审核，当前可以进入 draft2 修订，但还不能冻结为正式 v0.1。**

当前已确认：

- **P0：0**
- **P1：存在且跨模块集中**
- **总评：不满足 stop condition**

不满足停止条件的原因：

1. 6 个维度未全部达到 10/10
2. 仍存在多项 **P1**
3. 若直接冻结，会把关键状态机、容差、完整性证明、治理硬门槛留在 prose 层

---

## 2. 本轮审核快照

| 来源 | 结论摘要 |
|---|---|
| `review-methodology.md` | 整体 **48/60**；无 P0；有 5 个 P1 |
| `review-governance-redteam.md` | 治理可信度 **6.8/10**；无明确 P0；有 5 个主要 P1 |
| `review-ecosystem-product.md` | adoption **8.7/10**；有 1 个 P1（冷启动 / 飞轮）与若干 P2 |
| `review-implementation.md` | 整体 **45/60**；无 P0；有 4 个主要 P1 |
| `review-scoreboard.md` | 总评 **50/60**；明确要求进入 draft2 修订 |

---

## 3. 问题去重原则

本台账按以下方式去重：

1. **同一结构性缺口只保留一个 canonical issue**
2. 若多个 reviewer 指向同一问题，则在 `来源` 中合并列出
3. issue 优先按 **是否阻断 draft2 收敛** 划分为 P1 / P2
4. `拟修复流` 不是最终作者归属，而是用于下一轮多 AGENT 修订分工

---

## 4. 已去重的 P1 问题

| ID | 级别 | 问题摘要 | 主要来源 | 影响模块 | 拟修复流 |
|---|---|---|---|---|---|
| IR-01 | P1 | Trust tier 命名、存储枚举、显示标签、状态机关系未统一 | Scoreboard / Implementation | M1 M4 M5 M6 Draft1 | A. Terminology & Canonical Objects |
| IR-02 | P1 | 缺少 run-group preregistration / completeness proof 对象，无法证明全量 attempts 已披露 | Governance / Implementation / Scoreboard | M3 M4 M5 M6 Draft1 | B. Registration / Completeness |
| IR-03 | P1 | Reproduced / Verified 的 tolerance policy 没有唯一挂载点 | Implementation / Scoreboard | M4 M5 M6 Draft1 | B. Registration / Completeness |
| IR-04 | P1 | 缺少统一的 task disposition / denominator 规范，统计口径未闭环 | Methodology | M2 M3 M6 Draft1 | B. Registration / Completeness |
| IR-05 | P1 | `true seeded` 与 `pseudo repeated` 的 Verified 准入规则未钉死 | Methodology | M4 M6 Draft1 | B. Registration / Completeness |
| IR-06 | P1 | `harness_lift` / `model_lift` 依赖未定义的 `score(...)`，与“拒绝神圣总分”冲突 | Methodology | M6 Draft1 | B. Registration / Completeness |
| IR-07 | P1 | `ranking_eligibility` 让 benchmark/execution 层轻微污染 ranking policy 层 | Methodology / Implementation | M2 M4 Draft1 | A. Terminology & Canonical Objects |
| IR-08 | P1 | board slice 的公开发布统计门槛未定义 | Methodology | M6 Draft1 | B. Registration / Completeness |
| IR-09 | P1 | bundle 根目录命名与 M3/M5 契约未收敛为唯一规范 | Implementation | M3 M5 Draft1 | C. Bundle / CLI Contract |
| IR-10 | P1 | M2/M3/M5/M6 关键字段闭环未完成，缺少统一 runtime identity fields | Implementation | M2 M3 M5 M6 Draft1 | C. Bundle / CLI Contract |
| IR-11 | P1 | hidden split / private audit 缺少 public vs sealed 双通道证据模型 | Governance | M3 M4 M5 Draft1 | D. Governance Hardening |
| IR-12 | P1 | 高信任 tier 的环境完整性 / trace 防篡改门槛过软 | Governance | M3 M4 M5 Draft1 | D. Governance Hardening |
| IR-13 | P1 | autonomous / human-assisted 主要靠声明，缺少可审计交互遥测 | Governance | M3 M4 M5 Draft1 | D. Governance Hardening |
| IR-14 | P1 | cache / persistent memory / external KB 只有声明，没有隔离与证明机制 | Governance | M3 M4 M5 Draft1 | D. Governance Hardening |
| IR-15 | P1 | 贡献者飞轮 / 复现者飞轮 / 早期主榜过空的产品化闭环不够硬 | Ecosystem / Product | M1 M2 M3 M4 M5 Draft1 | E. Adoption & Launch |

---

## 5. 每个 P1 的 draft2 验收标准

### IR-01：Trust tier canonical enum 统一

**draft2 必须新增：**

- 单一真源表：`storage_enum` / `display_label` / `ranking_eligibility` / `min_evidence`
- 明确 `community` 是否等价于 `self_reported`
- 明确 `reproduced` 与 `reproducible` 的边界

**验收标准：**

- CLI、bundle、API、UI 使用同一状态机
- 全稿不再出现互相竞争的 tier 命名

### IR-02：run-group preregistration / completeness proof

**draft2 必须新增一个 canonical object**，名称可在 draft2 内最终定稿，例如：

- `study-registration`
- `run-group-manifest`
- `attempt-set-proof`

**该对象至少应覆盖：**

- `registration_id`
- `registration_receipt`
- `attempt_plan_hash`
- `declared_attempt_total`
- `seed_list_hash`
- `attempt_index`
- `submission_window`
- `completeness_verdict`

**验收标准：**

- 能程序化判断某个 `run_group_id` 是否完整上传
- 未绑定预注册承诺的结果不得升入高信任 tier

### IR-03：统一 tolerance policy 对象

**draft2 必须给出唯一挂载点**，例如：

- `reproduction_tolerance_policy`
- `verification_agreement_policy`

**至少明确：**

- 作用域：benchmark / lane / execution contract / verification tier
- 指标维度：success / cost / latency / crash / timeout
- deterministic 与 stochastic lane 的差异
- replay vs reproduce 的判定规则

### IR-04：task disposition / denominator 规范

**draft2 必须补统一 task terminal states 与分母规则**，至少覆盖：

- `succeeded`
- `failed`
- `timeout`
- `crash`
- `evaluator_error`
- `policy_violation`
- `not_attempted`
- `skipped`
- `redacted`

并说明：

- 各状态是否进入 numerator / denominator
- 何种情况下允许 repair / rerun

### IR-05：Verified 准入中的 `true seeded` vs `pseudo repeated`

**draft2 必须明确：**

- `pseudo repeated` 能否进入 Verified
- 若能，附加门槛是什么
- 若不能，应进入哪个 tier / label

### IR-06：`harness_lift` / `model_lift` 的口径

**draft2 必须避免抽象 `score(...)` 成为事实上的神圣总分。**

可接受的收敛方式：

1. 删除 lift 指标；或
2. 改为在明确切片下引用具体指标族；或
3. 仅保留为 research appendix，不进入默认主视图

### IR-07：`ranking_eligibility` 边界泄漏

**draft2 必须明确：**

- benchmark / execution 层只能给 advisory signals
- 最终榜单资格由 ranking / governance policy 决定

### IR-08：board slice 最低公开门槛

**draft2 必须写明：**

- 最低样本量
- 最低 run-group 数
- 是否允许仅显示区间不显示排序
- 稀疏切片如何降级为“观察中 / insufficient evidence”

### IR-09：bundle 根目录与文件命名冻结

**draft2 必须冻结唯一 bundle layout**，明确：

- MUST 文件
- MAY 文件
- 命名风格（`task-results.ndjson` vs `task_results.ndjson` 等）

### IR-10：关键字段闭环

**draft2 必须把关键 runtime identity fields 收敛到唯一挂载点**，至少包括：

- `task_package_digest`
- `execution_contract_digest`
- `adapter_digest`
- `preset_id` 或 `adapter_resolution_digest`
- `budget_policy_id`
- `tool_policy_id`

### IR-11：hidden split 双通道证据模型

**draft2 必须补：**

- `public_bundle`
- `sealed_audit_bundle`
- `release_policy`
- `visibility_class`
- `sealed_bundle_digest`

并写明：

- 哪些 tier / lane / split 必须 sealed
- 哪些内容在 benchmark active 期间不得公开

### IR-12：高信任 tier 的环境完整性与 trace 防篡改

**draft2 必须提升部分 SHOULD 为 MUST**，至少对高信任 tier 约束：

- `container_digest`
- `network_policy_digest`
- `artifact-manifest.json`
- `trace_root_hash`
- `attestation.json` 或等价官方执行证明

### IR-13：human interaction telemetry

**draft2 必须定义统一交互遥测对象**，至少包括：

- `interaction-log.jsonl`
- `human_event_count`
- `approval_event_count`
- `tty_input_digest`
- `manual_file_write_detected`

并写明：

- `autonomous`
- `approval-only`
- `interactive`

三者边界。

### IR-14：memory / cache / external KB 证明机制

**draft2 必须补：**

- `memory_scope`
- `cache_namespace`
- `state_reset_policy`
- `state_reset_proof`
- `external_kb_enabled`
- `external_kb_digest_list`

并写明：

- 哪些配置默认不得进入通用主榜
- 哪些 lane 可合法允许更强记忆 / 缓存

### IR-15：参与者飞轮与主榜空心期策略

**draft2 必须新增产品化闭环说明**，至少覆盖：

- uploader 激励
- reproducer / auditor 激励
- framework author 激励
- Community → Reproduced → Verified 升级路径
- 主榜空心期过渡策略

---

## 6. P2 跟进项（非阻断，但建议 draft2 一并收口）

| ID | 级别 | 问题摘要 | 主要来源 | 建议 |
|---|---|---|---|---|
| IR-16 | P2 | 提交 profile 分层不够明确 | Ecosystem / Product | 增加 `community-light` / `reproducible-standard` / `verified-full` |
| IR-17 | P2 | Persona → lane 推荐路径不够清楚 | Ecosystem / Product | 增加 onboarding lane / prestige lane 默认路线 |
| IR-18 | P2 | scorecard view 与 research view 双层呈现未明确 | Ecosystem / Product | 区分默认产品视图与研究视图 |
| IR-19 | P2 | adapter 中间产物到最终 bundle 的映射图缺失 | Implementation / Scoreboard | 增加 normalizer mapping appendix |
| IR-20 | P2 | 缺少字段归属矩阵 / single source of truth appendix | Scoreboard / Implementation | 补字段所属对象、模块、MUST/SHOULD 表 |

---

## 7. 建议的 draft2 修复流（用于下一轮多 AGENT 分工）

### 修复流 A：Terminology & Canonical Objects

负责：

- IR-01
- IR-07
- IR-20

目标：

- 统一枚举、对象归属与术语边界

### 修复流 B：Registration / Completeness / Statistical Gates

负责：

- IR-02
- IR-03
- IR-04
- IR-05
- IR-06
- IR-08

目标：

- 让 run-group、verification、统计发布门槛真正闭环

### 修复流 C：Bundle / CLI Contract Convergence

负责：

- IR-09
- IR-10
- IR-19

目标：

- 形成唯一、可直接编码的 bundle / manifest / adapter 合同

### 修复流 D：Governance Hardening

负责：

- IR-11
- IR-12
- IR-13
- IR-14

目标：

- 把高信任 tier 的反作弊要求从原则层推进到审计层

### 修复流 E：Adoption & Launch

负责：

- IR-15
- IR-16
- IR-17
- IR-18

目标：

- 解决协议正确但生态冷启动过弱的问题

---

## 8. 下一步执行顺序

1. 将 Phase 2 标记为完成，Phase 3 标记为 in progress
2. 按修复流 A–E 拉起新的 draft2 修订 AGENT 团队
3. 每个 AGENT 先产出各自 repair packet，不直接并发改写同一主文档
4. 主控整合 repair packets，生成 `ohbp-v0.1-draft2.md`
5. 再拉起一轮新的 reviewer 团队，重复打分

---

## 9. 当前判断

**项目状态良好：不是“推倒重来”，而是“第一轮设计成功、第一轮审核完成、进入结构化修补阶段”。**

当前最重要的不是继续发散想法，而是：

> **把 P1 从 prose 缺口收敛为 canonical object、canonical enum、canonical rule。**
