# OHBP / harnessbench 协议草案 v0.1-draft3

> 状态：已整合 round2 focused convergence patches，待进入最终小范围 stop-condition review  
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

draft3 的核心升级不是“再多写一些建议”，而是把 draft1 中若干 prose-first 的部分，收敛成：

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

OHBP v0.1-draft3 以以下原则为准：

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

draft3 在结构上的第一条硬升级，是把几类过去容易混用的状态显式拆开。

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
| 证据通道模式 | `evidence_channel_mode` | `Public only` / `Public + Sealed` | `public_only` / `public_plus_sealed` | M3 → M4 |
| 对外可见形态 | `visibility_class` | `Public full` / `Public redacted` / `Public summary` / `Sealed pending publication` | `public_full` / `public_redacted` / `public_summary` / `sealed_pending_publication` | M3 → M4 |
| 公开释放策略 | `release_policy` | `Public immediate` / `Delayed until date` / `Delayed until legacy` / `Summary only permanent` | `public_immediate` / `delayed_until_date` / `delayed_until_legacy` / `summary_only_permanent` | M3 → M4 |
| 比较模式 | `comparison_mode` | `Fixed model → compare harness` / `Fixed harness → compare model` / `System combination board` | `fixed_model_compare_harness` / `fixed_harness_compare_model` / `system_combination` | M4 |
| M2 的治理建议 | `lane_governance_hint.max_recommended_trust_tier` | ceiling label | 与 `trust_tier` 同值域 | M2 |
| M4 的权威准入 | `board_admission_policy.max_allowed_trust_tier` | 与 `trust_tier` 同 display | 与 `trust_tier` 同值域 | M4 |
| 裁决对象类型 | `verification_record.subject_ref.subject_type` | `Attempt bundle` | `attempt_bundle` | M4 |

说明：

- `human_assisted` 可以作为展示层 umbrella prose，但不作为 v0.1-draft3 的审计叶子枚举
- `verification_tier` 视为历史 alias，canonical field 统一收敛为 `trust_tier`
- `declared_autonomy_mode` 可以出现在 registration 等声明层对象中，但平台审定叶子模式始终是 `autonomy_mode`

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
- `evidence_channel`

并规定：

- 一个 final bundle 对应一个 `attempt_id`；多次 repeated runs 通过 `run_group_id` 关联，不在 v0.1 混装
- 默认 canonical final bundle 视为该 attempt 的 public bundle
- 若 `evidence_channel_mode = public_plus_sealed`，则同一 attempt 还 **MUST** 有一份 digest 绑定的 sealed audit bundle；它不是第二套语义，只是第二条证据通道

### 5.3 Governance & Ranking 层

该层定义：

- `verification_record`
- `lane_governance_hint`
- `board_admission_policy`
- `board_slice`

其中：

- `verification_record` 是信任层级、公开状态、autonomy verdict 与 evidence-channel verdict 的权威真源
- `verification_record` **MUST** 通过 `subject_ref` + `subject_bundle_digest` 绑定一个 `attempt_bundle`
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

OHBP v0.1-draft3 明确：

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

draft3 冻结一个关键分层：

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

OHBP v0.1-draft3 至少支持三档稳定 profile：

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

draft3 明确引入：

- `run-group-registration.json`

其作用是：

- 冻结 run-group 的比较边界
- 冻结 attempt 计划
- 冻结重复运行类型
- 在首个 attempt 开始前完成声明
- 为 `pseudo_repeated` 提供 registration-level 审计抓手

最小关键字段包括：

- `registration_id`
- `registration_digest`
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
- `declared_autonomy_mode`
- `benchmark_tuned_flag`
- `requested_trust_tier`
- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock`
- `provider_release_window`
- `allowed_replacement_policy`

**规范要求：**

- Reproduced / Verified 候选提交 **MUST** 先生成 registration 对象
- `declared_attempt_total`、`attempt_plan_hash`、`repeatability_class`、`execution_contract_digest`、`requested_trust_tier` 在首个 attempt 开始后 **MUST NOT** 改写
- `requested_tier` 仅可作为 intake 兼容 alias 出现在非规范转换层；不得再出现在 v0.1-draft3 的 normative schema、field table、bundle manifest 或 verification record 中
- `declared_autonomy_mode` 只是上传侧意图字段；`autonomy_mode` 的权威叶子判定来自 `§9.5`
- Community 允许 `offline_provisional`，但默认不得伪装成高信任 tier

#### `pseudo_repeated` registration controls

当 `repeatability_class = pseudo_repeated` 且 `requested_trust_tier ∈ {reproduced, verified}` 时，以下字段 **MUST** 在首个 attempt 开始前冻结：

- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock` **或** `provider_release_window`

