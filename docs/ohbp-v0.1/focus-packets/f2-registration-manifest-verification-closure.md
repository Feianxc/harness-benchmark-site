# F2 Focused Patch Packet — Registration / Manifest / Verification Binding Closure

> 作用范围：仅解决 R2-03 / R2-04 / R2-05 / R2-06  
> 不在本包内扩展产品叙事，不处理 F1 的 public/sealed 与 autonomy 主问题  
> 目标：把 residual P1 收口成 machine-checkable protocol objects

---

## 1. 结论

**结论：draft2 的 F2 剩余问题不是再发明新对象，而是把已有对象之间的“绑定关系”钉死。**

本 patch packet 建议主稿只做 4 类收口：

1. 把 `run-group-registration.json` 中的 `requested_tier` 统一回 `requested_trust_tier`；
2. 为 `pseudo_repeated` 冻结 registration-level 审计字段，使 `narrow window / 近似随机性控制` 可程序化检查；
3. 让 `manifest.json` 真正成为 registration / tolerance 的 canonical join surface；
4. 让 `verification_record` 明确裁决某一个 **attempt-level final bundle**，而不是依赖平台数据库上下文猜测对象。

如果按本包执行，F2 范围内可直接对照关闭：

- **R2-03** `pseudo_repeated` registration-level 审计字段闭环
- **R2-04** `requested_trust_tier` 命名回退
- **R2-05** `manifest.json` 对 registration / tolerance 的唯一真源不足
- **R2-06** `verification_record` 缺少 subject binding

---

## 2. 要关闭的 P1 映射

| P1 ID | 当前症状 | 本包修复动作 | 主落点 |
|---|---|---|---|
| R2-03 | `pseudo_repeated` 仍依赖 prose 的 narrow window / 近似随机性控制 | 在 `run-group-registration.json` 冻结 `submission_window`、`randomness_fingerprint_hint`、`request_template_hash`、`provider_snapshot_lock` / `provider_release_window`，并规定前置冻结与 gate 规则 | §7.1 / §7.4 |
| R2-04 | registration 对象出现 `requested_tier` | 统一改为 `requested_trust_tier`，并声明 `requested_tier` 仅可作为历史 alias 的 intake 兼容，不得进入 normative schema | §7.1 |
| R2-05 | `manifest.json` 仅有 `*_ref`，无足够硬的 registration / tolerance identity path | 在 `manifest.json` 冻结 `registration_ref`、`registration_digest`、`tolerance_policy_ref`、`tolerance_policy_digest`，并加 run identity group | §8.1 / §8.2 |
| R2-06 | `verification_record` 不知道自己在裁决哪个 bundle | 在 `verification_record` 增加 `subject_ref`、`subject_bundle_digest`，并声明 v0.1 的 canonical subject 为 `attempt_bundle` | §9.1 |

---

## 3. Scoped digest / ref 规则（供本 patch 使用）

> 若主稿后续补入全局 digest 规范，则以下字段继承全局规范；在此之前，本包新增字段按以下 scoped rule 解释。

### 3.1 Digest rule

1. **JSON object digest**  
   `sha256(canonical_json(object))`
2. **canonical_json** 指：
   - UTF-8 编码
   - object key 按字典序排序
   - 数组保持原顺序
   - 不保留非语义空白
   - 数字 / 布尔 / null 采用稳定 JSON 序列化
3. **bundle digest**  
   `subject_bundle_digest = sha256(utf8_bytes(checksums.sha256))`  
   前提：`checksums.sha256` 必须按 bundle 内相对路径字典序列出条目，且 **不得把自身再列入自身摘要**。
4. **template hash**  
   `request_template_hash = sha256(normalized_request_template_bytes)`  
   其中 `normalized_request_template_bytes` 指：
   - 已展开协议要求的固定模板层（system / developer / tool contract / request scaffold）
   - 保留跨 attempt 恒定的模板结构
   - 去掉 provider 返回 ID、server timestamp、trace nonce 等运行后才产生的字段
   - 对 attempt-specific placeholders 使用稳定 placeholder token，而不是运行时具体值

