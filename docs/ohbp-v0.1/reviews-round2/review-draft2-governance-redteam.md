# Review B2 — Governance / Anti-Cheat / Red-Team（Round 2）

> Reviewer 角色：第二轮独立审核 Reviewer B2  
> 日期：2026-04-20  
> 读取输入：
> - `E:/工作区/10_Projects_项目/harness测评网站/task_plan.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/rubric.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/draft1-issue-register.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft2.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/repair-packets/repair-d-governance-hardening.md`

---

## 0. 结论先说

**结论：draft2 相比 draft1 已经完成一次明显有效的治理硬化，`IR-12`（环境完整性 / trace 基础门槛）与 `IR-14`（memory / cache / external KB 隔离）大体已从“原则级”推进到“对象级”；但 `IR-11`（public bundle / sealed audit bundle 双通道）与 `IR-13`（autonomy 审计边界）仍未完全闭环。**

我的独立判断是：

1. **没有发现 P0。**
2. **仍有 2 个 P1。**
3. `Verified only` 作为默认官方主榜原则，**现在比 draft1 明显更站得住**；但若要说“已经足够硬到可直接冻结为 v0.1”，我这边结论仍然是 **还差一轮小修订**。
4. 这已经不是“推倒重来”的状态，而是：**协议主体已成形，剩余是治理硬化收口问题。**

一句话判断：

> **draft2 已经进入“接近定稿，但治理上仍不能宣称满分”的阶段。**

---

## 1. 治理可信度评分

**治理可信度：8.1 / 10**

相较 draft1 的核心提升：

- `trust_tier / publication_state / autonomy_mode` 已拆轴；
- `Reproduced / Verified` 已绑定 run-group 完整性、最低 `n_runs`、`tolerance_policy_digest`；
- `reports/environment-report.json`、`reports/trace-integrity.json`、`interaction-log.jsonl`、`interaction-summary.json`、`reports/state-reset-report.json`、`reports/cache-report.json` 已进入规范文本；
- `memory_scope`、`state_reset_proof`、`external_kb_digest_list` 已不再只是空泛声明；
- `Official main board` 已明确只收 `Verified`，且默认优先 `true_seeded`。

但扣分点也很明确：

- **双通道证据仍停留在 prose / trade-off 层，没有真正冻结成 canonical object + canonical field。**
- **`autonomy_mode` 虽然开始证据化，但 schema 仍有未闭口字段，导致“autonomous only” 切片的跨实现可审计性还不够硬。**

---

## 2. 按 6 维 rubric 打分

### 2.1 治理相关模块（M3 / M4 / M5 / M6 聚合）

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8.6 | 已明确区分 protocol / ranking policy / publication state / trust tier，且把官方主榜限制在 `Verified`。 |
| 协议完整性 | 7.8 | 环境、trace、interaction、state isolation 对象已补上，但双通道证据与 autonomy schema 仍有缺口。 |
| 治理与反作弊 | 8.1 | 比 draft1 明显更可信；对 selective reporting、记忆污染、人工干预已有硬门槛，但 hidden/holdout 场景的 sealed 证据链仍未冻结。 |
| 可实现性 | 8.4 | 这些对象都能落到 CLI / bundle / intake / audit pipeline 上，不像空中楼阁。 |
| 生态兼容性 | 8.5 | 没有把治理要求写死在单一 harness 生态里，仍保留 preset/custom adapter/open upload 的开放面。 |
| 文档清晰度 | 7.9 | 核心结构清楚，但 `public/sealed` 与 `autonomy` 的关键字段没有完全收口到同一对象表。 |
| **合计** | **49.3 / 60** | **达到“方向成熟、结构接近稳定”，但尚不满足 stop condition。** |

