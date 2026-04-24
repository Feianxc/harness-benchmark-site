# Repair Packet B — Registration / Completeness / Statistical Gates

> 负责人：draft2 修订团队 B  
> 范围：IR-02 / IR-03 / IR-04 / IR-05 / IR-06 / IR-08  
> 目标：把“重复运行、完整性证明、容差、分母、Verified 准入、切片发布门槛”从 prose 约定收敛成可编码对象与规则。

---

## 0. 结论先说

本 repair packet 的核心主张有 6 个：

1. **run-group 不再只靠口头声明**：采用“双对象链”  
   - 不可变的 `run-group-registration.json`
   - 平台生成的 `completeness-proof.json`

2. **tolerance policy 只能有一个 canonical 挂载点**：  
   **唯一真源 = `Execution Contract.verification_policy.tolerance_policy`**  
   其他模块只引用 `tolerance_policy_digest`，不再各写一套文字规则。

3. **分母必须拆成两层**：  
   - `declared_task_denominator`：完整性 / 披露分母  
   - `scorable_task_denominator`：能力分数分母  
   否则 `evaluator_error`、`not_attempted`、`redacted` 会把“评分”和“完整性”混在一起。

4. **`true_seeded` 与 `pseudo_repeated` 必须分 slice，不能默认混榜**：  
   - `true_seeded`：Verified 默认门槛 `n_runs >= 5`
   - `pseudo_repeated`：只有在 lane 明确允许且平台控制环境时，才能进 Verified；默认提高到 `n_runs >= 7`，并强制单独标记 / 单独切片

5. **`harness_lift` / `model_lift` 不应继续作为规范内单标量指标**：  
   建议从规范核心中**降级为 research / analysis 视图概念**，主规范改成“paired delta panel”，不再依赖未定义的 `score(...)`。

6. **board slice 要定义发布状态机**：  
   - `insufficient_evidence`
   - `comparison_only`
   - `ranked_tiered`
   - `ranked_ordinal`  
   稀疏切片不允许硬排“第 1 / 第 2 / 第 3”。

---

## 1. IR-02：run-group preregistration / completeness proof 的 canonical object

### 1.1 设计决策

不建议把 preregistration 与 completeness 混成一个可变对象。  
**原因**：预注册对象需要“先声明后执行”，而完整性证明需要“执行后由平台生成”。二者生命周期不同、签名主体不同、审计含义也不同。

因此建议采用：

1. **`run-group-registration.json`**  
   - 由 CLI `init` 阶段创建
   - connected mode 下必须带平台回执 / 签名
   - first attempt 开始后即视为不可变

2. **`completeness-proof.json`**  
   - 由平台 intake / upload 完成后生成
   - 以 `run-group-registration.json` 为输入
   - 负责回答“声明过的 attempts 是否全量到齐、是否有多报/漏报/替换”

### 1.2 Canonical object A：`run-group-registration.json`

**作用**：冻结 run-group 的比较边界、attempt 计划与预注册承诺。  
**创建时机**：`init` 完成、首个 attempt 启动前。  
**权威性**：Reproduced / Verified 必须以它为准；Community 可使用 `provisional` 模式，但不得伪装成高信任 tier。

