# Focused Patch Packet F1 — Evidence Channel + Autonomy Closure

> 范围：只处理 residual P1 `R2-01` 与 `R2-02`
> 
> 目标：不给主稿扩 scope，只把 draft2 剩余的双通道 evidence 与 autonomy 审计边界收口成 machine-checkable protocol objects
> 
> 约束：本 packet **不直接改主稿**，也**不接管** F2 的 registration / manifest ref / subject binding 收口；主控整合时只需把本 packet 的字段、枚举、MUST 规则吸收进 draft3。

---

## 0. 结论

draft2 在治理层剩下的两个 P1，本质上都是“已经知道方向，但还没有把规则冻结成对象”的问题：

1. **public / sealed 仍偏 prose，没有 canonical `evidence_channel` 对象；**
2. **`autonomous / approval_only / interactive` 仍有“上传者声明大于机审闭环”的缝。**

因此，本 packet 的最小 closing move 只有两件事：

- 把双通道公开度收口成 **`evidence_channel` canonical object + public/sealed artifact matrix**；
- 把 autonomy 收口成 **`interaction-summary.json` + `interaction-log.jsonl` 驱动的平台派生判定**，并冻结零输入 sentinel 与自动降级条件。

如果以下字段、枚举与 MUST 规则被整合进 `ohbp-v0.1-draft3.md`，则：

- **R2-01 可以关闭；**
- **R2-02 可以关闭；**
- 且不会与 F2 的 `manifest / verification_record binding` 收口冲突。

---

## 1. 要关闭的 P1 映射

| residual P1 | 本 packet 的关闭方式 | 首选落点 |
|---|---|---|
| `R2-01` public / sealed 双通道 evidence canonicalization | 冻结 `evidence_channel` canonical object、`visibility_class` / `release_policy` 枚举、public vs sealed artifact matrix、Benchmark Health 联动规则 | `§8` / `§9` / `§10` / `§12` |
| `R2-02` autonomy schema closure | 冻结 `interaction-summary.json` 最小字段、`tty_freeform_input_detected`、`ZERO_INPUT_V1` sentinel、`approval_only -> interactive` 自动降级条件、`target_ref` 绑定要求 | `§8` / `§9` / `§10` |

**跨流说明：**

- F1 只要求以上字段**有且仅有一套 canonical 名称**；
- F2 仍需负责把这些字段与 `manifest.json` / `verification_record.subject_ref` / bundle subject binding 做最终闭环；
- 主控整合时不要再发明别名，例如不要同时保留 `sealed_bundle_digest` / `sealed_audit_bundle_digest` 两套写法。

---

## 2. Patch instructions（按章节）

### §7 Registration / Completeness / Tolerance

**本节不新增 F1 的 registration schema。**

只建议在 `§7.1` 末尾或 `§7` 末尾补一条同步说明，防止 registration 回流成第二真源：

> `requested_trust_tier`、`evidence_channel_mode`、`visibility_class`、`release_policy` 与 `autonomy_mode` 都不是 registration 自报即成立的真值；前者由平台审定，后者必须在 `§8–§9` 基于 bundle 证据与 interaction telemetry 派生。

**目的：**

- 不让 `registration` 抢走 `verification_record` 的治理真源地位；
- 不把 F1 扩张成新的 preregistration 分支；
- 与 F2 的 registration 收口保持正交。

---

### §8 Run Data & Evidence 合同

#### 8.1 `final bundle canonical layout` 后追加：`evidence_channel` canonical contract

主控应在 `§8.1` 当前 bundle layout 之后、`§8.2` 之前，新增一个短节，明确：

1. **当前 draft2 的 canonical final bundle 视为 `public bundle`。**
2. 当 `evidence_channel_mode = public_plus_sealed` 时，**必须存在一个可审计寻址的 `sealed audit bundle`**；它与 public bundle 共享同一逻辑路径语义，但允许保留 public bundle 中被 redaction / omission 的原始 trace、payload、artifact、interaction、audit material。
3. 双通道不是“两种随便说的发布策略”，而是 **一个 canonical object**，必须有固定字段、固定 digest 绑定与固定 release 规则。

#### 建议插入的 public / sealed artifact matrix

| artifact class | `public_only` | `public_plus_sealed` 的 public channel | `public_plus_sealed` 的 sealed channel |
|---|---|---|---|
| `manifest.json` | MUST | MUST（公开版必须保留 digests / policy / refs） | MUST（审计原版） |
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

