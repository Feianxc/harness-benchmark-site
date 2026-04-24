# OHBP v0.1-draft3 第三轮小范围复核 — Reviewer C4（实现 / 协议工程）

> 审核范围：只复核实现 / schema closure 是否还存在 residual P0 / P1  
> 审核依据：`task_plan.md`、`rubric.md`、`draft2-round2-issue-register.md`、`ohbp-v0.1-draft3.md`、`review-draft2-implementation.md`  
> 日期：2026-04-20

---

## 1. 结论先说

**结论：从实现 / 协议工程视角看，draft3 已关闭 round2 遗留的实现型 P1；本轮未发现 residual P0 / P1。**

我重点复核了 4 个 stop-condition-oriented 问题，结论如下：

1. **`requested_trust_tier` 命名回退已关闭。** registration、manifest、verification record 三处已统一回到 `requested_trust_tier`；`requested_tier` 只剩兼容 alias prose，不再出现在 normative schema 中（`ohbp-v0.1-draft3.md:468-505, 797-805, 1027-1033`）。
2. **`manifest.json` 已成为 registration / tolerance / evidence 的 canonical join surface。** draft3 不只列了字段，还补了 binding rules，并明确 verification / ranking / replay / reproduce 消费时必须先读 manifest（`ohbp-v0.1-draft3.md:740-829`）。
3. **`verification_record.subject_ref` + `subject_bundle_digest` 已足以闭合 bundle → verification 链。** `subject_ref` 绑定到 `attempt_bundle`，并用 `study_id / run_group_id / attempt_id / bundle_id` 与 manifest 的 Run Identity 对齐；`subject_bundle_digest` 又把裁决对象锚回 verifier 重算后的 public final bundle digest（`ohbp-v0.1-draft3.md:1021-1064`）。
4. **未发现仍阻断冻结的 schema / object P1。** 当前剩余问题最多是 appendix / machine-readable schema 进一步收紧的 P2 级优化，不再是阻断冻结的问题。

**本轮计数：**
- **P0：0**
- **P1：0**
- **P2：1**

**建议：从实现 / 协议工程视角，`draft3` 已达到“可冻结”水平。**

---

## 2. 6 维 rubric 简表（整体 draft3）

| 维度 | 分数 | 判断 |
|---|---:|---|
| 方法论严谨性 | 10 | registration / completeness / tolerance / subject-bound verification 已形成闭环 |
| 协议完整性 | 10 | registration、manifest、verification record、evidence channel 的 canonical object 已闭合 |
| 治理与反作弊 | 10 | completeness、autonomy telemetry、public / sealed evidence 与 trust-tier gate 已可落地 |
| 可实现性 | 10 | 字段 owner、bundle layout、join surface、binding rule 已足以指导 schema / intake / verifier 实现 |
| 生态兼容性 | 10 | CLI-first + adapter-neutral 结构保持稳定，未被单一 runtime 锁死 |
| 文档清晰度 | 10 | 对实现方最关键的对象、字段、绑定规则已可直接落表 |
| **总分** | **60 / 60** | **就实现 / 协议工程复核范围而言，可冻结** |

---

## 3. 对 4 个重点检查项的直接回答

### 3.1 `requested_trust_tier` 命名回退是否彻底消失

**回答：是，已关闭。**

验证证据：
- registration 最小字段已使用 `requested_trust_tier`（`ohbp-v0.1-draft3.md:468-499`）
- draft3 显式规定 `requested_tier` 只能作为 intake 兼容 alias，且**不得**再出现在 normative schema / manifest / verification record（`ohbp-v0.1-draft3.md:501-506`）
- manifest 的 Verification policy 分组使用 `requested_trust_tier`（`ohbp-v0.1-draft3.md:801-805`）
- verification record 最小字段使用 `requested_trust_tier`（`ohbp-v0.1-draft3.md:1027-1033`）

我的检索结论是：**除了 alias 说明语句之外，没有看到新的 schema 回退。**

### 3.2 `manifest.json` 是否已成为 registration / tolerance / evidence 的 canonical join surface

**回答：是，已达到。**

验证证据：
- `manifest.json` 被单独提升为“runtime identity 与 evidence join 的单一真源”（`ohbp-v0.1-draft3.md:740-742`）
- Registration 分组已冻结：`registration_ref` + `registration_digest`（`ohbp-v0.1-draft3.md:797-800`）
- Verification policy 分组已冻结：`tolerance_policy_ref` + `tolerance_policy_digest` + `repeatability_class` + `requested_trust_tier`（`ohbp-v0.1-draft3.md:801-805`）
- Evidence Channel 分组已冻结：`evidence_channel_mode`、`public_bundle_digest`、`sealed_audit_bundle_digest`、`visibility_class`、`release_policy`、`redaction_policy_id`（`ohbp-v0.1-draft3.md:807-815`）
- binding rules 已明确：registration / tolerance / evidence 的 digest 约束与 canonical ref 约束都写成了 MUST（`ohbp-v0.1-draft3.md:816-829`）
- 最关键的一句是：`verification_record`、`board_slice`、`replay` / `reproduce` 工具链消费 registration / tolerance / evidence channel 时，**MUST 先读 `manifest.json`**（`ohbp-v0.1-draft3.md:829`）