### 2.2 整体 draft2（全稿视角）

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8.9 | 全稿在“不要神圣总榜”“默认 fixed-model compare harness”“分层信任 + 不确定性披露”上是稳的。 |
| 协议完整性 | 8.4 | 相比 draft1 已大幅补齐 canonical object，但治理侧仍有两个关键缝隙未完全封死。 |
| 治理与反作弊 | 8.1 | 治理强度明显上升，但还不足以让我给 9+。 |
| 可实现性 | 8.5 | CLI-first、bundle-first、thin website 的落地路径很现实。 |
| 生态兼容性 | 8.8 | 提交 profile、scorecard/research 双层视图、cold-start 路线都更利于 adoption。 |
| 文档清晰度 | 8.3 | draft2 的主叙事已经成型；剩余问题主要是收口而不是重写。 |
| **合计** | **51.0 / 60** | **整体已经比 draft1 更接近 v0.1，但还不能宣称“可冻结定稿”。** |

---

## 3. 对本轮重点审核点的独立结论

### 3.1 public bundle / sealed audit bundle 双通道是否足够硬

**结论：还不够硬；这是本轮最大的未关闭项。**

正面进展：

- draft2 在一句话定义、trade-off、Benchmark Health 联动里已经承认 `public / sealed evidence` 的必要性；
- `redactions.json` 已出现在 bundle layout；
- `Research view` 也已经承认需要 `sealed bundle` 引用。

但问题在于：

1. **`§8.1 final bundle canonical layout` 仍然只冻结了“单一 final bundle”的 canonical layout**，没有把 `Public Bundle` 与 `Sealed Audit Bundle` 定义为协议对象；
2. 全稿**没有冻结**以下字段：
   - `evidence_channel_mode`
   - `public_bundle_digest`
   - `sealed_audit_bundle_digest`
   - `visibility_class`
   - `release_policy`
3. 没有写死：
   - 哪些 split / lane / tier **MUST** 使用双通道；
   - public 与 sealed 如何 digest 绑定；
   - public 层最少必须公开哪些审计摘要；
   - hidden / holdout / rotating benchmark 在 active 期间的默认 release contract。

这意味着：

> **draft2 已经“承认问题存在”，但尚未把它变成 intake 可机审、榜单可追责、争议流程可执行的 canonical contract。**

我的判断：**IR-11 仍未关闭。**

### 3.2 Verified 的环境完整性 / trace 防篡改门槛是否够格

**结论：基本够格，较 draft1 已完成实质性升级，但还没到“无可挑剔”。**

我认可的进展：

- `§8.4` 明确了 `reports/environment-report.json` 与 `reports/trace-integrity.json`；
- `§9.3` / `§9.4` 已把 `container_digest`、`network_policy_digest`、`artifact-manifest.json`、`checksums.sha256`、`trace_root_hash`、`attestation.json or official_runner_attested=true` 写进高信任门槛；
- `§10.5` 把默认官方主榜限制在 `Verified`，并进一步偏向 `true_seeded`；
- 环境前后快照、allowlist、proxy log digest 的引入，让“声明执行环境”开始变成“证明执行边界”。

我保留的严格意见：

- `reports/trace-integrity.json` 目前更像**摘要层**，而不是已经冻结的 trace tamper-proof schema；
- 全稿没有把 `prev_event_hash / event_hash` 这类 per-event hash chain 明确成 MUST，因此 `event_chain_complete=true` 仍有一定“由报告自证”的味道；
- 对 `attestation` 的引用已经出现，但还没有形成完整的 attestation object contract / digest binding story。

因此我的定性是：

> **IR-12 基本关闭，但建议保留 1 个 P2 收尾，把 trace chain contract 与 attestation binding 再钉死。**

### 3.3 autonomy / approval_only / interactive 的审计边界是否可信

**结论：方向正确、强于 draft1，但还没有完全闭环。**

我认可的点：

- `§9.5` 已明确：`autonomy_mode` **MUST 基于交互遥测，而不是上传者单独声明**；
- `interaction-log.jsonl` / `interaction-summary.json` 已被纳入 bundle 证据；
- `autonomous`、`approval_only`、`interactive` 三种叶子模式已经具备清楚的语义边界。

但我认为还没完全闭环，因为：