**规范性补句：**

> Public bundle 与 sealed audit bundle 是同一被裁决结果的两条证据通道；它们 **MUST** 通过 digest 明确绑定，且 public bundle **MUST NOT** 假装自己等于 sealed raw evidence。

#### 8.2 `manifest.json` 是 runtime identity 单一真源 —— 增补 `Evidence Channel` 分组

在当前 `Benchmark / Task Package / Execution Contract / Evaluator / Runtime / Harness / Model / Policy / Registration / Verification refs` 之后，新增：

#### Evidence Channel

- `evidence.evidence_channel_mode`
- `evidence.public_bundle_digest`
- `evidence.sealed_audit_bundle_digest`
- `evidence.visibility_class`
- `evidence.release_policy`
- `evidence.redaction_policy_id`
- `evidence.release_not_before`
- `evidence.sealed_access_policy_id`

其中 `release_not_before` 与 `sealed_access_policy_id` 可为 SHOULD，但前 6 个字段建议冻结为 canonical fields。

#### 8.4 Governance evidence reports —— 必须同步修补的 schema 闭环

主控整合 draft3 时，建议把以下 4 个地方同步修补，避免 `§9` 写了规则、`§8.4` 仍缺字段：

##### A. `interaction-log.jsonl`

将 `target_ref` 从泛泛字段升级为：

- 对以下事件类型 **MUST**：
  - `approval_request`
  - `approval_granted`
  - `approval_denied`
  - `approval_aborted`
  - `manual_command`
  - `manual_file_patch`
  - `editor_write`
- 对纯观察类事件可以保留 MAY/SHOULD。

并冻结最小 `interaction_type` 集合：

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

##### B. `interaction-summary.json`

在现有字段表基础上，**必须新增或冻结**：

- `tty_freeform_input_detected`
- `approval_target_linkage_complete`

并明确：

- `tty_input_digest` 在无任何人类 TTY 文本输入时，**MUST** 等于固定 sentinel：`ZERO_INPUT_V1`
- `classification_verdict` 的 canonical enum 只有：
  - `autonomous`
  - `approval_only`
  - `interactive`

##### C. `redactions.json`

新增最小字段表：

- `redaction_policy_id`
- `redacted_paths[]`
- `sealed_only_paths[]`
- `reason_codes[]`

用来 machine-check：哪些路径 public 版本是删节、哪些只存在于 sealed、采用哪套 redaction policy。

##### D. `reports/environment-report.json`

与当前 `§9.4 Verified` 同步，补齐：

- `network_proxy_log_digest`（当 Verified 结果允许联网时 MUST）

避免 `§9.4` 要求了网络审计摘要，但 `§8.4` 的最小字段表里没有。

---

### §9 Verification Tiers 与治理

#### 9.1 `Verification Record` —— 增加 F1 需要的平台审定字段

在当前最小字段表之后，新增以下 adjudicated fields：

- `autonomy_mode`
- `interaction_summary_digest`
- `evidence_channel_mode`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `visibility_class`
- `release_policy`
- `redaction_policy_id`

**规范性补句：**

> `autonomy_mode` 与 `evidence_channel` 相关字段 **MUST** 由平台基于 `§8` 的 evidence objects 审定并写入 `verification_record`；上传者自报值可以保留为输入，但不得作为榜单与切片的权威真源。

> `board_slice.autonomy_mode`、evidence release / visibility gating **MUST** 读取 `verification_record` 的审定值，而不是 CLI 侧声明值。

#### 9.3 `Reproduced` 与 9.4 `Verified` —— 增加双通道强制条件

建议在两节中分别追加以下规范：

1. `hidden` / `holdout` / `rotating` split 的 `Reproduced` 与 `Verified` 结果，**MUST** 使用 `evidence_channel_mode = public_plus_sealed`。
2. 凡是 public bundle 中对 `task-results.ndjson`、`trace/events/*`、`payloads/*`、`interaction-log.jsonl` 做了 redaction / omission，但仍申请高信任 tier 的结果，**MUST** 存在 `sealed_audit_bundle_digest`。
3. 已 `published` 的高信任结果，公开层 **MUST** 可见：
   - `public_bundle_digest`
   - `sealed_audit_bundle_digest`（若存在 sealed）
   - `visibility_class`
   - `release_policy`
   - `redaction_policy_id`（若存在 redaction）