### 3.2 Ref resolution rule

1. `registration_ref` 的 canonical 解析目标是 bundle 内的 `run-group-registration.json`
2. `tolerance_policy_ref` 的 canonical 解析目标是  
   `execution_contract#/verification_policy/tolerance_policy`
3. `subject_ref` 的 canonical 解析目标是一个 **attempt-level final bundle**；v0.1 不允许 `verification_record` 直接以 prose 方式指向“某个 run group 结果”

---

## 4. Patch instructions（按章节）

## 4.1 对 §7 Registration / Completeness / Tolerance 的 patch instructions

### A. 修改 `§7.1 run-group registration` 的最小字段表

**1）将现有字段名替换：**

- 把：`requested_tier`
- 改为：`requested_trust_tier`

并在该处补一句规范话：

> `requested_tier` 仅可作为 intake 兼容 alias 出现于非规范转换层；不得再出现在 v0.1 的 normative schema、field table、bundle manifest 或 verification record 中。

**2）在 `run-group-registration.json` 的最小字段表中新增以下字段：**

- `registration_digest`
- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock`
- `provider_release_window`

建议插入顺序：

- `registration_id`
- `registration_digest`
- `study_id`
- `run_group_id`
- ...
- `repeatability_class`
- `requested_trust_tier`
- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock`
- `provider_release_window`
- `allowed_replacement_policy`

### B. 在 `§7.1` 字段表后新增一小段：`pseudo_repeated registration controls`

建议增加如下规范语义：

1. 当 `repeatability_class = pseudo_repeated` 且 `requested_trust_tier in {reproduced, verified}` 时，以下字段 **MUST** 在首个 attempt 开始前冻结：
   - `submission_window`
   - `randomness_fingerprint_hint`
   - `request_template_hash`
   - `provider_snapshot_lock` **或** `provider_release_window`
2. `submission_window` 用于约束 attempt 的允许起跑区间；平台 / verifier **MUST** 能用 attempt timestamp、registration receipt 或 runner telemetry 检查是否落窗。
3. `request_template_hash` 用于证明 repeated attempts 使用的是同一请求模板骨架，而不是随结果漂移后再补交。
4. `provider_snapshot_lock` 用于固定 vendor snapshot / build / API revision；若 provider 不提供明确 snapshot，则必须提供 `provider_release_window` 作为近似锁定区间。
5. `randomness_fingerprint_hint` 用于记录 provider / sampler / endpoint 侧的近似随机性指纹线索；它不是 seed 替代物，但必须能支撑审计“这些 attempts 是否被置于同一近似生成条件下”。

### C. 在 `§7.2 completeness proof` 末尾追加 cross-object consistency 规则

新增规范句：

1. 对同一个 `run_group_id` 的所有高信任 candidate bundles：
   - `manifest.registration_digest` **MUST** 与 `completeness-proof.json.registration_digest` 一致；
   - 不一致时，`completeness_verdict` **MUST** 至少为 `tampered` 或等价拒绝态。
2. 若 `repeatability_class = pseudo_repeated` 且 `submission_window` 缺失、`request_template_hash` 缺失，或 `provider_snapshot_lock` / `provider_release_window` 均缺失，则该 run-group **MUST NOT** 进入 Reproduced / Verified。

### D. 在 `§7.3 tolerance policy` 末尾追加 consumption rule

新增规范句：

> bundle、verification、ranking 三层对 tolerance policy 的消费，统一经由 `manifest.tolerance_policy_ref` / `manifest.tolerance_policy_digest` 进入；不得在 bundle 外再发明第二套自由浮动字段名。

---

## 4.2 对 §8 Run Data & Evidence 的 patch instructions

### A. 在 `§8.1 final bundle canonical layout` 追加条件性 MUST

在现有 bundle layout 后补两句：

