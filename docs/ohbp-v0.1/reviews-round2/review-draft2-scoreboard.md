# OHBP / harnessbench v0.1-draft2 第二轮独立审核总评评分板（Reviewer E2）

> Reviewer：E2（总评主席 / scoreboard）  
> 日期：2026-04-20  
> 唯一写入范围：`E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/reviews-round2/review-draft2-scoreboard.md`  
> 已读输入：`task_plan.md` / `rubric.md` / `draft1-issue-register.md` / `ohbp-v0.1-draft2.md`

---

## 0. 结论先说

**总评结论：draft2 已经从“结构化修补中”推进到“接近定稿”，但我不建议本轮直接冻结为正式 v0.1。**

我的独立判断：

- **P0：0**
- **P1：1**
- **P2：5**
- **P3：4**
- **总体建议：接近定稿**（不是“继续大改”，但也**不是**“可立即冻结为 v0.1”）

本轮 stop condition 判定：**未达到**。

原因非常明确：

1. 6 个维度并未全部达到 **10/10**；
2. 仍存在 **1 个跨模块 P1**；
3. 该 P1 不在方法论主骨架，而在 **public / sealed 双通道证据模型** 的 canonical object 化不足，这会继续影响 hidden split、private audit、以及高信任 tier 的审计落地一致性。

一句话判断：

> **draft2 已经把 draft1 的大多数结构性 P1 收敛成了可编码的协议对象，但还差最后一轮 focused patch，才能进入“可冻结”状态。**

---

## 1. 本地进度快照

基于 `task_plan.md` 与当前文档状态，我确认本地进度如下：

- **Phase 0 — 初始化与落盘：完成**
- **Phase 1 — 第一轮独立模块设计：完成**
- **Phase 2 — 第一轮独立审核：完成**
- **Phase 3 — 迭代修订：完成到 draft2 形成**
  - issue register 已建立
  - repair packets 已完成
  - integration blueprint 已完成
  - `ohbp-v0.1-draft2.md` 已生成
- **Phase 4 — 收敛与定稿：尚未完成**
  - 当前正处于 **第二轮独立审核 gate**

因此，本文件的职责不是继续设计，而是回答一个更窄的问题：

> **draft2 是否已经满足 stop condition，并足以冻结为 v0.1？**

我的答案：**还差一轮小修。**

---

## 2. Stop Condition 判定

### 2.1 目标门槛（来自 rubric / task plan）

只有同时满足以下三条，才可宣称本轮“满分 / 可冻结”：

1. 所有审核组对 6 个维度全部给出 **10/10**；
2. **无 P0 / P1**；
3. **无关键字段缺失**、**无治理层无法落地问题**、**无未记录的结构性 trade-off**。

### 2.2 本轮判定

| 检查项 | 结果 | 判定依据 |
|---|---|---|
| 6 维是否全部 10/10 | 否 | draft2 明显成熟，但仍有治理与对象冻结层面的剩余问题 |
| 是否无 P0 / P1 | 否 | 我独立识别出 1 个 P1 |
| 是否无关键字段 / 治理阻断问题 | 否 | public / sealed 证据通道仍未完全 object 化 |

**结论：stop condition 未达成。**

---

## 3. 按 6 维 rubric 对 M1–M6 与整体 draft2 打分

> 说明：这里的 M1–M6 沿用本项目既定模块划分：  
> M1 Foundations；M2 Benchmark / Execution；M3 Run Data / Evidence；M4 Trust / Governance / Ranking；M5 CLI / Adapter；M6 Metrics / Uncertainty / Health。

### 3.1 评分表

| 模块 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 总分 / 60 | 评分摘要 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **M1 Foundations** | 9 | 9 | 8 | 8 | 9 | 9 | **52** | canonical states、对象边界、非目标定义都已明显收敛 |
| **M2 Benchmark / Execution** | 9 | 9 | 8 | 9 | 8 | 8 | **51** | registration / tolerance / repeatability / denominator 已形成闭环 |
| **M3 Run Data / Evidence** | 8 | 9 | 8 | 9 | 8 | 8 | **50** | bundle / manifest / reports 进展很大，但 public vs sealed 仍不够冻结 |
| **M4 Trust / Governance / Ranking** | 9 | 9 | 8 | 8 | 8 | 8 | **50** | trust tier、autonomy、board gate 已成型，审计证据通道仍差最后一步 |
| **M5 CLI / Adapter** | 8 | 8 | 7 | 9 | 9 | 8 | **49** | CLI-first 路线正确，custom adapter 接口清楚，但部分 canonical naming 仍有轻微漂移 |
| **M6 Metrics / Uncertainty / Health** | 9 | 8 | 8 | 8 | 8 | 9 | **50** | 已摆脱“神圣总分”，paired delta / uncertainty / health 都比 draft1 强很多 |
| **整体 draft2** | **9** | **9** | **8** | **9** | **9** | **9** | **53** | 已接近可冻结，但尚未达到 stop condition |

### 3.2 总评分解释

#### 为什么是 53/60，而不是更低？

