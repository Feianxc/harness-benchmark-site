# Round 2 Review — Reviewer A2（方法论 / benchmark scientist）

> 审核对象：`ohbp-v0.1-draft2.md`  
> 审核人角色：第二轮独立审核 Reviewer A2  
> 审核范围重点：task disposition / denominator、tolerance policy、repeatability class、pseudo_repeated gate、`score(...)` 退出规范核心、board slice 发布门槛

---

## 0. 结论先说

**结论：draft2 相比 draft1 在方法论上已经有“实质性收敛”，不是文字润色，而是把多个 draft1 的 P1 从口头原则推进成了 canonical object / canonical rule。**

我本轮判断：

- **P0：0**
- **P1：1**
- **P2：3**
- **总体建议：应进入下一轮“定向修订”，而不是回到大改；方法论面已经接近可定稿，但还不能宣称满足 stop condition。**

我认为 draft1 中与方法论直接相关的 4 个核心 P1：

- IR-04（task disposition / denominator）→ **基本关闭**
- IR-05（`true_seeded` vs `pseudo_repeated` gate）→ **大体修复，但仍残留 1 个方法论 P1**
- IR-06（`score(...)` 退出规范核心）→ **关闭**
- IR-08（board slice 发布门槛）→ **大体关闭，残留 P2**

**因此：P1 的确显著收敛了，但尚未归零。**

本轮唯一保留的 P1 是：

> **`pseudo_repeated` 的方法论门槛仍未完全“证据化”。** draft2 已经写了 `n_runs >= 7`、单独切片、平台控制环境、lane 明确允许等规则，但它同时又依赖 `narrow window` / 近似随机性控制；然而在当前 draft2 的 `run-group registration` 字段中，没有把 `submission_window`、`randomness_fingerprint_hint` 或同等字段冻结进 canonical object，导致这条门槛还不能被稳定审计与程序化验证。

---

## 1. 按 6 维 rubric 对相关模块与整体 draft2 打分

### 1.1 相关模块评分

| 范围 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 小计 / 60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `§7 Registration / Completeness / Tolerance` + `§8.3 Task disposition` | 8 | 9 | 8 | 9 | 8 | 8 | **50** |
| `§9 Verification Tiers` + `§10 Ranking Policy / Board Slices` | 8 | 8 | 8 | 8 | 9 | 8 | **49** |
| `§11 指标体系与不确定性` | 9 | 8 | 7 | 9 | 9 | 8 | **50** |

### 1.2 整体 draft2 评分