其中：

- `submission_window` 至少应包含：
  - `opens_at`
  - `closes_at`
  - `max_span_minutes`
- `randomness_fingerprint_hint` 至少应提供以下之一：
  - `provider_fingerprint`
  - `sampler_config_hash`
  - `endpoint_profile_hash`
- `request_template_hash` 表示对 normalized request template bytes 做稳定哈希；它应保留跨 attempts 恒定的 scaffold，并把 attempt-specific placeholders 规范化成稳定 token
- `provider_snapshot_lock` 用于固定 vendor snapshot / build / revision；若 provider 无法提供显式 snapshot，则 **MUST** 用 `provider_release_window` 近似锁定 provider release 区间
- `provider_release_window` 至少应包含：
  - `not_before`
  - `not_after`

### 7.2 completeness proof

draft3 明确引入：

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
- 对同一个 `run_group_id` 的高信任 candidate bundles，`manifest.registration_digest` **MUST** 与 `completeness-proof.json.registration_digest` 一致；不一致时，结果 **MUST** 至少进入 `tampered` 或等价拒绝态
- 若 `repeatability_class = pseudo_repeated` 且缺失 `submission_window`、缺失 `request_template_hash`、或 `provider_snapshot_lock` 与 `provider_release_window` 同时缺失，则该 run-group **MUST NOT** 进入 Reproduced / Verified

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
- bundle、verification、ranking 三层对 tolerance policy 的消费，统一经由 `manifest.tolerance_policy_ref` / `manifest.tolerance_policy_digest` 进入；不得在 bundle 外再发明第二套自由浮动字段名

### 7.4 repeatability class

draft3 引入：

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
| `pseudo_repeated` | 允许，`n_runs >= 3` 且 prereg + completeness + registration controls 全部通过 | 条件允许：lane 明确允许 + 平台控制环境 + `n_runs >= 7` + registration controls 全部通过 + 单独标记 | 必须单独切片，不与 `true_seeded` 混榜 |

**`pseudo_repeated` 审计门槛：**

- verifier **MUST** 检查 `submission_window` 与实际 attempts 的时间戳 / receipt / runner telemetry 是否落在同一窄窗内
- verifier **MUST** 检查 repeated attempts 的 `request_template_hash` 一致，不得在结果漂移后再补交不同模板骨架
- verifier **MUST** 检查 `randomness_fingerprint_hint` 是否提供了至少一项稳定线索
- verifier **MUST** 检查存在 `provider_snapshot_lock` 或 `provider_release_window`，以支撑“同一近似 provider condition”判断

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

**条件性 MUST：**

- 当 `requested_trust_tier in {reproduced, verified}` 时，final bundle **MUST** 包含 `run-group-registration.json`
- `completeness-proof.json` 可由平台后补，但一旦存在，其 `registration_digest` **MUST** 与 `manifest.registration_digest` 一致

#### Evidence channels

当前 canonical final bundle 视为该 attempt 的 **public bundle**。

当 `evidence_channel_mode = public_plus_sealed` 时，平台 / verifier **MUST** 维护一份可由 digest 寻址的 **sealed audit bundle**；它与 public bundle 共享同一逻辑路径语义，但允许保留 public bundle 中被 redaction / omission 的原始 trace、payload、artifact、interaction 与审计材料。

Public bundle 与 sealed audit bundle 是同一被裁决结果的两条证据通道；它们 **MUST** 通过 digest 明确绑定，且 public bundle **MUST NOT** 假装自己等于 sealed raw evidence。

