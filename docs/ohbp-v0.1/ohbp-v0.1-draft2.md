# OHBP / harnessbench 协议草案 v0.1-draft2

> 状态：已整合第一轮 review 与第二轮 repair packets，待进入第二轮独立审核  
> 日期：2026-04-20  
> 目标：形成一套开放、版本化、可复现、可审计、可分层治理的 **Open Harness Benchmark Protocol**

---

## 0. 本稿定位

这不是一个“排行榜网站 PRD”，也不是“某个 benchmark 数据集规范”。  
本稿定义的是一套协议草案，用来支持：

- 用统一 CLI 或 wrapper 执行 benchmark
- 为任意 harness / agent / scaffold 产出结构化、可审计证据
- 把结果按信任层级与公开状态纳入平台
- 在 **固定模型，只换 harness** 等可比切片内形成高可信公共结论

本稿的总原则仍然是：

> **证据优先于分数；协议优先于产品；分层信任优先于单一总榜。**

draft2 的核心升级不是“再多写一些建议”，而是把 draft1 中若干 prose-first 的部分，收敛成：

- canonical field
- canonical object
- canonical state
- canonical bundle contract
- canonical verification gate

---

## 1. 协议要解决的问题

OHBP 试图解决的不是“再做一个页面更好看的排行榜”，而是：

1. 现有结果经常把 **model / harness / prompt / tool / benchmark-tuning / human intervention** 混在一起
2. 很多结果只有摘要分，没有 **可审计证据包**
3. 自报结果容易被 **best-of-N、选择性上报、缓存答案、持久记忆污染、人工修补、伪造 trace、环境作弊** 污染
4. benchmark 本身会 **老化、污染、失真**
5. 单次 run 波动很大，容易把“运气好的一次”误当成能力
6. 即使协议合理，也可能因为 **参与者飞轮不成形** 导致主榜长期空心

因此，OHBP v0.1 的回答不是“神圣总榜”，而是：

- 定义统一对象边界
- 定义统一执行与证据合同
- 定义统一的注册、完整性证明与容差规则
- 定义分层信任、公开状态与治理体系
- 定义多维指标、切片发布门槛与不确定性披露

---

## 2. v0.1 的目标与非目标

### 2.1 目标

OHBP v0.1 的目标是定义一个 **最小但闭环** 的协议骨架，支持从本地运行、证据打包、上传、复验、分层展示到后续争议处理的流程。

核心目标：

1. 定义统一协议对象：
   - Benchmark Card
   - Task Package
   - Execution Contract
   - Run-group Registration
   - Run Manifest
   - Evidence Bundle
   - Completeness Proof
   - Verification Record
   - Ranking / Board Admission Policy

2. 让“可审计证据”成为一等公民

3. 支持三类关键比较视角：
   - 固定模型，只换 harness
   - 固定 harness，只换模型
   - model × harness 适配矩阵

4. 内建分层信任：
   - Community
   - Reproduced
   - Verified

5. 将 benchmark health 纳入协议层，而不是事后注释

6. 把“冷启动产品层”最小化写入协议边界：
   - submission profile
   - participant roles
   - scorecard / research dual view

### 2.2 非目标

v0.1 明确不做：

1. 不定义唯一正确的全球总榜
2. 不统一所有 benchmark 的具体题目内容
3. 不规定 harness 内部架构必须怎么设计
4. 不承诺一次性解决全部作弊问题
5. 不把运营细节、积分公式、奖励额度写死进协议
6. 不强制公开全部私有 prompt、闭源代码或密封审计内容

---

## 3. 核心设计原则

OHBP v0.1-draft2 以以下原则为准：

1. **Evidence over Claims**
2. **Protocol over Product**
3. **Measurement separated from Policy**
4. **Clear Object Boundaries**
5. **Version Everything Critical**
6. **Layered Trust over Single Truth**
7. **Deterministic First**
8. **Compare Like with Like**
9. **Benchmark Health is First-class**
10. **MVP-first**
11. **Ecosystem Neutrality**
12. **Disputable / Revisable / Archivable**
13. **Single Source of Truth for Canonical Fields**
14. **Submission Profile ≠ Trust Tier ≠ Publication State**

---

## 4. Canonical state separation 与对象边界

draft2 在结构上的第一条硬升级，是把几类过去容易混用的状态显式拆开。

### 4.1 Canonical state separation

协议至少区分三套正交状态：

1. **`requested_trust_tier`**
   - 提交方请求进入哪个信任层级
   - 是 CLI / upload 的输入语义
   - 不是最终授予结果

2. **`trust_tier`**
   - 平台最终授予的信任层级
   - 是唯一权威分层字段
   - 只允许：
     - `community`
     - `reproduced`
     - `verified`