#### 字段表

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `schema_version` | string | MUST | 例如 `ohbp.run-group-registration.v0.1` |
| `registration_id` | string | MUST | 预注册对象 ID |
| `registration_digest` | string | SHOULD | 对象摘要 |
| `study_id` | string | MUST | 研究 / 提交批次 ID |
| `run_group_id` | string | MUST | 重复运行组 ID |
| `registration_mode` | enum | MUST | `connected_signed`, `connected_unsigned_provisional`, `offline_provisional` |
| `registered_at` | string | MUST | ISO 8601 |
| `registration_receipt` | object | SHOULD | 平台返回的回执 / 签名 / receipt id |
| `protocol_version` | string | MUST | 绑定 OHBP 版本 |
| `benchmark_id` | string | MUST | benchmark 身份 |
| `benchmark_version` | string | MUST | benchmark 版本 |
| `lane_id` | string | MUST | lane |
| `split` | string | MUST | `public`, `hidden`, `sealed` 等 |
| `task_package_digest` | string | MUST | 任务包摘要 |
| `execution_contract_digest` | string | MUST | 合同比较边界 |
| `tolerance_policy_digest` | string | MUST | 容差规则摘要，来自 execution contract |
| `repeatability_class` | enum | MUST | `true_seeded`, `pseudo_repeated` |
| `declared_attempt_total` | integer | MUST | 本 run-group 计划 attempts 总数 |
| `declared_task_total` | integer | MUST | 本 run-group 每次 run 的任务总数 / declared denominator |
| `attempt_plan_hash` | string | MUST | attempt grid 的摘要 |
| `seed_list_hash` | string/null | SHOULD | true seeded 时必须；pseudo 可为 null |
| `attempt_slots` | array[object] | SHOULD | 小规模时可内嵌；大规模时可外链 |
| `subset_id` | string | MAY | 若使用 subset，必须显式声明 |
| `budget_policy_id` | string | MUST | 预算策略 |
| `tool_policy_id` | string | MUST | 工具权限策略 |
| `timeout_policy_id` | string | SHOULD | 超时策略 |
| `autonomy_mode` | enum | MUST | `autonomous`, `approval_only`, `interactive` |
| `benchmark_tuned_flag` | boolean | MUST | 是否 benchmark-specific / tuned |
| `requested_tier` | enum | MUST | `community`, `reproduced`, `verified` |
| `allowed_replacement_policy` | enum | MUST | `none`, `platform_confirmed_evaluator_error_only`, `platform_confirmed_infra_fault_only` |
| `submission_window` | object | SHOULD | 允许提交的时间窗；pseudo repeated 尤其重要 |
| `notes` | string | MAY | 例外说明 |

#### `attempt_slots` 最小子字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `attempt_index` | integer | MUST | 逻辑序号，从 1 开始 |
| `seed` | integer/null | SHOULD | true seeded 必填 |
| `attempt_label` | string | MAY | 如 `seed_42` |
| `planned_start_after` | string | MAY | 计划起跑时间 |
| `randomness_fingerprint_hint` | object | MAY | pseudo repeated 时记录 provider version / request template hash / window |

#### 规范要求

- **MUST**：Reproduced / Verified 候选提交必须先生成 `run-group-registration.json`
- **MUST**：`declared_attempt_total`、`attempt_plan_hash`、`repeatability_class`、`execution_contract_digest` 在首个 attempt 开始后不可变
- **MUST NOT**：提交后按结果回填 / 改写 seed 集合或 attempt 总数
- **SHOULD**：connected mode 下由平台返回 `registration_receipt`
- **MAY**：Community 允许 `offline_provisional`，但默认只能进 self-reported / community 通道

### 1.3 Canonical object B：`completeness-proof.json`

**作用**：平台侧证明“声明过的 run-group 是否完整披露”。  
**创建时机**：`upload` 完成且 intake 验证后。  
**权威性**：高于提交方自报；Reproduced / Verified 准入必须以该对象结论为准。

#### 字段表

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `schema_version` | string | MUST | 例如 `ohbp.completeness-proof.v0.1` |
| `proof_id` | string | MUST | 证明对象 ID |
| `proof_generated_at` | string | MUST | 生成时间 |
| `run_group_id` | string | MUST | 对应 run-group |
| `registration_digest` | string | MUST | 绑定预注册对象 |
| `expected_attempt_total` | integer | MUST | 来自 registration |
| `observed_attempt_total` | integer | MUST | 平台实际收到 attempts 数 |
| `slot_coverage_rate` | number | MUST | 已覆盖 slot / 预注册 slot |
| `missing_slots` | array[object] | MUST | 缺失 attempt slots |
| `unexpected_attempts` | array[object] | MUST | 未声明却上传的 attempts |
| `duplicate_attempts` | array[object] | MUST | 重复 attempt / 冲突 bundle |
| `replacement_attempts` | array[object] | MAY | 允许 replacement 时的链路 |
| `task_coverage_summary` | object | MUST | declared / scorable / missing 的任务覆盖摘要 |
| `attempt_terminal_status_histogram` | object | MUST | 每种 disposition 计数 |
| `bundle_digest_list_hash` | string | SHOULD | 全量 bundle manifest 列表摘要 |
| `completeness_verdict` | enum | MUST | `complete`, `incomplete`, `overreported`, `duplicate_conflict`, `tampered` |
| `tier_eligibility_effect` | enum | MUST | `eligible`, `downgrade_to_community`, `reject`, `manual_review` |
| `signed_by_platform` | object | SHOULD | 平台签名 / attestation |