| artifact class | `public_only` | `public_plus_sealed` 的 public channel | `public_plus_sealed` 的 sealed channel |
|---|---|---|---|
| `manifest.json` | MUST | MUST（公开版必须保留 digests / policy / refs） | MUST |
| `aggregate.json` | MUST | MUST | MAY（可与 public 相同） |
| `task-results.ndjson` | MUST | MUST（public-safe / redacted 版本） | MUST（完整原版） |
| `artifact-manifest.json` | MUST | MUST | MUST |
| `checksums.sha256` | MUST | MUST | MUST |
| `redactions.json` | MAY | MUST（若 public 与 sealed 有差异） | SHOULD |
| `interaction-summary.json` | SHOULD；高信任时 MUST | MUST | MUST |
| `interaction-log.jsonl` | SHOULD（公开安全时） | MAY 为 redacted / digest-only 版本，但若省略必须在 `redactions.json` 声明 | MUST（高信任必备） |
| `reports/environment-report.json` | SHOULD；高信任时 MUST 摘要版 | MUST（可公开字段版） | MUST（完整审计版） |
| `reports/trace-integrity.json` | SHOULD；高信任时 MUST | MUST | MUST |
| `trace/events/*` | MAY | MAY 为 skeleton / redacted 版本；若隐藏则需显式声明 | MUST（完整） |
| `payloads/*` | MAY | benchmark active 且会泄漏 hidden/holdout 内容时 MUST NOT 公开原始内容 | MUST（若复验需要） |
| `attestation.json` | MAY | SHOULD 公开摘要或 receipt ref | MUST（Verified 如需） |

**规范要求：**

- `hidden` / `holdout` / `rotating` split 的 Reproduced / Verified 结果 **MUST** 使用 `evidence_channel_mode = public_plus_sealed`
- 任何高信任结果只要 public 版本对 `task-results.ndjson`、`trace/events/*`、`payloads/*`、`interaction-log.jsonl` 做了 redaction / omission，就 **MUST** 提供 `redactions.json` 与 `sealed_audit_bundle_digest`

### 8.2 `manifest.json` 是 runtime identity 与 evidence join 的单一真源

`manifest.json` 至少应冻结以下 identity / policy / runtime / evidence 分组：

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

#### Run Identity
- `study_id`
- `run_group_id`
- `attempt_id`
- `bundle_id`

#### Registration
- `registration_ref`
- `registration_digest`

#### Verification policy
- `tolerance_policy_ref`
- `tolerance_policy_digest`
- `repeatability_class`
- `requested_trust_tier`

#### Evidence Channel
- `evidence.evidence_channel_mode`
- `evidence.public_bundle_digest`
- `evidence.sealed_audit_bundle_digest`
- `evidence.visibility_class`
- `evidence.release_policy`
- `evidence.redaction_policy_id`
- `evidence.release_not_before`

**binding rules：**

- `canonical_json` 指 UTF-8 稳定 JSON 序列化：object key 按字典序排序，不保留非语义空白，数组保持原顺序
- `manifest.registration_ref` 的 canonical 值为 `run-group-registration.json`；若该值为 `null`，该 bundle **MUST NOT** 声称是 Reproduced / Verified candidate
- `manifest.registration_digest` **MUST** 等于 `sha256(canonical_json(run-group-registration.json))`
- `manifest.tolerance_policy_ref` 的 canonical 值为 `execution_contract#/verification_policy/tolerance_policy`
- `manifest.tolerance_policy_digest` **MUST** 等于被 `tolerance_policy_ref` 解析出的 tolerance policy object digest
- 当前 public final bundle 的 canonical digest 记为 `sha256(utf8_bytes(checksums.sha256))`；`evidence.public_bundle_digest` **MUST** 等于该值
- 若 `evidence.evidence_channel_mode = public_plus_sealed`，则 `evidence.public_bundle_digest` 与 `evidence.sealed_audit_bundle_digest` **MUST** 同时存在
- 当 `evidence.visibility_class != public_full` 或 `evidence.evidence_channel_mode = public_plus_sealed` 时，`evidence.redaction_policy_id` **MUST** 存在且版本化
- 若 `run-group-registration.json` 存在，则：
  - `manifest.requested_trust_tier` **MUST** 等于 `run-group-registration.json.requested_trust_tier`
  - `manifest.repeatability_class` **MUST** 等于 `run-group-registration.json.repeatability_class`
- `verification_record`、`board_slice`、`replay` / `reproduce` 工具链消费 registration / tolerance / evidence channel 时，**MUST** 先读 `manifest.json`，不得绕过 manifest 直接读取自由浮动字段

### 8.3 Task disposition 与分母规则

draft3 采用三层状态机：

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

核心思想：

- 先定义“执行上发生了什么”
- 再定义“评分器能否产出有效分数”
- 最后定义“公开层能看到什么”