3. **`publication_state`**
   - 平台公开 / 争议 / 失效 / 归档状态
   - 与 `trust_tier` 正交
   - 至少包括：
     - `submitted`
     - `provisional`
     - `published`
     - `disputed`
     - `corrected`
     - `invalidated`
     - `rejected`
     - `archived`

**规范要求：**

- `invalidated` 不是 trust tier
- `published` 不是 trust tier
- `Self-reported` 不再作为 canonical tier enum，只保留为来源描述或兼容 alias

### 4.2 Canonical field / enum 总表

| 概念 | Canonical field | Display label | Storage enum / form | Owner |
|---|---|---|---|---|
| 平台授予的信任层级 | `trust_tier` | `Community` / `Reproduced` / `Verified` | `community` / `reproduced` / `verified` | M4 |
| 提交方请求层级 | `requested_trust_tier` | `Community request` / `Reproduced request` / `Verified request` | 与 `trust_tier` 同值域 | M5 → M4 |
| 平台公开状态 | `publication_state` | `Submitted` / `Provisional` / `Published` / `Disputed` / `Corrected` / `Invalidated` / `Rejected` / `Archived` | `lowercase_snake_case` | M4 |
| 自主程度（审计叶子模式） | `autonomy_mode` | `Autonomous` / `Approval-only` / `Interactive` | `autonomous` / `approval_only` / `interactive` | M4 |
| 比较模式 | `comparison_mode` | `Fixed model → compare harness` / `Fixed harness → compare model` / `System combination board` | `fixed_model_compare_harness` / `fixed_harness_compare_model` / `system_combination` | M4 |
| M2 的治理建议 | `lane_governance_hint.max_recommended_trust_tier` | ceiling label | 与 `trust_tier` 同值域 | M2 |
| M4 的权威准入 | `board_admission_policy.max_allowed_trust_tier` | 与 `trust_tier` 同 display | 与 `trust_tier` 同值域 | M4 |

说明：

- `human_assisted` 可以作为展示层 umbrella prose，但不作为 v0.1-draft2 的审计叶子枚举
- `verification_tier` 视为历史 alias，canonical field 统一收敛为 `trust_tier`

### 4.3 对象边界

OHBP 继续明确区分以下对象：

#### Protocol
负责定义：
- 对象
- 工作流
- 最低字段要求
- 信任层级与治理接口

#### Benchmark
负责定义：
- 测什么
- 任务集合
- evaluator
- 健康元数据

#### Harness
负责定义：
- 如何在合同内执行任务
- 如何产出运行结果与证据

#### Ranking Policy
负责定义：
- 哪些结果进哪张榜
- 如何过滤
- 如何聚合
- 如何展示

关键边界：

- `Protocol ≠ Benchmark`
- `Benchmark ≠ Ranking Policy`
- `Harness ≠ 上传者身份`
- `Trust Tier ≠ Publication State`
- `Submission Profile ≠ Trust Tier`
- `CLI lifecycle ≠ Platform governance state`

---

## 5. 协议对象总览

### 5.1 Benchmark & Execution 层

该层定义：

1. **Benchmark Card**
2. **Task Package**
3. **Execution Contract**
4. **Lane**
5. **Benchmark Health Record**

最小可比条件：

- `benchmark.id`
- `benchmark.version`
- `task_package.digest`
- `execution_contract.digest`
- `benchmark.lane_id`

若缺任一对象，结果不得视为“可比较”。

### 5.2 Run & Evidence 层

该层定义：

- `study_id`
- `run_group_id`
- `attempt_id`
- `bundle_id`
- `registration_id`
- `proof_id`

并规定：

> **一个 final bundle 对应一个 `attempt_id`；多次 repeated runs 通过 `run_group_id` 关联，不在 v0.1 混装。**

### 5.3 Governance & Ranking 层

该层定义：

- `verification_record`
- `lane_governance_hint`
- `board_admission_policy`
- `board_slice`

其中：

- `verification_record` 是信任层级与公开状态的权威真源
- `board_slice` 是派生对象，不是 CLI 上传字段

### 5.4 Submission & Product Surface 层

该层定义：

- `submission_profile`
- `scorecard_view`
- `research_view`
- `participant_role`

其中：

- `submission_profile` 决定证据负担与 UX 档位
- `trust_tier` 决定平台公开可信度
- 二者不得混用

---

## 6. CLI-first 执行层

OHBP v0.1-draft2 明确：

> **CLI 是标准执行层；SKILL / plugin / slash command / wrapper 只是入口包装，不得发明第二套 bundle、manifest、tier 或 ranking 语义。**

Canonical command：

```bash
harnessbench
```

可选短别名：

```bash
hb
```

核心命令族：

- `doctor`
- `init`
- `run`
- `pack`
- `upload`
- `replay`
- `reproduce`
- `inspect`
- `preset list`
- `adapter init`
- `adapter validate`

