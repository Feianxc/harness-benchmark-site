# Review B4 — Governance / Anti-Cheat / Red-Team（Round 4, micro re-review）

> Reviewer 角色：Round4 Reviewer B4（治理 / anti-cheat / red-team，micro re-review）  
> 日期：2026-04-20  
> 读取输入：
> - `E:/工作区/10_Projects_项目/harness测评网站/task_plan.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/rubric.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft4.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/reviews-round3/review-draft3-governance-redteam.md`

---

## 0. 结论先说

**结论：draft4 的三处 micro-hardening 足以把 round3 的两个治理 P2 全部关闭。**

我本轮判断如下：

1. `reports/trace-integrity.json` 已不再停留在“摘要级自证”，而是升级为 **per-event hash-chain / attested trace contract 二选一** 的显式审计门槛。
2. `sealed_audit_bundle_digest` 的重算算法已经写成与 public bundle **对称且可实现** 的显式规则。
3. `verification_record.*` 与 `manifest.evidence.*` 的一致性规则已经明文化，消除了 evidence digest 在裁决层与 manifest 层之间静默漂移的治理歧义。

**因此：本轮治理向结论为 `P0 / P1 / P2 = 0 / 0 / 0`，建议冻结；治理向 6 维 rubric 可给 `60 / 60`。**

---

## 1. 6 维 rubric 简表（治理向）

| 维度 | 分数 | 简评 |
|---|---:|---|
| 方法论严谨性 | 10 | `trace-integrity`、`sealed/public digest`、`verification_record` 一致性都回到了“证据先于宣称”的主原则，治理逻辑闭合。 |
| 协议完整性 | 10 | round3 留下的两个治理 P2 都已补成字段 + 规则 + verifier 责任，不再是 editor note 式提示。 |
| 治理与反作弊 | 10 | 伪造 trace、sealed digest 漂移、manifest / verdict 双真源偏差三个攻击面都已有明确 `MUST` 级约束。 |
| 可实现性 | 10 | `per_event_hash_chain` 与 `attested_trace_contract_ref` 采用二选一，不强迫单一实现路线，工程上可落地。 |
| 生态兼容性 | 10 | 既允许强审计 runner 走 attested contract，也允许通用 runner 走 hash-chain，不锁死单一生态。 |
| 文档清晰度 | 10 | `§8.2`、`§8.4`、`§9.1` 的规范句已经足够直接，可供 intake / verifier / platform 实现。 |
| **合计** | **60 / 60** | **从治理 / anti-cheat / red-team 视角，draft4 已达到可冻结满分。** |

---

## 2. 对 round3 两个治理 P2 的明确回答

### 2.1 P2-01 是否关闭？

**回答：是，已关闭。**

round3 的问题是：`reports/trace-integrity.json` 仍偏“摘要级 tamper evidence”，缺少真正的链式或外部背书合同。draft4 现在已经补上：

- `§8.4` 为 `reports/trace-integrity.json` 新增：
  - `event_hash_chain_mode`
  - `first_event_hash`
  - `last_event_hash`
  - `attested_trace_contract_ref`
- 并明确高信任结果 **MUST** 至少满足二选一：
  1. `event_hash_chain_mode = per_event_hash_chain`
  2. `attested_trace_contract_ref` 指向平台认可的 attested trace contract
- 同时规定：若 `event_chain_complete = true`，则 verifier **MUST** 验证上述两条之一真实成立，**不得只凭摘要报告自证链完整**。

这正面关闭了 round3 对“trace 摘要由报告自证”的担忧。

### 2.2 P2-02 是否关闭？

**回答：是，已关闭。**

round3 的问题是：`sealed_audit_bundle_digest` 虽然已被引入，但其重算规则没有像 public bundle 那样写成对称、显式、算法化句式。draft4 现在已经补上：

- `§8.2` 明确：
  - public bundle 的 canonical digest：`sha256(utf8_bytes(checksums.sha256))`
  - sealed audit bundle 的 canonical digest：`sha256(utf8_bytes(sealed_checksums.sha256))`
- 并要求：若 `evidence_channel_mode = public_plus_sealed`，则 `public_bundle_digest` 与 `sealed_audit_bundle_digest` **MUST** 同时存在。

这已经把 sealed digest 的算法写成与 public bundle 对称的规范句，可消除实现歧义。

### 2.3 本轮新增的第三处 micro-hardening 是否带来治理增益？

**回答：是。**

draft4 新增的 `verification_record.*` 与 `manifest.evidence.*` 一致性规则，虽然不是 round3 明列的 P2 标题，但它确实进一步收紧了治理边界：

- `verification_record.public_bundle_digest` **MUST** 等于 `manifest.evidence.public_bundle_digest`
- 若存在 sealed 通道，`verification_record.sealed_audit_bundle_digest` **MUST** 等于 `manifest.evidence.sealed_audit_bundle_digest`
- 若平台因 correction / redaction / sealed repackaging 导致二者不一致，则 **MUST** 留痕在 `decision_reason_codes[]` 或 dispute / correction 历史中，**不得静默漂移**

这使得 manifest 与平台裁决层之间不再存在隐含双真源问题。

---

## 3. P0 / P1 / P2 计数

- **P0：0**
- **P1：0**
- **P2：0**

我本轮没有发现新的治理阻断项，也没有发现新的治理收尾项需要继续阻止冻结。

---

## 4. 最终裁决

- **round3 的两个治理 P2 是否关闭：是，已全部关闭。**
- **是否建议冻结：是，建议冻结。**
- **是否达到治理向 60/60：是，达到 60/60。**

一句话结论：

> **从治理 / anti-cheat / red-team 视角，draft4 已把 round3 的 residual P2 清零，当前版本可作为 v0.1 正式冻结候选。**