1. 当 `requested_trust_tier in {reproduced, verified}` 时，final bundle **MUST** 包含 `run-group-registration.json`。
2. `completeness-proof.json` 可由平台后补，但一旦存在，其 `registration_digest` **MUST** 与 `manifest.registration_digest` 一致。

### B. 重写 `§8.2 manifest.json 是 runtime identity 单一真源` 中的 Registration / Verification refs 段

建议把现有：

- `registration_ref`
- `tolerance_policy_ref`
- `repeatability_class`
- `requested_trust_tier`

升级成 3 个固定分组：

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

### C. 在 `§8.2` 末尾追加 manifest binding 规则

新增规范句：

1. `manifest.registration_ref` 的 canonical 值为 `run-group-registration.json`；若该值为 `null`，该 bundle **MUST NOT** 声称是 Reproduced / Verified candidate。
2. `manifest.registration_digest` **MUST** 等于 `sha256(canonical_json(run-group-registration.json))`。
3. `manifest.tolerance_policy_ref` 的 canonical 值为 `execution_contract#/verification_policy/tolerance_policy`。
4. `manifest.tolerance_policy_digest` **MUST** 等于被 `tolerance_policy_ref` 解析出的 tolerance policy object digest。
5. 若 `run-group-registration.json` 存在，则：
   - `manifest.requested_trust_tier` **MUST** 等于 `run-group-registration.json.requested_trust_tier`
   - `manifest.repeatability_class` **MUST** 等于 `run-group-registration.json.repeatability_class`
6. `verification_record`、`board_slice`、`reproduce` / `replay` 工具链消费 registration / tolerance 时，**MUST** 先读 `manifest.json`，不得绕过 manifest 直接读取自由浮动字段。

---

## 4.3 对 §9 Verification Record 的 patch instructions

### A. 修改 `§9.1` 最小字段表

在现有最小字段：

- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `board_admission_policy_id`
- `decision_reason_codes[]`
- `assigned_at`
- `assigned_by`

之外，新增：

- `subject_ref`
- `subject_bundle_digest`

### B. 在 `§9.1` 新增一个小段：`subject binding`

建议新增如下规范语义：

1. v0.1 中，`verification_record.subject_ref.subject_type` **MUST** 为 `attempt_bundle`。
2. `subject_ref` 至少包含：
   - `subject_type`
   - `study_id`
   - `run_group_id`
   - `attempt_id`
   - `bundle_id`
3. 这些字段 **MUST** 与 `manifest.json` 中的 Run Identity 分组逐项一致。
4. `subject_bundle_digest` **MUST** 为 verifier 侧重算得到的 bundle digest，而不是上传方自填的展示字段。
5. 若 `subject_ref` 与 bundle 内 `manifest.json` 不一致，平台 **MUST** 拒绝授予 `trust_tier`，或将结果置为 `invalidated` / `rejected`。
6. v0.1 的 `verification_record` 绑定的是 **单个 attempt-level bundle**；run-group 级判断通过：
   - 多个 `verification_record`
   - `completeness-proof.json`
   - ranking / admission policy
   联合导出，而不是把 run-group 直接塞成一个模糊 subject。

---

## 5. Canonical field tables

## 5.1 `run-group-registration.json` — F2 新增 / 修正字段表

| 字段 | 类型 | 要求 | 机器规则 |
|---|---|---:|---|
| `registration_digest` | string | MUST | `sha256(canonical_json(run-group-registration.json))` |
| `requested_trust_tier` | enum | MUST | 取值与 `trust_tier` 同值域；替代 `requested_tier` |
| `submission_window` | object/null | MUST（当 `repeatability_class = pseudo_repeated` 且请求 `reproduced`/`verified`） | 见下表；attempt timestamp 必须可核对是否落窗 |
| `randomness_fingerprint_hint` | object/null | MUST（同上） | 至少一项非空的近似随机性线索 |
| `request_template_hash` | string/null | MUST（同上） | `sha256(normalized_request_template_bytes)` |
| `provider_snapshot_lock` | string/null | MUST（同上，除非提供 `provider_release_window`） | vendor snapshot / build / revision pin |
| `provider_release_window` | object/null | MUST（同上，除非提供 `provider_snapshot_lock`） | 见下表；用于近似锁定 provider release 区间 |