### 6.1 CLI 生命周期

CLI 的本地 artifact 生命周期只表达本地流程：

```text
initialized -> executed -> packed -> uploaded
```

说明：

- `replay`
- `reproduce`

是命令或工作流动作，不是本地 study 状态。

以下术语不应再作为 CLI 本地生命周期终态：

- `reproduced`
- `verified`
- `published`
- `provisional`

这些都属于平台治理语义。

### 6.2 raw run workspace ≠ final bundle

draft2 冻结一个关键分层：

1. **raw run workspace**
   - 面向执行与调试
   - 保存 adapter 原始输出
   - 可保留实现细节

2. **final bundle**
   - 面向上传、复算、复验、平台 intake
   - 必须使用 canonical layout
   - 由 `pack` 归一化生成

推荐本地语义结构：

```text
.hb/
  study.json
  runs/
    run_<id>/
      run-metadata.json
      adapter-resolution.json
      tasks/
        <task_id>/
          result.json
          trace.jsonl
          stdout.log
          stderr.log
          artifacts/
  bundles/
    <bundle_id>/
      ...canonical final bundle...
```

### 6.3 preset 与 custom adapter

- preset：降低上手成本
- custom adapter：保证开放性

二者最终都必须解析成：

- adapter 配置
- `runtime.adapter_digest`
- `runtime.adapter_resolution_digest`
- `runtime.preset_id`（如适用）
- launcher 定义
- capability 声明

### 6.4 Custom Adapter 最小原始合同

CLI 传入：

- `OHBP_STUDY_ID`
- `OHBP_RUN_GROUP_ID`
- `OHBP_ATTEMPT_ID`
- `OHBP_BENCHMARK_MANIFEST`
- `OHBP_EXECUTION_CONTRACT`
- `OHBP_TASK_PACKAGE`
- `OHBP_OUT_DIR`
- `OHBP_WORK_DIR`
- `OHBP_SEED`
- `OHBP_MODEL_REF`

adapter 至少产出原始工件：

- `result.json`
- `trace.jsonl`
- `artifacts/`
- `stdout.log`
- `stderr.log`

这些是 **raw output**，不是 final bundle schema。

### 6.5 submission profile

OHBP v0.1-draft2 至少支持三档稳定 profile：

| Profile ID | 定位 | 典型目标 | 默认 intake 方向 |
|---|---|---|---|
| `community_light` | 低摩擦首跑 / 闭源试跑 / 快速接入 | 先形成公共样本 | Community |
| `reproducible_standard` | 可 replay / 可 reproduce 的严肃提交 | 进入 Reproduced 候选层 | Reproduced candidate |
| `verified_full` | 冲击官方默认结论层的高影响提交 | 进入 Verified 候选层 | Verified candidate |

**规范要求：**

- `submission_profile ≠ trust_tier`
- CLI / upload receipt **SHOULD** 反馈：
  - 当前 profile
  - 当前 `trust_tier`
  - 下一升级缺口
  - 是否进入 reproduce / verified 队列

---

## 7. Registration / Completeness / Tolerance

### 7.1 run-group registration

draft2 明确引入：

- `run-group-registration.json`

其作用是：

- 冻结 run-group 的比较边界
- 冻结 attempt 计划
- 冻结重复运行类型
- 在首个 attempt 开始前完成声明

最小关键字段包括：

- `registration_id`
- `study_id`
- `run_group_id`
- `registration_mode`
- `registration_receipt`（connected mode）
- `benchmark_id`
- `benchmark_version`
- `lane_id`
- `split`
- `task_package_digest`
- `execution_contract_digest`
- `tolerance_policy_digest`
- `repeatability_class`
- `declared_attempt_total`
- `declared_task_total`
- `attempt_plan_hash`
- `seed_list_hash`（`true_seeded` 时）
- `budget_policy_id`
- `tool_policy_id`
- `timeout_policy_id`
- `autonomy_mode`
- `benchmark_tuned_flag`
- `requested_tier`
- `allowed_replacement_policy`

**规范要求：**

- Reproduced / Verified 候选提交 **MUST** 先生成 registration 对象
- `declared_attempt_total`、`attempt_plan_hash`、`repeatability_class`、`execution_contract_digest` 在首个 attempt 开始后 **MUST NOT** 改写
- Community 允许 `offline_provisional`，但默认不得伪装成高信任 tier

### 7.2 completeness proof

draft2 明确引入：

- `completeness-proof.json`

其作用是：

- 由平台或 intake 侧证明“声明过的 run-group 是否完整披露”
- 防止 best-of-N 后选择性上传

最小关键字段包括：