1. `approval_only` 的硬要求使用了 `tty_freeform_input_detected = false`，**但该字段并未在 `interaction-summary.json` 的最小字段表中冻结**；
2. `autonomous` 的“零输入”哨兵语义没有像 repair packet 那样被写成稳定 contract；
3. `interaction-log.jsonl` 的 `target_ref` 仅为 SHOULD，不足以保证审批事件与 trace/action 一一映射；
4. 这会导致不同实现对 `approval_only` / `interactive` 的边界可能仍有可钻空子的解释差异。

我的判断：

> **IR-13 只算“部分关闭”，还不能说已经完全可信。**

### 3.4 memory / cache / external KB 的隔离与证明机制是否足够防污染

**结论：相比 draft1 已经有本质进步，原则上足够支撑 v0.1 的高信任治理底座。**

我认可的点：

- `§9.7` 引入了 `memory_scope`、`cache_namespace`、`state_reset_policy`、`state_reset_proof`、`external_kb_enabled`、`external_kb_digest_list`；
- `§8.4` 补了 `reports/state-reset-report.json` 与 `reports/cache-report.json`；
- 通用主榜对 `global memory / global cache` 的默认排除已经写清；
- `external_kb_enabled = true` 但无 digest list 时，最高只能停留在 Community，这条很关键。

我保留的改进意见：

- `state_reset_proof` 仍未标准化为有限几种可验证 proof type；
- hidden / holdout 情况下，对 KB corpus snapshot 的 sealed retention 还没写得足够硬；
- `benchmark_answer_material_declared` 仍偏声明，不是强审计对象。

但总体上，我认为：

> **IR-14 在协议层面已基本关闭，剩余更多是 v0.1 后续实施细化，而不是当前阻断。**

### 3.5 高信任默认官方榜是否现在可以更有底气地成立

**结论：可以“更有底气”，但还不应“宣布万无一失”。**

我支持它比 draft1 更站得住的原因：

- 默认官方主榜只收 `Verified`；
- 默认不混 `true_seeded` 与 `pseudo_repeated`；
- `board_slice` 已绑定 `tolerance_policy_digest`、`trust_tier`、`autonomy_mode`、`comparison_mode` 等关键维度；
- `run_group` 完整性、最小 `n_runs`、publication state 都进入了明确约束。

我仍保留谨慎态度的原因：

- **如果是 hidden / holdout / redacted / networked 的高价值结果，但双通道证据未 canonicalize，官方主榜的“公众可审计性”还不够稳。**
- **如果是主打 `autonomous only` 的 slice，但 autonomy schema 仍有字段缺口，那么这张榜的“人类未介入”结论仍存在争议窗口。**

因此我的建议表述是：

> **“Verified only 是默认官方主榜的正确原则”已经成立；但“Verified main board 已达到可冻结的治理强度”这一句，现在我还不会签字。**

---

## 4. P0 / P1 / P2 清单

### 4.1 P0

**无。**

### 4.2 P1

#### P1-01：双通道证据模型仍未 canonicalize，IR-11 未关闭

症状：

- `§8.1` 只定义单一 final bundle layout；
- 全稿缺少 `evidence_channel_mode / public_bundle_digest / sealed_audit_bundle_digest / visibility_class / release_policy` 的冻结字段；
- 未写死哪些 split / tier / lane 必须 `public + sealed`。

影响：

- hidden / holdout / redacted 的高信任结果仍无法形成**可机审、可争议、可索引**的双通道证据链；
- 官方主榜在高敏感 benchmark 上的“既防污染又防黑箱”仍未完全成立。

建议修法：

- 在 `§5` 或 `§8` 显式新增 `evidence_channel` canonical object；
- 冻结双通道字段；
- 明确 public / sealed 的 digest binding、最低公开摘要、release contract、适用场景。

#### P1-02：autonomy 审计 schema 仍有未闭口字段，IR-13 未完全关闭

症状：

- `approval_only` 使用 `tty_freeform_input_detected`，但 `interaction-summary.json` 字段表未定义该字段；
- `autonomous` 的零输入 contract 未冻结为一致 schema；
- 审批事件到 trace/action 的映射还不够硬。

影响：

- `autonomous only` / `approval_only` slice 的跨实现可审计性不足；
- 不同 adapter / runner 可能在边界处理上出现可利用差异。

