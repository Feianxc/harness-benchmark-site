# Round 3 Review — Reviewer A3（方法论 / benchmark scientist）

> 审核对象：`ohbp-v0.1-draft3.md`  
> 审核角色：Round3 Reviewer A3（方法论 / benchmark scientist）  
> 审核范围：stop-condition-oriented 小范围复核，仅检查方法论相关 residual P0 / P1 是否已清零

---

## 0. 结论先说

**结论：就方法论 reviewer 的职责范围看，draft3 已关闭 round2 留下的方法论 P1，当前未再发现 residual P0 / P1 / P2。**

我本轮判断：

- **P0：0**
- **P1：0**
- **P2：0**
- **round2 的方法论 P1：已关闭**
- **方法论侧 stop condition 阻断项：无**
- **建议：可冻结（方法论侧）**

需要说明的边界：

- 这里的“可冻结”仅表示**方法论维度已不再阻断**；整体项目是否达到 `task_plan.md` 定义的 stop condition，仍需结合其他 reviewer 的并行结论。

---

## 1. 6 维 rubric 简表（按本 reviewer 的 draft3 复核结论）

| 审核对象 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 总分 / 60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `ohbp-v0.1-draft3.md` | 10 | 10 | 10 | 10 | 10 | 10 | **60 / 60** |

给满分的原因不是“已经没有后续扩展空间”，而是：**在本轮方法论 stop-condition review 的验收范围内，draft3 已不存在会阻断规范冻结的明显缺口。**

---

## 2. 重点复核结论

### 2.1 `pseudo_repeated` 的 registration-level 审计字段已形成闭环

round2 唯一方法论 P1 是：

> `pseudo_repeated` 的 gate 虽然写出来了，但缺少 registration-level audit 字段闭环。

draft3 已把这部分从 prose 提升为 machine-checkable gate：

1. 在 `§7.1 run-group registration` 中，把以下字段纳入 normative registration schema：
   - `submission_window`
   - `randomness_fingerprint_hint`
   - `request_template_hash`
   - `provider_snapshot_lock`
   - `provider_release_window`
   - `requested_trust_tier`

2. 在 `§7.1 pseudo_repeated registration controls` 中，明确要求：
   - 当 `repeatability_class = pseudo_repeated` 且 `requested_trust_tier ∈ {reproduced, verified}` 时，上述字段 **MUST** 在首个 attempt 开始前冻结。

3. 在 `§7.2 completeness proof` 中，进一步给出否决条件：
   - 缺失 `submission_window`
   - 缺失 `request_template_hash`
   - `provider_snapshot_lock` 与 `provider_release_window` 同时缺失
   - 则该 run-group **MUST NOT** 进入 Reproduced / Verified

4. 在 `§7.4 repeatability class` 中，verifier 的审计动作也被明确为 MUST：
   - 检查同一窄窗
   - 检查模板哈希一致
   - 检查随机性线索存在
   - 检查 snapshot / release window 锁定

**判断：round2 的方法论 P1 已被真正关闭，而不是仅被文案性覆盖。**

---

### 2.2 task disposition / denominator / `attempted_or_terminal_tasks` 已达到可接受闭环

我本轮重点复核了 round2 中曾经接近关闭、但仍需确认是否 fully acceptable 的 denominator 结构。

draft3 在 `§8.3 Task disposition 与分母规则` 中已做到：

1. 固定三层状态机：
   - execution disposition
   - scoring disposition
   - visibility disposition

2. 明确区分：
   - `declared_task_denominator`
   - `scorable_task_denominator`
   - success numerator

3. 把 `attempted_or_terminal_tasks` 明确定义为 canonical count：
   - 执行状态属于 `{succeeded, failed, timeout, crash, policy_violation, skipped}` 的 task 数

4. 明确排除了之前最容易产生实现漂移的边界：
   - `redacted` 不是新的 terminal execution class
   - `not_attempted` 默认不计入 `attempted_or_terminal_tasks`
   - `evaluator_error` 默认不计入 `attempted_or_terminal_tasks`

**判断：该部分已从“方向正确”升级为“规范可落地”，不再构成 P1 / P2。**

---

### 2.3 board slice publish gate / rank separation policy hook 已足以方法论接受

我重点检查了 round2 中仍偏轻的 publish gate / rank separation hook 是否已经到达可接受状态。

draft3 在 `§10.4 Entry gate 与 Slice gate` 中已明确：

1. entry gate 读取 `board_admission_policy.minimum_publishable_task_floor`，使 publishable floor 不再只是 prose，而是挂到明确 policy hook 上。
2. slice state 明确区分：
   - `insufficient_evidence`
   - `comparison_only`
   - `ranked_tiered`
   - `ranked_ordinal`
3. `ranked_tiered` 与 `ranked_ordinal` 的分界，明确绑定到：
   - `board_admission_policy.rank_separation_policy_id`
4. `autonomy_mode` 相关 slice 的 admission，强制读取：
   - `verification_record.autonomy_mode`
   - 不再允许上传声明值直接决定 slice

这意味着：

- “是否足以公开比较”
- “是否只给 cluster / tier”
- “是否允许 ordinal rank”

已经不再依赖 reviewer 的临场解释，而是被接到 policy object hook 上。

**判断：从方法论角度，这已经足以接受，不再保留 residual P1 / P2。**

---

## 3. P0 / P1 / P2 清单

### P0

**无。**

### P1

**无。**

### P2

**无。**

---

## 4. 明确回答：round2 的方法论 P1 是否关闭

**是，已关闭。**

更具体地说：

- round2 的唯一方法论 P1 是 `pseudo_repeated` 缺少 registration-level audit closure；
- draft3 已在 `§7.1 + §7.2 + §7.4` 把它补成 registration 字段、否决条件、verifier MUST 审计三段式闭环；
- 因此我本轮不再保留该 P1，也不再把它降格保留为 P2。

---

## 5. 是否仍有 stop condition 阻断项

**就方法论维度而言：没有。**

理由：

1. 本 reviewer 未发现 residual P0 / P1；
2. 本 reviewer 未发现“关键字段缺失导致方法论无法落地”的问题；
3. round2 方法论遗留问题已被补成 machine-checkable 规则，而非停留在 prose；
4. denominator、publish gate、rank separation hook、autonomy-related slice admission 均已具备可执行的规范接口。

---

## 6. 建议

**建议：可冻结（方法论侧）。**

一句话版：

> draft3 已把 round2 方法论遗留的最后一个 P1（`pseudo_repeated` registration audit closure）补成了规范级对象与审核门槛，同时把 denominator 与 board-slice gate 收口到可执行 policy hook；因此我认为方法论维度已达到本轮冻结条件。