- `proof_id`
- `run_group_id`
- `registration_digest`
- `expected_attempt_total`
- `observed_attempt_total`
- `slot_coverage_rate`
- `missing_slots`
- `unexpected_attempts`
- `duplicate_attempts`
- `replacement_attempts`
- `task_coverage_summary`
- `attempt_terminal_status_histogram`
- `completeness_verdict`
- `tier_eligibility_effect`

`completeness_verdict` 至少支持：

- `complete`
- `incomplete`
- `overreported`
- `duplicate_conflict`
- `tampered`

**规范要求：**

- Reproduced / Verified **MUST** 满足 `completeness_verdict = complete`
- 只要 `missing_slots`、`unexpected_attempts`、`duplicate_attempts` 任一非空，结果不得自动升入 Verified
- `completeness-proof.json` **MUST NOT** 由提交方自证生成

### 7.3 tolerance policy

tolerance policy 的唯一真源固定为：

```text
Execution Contract.verification_policy.tolerance_policy
```

其他模块只引用：

- `tolerance_policy_id`
- `tolerance_policy_digest`

不再各自发明另一套“口头容差规则”。

最小关键字段：

- `tolerance_policy_id`
- `tolerance_policy_version`
- `tolerance_policy_digest`
- `applies_to_tiers`
- `allowed_repeatability_classes`
- `comparison_unit`
- `statistical_protocol`
- `metric_rules[]`
- `missingness_rule`
- `replay_rule`
- `reproduce_rule`
- `promotion_gate`

每个 `metric_rules[]` 至少包含：

- `metric_id`
- `level`
- `comparison_method`
- `threshold_abs`
- `threshold_rel`
- `directionality`
- `hard_fail`

**规范要求：**

- 任何 `within tolerance` 的说法都 **MUST** 可追溯到 `tolerance_policy_digest`
- board slice **MUST** 至少隐含绑定 `tolerance_policy_digest`

### 7.4 repeatability class

draft2 引入：

- `repeatability_class`

取值至少包括：

- `true_seeded`
- `pseudo_repeated`

定义：

- `true_seeded`：provider / runner 支持真实 seed 或等价可控随机源
- `pseudo_repeated`：无法真正固定 seed，只能通过 snapshot、模板、时间窗等近似控制随机性

**准入原则：**

| repeatability class | Reproduced | Verified | 默认榜单处理 |
|---|---|---|---|
| `true_seeded` | 允许，`n_runs >= 3` | 允许，`n_runs >= 5` | 可进入默认 rankable slice |
| `pseudo_repeated` | 允许，`n_runs >= 3` 且 prereg + completeness + narrow window | 条件允许：lane 明确允许 + 平台控制环境 + `n_runs >= 7` + 单独标记 | 必须单独切片，不与 `true_seeded` 混榜 |

**附加否决规则：**

若某 lane / provider 理论上支持 true seed，但提交方只提供 `pseudo_repeated`：

- 不得进入 Verified
- 最多进入 Reproduced 或 Community

---

## 8. Run Data & Evidence 合同

### 8.1 final bundle canonical layout

final bundle 根目录名不进入协议语义；协议只约束其内部路径。

canonical final bundle 至少包含：

```text
manifest.json
aggregate.json
task-results.ndjson
artifact-manifest.json
checksums.sha256
reports/evaluator-report.json
trace/session-index.json
trace/events/<task_id>.jsonl.zst
artifacts/
```

可选增强项包括：

```text
payloads/
redactions.json
attestation.json
interaction-log.jsonl
interaction-summary.json
reports/environment-report.json
reports/trace-integrity.json
reports/state-reset-report.json
reports/cache-report.json
run-group-registration.json
completeness-proof.json
```

**命名冻结：**

- `task-results.ndjson` 是 canonical 名称
- `artifact-manifest.json` 是 canonical 名称
- `stdout.log` / `stderr.log` 统一使用 `.log`
- `task_results.ndjson`、`bundle_manifest.json` 等视为 deprecated

### 8.2 `manifest.json` 是 runtime identity 单一真源

`manifest.json` 至少应冻结以下 identity / policy / runtime 分组：

#### Benchmark
- `benchmark.id`
- `benchmark.version`
- `benchmark.split`
- `benchmark.lane_id`

#### Task Package
- `task_package.digest`

#### Execution Contract
- `execution_contract.id`
- `execution_contract.version`
- `execution_contract.digest`

#### Evaluator
- `evaluator.digest`

#### Runtime
- `runtime.runner_digest`
- `runtime.adapter_digest`
- `runtime.adapter_resolution_digest`
- `runtime.preset_id`
- `runtime.launcher_digest`

#### Harness
- `harness.name`
- `harness.version`
- `harness.commit`
- `harness.prompt_hash`
- `harness.rules_hash`
- `harness.memory_config_hash`
- `harness.tool_manifest_hash`

#### Model
- `model.provider`
- `model.name`
- `model.snapshot`