这已经不是“主真源但不够硬”的状态，而是**canonical join surface 已落到对象 + 字段 + binding rule**。

### 3.3 `verification_record.subject_ref` + `subject_bundle_digest` 是否足以闭合 bundle → verification 链

**回答：足以。**

验证证据：
- `verification_record` 最小字段已包含 `subject_ref` + `subject_bundle_digest`（`ohbp-v0.1-draft3.md:1027-1033`）
- `subject_ref` 至少包含：`subject_type`、`study_id`、`run_group_id`、`attempt_id`、`bundle_id`（`ohbp-v0.1-draft3.md:1047-1053`）
- `subject_ref.subject_type` 在 v0.1 被固定为 `attempt_bundle`（`ohbp-v0.1-draft3.md:1060`）
- `subject_ref` 的 run identity 字段必须与 `manifest.json` 的 Run Identity 分组逐项一致（`ohbp-v0.1-draft3.md:1061`）
- `subject_bundle_digest` 必须由 verifier 依据 public final bundle 的 `checksums.sha256` 重算得到，而不是上传方自填（`ohbp-v0.1-draft3.md:1062`）
- 缺失 `subject_ref` 或 `subject_bundle_digest`，平台不得授予 `trust_tier`（`ohbp-v0.1-draft3.md:1064`）

这意味着：
- **subject identity** 已由 `subject_ref` 固定
- **subject bytes / bundle object** 已由 `subject_bundle_digest` 固定
- **platform adjudication** 已由 `verification_record` 固定

实现上，bundle → verification → board 的追踪链条已经闭口。

### 3.4 是否还存在阻断冻结的 schema / object P1

**回答：本轮未发现。**

我没有再看到 round2 那种会阻断冻结的实现问题，例如：
- canonical 字段名回退
- manifest 仍不足以索引 registration / tolerance / evidence
- verification_record 无法指明裁决对象

如果继续加强，更多属于：
- appendix 里的 JSON Schema / example payload 补齐
- verifier 与 manifest 的字段镜像关系再写得更机械化

这些都属于**P2 收尾优化**，不再是 stop-condition 级阻断项。

---

## 4. P0 / P1 / P2 清单

### P0

**无。**

### P1

**无。**

### P2

#### P2-C4-01：可在后续 appendix 中再补一条 `manifest.evidence.*` 与 `verification_record` 对应字段的显式一致性规则

当前 draft3 已经通过：
- `manifest.json` 作为 join surface
- `verification_record` 作为平台裁决真源
- `subject_ref` + `subject_bundle_digest` 作为对象锚点

把语义闭环做出来了，因此**这不是 P1**。但为了让未来 schema validator / ingestion service 更机械化，后续 appendix 仍可再补一句显式一致性规则，例如：
- `verification_record.public_bundle_digest` 与 `manifest.evidence.public_bundle_digest` 在通过审计时应一致
- 若存在 sealed 通道，对应 digest 的一致性也应明文化

这属于**实现便利性优化**，不阻断 draft3 冻结。

---

## 5. 对 round2 实现 P1 的关闭情况给出明确回答

**回答：round2 的实现 P1 已全部关闭。**

对应关系如下：

| round2 实现 P1 | draft3 状态 | 证据 |
|---|---|---|
| `requested_trust_tier` 命名回退 | **已关闭** | `ohbp-v0.1-draft3.md:468-505, 801-805, 1027-1033` |
| `manifest.json` 尚未成为 registration / tolerance 的唯一 join surface | **已关闭** | `ohbp-v0.1-draft3.md:740-829` |
| `verification_record` 缺少裁决对象 binding | **已关闭** | `ohbp-v0.1-draft3.md:1021-1064` |

我的结论是：**round2 的实现面 residual P1 在 draft3 已完成清零。**

---

## 6. 最终建议

**建议：可冻结。**

更精确地说：

- **从实现 / 协议工程视角：可冻结**
- **从全局 stop condition 视角：还需与其他 round3 reviewer 的结论合并**

但就我负责的范围，draft3 已经从“接近 object-first / rule-first”进一步推进到：

> **关键对象已闭合、关键字段已统一、关键绑定已 machine-checkable，可作为 v0.1 正式规范的实现基线冻结。**