#### 规范要求

- **MUST**：Reproduced / Verified 必须满足 `completeness_verdict = complete`
- **MUST**：只要出现 `missing_slots`、`unexpected_attempts`、`duplicate_attempts` 任一非空，就不能自动升入 Verified
- **MUST NOT**：由提交方单方面生成并自证为“complete”
- **SHOULD**：平台把 `replacement_attempts` 单独列出，不允许“静默重跑替换”

### 1.4 Completeness 的裁定逻辑

建议使用以下优先级：

1. **先比 slot**：预注册的 attempt slots 是否一一对应
2. **再比 bundle**：每个 slot 是否有唯一 bundle / attempt 证据
3. **再比任务覆盖**：每个 attempt 的任务 coverage 是否完整
4. **最后看 rerun 合法性**：replacement 是否符合 `allowed_replacement_policy`

### 1.5 Rerun / Replacement 规则

默认规则：

- `allowed_replacement_policy = none`
- 仅以下情况可 replacement：
  - 平台确认的 `evaluator_error`
  - 平台确认的基础设施故障（而非 harness 自己 crash）

即使允许 replacement，也必须：

- 保留原始 failed / errored 记录
- 在 `replacement_attempts` 中显式链出
- 不改变 `declared_attempt_total`
- 不允许借 rerun 获得“更好的一次”

---

## 2. IR-03：tolerance policy 的唯一挂载点与字段表

### 2.1 设计决策

建议把 tolerance policy 的**唯一真源**放在：

```text
Execution Contract.verification_policy.tolerance_policy
```

原因：

1. tolerance 是“同一 lane 下怎样算 replay / reproduce / promote 成功”的外部比较条件  
2. 它应先于 run 被确定，不能事后按结果改写  
3. M4 / M5 / M6 都会用到，但都不应该各自再定义一遍

因此：

- **M2**：定义对象本体
- **M3 / M5 / M6 / M4**：只存 `tolerance_policy_digest` 或 `tolerance_policy_ref`

### 2.2 Canonical object：`verification_policy.tolerance_policy`

#### 字段表

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `tolerance_policy_id` | string | MUST | 容差规则 ID |
| `tolerance_policy_version` | string | MUST | 版本 |
| `tolerance_policy_digest` | string | MUST | 摘要 |
| `applies_to_tiers` | array[enum] | MUST | 如 `reproduced`, `verified` |
| `allowed_repeatability_classes` | array[enum] | MUST | `true_seeded`, `pseudo_repeated` |
| `comparison_unit` | enum | MUST | `task`, `attempt`, `run_group` |
| `statistical_protocol` | object | MUST | `paired_bootstrap`, `clustered_bootstrap`, `exact_match` 等 |
| `metric_rules` | array[object] | MUST | 对 success / timeout / crash / cost / latency 等逐项规则 |
| `missingness_rule` | object | MUST | 缺失 evidence / 缺失 task 的处理 |
| `replay_rule` | object | MUST | replay 需要 exact 还是 bounded match |
| `reproduce_rule` | object | MUST | reproduce 的 run-group agreement 规则 |
| `promotion_gate` | object | MUST | 从 candidate -> reproduced / verified 的硬门槛 |
| `notes` | string | MAY | lane 说明 |

#### `metric_rules[]` 最小子字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `metric_id` | string | MUST | 如 `task_success_rate`, `timeout_rate`, `crash_rate` |
| `level` | enum | MUST | `task`, `attempt`, `run_group` |
| `comparison_method` | enum | MUST | `exact_match`, `abs_delta`, `rel_delta`, `ci_overlap`, `distributional_match` |
| `threshold_abs` | number/null | MAY | 绝对容差 |
| `threshold_rel` | number/null | MAY | 相对容差 |
| `directionality` | enum | MUST | `two_sided`, `non_inferior`, `non_superior` |
| `hard_fail` | boolean | MUST | 是否一票否决 |

### 2.3 推荐解释规则

建议把 tolerance 分成 3 层：