4. `publication_state = published` 的结果 **MUST NOT** 使用 `visibility_class = sealed_pending_publication`。

#### 9.5 `Autonomy modes` —— 改成平台派生判定，而不是 prose 定义

建议把 `§9.5` 当前 3 个叶子模式的 prose，升级为 **可程序化判定规则**。

##### `autonomous`

只有当以下条件**同时成立**时，`classification_verdict` 才能是 `autonomous`：

- `human_event_count = 0`
- `approval_event_count = 0`
- `interactive_event_count = 0`
- `tty_freeform_input_detected = false`
- `manual_command_detected = false`
- `manual_file_write_detected = false`
- `editor_interaction_detected = false`
- `tty_input_digest = ZERO_INPUT_V1`
- 存在完整 `interaction-log.jsonl`

##### `approval_only`

只有当以下条件**同时成立**时，`classification_verdict` 才能是 `approval_only`：

- `approval_event_count > 0`
- `interactive_event_count = 0`
- `tty_freeform_input_detected = false`
- `manual_command_detected = false`
- `manual_file_write_detected = false`
- `editor_interaction_detected = false`
- `approval_target_linkage_complete = true`
- 所有审批事件都可在 `interaction-log.jsonl` 中找到并绑定 `target_ref`

##### `interactive`

`interactive` 既是显式模式，也是**自动降级的兜底模式**。凡是以下任一条件成立，结果 **MUST** 归入 `interactive`：

- `tty_freeform_input_detected = true`
- `interactive_event_count > 0`
- `manual_command_detected = true`
- `manual_file_write_detected = true`
- `editor_interaction_detected = true`
- `approval_target_linkage_complete = false`
- 申请 `autonomous` / `approval_only`，但缺失 `interaction-summary.json` 或 `interaction-log.jsonl`

**关键补句（必须加）：**

> `approval_only -> interactive` 的自动降级条件必须机审可判定；一旦出现自由文本输入、手工命令、手工文件改写、编辑器直接写入、或审批事件无法绑定到 `target_ref`，平台 **MUST** 直接降级为 `interactive`，不得继续展示为 `approval_only`。

---

### §10 Ranking Policy 与 Board Slices

#### 10.4 `Entry gate 与 Slice gate` —— 增加两个 F1 gate

在当前 entry gate 条件后追加：

6. 若 `benchmark.split ∈ {hidden, holdout, rotating}` 且 `trust_tier ∈ {Reproduced, Verified}`，则 entry **MUST** 满足与 `Benchmark Health` 相容的 `evidence_channel` 规则；不满足时不得进入对应高信任 slice。
7. `autonomy_mode` 相关 slice 的 admission **MUST** 读取 `verification_record.autonomy_mode`；上传者声明不得直接决定 slice。

并加一条兜底规则：

> 缺失 `interaction-summary.json`、缺失完整 `interaction-log.jsonl`、或触发自动降级条件的结果，**MUST NOT** 进入 `autonomous` / `approval_only` slice；平台应将其按 `interactive` 展示，或在审计完成前标记为 ineligible。

#### 10.5 `Official main board 默认规则` —— 增加 evidence-health 约束

在“只收 Verified / 只收同一 repeatability_class”之后，再加一条：

3. 若 benchmark 仍处于 `fresh` / `active`，且 split 为 `hidden` / `holdout` / `rotating`，则默认官方主榜只接收满足 benchmark-health-compatible release policy 的高信任结果；公开 full raw evidence 与 benchmark health 冲突的结果，不得进入默认官方主榜。

---

### §12 Benchmark Health

本节需要把当前 prose 的 “与 release policy 联动” 写成小矩阵，而不是一句话带过。

#### 建议插入的 health × release policy coupling

| benchmark health / split 状态 | 允许的默认 public 形态 | REQUIRED evidence channel rule |
|---|---|---|
| `fresh` / `active` + `hidden` / `holdout` / `rotating` | `public_redacted` 或 `public_summary` | `evidence_channel_mode = public_plus_sealed`；`release_policy` 只能是 `delayed_until_date` / `delayed_until_legacy` / `summary_only_permanent` |
| `fresh` / `active` + public split | `public_full` 或 `public_redacted` | 可 `public_only`，但若高信任审计仍需要 raw evidence，可保留 sealed 通道 |
| `aging` | `public_redacted` / `public_summary` / 受控 `public_full` | 可以按 benchmark policy 放宽，但 `public_bundle_digest`、`sealed_audit_bundle_digest`、`redaction_policy_id` 历史 MUST 保留 |
| `legacy` | 可放宽为 `public_full` | release policy 变化 MUST 版本化；新公开版生成新 digest，旧审计链不可静默覆盖 |

