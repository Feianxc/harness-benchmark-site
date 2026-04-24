# Review B3 — Governance / Anti-Cheat / Red-Team（Round 3）

> Reviewer 角色：Round3 Reviewer B3（治理 / anti-cheat / red-team）  
> 日期：2026-04-20  
> 读取输入：
> - `E:/工作区/10_Projects_项目/harness测评网站/task_plan.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/rubric.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/draft2-round2-issue-register.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft3.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/reviews-round2/review-draft2-governance-redteam.md`

---

## 0. 结论先说

**结论：从治理 / 反作弊 / 红队视角看，draft3 已关闭 round2 的治理阻断项；我本轮未发现 residual P0 / P1。**

更具体地说：

1. **round2 的治理 P1 已关闭。**
   - `IR-11`：public / sealed 双通道 evidence 已从 prose 提升为 canonical field + canonical binding + artifact matrix。
   - `IR-13`：autonomy schema 已闭口，`approval_only -> interactive` 自动降级条件已可机审。
2. `network_proxy_log_digest`、`redactions.json`、`interaction telemetry` 已形成 **v0.1 足够强** 的字段闭环。
3. 仍有少量 **P2 级收尾项**，但它们更像 v0.2 的硬化空间，而不是阻断冻结的治理缺陷。

**我的建议：治理维度可冻结。**  
如果总评主席只问“治理侧还要不要继续 patch 才能过 stop-condition 的 blocker 线”，我的回答是：**不用再为治理 blocker 开 patch。**

---

## 1. 6 维 rubric 简表（针对 draft3 全稿的治理向复核视角）

| 维度 | 分数 | 简评 |
|---|---:|---|
| 方法论严谨性 | 9.5 | 分层信任、切片比较、benchmark health 约束与治理对象边界都已稳定。 |
| 协议完整性 | 9.4 | round2 的治理缺口已补成对象与字段；剩余主要是细化而不是缺对象。 |
| 治理与反作弊 | 9.5 | 已达到可冻结强度；best-of-N、防人工干预、双通道证据、状态隔离均有可执行门槛。 |
| 可实现性 | 9.1 | 对 CLI / manifest / verifier / 平台 intake 都是可落地的，不依赖超重基础设施。 |
| 生态兼容性 | 9.2 | 治理要求没有锁死在单一 harness 生态，仍保持开放接入面。 |
| 文档清晰度 | 9.3 | 关键治理规则已从叙述收敛到 `§8` / `§9` / `§12` 的机审合同。 |
| **合计** | **56.0 / 60** | **治理侧已越过冻结门槛，但仍未到“所有维度 10/10”的审美状态。** |

---

## 2. 本轮重点检查结论

### 2.1 public / sealed 双通道 evidence：是否已 canonical object 化？

**结论：已关闭 round2 P1。**

我确认 draft3 已不再只是“承认需要 sealed”，而是已经形成对象级闭环：

- `§4.2` 冻结了 canonical fields：
  - `evidence_channel_mode`
  - `visibility_class`
  - `release_policy`
- `§8.1` 定义了 public / sealed 双通道的 artifact matrix，并明确：
  - 哪些 artifact 在 public channel / sealed channel 各自必须存在
  - `hidden / holdout / rotating` 的高信任结果 **MUST** 使用 `public_plus_sealed`
  - 发生 redaction / omission 时 **MUST** 有 `redactions.json` 与 `sealed_audit_bundle_digest`
- `§8.2` 把 evidence channel 收口进 `manifest.json` 的单一真源：
  - `evidence.public_bundle_digest`
  - `evidence.sealed_audit_bundle_digest`
  - `evidence.redaction_policy_id`
- `§9.1` 让 `verification_record` 成为平台裁决真源，并绑定：
  - `public_bundle_digest`
  - `sealed_audit_bundle_digest`
  - `visibility_class`
  - `release_policy`
- `§12` 进一步把 benchmark health 与 release policy / visibility class 联动成准入规则。

我的判断：

> **双通道证据模型已经从“叙事层”进入“canonical object + canonical binding + policy gating”层。**

这足以关闭 round2 的治理 P1。

### 2.2 autonomy schema：是否真正闭口，自动降级是否可机审？

**结论：已关闭 round2 P1。**

与 draft2 相比，draft3 已把 round2 缺的关键钉子补齐：

- `§8.4 interaction-log.jsonl` 冻结了：
  - canonical event types
  - `target_ref`
  - 对审批 / 手工命令 / 手工文件改写 / 编辑器写入等事件的强绑定要求
- `§8.4 interaction-summary.json` 冻结了：
  - `tty_input_digest`
  - `tty_freeform_input_detected`
  - `manual_command_detected`
  - `manual_file_write_detected`
  - `editor_interaction_detected`
  - `approval_target_linkage_complete`
  - `classification_verdict`
  - `ZERO_INPUT_V1` sentinel