1. **Replay tolerance**  
   - 目标：平台能否依据 bundle 复算 / 重放出一致结果  
   - deterministic lane 优先 `exact_match`

2. **Reproduce tolerance**  
   - 目标：新 run-group 与参考 run-group 是否在统计上“足够接近”  
   - 关注 success / timeout / crash / cost / latency 的 delta 与 CI

3. **Promotion tolerance**  
   - 目标：能否从 candidate 升为 Reproduced / Verified  
   - 与 tier 门槛、repeatability class、completeness verdict 一起生效

### 2.4 规范要求

- **MUST**：任何 `within tolerance` 的说法都必须可追溯到 `tolerance_policy_digest`
- **MUST NOT**：M4 / M5 / M6 再写“口头容差规则”而不落对象
- **SHOULD**：不同 lane 可有不同 policy，但必须版本化
- **MUST**：board slice 至少隐含绑定 `tolerance_policy_digest`，防止不同容差规则混排

---

## 3. IR-04：task disposition / denominator 状态机

### 3.1 设计决策

当前 draft1 的核心问题不是“没有状态名”，而是**没有把状态和分母规则绑定**。  
建议 draft2 把 task-level 状态拆成三层：

1. **Execution disposition**
2. **Scoring disposition**
3. **Visibility disposition**

对外兼容展示时，可导出一个 `task_disposition` 扁平字段；  
但规范正文应先定义三层状态机，否则 `redacted` 会与 `failed` / `evaluator_error` 混义。

### 3.2 三层状态机

#### A. Execution disposition

- `succeeded`
- `failed`
- `timeout`
- `crash`
- `policy_violation`
- `skipped`
- `not_attempted`

#### B. Scoring disposition

- `scored`
- `evaluator_error`

#### C. Visibility disposition

- `public`
- `redacted`

### 3.3 关键解释

- `redacted` **不是能力结果本身**，而是发布层 overlay  
- 若 `visibility_disposition = redacted`，**必须**同时有 `underlying_execution_disposition`
- 若没有 sealed evidence 支撑，`redacted` 不能进入 Reproduced / Verified 的 scorable denominator

### 3.4 两个分母

#### 1) `declared_task_denominator`

定义：

> 该 attempt / run 本来应该覆盖的任务总数。

用途：

- 检查 completeness
- 检查 selective reporting
- 检查是否“少传了失败任务”

#### 2) `scorable_task_denominator`

定义：

> 在 declared tasks 中，能够被平台合法计入能力评分的任务总数。

默认计算：

```text
scorable_task_denominator
= declared_task_denominator
- platform_confirmed_evaluator_error
- platform_unscorable_redactions
```

说明：

- `not_attempted` 不会自动从 declared denominator 中消失
- 但 `not_attempted` 通常意味着该 attempt / run-group completeness 不成立，高 tier 不可进榜

### 3.5 Disposition × denominator 规则表

| disposition | 语义 | 计入 declared denominator | 计入 scorable denominator | success numerator | 是否允许 replacement |
|---|---|---:|---:|---:|---|
| `succeeded` | 任务完成且评分通过 | 是 | 是 | 是 | 否 |
| `failed` | 任务完成但未通过 | 是 | 是 | 否 | 否 |
| `timeout` | 超时终止 | 是 | 是 | 否 | 否 |
| `crash` | harness / runtime 崩溃 | 是 | 是 | 否 | 仅限平台确认的基础设施故障 |
| `policy_violation` | 违反 contract | 是 | 是 | 否 | 否，且可能整组失格 |
| `skipped` | 代理显式跳过任务 | 是 | 是（默认当失败） | 否 | 否 |
| `not_attempted` | 应跑未跑 / 无有效 attempt | 是 | 否 | 否 | 不自动允许；通常触发 completeness fail |
| `evaluator_error` | 平台确认评分器无法裁决 | 是 | 否 | 否 | 是，需保留原始记录 |
| `redacted` | 公开副本脱敏 | 是 | 视 underlying + sealed evidence 而定 | 视 underlying 而定 | 不单独决定 |

### 3.6 规范性公式

建议在 M6 增加以下定义：

```text
task_success_rate = succeeded_tasks / scorable_task_denominator

attempt_coverage_rate = attempted_or_terminal_tasks / declared_task_denominator

run_group_publishable = 
  (all attempts disclosed)
  AND (no unresolved missing task slots)
  AND (completeness_verdict = complete)
```