**必须补一句：**

> Benchmark Health 不是展示层标签，而是 `release_policy` 与 `visibility_class` 的约束输入；当 benchmark 处于 `fresh` / `active` 且存在 hidden integrity 风险时，公开 full raw evidence 的结果不得因为“更透明”而直接获得高信任主榜资格。

---

## 3. Canonical field tables

### 3.1 `manifest.json` 中的 `evidence` 对象（新增）

| canonical path | 级别 | 类型 / 枚举 | 说明 |
|---|---:|---|---|
| `evidence.evidence_channel_mode` | MUST | `public_only` \| `public_plus_sealed` | 是否存在 sealed audit 通道 |
| `evidence.public_bundle_digest` | MUST | digest string | public bundle 的权威摘要 |
| `evidence.sealed_audit_bundle_digest` | MUST if `public_plus_sealed` | digest string | sealed audit bundle 的权威摘要 |
| `evidence.visibility_class` | MUST | `public_full` \| `public_redacted` \| `public_summary` \| `sealed_pending_publication` | 当前对外可见形态 |
| `evidence.release_policy` | MUST | `public_immediate` \| `delayed_until_date` \| `delayed_until_legacy` \| `summary_only_permanent` | 公开策略 |
| `evidence.redaction_policy_id` | MUST if `visibility_class != public_full` OR `evidence_channel_mode = public_plus_sealed` | string | 采用哪套删节/脱敏策略 |
| `evidence.release_not_before` | SHOULD; MUST if `release_policy = delayed_until_date` | RFC3339 timestamp | 最早解封时间 |
| `evidence.sealed_access_policy_id` | SHOULD if `public_plus_sealed` | string | 哪类平台/授权审计者可访问 sealed |

**固定解释：**

- `public_full`：public bundle 已足够完整，原则上可支持公开 replay；
- `public_redacted`：public bundle 保留 canonical layout，但含删节内容；
- `public_summary`：public bundle 只公开摘要 / digest / public-safe 结果，原始细节留在 sealed；
- `sealed_pending_publication`：仅允许出现在 `submitted` / `provisional` 阶段，**不得** 作为 `published` 状态继续上榜。

---

### 3.2 `interaction-summary.json`（新增/冻结字段）

| field | 级别 | 类型 / 枚举 | 说明 |
|---|---:|---|---|
| `autonomy_mode_declared` | MAY | string | 上传侧自报；不可作为权威真源 |
| `human_event_count` | MUST | integer | 所有人类可观察事件总数 |
| `approval_event_count` | MUST | integer | 审批事件数 |
| `interactive_event_count` | MUST | integer | 自由输入 / 手工编辑 / 手工命令事件数 |
| `tty_input_digest` | MUST | digest string or `ZERO_INPUT_V1` | 人类 TTY 文本输入摘要；无输入时必须是固定 sentinel |
| `tty_freeform_input_detected` | MUST | boolean | 是否观察到自由文本输入 |
| `editor_interaction_detected` | MUST | boolean | 是否观察到编辑器直接写入 |
| `manual_file_write_detected` | MUST | boolean | 是否观察到手工文件写入 / patch |
| `manual_command_detected` | MUST | boolean | 是否观察到手工命令 |
| `approval_target_linkage_complete` | MUST | boolean | 审批事件是否都绑定到了 `target_ref` |
| `classification_verdict` | MUST | `autonomous` \| `approval_only` \| `interactive` | 平台/runner 的最终分类结果 |

**固定 sentinel：**

```text
ZERO_INPUT_V1
```

任何实现只要观测到“无任何人类 TTY 文本输入”，就必须把 `tty_input_digest` 写成该常量，而不是写空字符串、`null`、`none`、`0` 或自定义别名。

---

### 3.3 `interaction-log.jsonl`（必须同步收紧）