因为 draft2 已经成功解决了 draft1 的大部分核心阻断项：

- canonical state separation 已冻结；
- run-group registration / completeness proof 已对象化；
- tolerance policy 已有唯一挂载点；
- task disposition / denominator 已闭环；
- `true_seeded` vs `pseudo_repeated` 的 gate 已明确；
- `harness_lift` / `model_lift` 已从协议核心退场；
- bundle / manifest / runtime identity 已大幅收敛；
- governance reports（interaction / state reset / cache / trace）已进入协议主文；
- 冷启动与 adoption flywheel 已不再是“产品愿景口号”。

#### 为什么又不是 60/60？

因为 draft2 仍未把以下问题彻底冻结：

- **public bundle 与 sealed audit bundle 的关系、字段、可见性状态、release policy 仍偏 prose，不够 schema-first；**
- 一些 canonical naming 还存在轻微漂移；
- 若要进入“实现即规范”的阶段，部分 tier-conditional MUST / MAY 矩阵还需要更硬。

---

## 4. P0 / P1 / P2 / P3 分级问题

## 4.1 P0

**无。**

我的独立结论是：draft2 已经不再存在“缺关键对象导致根本无法上传 / 复验”的 P0。

---

## 4.2 P1

### P1-01：public / sealed 双通道证据模型仍未完全 canonical object 化

**问题描述**

draft2 已经多次提到 `sealed evidence`、`redacted`、benchmark active 期间需要部分内容不公开，也承认 public vs sealed 的结构性权衡；但从协议冻结角度看，它还没有把这件事完全收敛为**可直接实现的一组 canonical object / field**。

当前文本中，相关意图散落在：

- §8.1 bundle layout 的 optional 增强件
- §8.3 / §8.4 对 redaction / reports / evidence 的说明
- §11 `research_view`
- §12 benchmark health 与 active / retired 阶段关系
- §14.2 `Public vs Sealed` trade-off

但以下内容仍不够硬：

1. 缺少一个明确的 **双通道对象模型**；
2. 缺少统一字段来表达：
   - 哪些工件属于 public channel；
   - 哪些工件属于 sealed audit channel；
   - 两者如何用 digest 绑定；
   - 哪个 release policy 约束何时解封；
3. 高信任 tier 所需的 trace / interaction / payload 到底是 **必须公开**、**可 sealed**，还是 **必须双存一份 public summary + sealed raw**，目前仍偏 prose；
4. hidden split / private audit 的平台实现会因此产生不一致解释空间。

**为什么这是 P1，而不是 P2**

因为这不是纯文档润色问题，而是会直接影响：

- hidden split 的长期可用性；
- Reproduced / Verified 在不同 benchmark 生命周期下的可审计一致性；
- 平台究竟如何既保护 benchmark health，又维持可追溯证据链。

如果不把这层 object 化，后续 CLI、bundle normalizer、平台 intake 与研究视图实现都可能各做一套“默认理解”，这会重新引入规范漂移。

**建议修复方向**

至少新增并冻结：

- `evidence_channel` 或等价字段
- `visibility_class`
- `release_policy_id`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `redaction_policy_id`
- `audit_summary_ref`
- public / sealed 的 MUST / MAY artifact 对照表

并明确：

- `interaction-log.jsonl`
- `trace/events/...`
- `payloads/`
- `artifacts/`
- `attestation.json`
- `reports/*`

在 Community / Reproduced / Verified、以及 active / aging / legacy benchmark 阶段下，分别属于哪一类可见性。

---

## 4.3 P2

### P2-01：`requested_tier` 与 `requested_trust_tier` 存在轻微命名漂移

draft2 在 canonical state separation 中已经冻结了 `requested_trust_tier`，但在 registration 字段表中仍出现 `requested_tier`。这不是结构性大错，但如果不尽早统一，后续 schema / CLI / UI 会出现 alias 泛滥。

### P2-02：bundle layout 对 tier-conditional MUST / MAY 的表达仍可更硬

§8.1 把 `run-group-registration.json` 与 `completeness-proof.json` 放在 optional 增强项里；而 §7 又要求 Reproduced / Verified 候选必须具备它们。建议在 bundle layout 处补一个 **按 trust tier / submission profile / publication state 的条件矩阵**，避免 implementer 误判。

### P2-03：`board_slice` 的 publishable floor 还缺 canonical 字段落点

§10.4 已提出 `scorable_task_denominator` 必须达到 lane 定义的最低 publishable floor，但还没明确这个 floor 在 `board_admission_policy`、`execution_contract` 还是 `lane` 对象中冻结。建议补一个字段归属表。

### P2-04：`scorecard_view` / `research_view` 已有强叙事，但还未冻结最小 schema

当前 dual view 已足以指导产品设计，但若要支持后续 API / thin website / query layer，建议再补一个最小字段集与派生关系表。

### P2-05：benchmark health 与 evidence release 的联动还欠一张对象图

§12 已把 benchmark health 纳入主文，但 health state 如何驱动 evidence release policy 仍更多依赖 prose。该项不足以单独构成 P1，但建议在下一轮 patch 中，与 P1-01 一起完成对象收口。