| 审核对象 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 总分 / 60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ohbp-v0.1-draft2.md`（整体，按方法论 reviewer 视角） | 8 | 9 | 8 | 9 | 9 | 9 | **52 / 60** |

### 1.3 打分解释

- **方法论严谨性 8/10**：核心规则已经从 prose 走向对象化，但 `pseudo_repeated` 仍差最后一个“可审计字段闭环”。
- **协议完整性 9/10**：registration / completeness / tolerance / denominator / board gate 的闭环已经形成，剩余问题主要是少数字段未冻结到 object 里。
- **治理与反作弊 8/10**：best-of-N / selective reporting 的防线明显更硬，但 `pseudo_repeated` 的窗口约束未证据化，仍留下灰区。
- **可实现性 9/10**：绝大多数对象已足够直接转成 schema / CLI 行为。
- **生态兼容性 9/10**：允许现实世界闭源 provider 通过 `pseudo_repeated` 路径进入高信任层，但又不与 `true_seeded` 混榜，这个折中是成熟的。
- **文档清晰度 9/10**：整体边界明显优于 draft1，仅剩少量字段命名和 decision hook 未完全统一。

---

## 2. 重点审核结论

### 2.1 task disposition / denominator：**基本闭环，已从 P1 降为 P2 级收尾问题**

证据位置：

- `§8.3 Task disposition 与分母规则`（约第 710–773 行）

本次明确做对了三件事：

1. **把状态拆成三层**：
   - execution disposition
   - scoring disposition
   - visibility disposition
2. **把“应覆盖任务总数”与“可计分任务总数”拆成两个分母**：
   - `declared_task_denominator`
   - `scorable_task_denominator`
3. **把 selective reporting 风险接回 publishability**：
   - `run_group_publishable = all attempts disclosed AND no unresolved missing task slots AND completeness_verdict = complete`

这三点说明 draft2 不再只是“列几个状态名”，而是已经把 denominator 规则和 completeness 逻辑真正接上了。和 draft1 相比，这是实质性升级。

但我仍保留一个 P2：

- 公式里出现了 `attempted_or_terminal_tasks`，但正文没有把它再定义成 canonical 计数对象；不同实现可能会对 `redacted` / `not_attempted` / partially logged task 的计数产生漂移。

结论：

- **IR-04 不再是 P1。**
- 该部分已足够进入下一轮小修，而不是返工。

---

### 2.2 tolerance policy / repeatability class / pseudo_repeated gate：**大体变硬，但仍残留 1 个 P1**

证据位置：

- `§7.3 tolerance policy`（约第 533–577 行）
- `§7.4 repeatability class`（约第 578–607 行）
- `§9.4 Verified`（约第 919–935 行）

这部分相比 draft1 的提升非常明显：

1. **tolerance policy 已有唯一真源**：
   - `Execution Contract.verification_policy.tolerance_policy`
2. **`within tolerance` 不再允许口头漂移**：
   - 必须追溯到 `tolerance_policy_digest`
3. **`true_seeded` 与 `pseudo_repeated` 已明确分流**：
   - 准入门槛不同
   - 默认不混榜
   - Verified 的门槛更高
4. **明确禁止“理论上可 true seed，但故意只交 pseudo”直接进 Verified**

这些都说明 IR-03 / IR-05 已经不再停留在“原则上说得通”，而是已经接近 protocol-grade 规则。

但是，我仍保留 **1 个方法论 P1**：

### P1-A2-01：`pseudo_repeated` 的“narrow window / 近似随机性控制”尚未进入可审计对象

问题描述：

- draft2 在 `§7.4` 中要求 `pseudo_repeated` 进入 Reproduced 需满足 `n_runs >= 3`、`prereg + completeness + narrow window`。
- 但当前 `§7.1 run-group registration` 的字段表中，并没有把用于审计这条门槛的 canonical 字段冻结进去。
- 对照 repair packet B，本应存在的 `submission_window` / `randomness_fingerprint_hint` / 等价控制字段，在 draft2 主稿里没有真正落为 registration schema 的组成部分。

为什么这是 P1：

- 这不是纯文案瑕疵，而是 **Verified / Reproduced 准入门槛的证据缺口**。
- 只要 `narrow window` 还是 prose，而不是 object 字段，平台就无法稳定区分：
  - 真正被收紧时间窗的 `pseudo_repeated`
  - 事后口头宣称“我们差不多是在同一窗口跑的”
- 这会直接削弱 `pseudo_repeated` 不与 `true_seeded` 等价的核心方法论立场。

建议修补：

在 `run-group-registration.json` 中至少补齐下列之一或等价字段：

- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock` / `provider_release_window`

并明确：

- 这些字段 **必须在首个 attempt 前冻结**
- `pseudo_repeated` 的 Reproduced / Verified 审核必须检查这些字段

结论：

- **IR-05 还没有完全关闭。**
- 这是本轮我保留的唯一 P1。

---

### 2.3 `score(...)` 是否真的退出规范核心：**是，已关闭**

证据位置：

- `§11.4 用 paired delta panel 替代抽象 lift`（约第 1153–1175 行）

当前 draft2 的处理，我认可为“实质退出”，理由如下：

1. 正文明确写出：
   - 不再把 `harness_lift = score(...) - score(...)`
   - 不再把 `model_lift = score(...) - score(...)`
   作为协议核心字段
2. 替代方案改成了显式指标差分：
   - `delta_success_vs_baseline`
   - `delta_cost_vs_baseline`
   - `delta_latency_vs_baseline`
   - `delta_timeout_vs_baseline`
   - `delta_crash_vs_baseline`
3. baseline / slice / paired condition 都被要求显式声明

这意味着：

- draft2 已不再偷偷把抽象 `score(...)` 塞回协议核心；
- 即使产品层未来做 composite，也应落在 product / ranking policy，而不是 protocol core。

结论：

- **IR-06 已关闭。**
- 这一点是 draft2 的明确进步。

---

### 2.4 board slice 发布门槛：**方法论上已基本自洽，但还有 2 个 P2 决策钩子未冻结**

证据位置：

- `§10.2 board_slice 的最小固定维度`（约第 1032–1052 行）
- `§10.4 Entry gate 与 Slice gate`（约第 1065–1091 行）
- `§10.5 Official main board 默认规则`（约第 1093–1100 行）

这部分相较 draft1 已明显成熟：

1. **把 entry gate 与 slice gate 分开**
2. **把公开比较和公开排序的最低 entry 数分开**
3. **允许稀疏切片降级为 comparison-only / insufficient-evidence，而不是硬排榜**
4. **继续坚持 `pseudo_repeated` 不与 `true_seeded` 混榜**

这已经满足了 IR-08 的主体要求，所以我不再把它算作 P1。

但仍有两个 P2：