### 3.7 Replacement / repair 规则

只有两类情况允许同一 task slot 触发 replacement：

1. 平台确认的 `evaluator_error`
2. 平台确认的 infra fault（非 harness 自身 crash）

并且：

- 原始 disposition 必须保留
- replacement 只能修复“可评分性”，不能修复“能力结果”
- 不允许因为模型答差了 / harness 崩了就 rerun 挑更好的一次

---

## 4. IR-05：`true seeded` vs `pseudo repeated` 的 Verified 准入规则

### 4.1 设计决策

不建议一刀切地说“pseudo repeated 永远不能进 Verified”。  
那会把大量现实闭源模型直接排除，削弱协议 adoption。

但也不能把两者当成等价证据。  
因此建议采用：

1. **准入不等价**
2. **切片不混排**
3. **pseudo repeated 需要更严格门槛**

### 4.2 定义

- **`true_seeded`**：底层 provider / runner 支持真实 seed 或等价可控随机源，attempt slot 能由 seed 直接复指
- **`pseudo_repeated`**：无法真正固定 seed，只能通过 provider snapshot、请求模板、时间窗、attempt index 等元数据近似控制随机性

### 4.3 准入表

| repeatability class | Reproduced | Verified | 默认榜单处理 |
|---|---|---|---|
| `true_seeded` | 允许，`n_runs >= 3` | 允许，`n_runs >= 5` | 可进入默认 rankable slice |
| `pseudo_repeated` | 允许，`n_runs >= 3` 且 prereg + completeness + narrow window | **条件允许**：仅当 lane 明确允许 + 平台控制环境 + `n_runs >= 7` + 单独标记 | 必须单独切片，默认不与 `true_seeded` 混榜 |

### 4.4 Pseudo repeated 进入 Verified 的附加条件

`pseudo_repeated` 只有在以下条件全部满足时，才可进入 Verified：

1. **lane / execution contract 明确写明 `pseudo_repeated` 可升 Verified**
2. **connected / platform-controlled execution**
3. **`run-group-registration.json` 在首跑前冻结**
4. **`completeness_verdict = complete`**
5. **`n_runs >= 7`**
6. **固定 provider / model snapshot / request template hash / policy digests**
7. **submission window 收紧**，避免长时间窗引入额外漂移
8. **显示为 `verified (pseudo-repeated)` 或等价显式标签**

### 4.5 一条重要否决规则

如果某 lane / provider **理论上支持 true seed**，但提交方选择不使用，只提供 `pseudo_repeated`：

- **不得进入 Verified**
- 最多进入 Reproduced 或 Community

### 4.6 Slice 维度要求

建议把以下字段加入 board slice 的最小固定维度：

- `repeatability_class`
- `tolerance_policy_digest`

否则：

- `true_seeded` 与 `pseudo_repeated` 会被错误混排
- 不同容差规则下的结果会被错误视为同标准

---

## 5. IR-06：`harness_lift` / `model_lift` 的处理建议

### 5.1 设计决策

建议对这两个概念采取 **“降级 + 改写”**：

1. **从规范核心里删除单标量公式**
2. **保留为 research / analysis 视图中的概念标签**
3. **主规范改为 paired delta panel**

原因：

- 当前公式依赖未定义的 `score(...)`
- 容易偷渡成“神圣总分”
- 与 OHBP “多指标 + uncertainty + 不装作单真理” 的原则冲突

### 5.2 替代方案：paired delta panel

建议在研究视图中，用以下显式指标替代：

- `delta_success_vs_baseline`
- `delta_cost_vs_baseline`
- `delta_latency_vs_baseline`
- `delta_timeout_vs_baseline`
- `delta_crash_vs_baseline`
- 各自 CI / IQR / paired bootstrap 区间

并强制声明：

- baseline 是谁
- baseline 所在 slice
- paired condition 是否满足

### 5.3 规范要求

- **MUST NOT**：draft2 继续保留 `harness_lift = score(...) - score(...)` 作为规范字段
- **SHOULD**：在 M6 中保留“lift 作为研究术语”的说明
- **MAY**：产品层若确实要做某种 composite lift，必须归入 ranking policy / product policy，而非 protocol core