- `§9.5` 给出了三叶模式的 machine-checkable 判定：
  - `autonomous`
  - `approval_only`
  - `interactive`
- 同节明确了自动降级规则：
  - 任一自由文本输入 / 手工命令 / 手工文件改写 / 编辑器写入 / 审批缺失 `target_ref`
  - **MUST** 直接降级为 `interactive`
- `§10.4` 还把 admission gate 写清：缺少 interaction telemetry 或触发自动降级条件的结果，**MUST NOT** 进入 `autonomous` / `approval_only` slice。

我的判断：

> **autonomy 不再依赖上传者自述，而是依赖可审计的 interaction telemetry + summary verdict；自动降级已足够程序化。**

这足以关闭 round2 的治理 P1。

### 2.3 `network_proxy_log_digest`、`redactions.json`、interaction telemetry：字段闭环是否足够？

**结论：足够，达到 v0.1 冻结线。**

我逐项检查的结果如下：

#### `network_proxy_log_digest`
- 已在 `§8.4 reports/environment-report.json` 冻结为高信任环境报告字段。
- 已在 `§9.4 Verified` 提升为“若允许联网则应提供”的升级证明项。
- 与 `network_policy_digest`、`env_allowlist_hash`、`mount_manifest_hash` 一起，已经形成可用于高信任联网审计的最小闭环。

#### `redactions.json`
- 已在 `§8.4` 给出最小字段表：
  - `redaction_policy_id`
  - `redacted_paths[]`
  - `sealed_only_paths[]`
  - `reason_codes[]`
- 已在 `§8.1` 与 artifact matrix / 双通道规则绑定。
- 已在 `§8.2` / `§9.1` / `§9.3` / `§9.4` / `§12` 中与 digest、publication、health 规则联动。

#### interaction telemetry
- 事件级对象、summary 对象、autonomy verdict、slice gate 已形成闭环。
- 关键字段不再散落在 prose 中，而是集中在 `§8.4` + `§9.5` + `§10.4`。

我的判断：

> **这三类字段现在已经足够支撑 intake、verifier、排名 admission 与争议处理；我不再把它们视为冻结阻断项。**

---

## 3. 对 round2 治理 P1 的明确回答

### 3.1 round2 的治理 P1 是否关闭？

**回答：是，已关闭。**

对应关系：

| round2 问题 | draft3 结论 |
|---|---|
| `IR-11`：public / sealed 双通道仍偏 prose | **已关闭**：`§4.2` + `§8.1` + `§8.2` + `§9.1` + `§12` 已形成 canonical object 闭环 |
| `IR-13`：autonomy schema 未完全闭口 | **已关闭**：`§8.4` + `§9.5` + `§10.4` 已形成 machine-checkable closure |

### 3.2 本轮是否发现新的治理 P1？

**回答：没有。**

我没有在 draft3 中看到新的治理阻断项需要把主稿打回到“仍需 patch”的状态。

---

## 4. P0 / P1 / P2 清单

### 4.1 P0

**无。**

### 4.2 P1

**无。**

### 4.3 P2

#### P2-01：`reports/trace-integrity.json` 仍偏“摘要级 tamper evidence”，未来可再补 per-event hash-chain / attested trace contract

draft3 已明显强于 draft2，但当前规范仍主要冻结：
- `trace_root_hash`
- `hash_algorithm`
- `event_chain_complete`
- `missing_event_ranges`
- `payload_coverage_ratio`

这对 v0.1 已够用；但若未来要进一步压缩“trace 摘要由报告自证”的空间，建议在 v0.2 明确 per-event hash chain 或等价 attested trace contract。

#### P2-02：`sealed_audit_bundle_digest` 的重算规则可在后续版本写得更对称、更算法化

draft3 已经要求 public / sealed 双通道 digest 绑定，也把 public bundle 的 canonical digest 重算方式写清。但 sealed bundle digest 的重算方式尚未像 public bundle 那样写成同等显式的算法句式。

这不构成治理 blocker；只是未来若要进一步减少实现分歧，建议在后续版本补齐对称化表述。

---

## 5. 最终建议

**建议：可冻结。**

更精确地说：

- **治理维度：可冻结**
- **是否还需要为治理 blocker 再开 patch：不需要**
- **剩余问题：仅 P2 收尾项，可进入 v0.2 backlog 或 editor's note，不应继续阻塞 draft3**

我的最终判断是：

> **如果其他 reviewer 没有发现跨模块 P1，那么仅从治理 / anti-cheat / red-team 视角，我愿意为 draft3 的冻结签字。**