#### Policy
- `policy.budget_policy_id`
- `policy.tool_policy_id`
- `policy.timeout_policy_id`
- `policy.benchmark_tuned`
- `policy.cache_policy`
- `policy.persistent_memory_enabled`
- `policy.seed`

#### Registration / Verification refs
- `registration_ref`
- `tolerance_policy_ref`
- `repeatability_class`
- `requested_trust_tier`

### 8.3 Task disposition 与分母规则

draft2 采用三层状态机：

1. **Execution disposition**
   - `succeeded`
   - `failed`
   - `timeout`
   - `crash`
   - `policy_violation`
   - `skipped`
   - `not_attempted`

2. **Scoring disposition**
   - `scored`
   - `evaluator_error`

3. **Visibility disposition**
   - `public`
   - `redacted`

并引入两个分母：

1. **`declared_task_denominator`**
   - 本来应该覆盖的任务总数
   - 用于 completeness / selective reporting 检查

2. **`scorable_task_denominator`**
   - 能合法计入能力评分的任务总数
   - 默认：

```text
scorable_task_denominator
= declared_task_denominator
- platform_confirmed_evaluator_error
- platform_unscorable_redactions
```

核心规则：

| disposition | 计入 declared denominator | 计入 scorable denominator | success numerator |
|---|---:|---:|---:|
| `succeeded` | 是 | 是 | 是 |
| `failed` | 是 | 是 | 否 |
| `timeout` | 是 | 是 | 否 |
| `crash` | 是 | 是 | 否 |
| `policy_violation` | 是 | 是 | 否 |
| `skipped` | 是 | 是（默认按失败） | 否 |
| `not_attempted` | 是 | 否 | 否 |
| `evaluator_error` | 是 | 否 | 否 |
| `redacted` | 是 | 取决于 underlying + sealed evidence | 取决于 underlying |

规范性公式：

```text
task_success_rate = succeeded_tasks / scorable_task_denominator

attempt_coverage_rate = attempted_or_terminal_tasks / declared_task_denominator

run_group_publishable =
  (all attempts disclosed)
  AND (no unresolved missing task slots)
  AND (completeness_verdict = complete)
```

### 8.4 Governance evidence reports

为让高信任 tier 从“声明式”升级为“证据式”，draft2 引入以下报告对象：

#### `reports/environment-report.json`

至少包括：

- `container_digest`
- `base_image`
- `runner_digest`
- `evaluator_digest`
- `network_policy_digest`
- `mount_manifest_hash`
- `env_allowlist_hash`
- `workspace_snapshot_hash_before`
- `workspace_snapshot_hash_after`
- `official_runner_attested`
- `attestation_ref`

#### `reports/trace-integrity.json`

至少包括：

- `trace_root_hash`
- `hash_algorithm`
- `event_chain_complete`
- `trace_file_count`
- `missing_event_ranges`
- `payload_coverage_ratio`

#### `interaction-log.jsonl`

每条事件至少包括：

- `event_id`
- `attempt_id`
- `timestamp`
- `actor_type`
- `interaction_type`
- `target_ref`
- `content_digest`
- `content_redacted`
- `policy_classification`

#### `interaction-summary.json`

至少包括：

- `autonomy_mode_declared`
- `human_event_count`
- `approval_event_count`
- `interactive_event_count`
- `tty_input_digest`
- `editor_interaction_detected`
- `manual_file_write_detected`
- `manual_command_detected`
- `classification_verdict`

#### `reports/state-reset-report.json`

至少包括：

- `memory_scope`
- `cache_namespace`
- `state_reset_policy`
- `state_reset_proof`
- `cache_root_hash_before`
- `cache_root_hash_after`
- `memory_snapshot_digest_before`
- `memory_snapshot_digest_after`
- `reset_verdict`

#### `reports/cache-report.json`

至少包括：

- `cache_policy`
- `cache_namespace`
- `external_kb_enabled`
- `external_kb_digest_list`
- `external_kb_policy_id`
- `benchmark_answer_material_declared`
- `cache_isolation_verdict`

---

## 9. Verification Tiers 与治理

### 9.1 Verification Record

draft2 显式引入权威对象：

- `verification_record`

其最小字段包括：

- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `board_admission_policy_id`
- `decision_reason_codes[]`
- `assigned_at`
- `assigned_by`

**规范要求：**

- `verification_record` 是 M4 的真源
- CLI 不能伪造 `trust_tier`
- board slice 使用的 `trust_tier` 必须派生自该对象

### 9.2 Community

Community 至少满足：

- 用户自管环境运行
- 平台做基础 schema / hash / manifest 校验
- 可以公开展示
- 默认不得进入官方主榜

典型 profile：

- `community_light`

### 9.3 Reproduced

Reproduced 至少满足：