---

## 6. IR-08：board slice 最低发布门槛与稀疏切片降级规则

### 6.1 设计决策

建议把“能不能公开”和“能不能排序”分成两层：

1. **Entry gate**：单个 run-group 能否出现在该 slice 中
2. **Slice gate**：该 slice 能否被公开成真正的 leaderboard

### 6.2 Entry gate（单 entry 进入 slice 的最低门槛）

单个 run-group 进入某个公开 slice，至少要满足：

1. `completeness_verdict = complete`
2. 满足该 trust tier 的最小 `n_runs`
3. `declared_task_denominator` 覆盖完整
4. `scorable_task_denominator` 达到 lane 定义的最低 publishable floor
5. 绑定唯一的：
   - `execution_contract_digest`
   - `tolerance_policy_digest`
   - `repeatability_class`
   - `trust_tier`

若不满足：

- 可保留证据页 / profile 页
- 但不得当作该 slice 的正式 entry 排名

### 6.3 Slice gate（切片公开形态）

建议采用以下 4 档状态：

| slice 状态 | 条件 | UI / 排名行为 |
|---|---|---|
| `insufficient_evidence` | `< 2` 个 eligible entries | 只显示条目卡，不生成排行榜 |
| `comparison_only` | 恰好 `2` 个 eligible entries | 只显示 head-to-head 对比，不给 ordinal rank |
| `ranked_tiered` | `>= 3` 个 eligible entries，但 rank spread / CI 重叠较大 | 显示 tier / cluster；同 tier 内不强排先后 |
| `ranked_ordinal` | `>= 3` 个 eligible entries，且相邻层级具有足够分离证据 | 显示有 uncertainty 的顺序榜 |

### 6.4 推荐默认门槛

若 lane 没有更严格的 override，建议 v0.1 默认：

- **公开比较至少需要 2 个 eligible entries**
- **公开排序至少需要 3 个 eligible entries**
- **Verified 主榜 entry 至少满足自身 tier 的 run 数门槛**
- **`pseudo_repeated` Verified slice 与 `true_seeded` Verified slice 分开计数、分开发布**

### 6.5 稀疏切片的降级规则

以下任一情况触发降级：

1. eligible entries 太少
2. `repeatability_class` 混杂
3. `tolerance_policy_digest` 不一致
4. rank spread 高度重叠
5. evaluator error / redaction 过多，导致 `scorable_task_denominator` 太低
6. benchmark health 把该 slice 标到 `watchlist`

降级路径建议：

```text
ranked_ordinal
  -> ranked_tiered
  -> comparison_only
  -> insufficient_evidence
```

### 6.6 Official main board 的附加限制

默认官方主榜建议再加两条：

1. 只收 `Verified`
2. 只收同一 `repeatability_class` 的 slice  
   - 优先 `true_seeded`
   - `pseudo_repeated` 若存在，应单独页签 / 单独筛选，不默认混入

---

## 7. 建议改动到哪些模块、哪些段落

下面不是直接改稿，而是给主控整合 draft2 时的落点建议。

### 7.1 `modules/benchmark-execution.md`（M2）

#### 建议改动段落

1. **§6 Execution Contract**
   - 在 `6.2 Execution Contract 的最低字段` 中新增：
     - `verification_policy`
     - 其内的 `tolerance_policy`
   - 在 `6.3 合约必须固定的比较条件` 中，把：
     - `repeatability_class`
     - `promotion gate`
     - `tolerance_policy_digest`
     写成 contract 固定条件

2. **§7 Lane 设计**
   - 在 `7.2 Lane 的必填字段` 中新增或收紧：
     - `supported_repeatability_classes`
     - `min_publishable_task_floor`
     - `min_rankable_entries`
     - `pseudo_repeated_verified_allowed`
   - `ranking_eligibility` 建议只保留 advisory，不再替代后续 board gate

### 7.2 `modules/run-data-evidence.md`（M3）

#### 建议改动段落

1. **§3 核心对象与标识**
   - 新增：
     - `registration_id`
     - `proof_id`

2. **新增专节：Run-group Registration**
   - 定义 `run-group-registration.json`

3. **新增专节：Completeness Proof**
   - 定义 `completeness-proof.json`