- `scorable_task_denominator` 需达到的 **最低 publishable floor** 目前只有 prose，没有 canonical field / policy hook。
- `ranked_tiered` 与 `ranked_ordinal` 的分界仍写成“有足够分离证据”，但没有绑定唯一 decision policy（例如 `ranking_confidence_policy_id` 或等价对象）。

这两个问题不会推翻现在的框架，但会导致不同平台实现对“何时只给 cluster、何时给 ordinal rank”出现可预期漂移。

结论：

- **IR-08 已从 P1 降为 P2。**
- 方法论上已经自洽到可以进入下一轮小修。

---

## 3. P0 / P1 / P2 清单

### 3.1 P0

**无。**

---

### 3.2 P1

#### P1-A2-01：`pseudo_repeated` gate 缺少可审计的 registration 字段闭环

- 位置：`§7.1` + `§7.4`
- 症状：规则要求 `narrow window` / 近似随机性控制，但 canonical registration schema 没有把这一约束对象化
- 后果：`pseudo_repeated` 的 Reproduced / Verified 准入仍部分依赖 prose / 人工解释
- 建议：把 `submission_window`、`randomness_fingerprint_hint`、`request_template_hash` 或等价字段冻结到 `run-group-registration.json`

---

### 3.3 P2

#### P2-A2-01：`attempted_or_terminal_tasks` 尚未定义成 canonical 计数对象

- 位置：`§8.3`
- 问题：公式引用了它，但正文未给出精确定义
- 风险：不同实现对 partially observed / redacted / terminal-but-unscored task 的计数可能不一致

#### P2-A2-02：slice publish gate 缺少 machine-checkable 的决策钩子

- 位置：`§10.4`
- 问题：`minimum publishable floor`、`足够分离证据` 仍是 prose，不是 canonical policy reference
- 风险：不同实现对 `comparison_only` / `ranked_tiered` / `ranked_ordinal` 的切换门槛会漂移

#### P2-A2-03：canonical field 命名仍残留一处漂移

- 位置：`§7.1 run-group registration`
- 问题：registration 字段表仍写 `requested_tier`，但 `§4.1`、`§8.2`、`§9.1` 的 canonical field 已收敛为 `requested_trust_tier`
- 风险：不是方法论阻断，但会削弱 single source of truth 的一致性

---

## 4. 与 draft1 相比是否显著进步

**是，且是“真实进步”，不是表述更漂亮而已。**

### 4.1 关闭 / 基本关闭的点

| draft1 问题 | draft2 状态 | 我的判断 |
|---|---|---|
| IR-04：task disposition / denominator 未闭环 | 已有三层状态机 + 双分母 + publishability 公式 | **基本关闭** |
| IR-05：`true_seeded` vs `pseudo_repeated` gate 未钉死 | 已有 repeatability class + tier gate + 不混榜原则 | **大体修复，但残留 1 个 P1** |
| IR-06：`score(...)` 偷渡总分 | 已明确退出 protocol core，改为 paired delta panel | **关闭** |
| IR-08：board slice 门槛未定义 | 已有 entry gate / slice gate / 4 档降级状态 | **大体关闭，降为 P2** |

### 4.2 为什么我认为这是“显著进步”

因为 draft2 已经把这些关键点从：

- reviewer 才能读懂的隐性共识
- prose 式原则
- 依赖人工解释的口头规则

推进到了：

- canonical object
- canonical state separation
- canonical digest / gate / slice rule

这就是协议从“想法好”迈向“可实施规范”的标志。

---

## 5. 是否建议进入下一轮修订，还是可接近定稿

我的建议是：

### 结论

**建议进入下一轮“定向修订”，但不建议因方法论问题回到大改。**

换句话说：

- **不能现在就宣称方法论满分或 stop condition 已满足**；
- **但 draft2 已经接近定稿级结构**；
- 只要补掉我列出的 1 个 P1，再顺手清掉 2–3 个 P2，方法论维度就有机会进入最终冻结区间。

### 我建议的最小修补顺序

1. **先补 `pseudo_repeated` 的 registration 审计字段**
   - 这是唯一剩余 P1
2. **再把 `attempted_or_terminal_tasks` 定义成 canonical count**
3. **最后把 slice gate 的 publishable floor / separation evidence 绑定到一个 policy hook**
4. **顺手统一 `requested_tier` → `requested_trust_tier`**

如果只从我负责的“方法论 / benchmark science”视角看：

> **draft2 已经“接近定稿，但还不应冻结”。**

---

## 6. 本 review 的一句话版本

**draft2 已真实修复了大多数方法论 P1，尤其是 denominator、board gate 与 `score(...)` 退出协议核心这三块；但 `pseudo_repeated` 仍差最后一个 registration-level 的证据字段闭环，因此我保留 1 个 P1，建议做一次小范围定向修订后再尝试收敛到定稿。**