- 完整 run-group
- 全 attempts 披露
- `completeness_verdict = complete`
- 满足该 tier 的最小 run 数门槛（默认 `>= 3`）
- `tolerance_policy_digest` 可追溯
- 至少可 replay / rescore
- 有独立复现或等价复验支撑
- 具备高信任最小环境与 trace 证明集合：
  - `container_digest`
  - `network_policy_digest`
  - `artifact-manifest.json`
  - `checksums.sha256`
  - `trace_root_hash`
  - `interaction-log.jsonl`
  - `interaction-summary.json`

### 9.4 Verified

Verified 至少满足：

- 满足 Reproduced 的全部要求
- `true_seeded` 默认 `n_runs >= 5`
- `pseudo_repeated` 若允许，则默认 `n_runs >= 7`、平台控制环境、单独标记 / 单独切片
- 平台控制复跑、平台官方评分，或等价强度的升级审计
- 通过风险审计
- 提供更强执行证明：
  - `attestation.json` 或 `official_runner_attested=true`
  - `mount_manifest_hash`
  - `env_allowlist_hash`
  - `workspace_snapshot_hash_before`
  - `workspace_snapshot_hash_after`
  - `network_proxy_log_digest`（若允许联网）

### 9.5 Autonomy modes

`autonomy_mode` 的判定 **MUST** 基于交互遥测，而不是上传者单独声明。

#### `autonomous`

硬要求：

- `human_event_count = 0`
- `approval_event_count = 0`
- `manual_file_write_detected = false`
- 必须存在完整 `interaction-log.jsonl`

#### `approval_only`

定义：

- 人类只能做预定义审批，不得自由输入、自由命令、手改文件

硬要求：

- 必须记录全部审批事件
- `interactive_event_count = 0`
- `manual_file_write_detected = false`
- `tty_freeform_input_detected = false`

#### `interactive`

定义：

- 存在任意自由文本输入、手工命令、手工文件修改、IDE 编辑、补丁等行为

硬要求：

- 必须记录全部可观察到的人类交互事件
- 不得被展示为 `autonomous` 或 `approval_only`

### 9.6 Publication state

建议状态迁移：

| From | To | 说明 |
|---|---|---|
| `submitted` | `provisional` | 已接收，待进一步审计 |
| `submitted` | `published` | 直接公开 |
| `submitted` | `rejected` | 基础校验失败或政策不允许 |
| `provisional` | `published` | 审计通过 |
| `provisional` | `rejected` | 审计失败 |
| `published` | `disputed` | 进入争议 |
| `published` | `corrected` | 更正后保留历史 |
| `published` | `invalidated` | 失效下榜但保留记录 |
| `disputed` | `published` / `corrected` / `invalidated` | 视调查结论 |
| `rejected` / `invalidated` / `corrected` | `archived` | 归档终态 |

**规范句：**

> 一个结果是否“能上榜”，至少同时受 `trust_tier`、`publication_state`、`board_admission_policy` 三者约束；任何单字段都不足以表达全部资格。

### 9.7 State isolation / memory / cache / external KB

draft2 统一要求高信任结果声明并证明状态作用域：

- `memory_scope`
- `cache_namespace`
- `state_reset_policy`
- `state_reset_proof`
- `external_kb_enabled`
- `external_kb_digest_list`

`memory_scope` 至少支持：

- `none`
- `attempt`
- `run_group`
- `benchmark`
- `project`
- `global`

**规范要求：**

- 通用主榜中的高信任结果，若 `memory_scope = global` 或 `cache_policy = global`，默认不得进入 general-purpose official board，除非该 lane 明确允许且单独分榜
- `external_kb_enabled = true` 但无 `external_kb_digest_list` 的结果，最高只能停留在 Community
- 无 `state_reset_proof` 的高信任结果，不得进入 Reproduced / Verified

---

## 10. Ranking Policy 与 Board Slices

### 10.1 不定义神圣全局总榜

OHBP v0.1-draft2 继续坚持：

> **协议不定义神圣全局总榜。**

排名只在 `board_slice` 内成立。

### 10.2 `board_slice` 的最小固定维度

一个 slice 至少由以下维度唯一确定：

- `benchmark_id`
- `benchmark_version`
- `lane_id` 或 `lane_class`
- `execution_contract_digest`
- `tolerance_policy_digest`
- `trust_tier`
- `repeatability_class`
- `autonomy_mode`
- `benchmark_tuned_flag`
- `budget_class`
- `comparison_mode`

其中：

- `trust_tier` 来自 `verification_record`
- `comparison_mode` 来自 ranking policy
- `budget_class` 是由 `budget_policy_id` 派生，不是原始输入字段

### 10.3 排名禁令

协议至少要求：