4. **§4 Run Manifest**
   - 新增 manifest 引用字段：
     - `registration_digest`
     - `tolerance_policy_digest`
     - `repeatability_class`

5. **§Task-level Results（对应 task-results / task_results）**
   - 新增：
     - `execution_disposition`
     - `scoring_disposition`
     - `visibility_disposition`
     - `underlying_execution_disposition`
     - `counts_for_declared_denominator`
     - `counts_for_scorable_denominator`

### 7.3 `modules/trust-governance-ranking.md`（M4）

#### 建议改动段落

1. **§3 Reproduced / Verified Tier**
   - 把 `true_seeded` 与 `pseudo_repeated` 的准入条件写死
   - 明确 pseudo repeated 的 Verified 附加门槛

2. **§5 Audit Flow**
   - `Step 0 — Registration / Declaration` 升级为：
     - 必须有 `run-group-registration.json`
   - `Step 1 — Intake Validation` 中加入：
     - 平台生成 `completeness-proof.json`
   - `Step 3 / Step 4` 中把 tolerance 的判断改成：
     - 依据 `tolerance_policy_digest`

3. **§4 Ranking Policy / board slice**
   - 明确：
     - slice 绑定 `repeatability_class`
     - slice 绑定 `tolerance_policy_digest`
     - slice 发布状态机（4 档）

### 7.4 `modules/cli-adapter.md`（M5）

#### 建议改动段落

1. **§4.2 `init`**
   - `init` 必须产出 `run-group-registration.json`
   - connected mode 必须拿到 `registration_receipt`

2. **§4.3 `run`**
   - 首个 attempt 启动后冻结 registration 对象
   - 不允许运行过程中变更 attempt plan

3. **§4.4 `pack`**
   - 增加 slot-level completeness 校验
   - 若 incomplete，只能打 `community candidate`

4. **§4.5 `upload`**
   - 平台 receipt 外，再新增 `completeness-proof.json`

5. **§4.6 `replay` / §4.7 `reproduce`**
   - 不再口头说“达到所需容差”
   - 必须读取 `tolerance_policy_digest`

### 7.5 `modules/metrics-uncertainty.md`（M6）

#### 建议改动段落

1. **§5 Repeated Runs**
   - 补：
     - preregistration object
     - completeness proof
     - true_seeded / pseudo_repeated gate

2. **§6 不确定性**
   - 增加 slice 发布状态机与 tiering 降级规则

3. **§7 Model vs Harness 分离**
   - 删除单标量 `harness_lift` / `model_lift` 公式
   - 改为 paired delta panel 的 research-only 说明

4. **新增专节：Task Disposition & Denominator Policy**
   - 写入两层分母 + disposition 规则表

### 7.6 `ohbp-v0.1-draft1.md`（主文档汇总稿）

#### 建议改动段落

1. **§5 Run Data & Evidence 层**
   - 对象清单新增：
     - `run-group-registration`
     - `completeness-proof`

2. **§7 Verification Tiers 与治理**
   - 钉死 pseudo repeated 的 Verified 条件

3. **§8 Ranking Policy**
   - board slice 最小固定维度新增：
     - `repeatability_class`
     - `tolerance_policy_digest`
   - 加入发布状态机

4. **§9 指标体系与不确定性**
   - 删除 `harness_lift` / `model_lift` 的规范性写法
   - 加入 disposition / denominator / publishability 规则

---

## 8. 建议给主控的整合顺序

建议主控整合 draft2 时按下面顺序落稿：

1. **先在 M2 定义 `tolerance_policy`**
2. **再在 M3 定义 registration / completeness / disposition**
3. **再在 M4 写 tier 准入与 board gate**
4. **最后在 M6 统一统计口径与 publishability**

原因很简单：

- M2 固定 contract 边界
- M3 负责事实对象
- M4 负责治理裁定
- M6 负责统计解释

若顺序反过来，就会再次出现“统计口径先写了，但对象没有 canonical 挂载点”的问题。

---

## 9. 本 repair packet 的一句话版本

> draft2 必须把“重复运行是如何先声明、如何证明全量披露、如何定义容差、哪些任务算进分母、哪些 pseudo repeated 能进 Verified、以及切片何时只能观察不能排名”全部收敛成对象与状态机，否则 v0.1 仍然只是有观点但不可审计的 prose。