由此可统一：

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

其中：

- `attempted_or_terminal_tasks` = 执行状态属于 `{succeeded, failed, timeout, crash, policy_violation, skipped}` 的 task 数
- `redacted` 只是可见性层状态；它在计数时跟随 underlying execution disposition，而不是单独成为新的 terminal execution class
- `not_attempted` 与 `evaluator_error` 默认不计入 `attempted_or_terminal_tasks`，除非另有独立 terminal execution record 能证明该 task 已进入终态

### 8.4 Governance evidence reports

为让高信任 tier 从“声明式”升级为“证据式”，draft3 引入以下报告对象：

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
- `network_proxy_log_digest`（若允许联网）

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

`interaction_type` 的 canonical 最小集合至少包括：

- `approval_request`
- `approval_granted`
- `approval_denied`
- `approval_aborted`
- `tty_input`
- `manual_command`
- `manual_file_patch`
- `editor_write`
- `session_attach`
- `session_detach`
- `abort`

对以下事件类型，`target_ref` **MUST** 存在：

- `approval_request`
- `approval_granted`
- `approval_denied`
- `approval_aborted`
- `manual_command`
- `manual_file_patch`
- `editor_write`

#### `interaction-summary.json`

至少包括：

- `autonomy_mode_declared`
- `human_event_count`
- `approval_event_count`
- `interactive_event_count`
- `tty_input_digest`
- `tty_freeform_input_detected`
- `editor_interaction_detected`
- `manual_file_write_detected`
- `manual_command_detected`
- `approval_target_linkage_complete`
- `classification_verdict`

其中：

- `classification_verdict` 的 canonical enum 只有：`autonomous`、`approval_only`、`interactive`
- 若无任何人类 TTY 文本输入，`tty_input_digest` **MUST** 等于固定 sentinel：`ZERO_INPUT_V1`

#### `redactions.json`

至少包括：

- `redaction_policy_id`
- `redacted_paths[]`
- `sealed_only_paths[]`
- `reason_codes[]`

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

draft3 显式引入权威对象：

- `verification_record`

其最小字段包括：

- `subject_ref`
- `subject_bundle_digest`
- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `board_admission_policy_id`
- `autonomy_mode`
- `interaction_summary_digest`
- `evidence_channel_mode`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `visibility_class`
- `release_policy`
- `redaction_policy_id`
- `decision_reason_codes[]`
- `assigned_at`
- `assigned_by`

`subject_ref` 至少包括：

- `subject_type`
- `study_id`
- `run_group_id`
- `attempt_id`
- `bundle_id`

**规范要求：**

- `verification_record` 是 M4 的真源
- CLI 不能伪造 `trust_tier`
- `board_slice` 使用的 `trust_tier` 与 `autonomy_mode` 都 **MUST** 派生自该对象
- v0.1 中，`subject_ref.subject_type` **MUST** 固定为 `attempt_bundle`
- `subject_ref` 的 run identity 字段 **MUST** 与 `manifest.json` 中的 Run Identity 分组逐项一致
- `subject_bundle_digest` **MUST** 为 verifier 侧依据当前 public final bundle 的 `checksums.sha256` 重算得到的 bundle digest，而不是上传方自填展示字段
- 若存在 sealed 通道，`sealed_audit_bundle_digest` 绑定的是同一被裁决结果的第二证据通道；它 **MUST NOT** 取代 `subject_ref`
- 缺失 `subject_ref` 或缺失 `subject_bundle_digest` 的结果，平台 **MUST NOT** 授予 `trust_tier`

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
- `manifest.registration_digest` 与 `manifest.tolerance_policy_digest` 可追溯
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
- 若 `repeatability_class = pseudo_repeated`，则 `§7.1` 的 registration controls **MUST** 全部存在并通过审计
- 若 `benchmark.split ∈ {hidden, holdout, rotating}`，则 **MUST** 使用 `evidence_channel_mode = public_plus_sealed`
- 已 `published` 的结果，公开层 **MUST** 可见：
  - `public_bundle_digest`
  - `sealed_audit_bundle_digest`（若存在 sealed）
  - `visibility_class`
  - `release_policy`
  - `redaction_policy_id`（若存在 redaction）

### 9.4 Verified

Verified 至少满足：