- 禁止把不同 `trust_tier` 混榜
- 禁止把 `benchmark_tuned` 与 `general-purpose` 混榜
- 禁止把不同 `repeatability_class` 混榜
- 禁止把不同 `tolerance_policy_digest` 混榜
- 禁止把 best single run 当作正式排名依据
- 公开榜必须显示 uncertainty，而不是假装差距绝对精确

### 10.4 Entry gate 与 Slice gate

单个 entry 进入某 slice，至少要满足：

1. `completeness_verdict = complete`
2. 满足该 trust tier 的最小 `n_runs`
3. `declared_task_denominator` 覆盖完整
4. `scorable_task_denominator` 达到 lane 定义的最低 publishable floor
5. 绑定唯一的：
   - `execution_contract_digest`
   - `tolerance_policy_digest`
   - `repeatability_class`
   - `trust_tier`

slice 的公开形态采用 4 档状态：

| Slice state | 条件 | UI / 排名行为 |
|---|---|---|
| `insufficient_evidence` | `< 2` 个 eligible entries | 只显示条目卡，不生成排行榜 |
| `comparison_only` | 恰好 `2` 个 eligible entries | 只显示 head-to-head，不给 ordinal rank |
| `ranked_tiered` | `>= 3` 个 entries，但 rank overlap 较大 | 只显示 tier / cluster |
| `ranked_ordinal` | `>= 3` 个 entries，且有足够分离证据 | 显示带 uncertainty 的顺序榜 |

默认门槛：

- 公开比较至少需要 `2` 个 eligible entries
- 公开排序至少需要 `3` 个 eligible entries

### 10.5 Official main board 默认规则

默认官方主榜建议再加两条：

1. 只收 `Verified`
2. 只收同一 `repeatability_class` 的 slice
   - 默认优先 `true_seeded`
   - `pseudo_repeated` 若存在，应单独页签 / 单独筛选，不默认混入

---

## 11. 指标体系与不确定性

### 11.1 核心指标族

OHBP v0.1-draft2 继续采用五个核心指标族：

1. **Effectiveness**
2. **Efficiency**
3. **Reliability**
4. **Recovery / Robustness**
5. **Reproducibility / Transparency**

默认建议展示：

- success
- cost
- latency
- stability
- reproducibility

### 11.2 run-group 是最小比较单位

不是 single run 排榜，而是拿相同配置下的一组 repeated runs 比较。

推荐最低门槛：

- Community：`1 run`
- Reproduced：`3 runs`
- Verified（`true_seeded`）：`5 runs`
- Verified（`pseudo_repeated`）：`7 runs`

### 11.3 不确定性披露

默认展示：

- point estimate
- `n_runs`
- `n_tasks`
- 95% CI 或 IQR
- `rank_spread`

并支持：

- `rank_p05`
- `rank_p50`
- `rank_p95`
- `top1_probability`
- `top3_probability`

### 11.4 用 paired delta panel 替代抽象 lift

draft2 不再把：

- `harness_lift = score(...) - score(...)`
- `model_lift = score(...) - score(...)`

保留为协议核心字段。

取而代之的是：

- `delta_success_vs_baseline`
- `delta_cost_vs_baseline`
- `delta_latency_vs_baseline`
- `delta_timeout_vs_baseline`
- `delta_crash_vs_baseline`
- 对应 CI / IQR / paired bootstrap 区间

**规范要求：**

- baseline 是谁，必须明确
- baseline 所在 slice，必须明确
- paired condition 是否满足，必须明确

### 11.5 Scorecard view 与 Research view

draft2 明确双层呈现：

#### `scorecard_view`

面向：

- 决策者
- 普通上传者
- 框架作者
- 默认分享场景

至少应显示：

- `trust_tier`
- slice 标签
- `lane_id`
- 主效果指标
- `n_runs`
- `n_tasks`
- 95% CI / rank band
- `median_cost`
- `p95_latency`
- `support_count`
- `benchmark_tuned` / `general-purpose`
- `autonomy_mode`
- `health warning`
- `last_audited_at`

#### `research_view`

面向：

- 研究者
- 审计者
- 复现者
- 争议处理者

至少应包括：

- 全 run-group attempts
- task-level 明细与 terminal states
- replay / reproduce report
- trace / artifact / sealed bundle 引用
- tolerance 判定结果
- audit / dispute / invalidation 历史
- ablation（如有）
- benchmark health snapshot 全字段

**严格关系：**

1. Scorecard 派生于 Research，不得独立造语义
2. 若某结论无法在 Research view 中追溯，就不得出现在 Scorecard
3. 默认分享链接可落在 Scorecard，但必须一跳到达 Research

---

## 12. Benchmark Health

每个 benchmark / lane / split 都应带健康元数据：

- `task_validity`
- `outcome_validity`
- `environment_stability`
- `freshness_tier`
- `contamination_tier`
- `reporting_completeness`
- `last_audit_at`
- `health_snapshot_version`

建议 freshness：