| field | 级别 | 规则 |
|---|---:|---|
| `event_id` | MUST | 唯一事件标识 |
| `attempt_id` | MUST | 归属 attempt |
| `timestamp` | MUST | 事件时间 |
| `actor_type` | MUST | 至少支持 `human` / `agent` / `platform` |
| `interaction_type` | MUST | 使用 `§8.4` 冻结的 canonical 集合 |
| `target_ref` | MUST for approval / manual-change event types | 审批与人工修改事件必须能绑定到 task / action / trace object |
| `content_digest` | SHOULD | 内容或补丁摘要 |
| `content_redacted` | SHOULD | 是否删节 |
| `policy_classification` | SHOULD | 用于 autonomy 判定的事件标签 |

---

### 3.4 `verification_record` 的 F1 增补字段

| field | 级别 | 说明 |
|---|---:|---|
| `autonomy_mode` | MUST | 经平台审定后的叶子模式 |
| `interaction_summary_digest` | MUST for `Reproduced` / `Verified` | 绑定 autonomy 审计证据 |
| `evidence_channel_mode` | MUST | 经平台审定后的通道模式 |
| `public_bundle_digest` | MUST | 公开证据通道摘要 |
| `sealed_audit_bundle_digest` | MUST if sealed exists | 密封审计通道摘要 |
| `visibility_class` | MUST | 当前对外可见形态 |
| `release_policy` | MUST | 当前 release contract |
| `redaction_policy_id` | MUST if redacted / sealed | 删节策略版本 |

> 注：F2 仍需负责把这些字段与 `subject_ref` / `subject_bundle_digest` 做最终 binding；F1 只要求这些字段先冻结成 canonical names。

---

### 3.5 `redactions.json`（新增最小字段表）

| field | 级别 | 说明 |
|---|---:|---|
| `redaction_policy_id` | MUST | 采用哪套删节策略 |
| `redacted_paths[]` | MUST | public 版本中被删节但仍保留文件位点的路径 |
| `sealed_only_paths[]` | MUST | 只存在于 sealed 的路径 |
| `reason_codes[]` | MUST | 删节原因，例如 hidden split protection / privacy / secret material |

---

### 3.6 `reports/environment-report.json`（F1 同步修补项）

| field | 级别 | 说明 |
|---|---:|---|
| `network_proxy_log_digest` | MUST when `Verified` and network is allowed | 联网审计摘要 |

---

## 4. MUST / MUST NOT rules

1. **`evidence_channel_mode` 只能有两种 canonical 值：** `public_only`、`public_plus_sealed`。不得再发明 `dual_channel`、`sealed_optional`、`public_and_private` 等别名。
2. 若 `evidence_channel_mode = public_plus_sealed`，则 `public_bundle_digest` 与 `sealed_audit_bundle_digest` **MUST** 同时存在，并绑定到同一被裁决结果。
3. `hidden` / `holdout` / `rotating` split 的 `Reproduced` 与 `Verified` 结果，**MUST** 使用 `public_plus_sealed`。
4. 任一高信任结果只要 public 版本对 `task-results.ndjson`、`trace/events/*`、`payloads/*`、`interaction-log.jsonl` 做了 redaction / omission，就 **MUST** 提供 `redactions.json` 与 `sealed_audit_bundle_digest`。
5. `publication_state = published` 的结果 **MUST** 存在 `public_bundle_digest`；并且 **MUST NOT** 使用 `visibility_class = sealed_pending_publication`。
6. 当 `visibility_class != public_full` 或存在 sealed 通道时，`redaction_policy_id` **MUST** 存在且版本化。
7. `tty_input_digest` 在“无任何人类 TTY 文本输入”时 **MUST** 等于固定 sentinel `ZERO_INPUT_V1`；不得使用 `null`、空串或实现自定义别名代替。
8. `autonomous` 只在以下条件全部成立时才成立：
   - `human_event_count = 0`
   - `approval_event_count = 0`
   - `interactive_event_count = 0`
   - `tty_freeform_input_detected = false`
   - `manual_command_detected = false`
   - `manual_file_write_detected = false`
   - `editor_interaction_detected = false`
   - `tty_input_digest = ZERO_INPUT_V1`
   - 完整 `interaction-log.jsonl` 存在
9. `approval_only` 只在以下条件全部成立时才成立：
   - `approval_event_count > 0`
   - `interactive_event_count = 0`
   - `tty_freeform_input_detected = false`
   - `manual_command_detected = false`
   - `manual_file_write_detected = false`
   - `editor_interaction_detected = false`
   - `approval_target_linkage_complete = true`
