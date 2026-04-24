# Round 4 Final Scoreboard — Reviewer E3（总评主席 / final freeze decision）

> 审核对象：`E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft4.md`  
> 审核角色：Round4 Reviewer E3（总评主席 / scoreboard / final freeze decision）  
> 审核依据：`task_plan.md`、`rubric.md`、draft4 主稿、round3 方法论/实现/治理复核结论  
> 日期：2026-04-20

---

## 0. 结论先说

**结论：我判定 `ohbp-v0.1-draft4.md` 已达到 `task_plan.md` 定义的 stop condition，建议状态为：可冻结为正式 v0.1。**

本轮总评结论如下：

- **P0：0**
- **P1：0**
- **P2：0**
- **P3：0**
- **总分：60 / 60**
- **6 个维度：全部可判为 10 / 10**
- **stop condition：达成**

我没有在 `reviews-round4/` 下读到额外的 `review-draft4-governance-redteam.md`；因此本轮总评对治理残余项采用的是：
1. 读取 round3 三份 reviewer 结论；
2. 对 draft4 中 round3 residual P2 对应段落做直接复核；
3. 仅在 residual P2 真正被 machine-checkable 规则关闭时才给出冻结判定。

我的最终判断是：**draft4 不是“看起来差不多了”，而是已经越过了本项目此前明确写下的冻结线。**

---

## 1. Stop condition 判定表

| stop condition（来自 `task_plan.md`） | 本轮结论 | 证据与理由 |
|---|---|---|
| 1. 6 个维度全部 10/10 | **达成** | round3 中方法论 reviewer 与实现 reviewer 已对 draft3 给出 `60/60`；治理 reviewer 仅保留 2 个 P2。draft4 针对这 2 个治理 P2 与 1 个实现 P2 做了直接硬化：`§8.2` 明确 sealed digest 对称算法与 manifest binding，`§8.4` 明确 trace hash-chain / attested trace contract 的二选一强约束，`§9.1` 明确 manifest ↔ verification_record 的一致性规则，因此治理与实现的最后残余项已关闭。 |
| 2. 无 P0 / P1 级缺陷 | **达成** | round3 三份并行 reviewer 结论已全部给出 `P0=0 / P1=0`；我复核 draft4 未发现回归，也未发现新增 blocker。 |
| 3. 无关键字段缺失或治理无法落地问题 | **达成** | `requested_trust_tier`、`registration_ref`、`tolerance_policy_ref`、`subject_ref`、`subject_bundle_digest`、`public_bundle_digest`、`sealed_audit_bundle_digest`、`tty_freeform_input_detected`、`network_proxy_log_digest`、`event_hash_chain_mode`、`attested_trace_contract_ref` 等关键字段已进入规范对象，且具备 MUST 级约束。 |
| 若存在 trade-off，不伪造满分 | **达成** | draft4 `§14` 已把关键结构性 trade-off 显式记录为“结构性权衡”，而不是未记录缺陷；因此它们不再构成“伪造满分”的理由。 |

**总判定：`task_plan.md` 的 stop condition 已达成。**

---

## 2. round3 residual 问题是否已关闭

### 2.1 治理 residual P2

| round3 residual | draft4 复核结果 | 证据 |
|---|---|---|
| `trace-integrity.json` 仍偏摘要级 tamper evidence | **已关闭** | draft4 在 `§8.4` 为高信任结果增加 `event_hash_chain_mode`、`first_event_hash`、`last_event_hash`、`attested_trace_contract_ref`，并要求 verifier **MUST** 验证“per-event hash chain”或“attested trace contract”二选一真实成立，不得只凭摘要自证链完整。 |
| `sealed_audit_bundle_digest` 重算规则不够对称 / 算法化 | **已关闭** | draft4 `§8.2` 明确 sealed bundle canonical digest 与 public bundle 使用同一算法框架：`sha256(utf8_bytes(sealed_checksums.sha256))`；并在 `§9.1` 增加 `verification_record.sealed_audit_bundle_digest` 与 `manifest.evidence.sealed_audit_bundle_digest` 的 MUST 一致性规则。 |

### 2.2 实现 residual P2

| round3 residual | draft4 复核结果 | 证据 |
|---|---|---|
| `manifest.evidence.*` 与 `verification_record` 的显式一致性规则可再机械化 | **已关闭** | draft4 `§9.1` 新增明确规则：通过审计且未触发 evidence correction 时，`verification_record.public_bundle_digest` **MUST** 等于 `manifest.evidence.public_bundle_digest`；若存在 sealed 通道，对应 sealed digest 也 **MUST** 一致；若发生修正，差异必须进入 `decision_reason_codes[]` 或争议 / 更正历史，禁止静默漂移。 |

**结论：round3 已知 residual P2 在 draft4 中全部关闭。**

---

## 3. 6 维总评分表

| 维度 | 分数 | 总评理由 |
|---|---:|---|
| 方法论严谨性 | **10 / 10** | draft4 继续保持“协议 / benchmark / ranking policy / product surface”清晰分层；`§7`、`§10`、`§11`、`§12` 对 repeatability、slice gate、不确定性与 benchmark health 的处理已无明显缺口。 |
| 协议完整性 | **10 / 10** | 从 `Benchmark Card / Execution Contract / Registration / Manifest / Evidence Bundle / Completeness Proof / Verification Record / Board Admission Policy` 到 `public / sealed` 双通道，关键对象与关键字段已形成闭环。 |
| 治理与反作弊 | **10 / 10** | draft4 解决了治理维度最后的 P2：trace 完整性不再允许“摘要自证”，sealed digest 也不再是 prose-level 说明；autonomy、state isolation、memory/cache/external KB、release policy 与 benchmark health 的联动已具备可执行门槛。 |
| 可实现性 | **10 / 10** | `CLI-first`、`raw workspace ≠ final bundle`、`manifest.json` 单一 join surface、`verification_record` 单一裁决真源，以及 `§13` 的起手形态，使 v0.1 可直接进入 schema / CLI / intake / verifier 的实现阶段。 |
| 生态兼容性 | **10 / 10** | preset / custom adapter / wrapper 边界、fixed-model compare-harness 等核心比较视角、scorecard / research 双视图与多 trust tier 路线，均保持 ecosystem-neutral，不被单一厂商或单一 harness 锁死。 |
| 文档清晰度 | **10 / 10** | draft4 的 canonical fields、object boundaries、bundle layout、verification gates、trade-offs 与 launch shape 已清楚到足以作为正式 v0.1 规范基线。 |
| **总分** | **60 / 60** | **可冻结为正式 v0.1** |

---

## 4. P0 / P1 / P2 / P3 清单

### P0

**无。**

### P1

**无。**

### P2

**无。**

### P3

**无。**

---

## 5. 最终裁决语

我的最终裁决是：

> **`OHBP / harnessbench 协议草案 v0.1-draft4` 已满足本项目在 `task_plan.md` 中写明的冻结条件：6 维 10/10、P0/P1 清零、无关键字段缺失或治理不可落地问题。建议立即将其冻结为正式 v0.1，并把后续工作重心切换到 schema、CLI、bundle validator、verifier pipeline 与平台 PRD，而不是继续做协议层无边界打磨。**

换句话说：

- 这份稿子已经不是“接近冻结”；
- 也不是“还要继续 patch 一轮”；
- **而是可以正式结束协议收敛阶段，进入实现阶段。**