- `fresh`
- `active`
- `aging`
- `legacy`

建议 contamination：

- `low`
- `medium`
- `high`

这些字段必须：

- 版本化
- 可追溯
- 不可静默覆盖历史

并应与 release policy 联动：

- benchmark active 时，哪些证据必须 sealed
- benchmark retired 后，哪些证据可延迟公开

---

## 13. v0.1 推荐起手形态

### 13.1 产品顺序

推荐顺序仍然是：

1. 协议
2. CLI
3. 上传 API
4. 薄网站
5. 平台抽样复跑 / 官方评分

### 13.2 首批推荐 lane

V1 推荐先只上三条 lane：

1. `core-lite-v1`
2. `terminal-lite-v1`
3. `workflow-clean-v1`

launch 叙事建议只重点主推两条：

- **Onboarding lane**：`core-lite-v1`
- **Prestige lane**：`terminal-lite-v1`

`workflow-clean-v1` 保留为专家 / 扩展 lane，不在第一屏打散叙事。

### 13.3 Persona → Lane → Profile

推荐引导顺序：

1. 先问用户是谁
   - casual
   - framework author
   - reproducer
   - enterprise
   - flagship claimant
2. 再推荐 lane
3. 最后推荐 submission profile

典型路径：

| Persona | 默认第一站 | 推荐 profile | 下一步 |
|---|---|---|---|
| 首次体验者 | `core-lite-v1` | `community_light` | 跑通后切 connected mode，再补 `reproducible_standard` |
| 框架作者 | `core-lite-v1` | `reproducible_standard` | 稳定后转 `terminal-lite-v1`，争取独立复现支持 |
| 独立复现者 | 先校准 `core-lite-v1`，再优先接 `terminal-lite-v1` 待复现单 | `reproducible_standard` | 完成公共审计 |
| 闭源团队 | `core-lite-v1` 或 `terminal-lite-v1` | `community_light`（可 redacted） | 高价值结果升级到 `reproducible_standard` |
| 冲击官方结论团队 | `terminal-lite-v1` | `verified_full` | 进入平台控制复跑 / 官方评分通道 |

### 13.4 三角色飞轮

平台最少应把以下三类参与者视为一等角色：

1. **Uploader**
2. **Framework Author**
3. **Reproducer / Auditor**

最小飞轮：

```text
低门槛上传
  -> Community 数据面
  -> system page 与 preset 生态
  -> reproducer 完成 replay / reproduce
  -> 高价值结果升入 Reproduced / Verified
  -> 官方结论更可信
  -> 更多人继续上传与复现
```

### 13.5 主榜空心期过渡策略

不改原则，只改默认发现路径。

平台公开层建议拆成三层：

1. **Official Verified Board**
2. **Reproducibility Frontier**
3. **Community Lab / Feed**

当某个 slice 的 Verified 结果不足以形成稳定排序时：

- 保留 Official Verified Board 入口
- 显示 `warming_up` / `verification_in_progress`
- 同页提供：
  - 当前 baseline
  - 最接近 Verified 的 Reproduced 候选
  - 待复现 / 待审计 run-group

### 13.6 launch phases

建议的冷启动阶段：

1. **Seeded Protocol Launch**
2. **Community Ramp**
3. **Reproduce Market**
4. **Selective Verified Launch**
5. **Broaden Verified Coverage**

平台在 v0.1 早期可适度进行 baseline seeding，其作用是：

- 给出最小比较锚点
- 验证协议链路可用
- 为 reproducer 提供练手机会
- 避免主榜首月完全空心

---

## 14. 结构性 trade-offs

以下问题在 draft2 中应显式记录为结构性权衡，而不是假装已完美解决。

### 14.1 `pseudo_repeated` 能否进入 Verified

本稿选择：

- 允许，但不是默认路径
- 必须单独标记 / 单独切片 / 提高门槛

### 14.2 Public vs Sealed 的公开度平衡

本稿选择：

- 优先保护 benchmark health
- 公开层必须看到 digest、release policy、审计摘要
- 不强制公开会泄漏 hidden split 的完整原文

### 14.3 Submission profile 是否进入协议核心

本稿选择：

- profile 概念进入协议核心
- 具体奖励、积分、商业实现不进入规范硬字段

### 14.4 Wrapper 的边界

本稿选择：

- wrapper 用于降低接入摩擦
- wrapper 不得定义第二套 bundle / tier / ranking 语义

---

## 15. draft2 的一句话定义

> **OHBP / harnessbench v0.1-draft2 不是“任意上传分数的平台协议”，而是“任何人都能通过统一 CLI / Adapter 合同产出可审计证据，并被平台按 registration、completeness、tolerance、Community / Reproduced / Verified、public / sealed evidence、scorecard / research 双层视图纳入公共知识库与分层榜单”的开放评测协议。**