- 满足 Reproduced 的全部要求
- `true_seeded` 默认 `n_runs >= 5`
- `pseudo_repeated` 若允许，则默认 `n_runs >= 7`、平台控制环境、registration controls 全部通过、单独标记 / 单独切片
- 平台控制复跑、平台官方评分，或等价强度的升级审计
- 通过风险审计
- 提供更强执行证明：
  - `attestation.json` 或 `official_runner_attested=true`
  - `mount_manifest_hash`
  - `env_allowlist_hash`
  - `workspace_snapshot_hash_before`
  - `workspace_snapshot_hash_after`
  - `network_proxy_log_digest`（若允许联网）
- 若 public bundle 对 `task-results.ndjson`、`trace/events/*`、`payloads/*`、`interaction-log.jsonl` 做了 redaction / omission，但仍申请 Verified，则 **MUST** 存在 `sealed_audit_bundle_digest`
- `publication_state = published` 的高信任结果 **MUST NOT** 使用 `visibility_class = sealed_pending_publication`

### 9.5 Autonomy modes

`autonomy_mode` 的判定 **MUST** 基于交互遥测，并最终写入 `verification_record`；上传者声明值只能作为输入，不能直接成为榜单真源。

固定 sentinel：

- `tty_input_digest = ZERO_INPUT_V1` 表示“无任何人类 TTY 文本输入”

#### `autonomous`

只有以下条件 **同时成立** 时，`classification_verdict` 才能是 `autonomous`：

- `human_event_count = 0`
- `approval_event_count = 0`
- `interactive_event_count = 0`
- `tty_freeform_input_detected = false`
- `manual_command_detected = false`
- `manual_file_write_detected = false`
- `editor_interaction_detected = false`
- `tty_input_digest = ZERO_INPUT_V1`
- 存在完整 `interaction-log.jsonl`

#### `approval_only`

只有以下条件 **同时成立** 时，`classification_verdict` 才能是 `approval_only`：

- `approval_event_count > 0`
- `interactive_event_count = 0`
- `tty_freeform_input_detected = false`
- `manual_command_detected = false`
- `manual_file_write_detected = false`
- `editor_interaction_detected = false`
- `approval_target_linkage_complete = true`
- 所有审批事件都能在 `interaction-log.jsonl` 中找到并绑定 `target_ref`

#### `interactive`

`interactive` 既是显式模式，也是自动降级的兜底模式。凡是以下任一条件成立，结果 **MUST** 归入 `interactive`：

- `tty_freeform_input_detected = true`
- `interactive_event_count > 0`
- `manual_command_detected = true`
- `manual_file_write_detected = true`
- `editor_interaction_detected = true`
- `approval_target_linkage_complete = false`
- 缺失 `interaction-summary.json` 或缺失完整 `interaction-log.jsonl`
- 任一审批事件缺失 `target_ref`

**自动降级规则：**

- 一旦出现自由文本输入、手工命令、手工文件改写、编辑器直接写入、或审批事件无法绑定到 `target_ref`，平台 **MUST** 直接降级为 `interactive`，不得继续展示为 `approval_only`
- 缺少足够 interaction telemetry 的结果，**MUST NOT** 进入 `autonomous` / `approval_only` slice；平台应将其按 `interactive` 展示，或在复审完成前标记为 ineligible

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

draft3 统一要求高信任结果声明并证明状态作用域：

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

OHBP v0.1-draft3 继续坚持：

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
- `autonomy_mode` 来自 `verification_record`
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
4. `scorable_task_denominator` 达到 `board_admission_policy.minimum_publishable_task_floor` 所定义的最低 publishable floor
5. 绑定唯一的：
   - `execution_contract_digest`
   - `tolerance_policy_digest`
   - `repeatability_class`
   - `trust_tier`
6. 若 `benchmark.split ∈ {hidden, holdout, rotating}` 且 `trust_tier ∈ {Reproduced, Verified}`，则 entry **MUST** 满足与 `Benchmark Health` 相容的 `evidence_channel` 规则
7. `autonomy_mode` 相关 slice 的 admission **MUST** 读取 `verification_record.autonomy_mode`；上传者声明不得直接决定 slice

slice 的公开形态采用 4 档状态：