建议修法：

- 把 `tty_freeform_input_detected`、zero-input sentinel、approval-to-trace linkage 一并补进 canonical summary / log schema；
- 至少把 `target_ref` 或等价 trace linkage 从 SHOULD 提升为高信任 MUST。

### 4.3 P2

#### P2-01：trace tamper-evidence 仍偏摘要级，建议补 per-event hash chain contract

`trace_root_hash + event_chain_complete` 已经明显优于 draft1，但若不冻结 per-event hash chain / equivalent attested trace contract，`trace-integrity` 仍带一点“报告自证”风险。

#### P2-02：`state_reset_proof` 的 proof type 尚未标准化

目前知道要提交 proof，但还不知道平台如何统一验证不同 proof 的等价性。建议定义有限 proof type，如：empty-namespace init、deletion log、snapshot diff、runner attested reset。

#### P2-03：`requested_tier` 与 `requested_trust_tier` 仍存在命名漂移

`§4` 已冻结 canonical field 为 `requested_trust_tier`，但 `§7.1 run-group registration` 仍写成 `requested_tier`。这不是大问题，但应尽快统一，避免治理字段回流为别名混战。

#### P2-04：release-policy 与 benchmark-health 的联动还没有冻结成对象表

当前已有 prose，但未形成真正的 schema。建议和 P1-01 一起收口。

---

## 5. 与 draft1 相比：哪些风险已关闭，哪些仍未关闭

### 5.1 已明显关闭或基本关闭

#### 已基本关闭：IR-12（高信任环境完整性 / trace 门槛）

draft1 的主要问题是门槛过软、停留在 SHOULD；draft2 已把高信任最小集合写进 `§8.4`、`§9.3`、`§9.4`，这一点是实质性进步。

#### 已基本关闭：IR-14（memory / cache / external KB）

draft1 主要靠声明；draft2 已经给出对象、报告、主榜排除规则和高信任最低证明要求。这一点我认为已经越过“阻断线”。

#### 大幅缓解：高信任主榜的 epistemic posture

draft1 的 `Verified` 更像 aspirational label；draft2 的 `Verified` 已与 `n_runs`、`repeatability_class`、`completeness`、`tolerance_policy_digest`、environment / trace / interaction / state isolation 发生实绑定。

### 5.2 仍未关闭

#### 未关闭：IR-11（public / sealed 双通道）

这是我本轮最主要的未关闭风险。当前还是“理念正确，合同未冻结”。

#### 部分关闭但未完全关闭：IR-13（autonomy 证据边界）

draft2 已经走到正确方向，但 schema 仍有关键字段缺口，因此还不能算 fully closed。

### 5.3 已从 P1 降为 P2 / 收尾项

- trace chain 细粒度 contract
- state reset proof type 标准化
- release-policy 的对象化落盘
- 小规模命名收敛

---

## 6. 最终判断：是否建议进入下一轮修订，还是可接近定稿

**我的建议是：进入下一轮“小修订”，而不是再开一轮大重构。**

我不建议的做法：

- 不要再把整个草案打散重写；
- 不要再重新讨论“大方向要不要 CLI-first / Verified-only / thin website”。

我建议的做法：

1. **只针对治理侧再做一次 targeted hardening**；
2. 优先关闭两个 P1：
   - 双通道证据 canonical object
   - autonomy schema closure
3. 顺手清掉 2-4 个 P2，尤其是：
   - trace chain contract
   - `requested_trust_tier` 命名统一

如果上述问题关闭，我的判断会变成：

> **可以进入“接近定稿 / 只剩编辑性修饰”的状态。**

而以当前版本来说：

> **draft2 已明显优于 draft1，且治理主干已经成立；但还不足以宣称可直接冻结为正式 v0.1。**

---

## 7. 本 reviewer 的落地结论

- **P0：0**
- **P1：2**
- **P2：4**
- **治理可信度：8.1 / 10**
- **建议：进入下一轮小修订（governance hardening sweep），完成后再做 round-2 scoreboard 汇总。**