### `submission_window` 最小子字段

| 子字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `opens_at` | string | MUST | ISO 8601 |
| `closes_at` | string | MUST | ISO 8601 |
| `max_span_minutes` | integer | MUST | 供 verifier 做窄窗检查 |

### `randomness_fingerprint_hint` 最小子字段

| 子字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `provider_fingerprint` | string/null | SHOULD | 如 provider 返回的 system fingerprint / model build hint |
| `sampler_config_hash` | string/null | SHOULD | 采样参数稳定哈希 |
| `endpoint_profile_hash` | string/null | SHOULD | endpoint / region / transport profile 的稳定哈希 |

> 规则：上述三个子字段中，至少一个 **MUST** 非空。

### `provider_release_window` 最小子字段

| 子字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `not_before` | string | MUST | ISO 8601 |
| `not_after` | string | MUST | ISO 8601 |

---

## 5.2 `manifest.json` — canonical join surface 字段表

| Path | 类型 | 要求 | 机器规则 |
|---|---|---:|---|
| `study_id` | string | MUST | Run identity 真源之一 |
| `run_group_id` | string | MUST | Run identity 真源之一 |
| `attempt_id` | string | MUST | 一个 final bundle 对应一个 `attempt_id` |
| `bundle_id` | string | MUST | bundle 自身标识 |
| `registration_ref` | string/null | MUST | 高信任 candidate 时必须为 `run-group-registration.json`；否则仅可为 `null` |
| `registration_digest` | string/null | MUST | `registration_ref != null` 时必须等于所引用 registration object 的 digest |
| `tolerance_policy_ref` | string | MUST | canonical 值：`execution_contract#/verification_policy/tolerance_policy` |
| `tolerance_policy_digest` | string | MUST | 必须等于 `tolerance_policy_ref` 解析对象的 digest |
| `repeatability_class` | enum | MUST | 若存在 registration，则必须与 registration 一致 |
| `requested_trust_tier` | enum | MUST | 若存在 registration，则必须与 registration 一致 |

---

## 5.3 `verification_record` — subject binding 字段表

| 字段 | 类型 | 要求 | 机器规则 |
|---|---|---:|---|
| `subject_ref` | object | MUST | v0.1 canonical subject object |
| `subject_bundle_digest` | string | MUST | verifier 重算 bundle digest |

### `subject_ref` 最小子字段

| 子字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `subject_type` | enum | MUST | 固定为 `attempt_bundle` |
| `study_id` | string | MUST | 与 `manifest.study_id` 一致 |
| `run_group_id` | string | MUST | 与 `manifest.run_group_id` 一致 |
| `attempt_id` | string | MUST | 与 `manifest.attempt_id` 一致 |
| `bundle_id` | string | MUST | 与 `manifest.bundle_id` 一致 |

---

## 6. MUST / MUST NOT rules

### 6.1 MUST

1. `requested_trust_tier` **MUST** 成为 registration / manifest / verification_record 的唯一 canonical field name。
2. 对 `pseudo_repeated` 的 Reproduced / Verified candidate，registration-level controls **MUST** 在首个 attempt 前冻结。
3. `manifest.json` **MUST** 同时提供：
   - run identity
   - `registration_ref` / `registration_digest`
   - `tolerance_policy_ref` / `tolerance_policy_digest`
4. `verification_record` **MUST** 绑定一个 attempt-level final bundle，而不是模糊的“某次提交”。
5. `subject_bundle_digest` **MUST** 由 verifier 侧重算。
6. `completeness-proof.json.registration_digest`、`manifest.registration_digest`、`run-group-registration.json` digest 三者 **MUST** 一致。
7. ranking / admission 层消费 `tolerance_policy_digest` 时 **MUST** 经过 manifest，而不是从自由文本或散落字段兜底推断。