| Slice state | 条件 | UI / 排名行为 |
|---|---|---|
| `insufficient_evidence` | `< 2` 个 eligible entries | 只显示条目卡，不生成排行榜 |
| `comparison_only` | 恰好 `2` 个 eligible entries | 只显示 head-to-head，不给 ordinal rank |
| `ranked_tiered` | `>= 3` 个 entries，但未满足 `board_admission_policy.rank_separation_policy_id` 所要求的稳定分离证据 | 只显示 tier / cluster |
| `ranked_ordinal` | `>= 3` 个 entries，且 `board_admission_policy.rank_separation_policy_id` 认可“分离证据足够” | 显示带 uncertainty 的顺序榜 |

默认门槛：

- 公开比较至少需要 `2` 个 eligible entries
- 公开排序至少需要 `3` 个 eligible entries
- 缺失 `interaction-summary.json`、缺失完整 `interaction-log.jsonl`、或触发 autonomy 自动降级条件的结果，**MUST NOT** 进入 `autonomous` / `approval_only` slice；平台应将其按 `interactive` 展示，或在审计完成前标记为 ineligible

### 10.5 Official main board 默认规则

默认官方主榜建议再加三条：

1. 只收 `Verified`
2. 只收同一 `repeatability_class` 的 slice
   - 默认优先 `true_seeded`
   - `pseudo_repeated` 若存在，应单独页签 / 单独筛选，不默认混入
3. 若 benchmark 仍处于 `fresh` / `active`，且 split 为 `hidden` / `holdout` / `rotating`，则默认官方主榜只接收满足 benchmark-health-compatible `release_policy` 的高信任结果；与 benchmark health 冲突的 `public_full + public_immediate` 组合不得进入默认官方主榜

---

## 11. 指标体系与不确定性

### 11.1 核心指标族

OHBP v0.1-draft3 继续采用五个核心指标族：

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

draft3 不再把：

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

draft3 明确双层呈现：

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
- `evidence_channel_mode` / `visibility_class`
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
- `subject_ref`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`（若存在）
- `visibility_class` / `release_policy` / `redaction_policy_id`
- trace / artifact / sealed bundle 引用
- tolerance 判定结果
- audit / dispute / invalidation 历史
- ablation（如有）
- benchmark health snapshot 全字段

**严格关系：**

1. Scorecard 派生于 Research，不得独立造语义
2. 若某结论无法在 Research view 中追溯，就不得出现在 Scorecard
3. 默认分享链接可落在 Scorecard，但必须一跳到达 Research

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

Benchmark Health 不只是展示标签，它还是 `release_policy` 与 `visibility_class` 的约束输入。

| benchmark health / split 状态 | 允许的默认 public 形态 | REQUIRED evidence rule |
|---|---|---|
| `fresh` / `active` + `hidden` / `holdout` / `rotating` | `public_redacted` 或 `public_summary` | `evidence_channel_mode = public_plus_sealed`；`release_policy` 只能是 `delayed_until_date` / `delayed_until_legacy` / `summary_only_permanent` |
| `fresh` / `active` + public split | `public_full` 或 `public_redacted` | 可 `public_only`，但若高信任审计仍需要 raw evidence，可保留 sealed 通道 |
| `aging` | `public_redacted` / `public_summary` / 受控 `public_full` | 可以按 benchmark policy 放宽，但 `public_bundle_digest`、`sealed_audit_bundle_digest`、`redaction_policy_id` 历史 **MUST** 保留 |
| `legacy` | 可放宽为 `public_full` | release policy 变化 **MUST** 版本化；新公开版生成新 digest，旧审计链不可静默覆盖 |

**规范要求：**

- 当 benchmark 处于 `fresh` / `active` 且存在 hidden integrity 风险时，公开 full raw evidence 的结果不得因为“更透明”而直接获得高信任主榜资格
- Benchmark Health 驱动的 release policy 变化 **MUST** 版本化；一旦 public 内容扩大公开，新的 public bundle **MUST** 产生新的 `public_bundle_digest`，不得静默覆盖旧审计链

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

以下问题在 draft3 中应显式记录为结构性权衡，而不是假装已完美解决。

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

## 15. draft3 的一句话定义

> **OHBP / harnessbench v0.1-draft3 不是“任意上传分数的平台协议”，而是“任何人都能通过统一 CLI / Adapter 合同产出可审计证据，并被平台按 registration、completeness、tolerance、subject-bound verification record、Community / Reproduced / Verified、public / sealed evidence channel、scorecard / research 双层视图纳入公共知识库与分层榜单”的开放评测协议。**