---

## 4.4 P3

### P3-01：部分章节存在信息回流，可适度压缩

例如 canonical states、ranking gate、dual view、trade-off 在多个章节都出现了概念回流。不是错误，但会让实现者反复跳转。

### P3-02：缺少 1–2 个“最小可运行 bundle 示例”

若能追加一个 Community 示例和一个 Verified 示例，将显著降低 CLI / intake / website 三端对协议的误读。

### P3-03：缺少模块到章节的显式映射附录

现在能读懂，但 reviewer / implementer 仍需自行脑补 “M1–M6 对应哪几个章节”。建议补 appendix。

### P3-04：别名与弃用词（deprecated aliases）可补 glossary

例如：

- `verification_tier` → `trust_tier`
- `self-reported` → 仅展示层来源描述
- hyphen / underscore 变体

补一页 deprecation glossary 会让 v0.1 更稳。

---

## 5. 相比 draft1 的显著改进

以下改进是**实质性**而非“文案变多了”：

### 5.1 IR-01 / IR-07：状态与边界显著收敛

draft1 最大的问题之一，是 trust tier / publication / ranking policy / benchmark hint 之间边界不够硬；draft2 通过：

- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `lane_governance_hint`
- `board_admission_policy`

把这几层基本拆清楚了。

### 5.2 IR-02 / IR-03 / IR-04 / IR-05 / IR-08：统计与完整性闭环基本建成

draft2 的最大正向变化，在我看来不是“写得更复杂”，而是第一次真正形成了：

- preregistration
- completeness proof
- tolerance policy
- repeatability class
- denominator rules
- slice gate

这让平台终于能够对“best-of-N + selective reporting”说清楚怎么防。

### 5.3 IR-06：成功摆脱“神圣总分”陷阱

将抽象 lift 指标从协议核心退场，改成 paired delta panel，是一个非常正确的决策。它既保留研究表达能力，又避免在协议层偷偷发明新总分。

### 5.4 IR-09 / IR-10：bundle / manifest / runtime identity 已大幅收敛

draft1 在 bundle 命名、field closure、adapter → bundle 映射上都有明显松动；draft2 至少已经把：

- `manifest.json`
- `task-results.ndjson`
- `artifact-manifest.json`
- `checksums.sha256`
- evaluator / runtime / policy identity fields

收敛到能指导实现的程度。

### 5.5 IR-12 / IR-13 / IR-14：高信任治理从“宣称式”升级为“证据式”

`interaction-log.jsonl`、`interaction-summary.json`、`state-reset-report.json`、`cache-report.json`、`trace-integrity.json`、`environment-report.json` 进入主文，是本轮修订最关键的治理升级之一。

### 5.6 IR-15：生态冷启动不再只是口号

submission profiles、persona → lane、三角色飞轮、Official Verified Board / Reproducibility Frontier / Community Lab 三层发现路径，已经足以支撑一个 CLI-first、thin website 的真实冷启动策略。

---

## 6. 是否建议继续修订 / 接近定稿 / 可冻结为 v0.1

我的正式建议是：

# **接近定稿**

但要明确加上后半句：

> **接近定稿，但不建议本轮直接冻结为 v0.1。**

### 为什么不是“继续修订”？

因为 draft2 已经不需要“大修”和“重新发散”。主骨架是对的，绝大多数 draft1 的 P1 已经被消化。

### 为什么又不是“可冻结为 v0.1”？

因为 stop condition 是硬门槛，不是主观好感：

- 我这里仍识别到 **1 个 P1**；
- 且该 P1 恰好落在 v0.1 后续实现最容易分叉的地方——**public / sealed evidence contract**。

### 我建议的最小下一步

只做一轮 **focused patch**，不要再广泛扩写：

1. 补齐 public / sealed 双通道 evidence object；
2. 统一 `requested_trust_tier` 等少数 naming drift；
3. 为 bundle / board / dual view 增加 2–3 张条件矩阵或字段归属表；
4. 再发起一轮轻量复审。

如果这轮 focused patch 做得干净，我倾向于下一轮就可以进入：

> **“可冻结为 v0.1” 的审查区间。**

---

## 7. Reviewer E2 的最终裁决

### 7.1 最终裁决语

> **OHBP / harnessbench v0.1-draft2：结构成熟、边界清晰、协议主骨架已经成立；本轮总评判定为“接近定稿”，但由于 public / sealed 双通道证据模型尚未完全 canonical object 化，暂不建议冻结为正式 v0.1。**

### 7.2 建议给主控的状态标签

建议主控在后续总汇总中使用以下标签：

- `round2_scoreboard_status: near_freeze_but_not_freezable_yet`
- `overall_recommendation: near_final`
- `stop_condition: not_met`
- `required_next_action: focused_patch_public_sealed_evidence`

---

## 8. 本 reviewer 的写入说明

我本轮只写入了以下唯一文件：

- `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/reviews-round2/review-draft2-scoreboard.md`

未编辑任何其他文件。