### 6.2 MUST NOT

1. `requested_tier` **MUST NOT** 再出现在 v0.1 normative field list。
2. `pseudo_repeated` **MUST NOT** 仅靠 prose 的“差不多在同一窗口跑的”进入 Reproduced / Verified。
3. `manifest.json` **MUST NOT** 只给 `*_ref` 不给对应 `*_digest`。
4. `verification_record` **MUST NOT** 在缺少 `subject_ref` / `subject_bundle_digest` 的情况下授予 `trust_tier`。
5. 平台 **MUST NOT** 只凭数据库内部 row id、上传账户或 UI entry id 认定被裁决对象。

---

## 7. 可选补丁（P2，不阻断 F2）

> 这些项与 round2 reviewer 提到的边角问题有关，但不应阻断本次 F2 收口。

### P2-optional-01：为 `attempted_or_terminal_tasks` 提供 canonical count 定义

建议落点：`§8.3 Task disposition 与分母规则`

最小可选补丁：

- 将 `attempted_or_terminal_tasks` 定义为：执行状态已进入 terminal disposition 的 task 数；
- 明确其与 `declared_task_denominator`、`scorable_task_denominator` 的关系；
- 避免不同实现对 `redacted` / `evaluator_error` / partial trace 的计数漂移。

### P2-optional-02：把 `network_proxy_log_digest` 收回 `reports/environment-report.json` 字段表

建议落点：`§8.4 Governance evidence reports`

最小可选补丁：

- 在 `reports/environment-report.json` 最小字段表中加入 `network_proxy_log_digest`（若允许联网）；
- 避免 Verified 门槛引用一个未归属到 schema 的字段。

### P2-optional-03：把 `tty_freeform_input_detected` 收回 `interaction-summary.json` 字段表

建议落点：`§8.4 Governance evidence reports`

最小可选补丁：

- 在 `interaction-summary.json` 最小字段表中加入 `tty_freeform_input_detected`；
- 使后续 F1 的 autonomy 审计规则能落到 object schema，而不是仍停留在 prose。

---

## 8. 验收清单

### 针对 R2-03

- [ ] `§7.1` 字段表已出现：`submission_window`、`randomness_fingerprint_hint`、`request_template_hash`、`provider_snapshot_lock` / `provider_release_window`
- [ ] `pseudo_repeated` 的高信任 gate 已写成 registration-level MUST
- [ ] 明确写出这些字段需在首个 attempt 前冻结

### 针对 R2-04

- [ ] 主稿 normative field list 中不再出现 `requested_tier`
- [ ] `requested_trust_tier` 在 `§4.1`、`§7.1`、`§8.2`、`§9.1` 一致

### 针对 R2-05

- [ ] `manifest.json` 已包含 run identity group
- [ ] `manifest.registration_ref` / `registration_digest` 已冻结
- [ ] `manifest.tolerance_policy_ref` / `tolerance_policy_digest` 已冻结
- [ ] 明确写出这些字段的 canonical resolution 规则

### 针对 R2-06

- [ ] `verification_record` 已包含 `subject_ref` / `subject_bundle_digest`
- [ ] `subject_ref.subject_type = attempt_bundle` 已写死
- [ ] `subject_ref` 与 manifest run identity 的一致性检查已写成 MUST
- [ ] `verification_record` 不再依赖平台外部上下文才能知道自己裁决的是哪个 bundle

---

## 9. 一句话交付物摘要

**本包不扩 scope，只把 registration → manifest → verification_record 这条链补成 machine-checkable：先冻结 pseudo-repeated 的预注册审计字段，再让 manifest 成为 registration / tolerance 的单一 join surface，最后让 verification_record 绑定到一个明确的 attempt-level final bundle。**