10. **`approval_only -> interactive` 自动降级条件必须显式写死：** 只要出现任一以下条件，平台 **MUST** 直接降级为 `interactive`：
    - `tty_freeform_input_detected = true`
    - `interactive_event_count > 0`
    - `manual_command_detected = true`
    - `manual_file_write_detected = true`
    - `editor_interaction_detected = true`
    - `approval_target_linkage_complete = false`
    - 任一审批事件缺失 `target_ref`
11. 缺失 `interaction-summary.json`、缺失完整 `interaction-log.jsonl`、或 interaction telemetry 不足以满足更严格判定的结果，**MUST NOT** 进入 `autonomous` / `approval_only` slice；平台 **MUST** 将其按 `interactive` 展示，或在复审完成前标记为 ineligible。
12. 当 benchmark 处于 `fresh` / `active` 且 split 为 `hidden` / `holdout` / `rotating` 时，高信任 published 结果 **MUST NOT** 采用 `public_full + public_immediate` 组合；此时至少应使用 `public_plus_sealed`，且 `release_policy` 只能是 `delayed_until_date`、`delayed_until_legacy`、`summary_only_permanent` 之一。
13. Benchmark Health 驱动的 release policy 变化 **MUST** 版本化；一旦 public 内容扩大公开，新的 public bundle **MUST** 产生新的 `public_bundle_digest`，不得静默覆盖旧审计链。

---

## 5. 验收清单

主控整合 draft3 后，以下检查项应全部能被 reviewer 逐条勾选：

### 用于关闭 `R2-01`

- [ ] `§8` 中出现独立的 `evidence_channel` canonical object，而不再只靠 prose 解释 public vs sealed。
- [ ] `evidence_channel_mode`、`public_bundle_digest`、`sealed_audit_bundle_digest`、`visibility_class`、`release_policy`、`redaction_policy_id` 已以 exact names 写入主稿。
- [ ] `§8.1` 有 public vs sealed artifact matrix。
- [ ] `§9.3` / `§9.4` 明确 hidden / holdout / rotating 的高信任结果必须 `public_plus_sealed`。
- [ ] `§10` entry gate 消费 `evidence_channel` 规则，而不是只消费 `trust_tier`。
- [ ] `§12` Benchmark Health 与 `release_policy` / `visibility_class` 的耦合规则已写成表，不再只是口头描述。

### 用于关闭 `R2-02`

- [ ] `interaction-summary.json` 的最小字段表中已出现 `tty_freeform_input_detected`。
- [ ] `ZERO_INPUT_V1` 已作为固定 sentinel 被明确写入主稿。
- [ ] `approval_target_linkage_complete` 或等价字段已被冻结。
- [ ] `interaction-log.jsonl.target_ref` 对审批与人工改动事件已升级为 MUST。
- [ ] `§9.5` 不再只是 prose，而是能程序化判断 `autonomous` / `approval_only` / `interactive`。
- [ ] `approval_only -> interactive` 的自动降级条件已逐条写死。
- [ ] `§10` 明确：缺 telemetry 或触发降级时，结果不得进入 `autonomous` / `approval_only` slice。

### 边角同步项（非新增 scope，但建议一次补齐）

- [ ] `reports/environment-report.json` 的字段表已补上 `network_proxy_log_digest`（与 `§9.4` 一致）。
- [ ] `redactions.json` 已有最小字段表，不再只是“有这个文件”。
- [ ] 没有引入 `dual_channel_mode`、`sealed_bundle_digest`、`requested_autonomy_mode` 等新别名。

---

## 6. 主控注意事项（F1 不接管，但应避免遗漏）

1. **不要把 F1 的字段再拆成两套来源。** 最好由 `manifest.json.evidence.*` 提供原始字段，再由 `verification_record` 写入审定值；不要让 CLI 自报值直接成为榜单真源。
2. **F2 仍需把 `verification_record` 与 subject bundle 做 canonical binding。** 本 packet 没有解决 `subject_ref / subject_bundle_digest`，那仍是 F2 的职责。
3. **trace per-event hash chain 仍属于 P2 收尾项。** 本 packet 没把它拉回 P1，只做了 autonomy / evidence closure 的最低必要同步。

---

## 7. 一句话交付结论

> draft3 只要把双通道 evidence 收口成 `evidence_channel` object，并把 autonomy 收口成 `interaction-summary + interaction-log` 驱动的派生判定，`R2-01` 与 `R2-02` 就能从“治理 prose 缝隙”变成“可机审协议规则”。
