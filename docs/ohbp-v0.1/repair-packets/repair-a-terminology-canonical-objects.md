# Repair Packet A — Terminology & Canonical Objects

> 范围：IR-01 / IR-07 / IR-20  
> 角色：draft2 修订团队 A  
> 目标：不给协议“大改写”，只把 **命名、对象边界、单一真源** 收敛成可直接并入 draft2 的修订包。

---

## 0. 结论先说

本轮建议冻结 3 条总原则：

1. **`trust_tier` 是唯一权威分层字段**  
   规范层只保留 `community / reproduced / verified` 三个 storage enum。  
   `Self-reported` 不再作为 tier enum，只允许作为**来源描述**或历史兼容 alias。

2. **把“信任层级”和“公开状态”彻底拆开**  
   draft2 应显式区分：
   - `requested_trust_tier`：提交方/CLI 请求的目标层级
   - `trust_tier`：平台治理后授予的实际层级
   - `publication_state`：平台公开/争议/失效状态

3. **`ranking_eligibility` 不应继续作为 M2 的裁决字段**  
   推荐把权威资格迁移到 **M4**；  
   若为了最小改动暂留在 M2，也必须降级为 **advisory hint**，且改名，避免把 benchmark/execution 层写成 ranking policy 层。

一句话版本：

> draft2 应把“Community / Reproduced / Verified”“submitted / published / disputed / invalidated”“lane hint / board policy / board slice”三套概念彻底拆分，并为每个字段指定唯一 owner。

---

## 1. 当前命名 / 边界问题清单（去重后）

### P1-A1. Trust tier 术语混用

当前文稿同时存在：

- `Community`
- `Self-reported`
- `self_reported`
- `community/self-reported`
- `Trust Tier / Verification Tier`
- `verification_tier`

这会导致实现层无法稳定回答以下问题：

- `community` 是否等于 `self_reported`
- `verification_tier` 与 `trust_tier` 是否是同一字段
- CLI / API / DB / UI 是否共享一套状态机

### P1-A2. `reproduced` 与 `reproducible` 混用

当前文稿同时出现：

- `Reproduced`（M4 的公开层级）
- `reproducible / reproducible candidate`（M5 CLI 文案）
- `reproduced`（tier）

问题在于：

- `reproduced` 是**平台授予状态**
- `reproducible` 更像**意图、能力、profile 名称**或“希望进入的流程”

如果不拆开，CLI 文案会把“目标”误写成“已获得的状态”。

### P1-A3. `ranking_eligibility` 把 M2 写成了半个 M4

M2 `lane` 表当前直接定义：

- `community_only`
- `reproducible_ok`
- `verified_ok`

这会让 benchmark / execution 层提前决定“能上什么榜”。  
但按 Foundations 的原则，**benchmark ≠ ranking policy**。

### P1-A4. `trust_tier` 与 `publication_state` 尚未正交化

目前 M4 已定义 `publication_state`，但全稿没有明确说清：

- `Verified` 不是 `published`
- `invalidated` 不是 trust tier
- `provisional / disputed / corrected` 是**平台治理状态**，不是 tier

结果是：

- 容易把 `provisional` 当成 tier
- 容易把 `invalidated` 当成 tier 终态
- 容易在 UI/DB 上混出一张“单轴状态表”

### P1-A5. CLI 本地生命周期混入平台治理术语

M5 目前存在两类混淆：

1. 生命周期写成：
   `initialized -> executed -> packed -> uploaded -> replayed / reproduced`
2. offline init 使用了 `provisional study` 之类措辞

问题是：

- `replayed / reproduced` 更像命令结果或平台验证结论，不是本地 artifact 生命周期
- `provisional` 已被 M4 用作 publication state，CLI 本地目录不应复用

### P1-A6. `autonomy_mode` 与 `human_assistance` 缺少真源说明

当前全稿里：

- `autonomy_mode` 是分榜字段
- `human_assistance` 是声明/策略字段

但没有一张表说明：

- 哪个是**声明源字段**
- 哪个是**榜单切片字段**
- 哪个字段能被审计修正

### P1-A7. Board slice 字段里“源字段”与“派生字段”没有冻结

典型例子：

- `benchmark_tuned` vs `benchmark_tuned_flag`
- `budget_policy_id` vs `budget_class`
- `comparison_mode` 当前只有 prose label，没有稳定 storage enum

问题不是这些概念不能并存，而是：

> 没有一张 canonical ownership matrix 说明谁是源、谁是派生、谁负责裁决。

---

## 2. 建议冻结的 canonical objects

本包建议 draft2 只显式冻结 3 个对象边界；不必重写整套协议。

### 2.1 `verification_record`（M4，权威）

这是本轮最值得新增或显式冻结的 canonical object。  
它负责承接所有“平台治理后得出的状态”，避免散落在 prose。

**建议最小字段：**

- `requested_trust_tier`
- `trust_tier`
- `publication_state`
- `attestation_flags[]`（可选，非 tier）
- `board_admission_policy_id`
- `decision_reason_codes[]`
- `assigned_at`
- `assigned_by`

**规范意图：**

- `requested_trust_tier`：提交方请求进入哪个层级
- `trust_tier`：平台最终授予哪个层级
- `publication_state`：它当前是否公开、争议、修正、失效

> 重点：`verification_record` 是 M4 的真源；CLI 不能伪造它。

### 2.2 `lane_governance_hint`（M2，建议性）

为解决 IR-07，建议把 M2 的 `ranking_eligibility` 改造成 hint object，而不是 verdict field。

**建议最小字段：**

- `max_recommended_trust_tier`
- `default_visibility_hint`（可选）
- `requires_platform_scoring`（可选）
- `notes`

它表达的是：

> “从 benchmark / lane 角度看，这条 lane 通常最多建议进入哪个 trust tier。”

它**不表达**：

> “平台已经批准它进入哪个榜单。”

### 2.3 `board_slice`（M4/M6，派生对象）

`board_slice` 继续保留，但应明确：

- 它是**派生对象**
- 它不是 CLI 上传字段
- 它不由 M2 独立裁决

**建议最小 slice 维度：**

- `benchmark_id`
- `benchmark_version`
- `lane_id` 或 `lane_class`
- `execution_contract_digest`
- `trust_tier`
- `autonomy_mode`
- `benchmark_tuned_flag`
- `budget_class`
- `comparison_mode`

其中：

- `trust_tier` 来自 `verification_record`
- `comparison_mode` 来自 M4 ranking policy
- `budget_class` 来自 `budget_policy_id` 的策略映射

---

## 3. 建议冻结的 canonical enum / display label / storage enum

### 3.1 通用命名规则

- **Display label**：Title Case / 面向 UI 与文档展示  
- **Storage enum**：统一 `lowercase_snake_case`
- **Prose alias**：允许中文解释，但不再新增第二套 machine name
- **Deprecated alias**：可保留兼容注释，但不得继续在规范表中并列出现

---

### 3.2 Canonical enum 总表

| 概念 | Canonical field | Display label | Storage enum | 备注 |
|---|---|---|---|---|
| 平台授予的信任层级 | `trust_tier` | `Community` / `Reproduced` / `Verified` | `community` / `reproduced` / `verified` | 唯一权威 tier 字段 |
| 提交方请求的目标层级 | `requested_trust_tier` | `Community request` / `Reproduced request` / `Verified request` | `community` / `reproduced` / `verified` | 值域与 `trust_tier` 相同，但语义不同 |
| 平台公开状态 | `publication_state` | `Submitted` / `Provisional` / `Published` / `Disputed` / `Corrected` / `Invalidated` / `Rejected` / `Archived` | `submitted` / `provisional` / `published` / `disputed` / `corrected` / `invalidated` / `rejected` / `archived` | 与 `trust_tier` 正交 |
| 自主程度（榜单切片字段） | `autonomy_mode` | `Autonomous` / `Approval-only` / `Human-assisted` / `Interactive` | `autonomous` / `approval_only` / `human_assisted` / `interactive` | 分榜字段，storage 不用连字符 |
| 比较模式 | `comparison_mode` | `Fixed model → compare harness` / `Fixed harness → compare model` / `System combination board` | `fixed_model_compare_harness` / `fixed_harness_compare_model` / `system_combination` | prose label 与 storage 分离 |
| M2 的建议性上限 | `lane_governance_hint.max_recommended_trust_tier` | `Community ceiling` / `Reproduced ceiling` / `Verified ceiling` | `community` / `reproduced` / `verified` | advisory only |
| M4 的权威准入上限 | `board_admission_policy.max_allowed_trust_tier` | `Community` / `Reproduced` / `Verified` | `community` / `reproduced` / `verified` | authoritative policy，不在 M2 裁决 |

---

### 3.3 明确禁止继续并列使用的旧写法

| 当前写法 | draft2 建议收敛为 | 处理方式 |
|---|---|---|
| `Self-reported`（作为 tier） | `trust_tier = community` | 作为 tier 术语废弃；只保留为来源描述 prose |
| `self_reported` | `community` | 废弃 storage alias |
| `verification_tier`（字段名） | `trust_tier` | 允许在过渡说明中写“旧名 alias” |
| `reproducible candidate` | `requested_trust_tier = reproduced` | CLI 文案收敛 |
| `self-reported candidate` | `requested_trust_tier = community` | CLI 文案收敛 |
| `ranking_eligibility`（M2 verdict） | `lane_governance_hint.max_recommended_trust_tier` | 字段迁移 / 降级 |

---

## 4. 建议冻结的 state transitions

### 4.1 `trust_tier` 迁移规则

`trust_tier` 只表达“当前被授予的信任层级”，**不吸收争议/失效语义**。

| From | To | 是否允许 | 条件 |
|---|---|---|---|
| `community` | `reproduced` | 允许 | 满足 Reproduced 全部要求 |
| `community` | `verified` | 允许 | 仅可由 M4 决策直接授予；不得由 CLI/上传端自标 |
| `reproduced` | `verified` | 允许 | 满足 Verified 全部要求 |
| `verified` | `reproduced` | 允许 | 审计后降级 |
| `verified` | `community` | 允许 | 严重证据缺失或结论回退 |
| `reproduced` | `community` | 允许 | 审计后降级 |

**规范补句：**

> `invalidated` 不是 trust tier；结果失效应通过 `publication_state = invalidated` 表达。

### 4.2 `publication_state` 迁移规则

| From | To | 是否允许 | 说明 |
|---|---|---|---|
| `submitted` | `provisional` | 允许 | 已接收，待进一步审计 |
| `submitted` | `published` | 允许 | 直接公开 |
| `submitted` | `rejected` | 允许 | 基础校验失败或政策不允许 |
| `provisional` | `published` | 允许 | 审计通过 |
| `provisional` | `rejected` | 允许 | 审计失败 |
| `published` | `disputed` | 允许 | 被举报/命中风险规则 |
| `published` | `corrected` | 允许 | 修正后保留历史 |
| `published` | `invalidated` | 允许 | 失效下榜但保留记录 |
| `disputed` | `published` | 允许 | 争议解除 |
| `disputed` | `corrected` | 允许 | 更正后恢复 |
| `disputed` | `invalidated` | 允许 | 争议成立 |
| `rejected` / `invalidated` / `corrected` | `archived` | 允许 | 归档终态 |

**规范补句：**

> 一个结果是否“能上榜”，至少同时受 `trust_tier`、`publication_state`、`board_admission_policy` 三者约束；任何单字段都不足以表达全部资格。

### 4.3 CLI 本地状态不应再复用平台治理状态

建议把 M5 的本地生命周期改成纯 artifact 流程，例如：

```text
initialized -> executed -> packed -> uploaded
```

其中：

- `replay`
- `reproduce`

是 CLI 命令 / 工作流动作，不是 study 目录状态；

- `provisional`
- `published`
- `reproduced`
- `verified`

属于平台治理语义，不是 CLI 本地状态。

---

## 5. `ranking_eligibility` 的降级 / 迁移方案

### 5.1 推荐方案：迁移到 M4（首选）

**做法：**

1. 从 M2 `lane` schema 中删除顶层字段 `ranking_eligibility`
2. 在 M2 增加：
   - `lane_governance_hint.max_recommended_trust_tier`
3. 在 M4 增加：
   - `board_admission_policy.max_allowed_trust_tier`
   - 或等价权威 policy object

**好处：**

- Benchmark / execution 层只描述“这条 lane 的测量条件”
- Ranking / governance 层才描述“允许进入哪类榜单”
- 与 Foundations 的 “Benchmark ≠ Ranking Policy” 原则对齐

**建议直接可贴入 draft2 的规范句：**

> Benchmark / execution 层最多输出治理建议（governance hint），不直接裁决榜单资格。最终公开可见性与分榜资格由 M4 的 ranking / governance policy 决定。

### 5.2 最小改动兼容方案：保留字段但降级为 advisory

如果主控希望 draft2 先最小改动，可保留该字段，但必须同时改 3 件事：

1. 改名为：
   - `max_recommended_trust_tier`
   - 或 `ranking_eligibility_hint`
2. 在字段表里明确写上：
   - **NON-AUTHORITATIVE**
   - **ADVISORY ONLY**
3. 在 M4 明确加一句：
   - 最终板块资格由 M4 policy 裁决，M2 hint 不构成自动进榜

**不建议继续保留原名 `ranking_eligibility`**，因为它天然带 verdict 语感。

### 5.3 推荐的权责划分

| 层 | 字段 | 性质 |
|---|---|---|
| M2 | `lane_governance_hint.max_recommended_trust_tier` | advisory |
| M4 | `board_admission_policy.max_allowed_trust_tier` | authoritative |
| M4/M6 | `board_slice` 是否实际展示 | derived outcome |

---

## 6. 字段归属矩阵（single source of truth appendix 草案）

> 目标：至少把 trust tier、autonomy、ranking eligibility、board slice 相关字段的 owner 冻住。

| 概念 | Canonical field | 所属对象 | 真源模块 | 生产 / 裁决者 | 消费方 | 备注 |
|---|---|---|---|---|---|---|
| 提交方请求层级 | `requested_trust_tier` | `verification_record`（或 submission receipt） | M5 → M4 | CLI 声明，平台接收 | M4 | 只表达“请求”，不是最终 tier |
| 平台授予层级 | `trust_tier` | `verification_record` | M4 | 平台治理 / 审计 | M4 / M6 / UI | 唯一权威 tier 字段 |
| 平台公开状态 | `publication_state` | `verification_record` | M4 | 平台治理 / 审计 | UI / API / ranking gate | 与 `trust_tier` 正交 |
| 自主程度 | `autonomy_mode` | run manifest 声明 + M4 校正后的 canonical view | M3/M5 声明，M4 审计 | 上传端声明；平台可纠正 | board slice / M4 / M6 | 分榜字段；不要再与 `human_assistance` 混为一体 |
| 人工辅助明细 | `human_assistance` | run manifest / policy | M3 | 上传端声明 + telemetry 证据 | M4 审计 | 证据字段，不是主榜切片主键 |
| M2 治理建议上限 | `lane_governance_hint.max_recommended_trust_tier` | `lane_governance_hint` | M2 | benchmark/lane 维护者 | M4 | advisory only |
| M4 权威准入上限 | `board_admission_policy.max_allowed_trust_tier` | `board_admission_policy` | M4 | 平台 policy | ranking / UI | authoritative |
| 切片信任层级 | `board_slice.trust_tier` | `board_slice` | M4/M6 | 派生自 `verification_record.trust_tier` | UI / 排名 | 绝不能由 CLI 直接给出 |
| 切片自主模式 | `board_slice.autonomy_mode` | `board_slice` | M4/M6 | 派生自 canonical `autonomy_mode` | UI / 排名 | 与 `approval_only`/`interactive` 一致使用 snake_case |
| 切片 benchmark tuning 标记 | `board_slice.benchmark_tuned_flag` | `board_slice` | M4/M6 | 派生自 M3 `policy.benchmark_tuned` | UI / 排名 | 建议在 appendix 中写明“源字段 vs 派生字段” |
| 预算原始策略 | `budget_policy_id` | run manifest / execution policy | M3/M5 | 上传端 / preset / adapter | M4 / M6 | 源字段 |
| 切片预算分组 | `board_slice.budget_class` | `board_slice` | M4/M6 | 由 policy 映射规则派生 | UI / 排名 | 派生字段，不应与 `budget_policy_id` 混用 |
| 比较模式 | `comparison_mode` | `board_slice` / ranking policy | M4 | ranking policy | UI / 排名 | 不应由 run bundle 自报 |
| 切片主键 | `board_slice_key` | `board_slice` | M4/M6 | 平台派生 | API / UI | 由 slice 维度规范化后生成 |

---

## 7. 建议改动到哪些模块、哪些段落

### 7.1 `ohbp-v0.1-draft1.md`

建议修改：

- **§7 Verification Tiers 与治理**
  - 把 `Community / Reproduced / Verified` 明确绑定到 `trust_tier`
  - 增补一句：`Self-reported` 不是 canonical tier enum
- **§8 Ranking Policy**
  - 在 `board slice` 段前增加“权威字段来自 M4 verification_record”的说明
  - 把 `comparison_mode` 改成 display label + storage enum 双写法
- **§9.1 run group 是最小比较单位**
  - 把 `self-reported` / `reproduced` / `verified` 表述与 canonical enum 对齐

### 7.2 `modules/foundations.md`

建议修改 glossary：

- `Community Result`
- `Self-reported Result`
- `Trust Tier / Verification Tier`
- `Ranking Policy`

建议新增 glossary：

- `Publication State`
- `Requested Trust Tier`
- `Verification Record`
- `Board Admission Policy`

核心要点：

- 把 `Self-reported` 从 tier 词表中降为 provenance prose
- 明确 `verification_tier` 只是历史说法，canonical field 为 `trust_tier`

### 7.3 `modules/benchmark-execution.md`

重点修改：

- **§7.2 lane schema 表**
  - 删除或降级 `ranking_eligibility`
  - 替换为 `lane_governance_hint.max_recommended_trust_tier`
- **模块输出到 M4 的段落**
  - 从“输出 `ranking_eligibility`”改为“输出 governance hint”

建议补一句强规范：

> lane 的治理提示不构成自动进榜资格。

### 7.4 `modules/trust-governance-ranking.md`

这是本包的主战场，建议修改：

- **§2.4 Board Slice**
  - 显式声明 board slice 是 derived object
  - 冻结 `comparison_mode` 的 storage enum
- **§2.5 Publication State**
  - 增加“与 trust_tier 正交”的规范句
  - 增加 state transition 小表
- **§3 Verification Tiers**
  - 引入 canonical enum 表
  - 增加：`Self-reported` 不是 tier enum
- **§4.2 / §4.3 官方榜单与强制分榜维度**
  - 把 trust/publication/policy 三轴关系写清
- **§5.1–§5.6 审核流程**
  - 引入 `verification_record`
  - 将 `promote to Reproduced / Verified` 落成对 `trust_tier` 的裁决，而不是 prose-only

### 7.5 `modules/cli-adapter.md`

建议修改：

- **§2.2 connected / offline mode**
  - offline 只允许 `requested_trust_tier = community`
- **§2.3 生命周期状态**
  - 去掉 `replayed / reproduced` 作为生命周期终态
  - 不再使用 `provisional study` 这类 M4 术语
- **`upload` 段**
  - `self-reported candidate` 改为 `requested_trust_tier = community`
- **`pack` 检查失败段**
  - `reproducible candidate` 改为 `requested_trust_tier > community` 不可成立

### 7.6 `modules/metrics-uncertainty.md`

建议修改：

- `verification_tier` → `trust_tier`
- 重复运行最低门槛表中的层级名与 canonical display label 对齐
- 在 Reproducibility / Transparency 指标族里补一句：
  - `trust_tier` 是治理标签，不是单独计算出来的 score

### 7.7 补充触达（建议，但不阻塞本包交付）

为彻底闭环，主控整合 draft2 时最好顺手补到：

- `modules/run-data-evidence.md`

建议把：

- `policy.human_assistance`
- `policy.benchmark_tuned`

与 M4 / board slice 的 canonical field 关系补一张映射表。

---

## 8. 仍存在的 trade-off

### T1. 把 `Self-reported` 退出 tier enum，会损失一部分“来源 nuance”

收益是：

- 状态机更清楚
- UI / API / DB 更容易统一

代价是：

- “community” 可能比“self-reported”语义更宽

**建议处理：**

- v0.1 先把 `Self-reported` 降为 provenance prose
- 若后续确有需要，再单独加 `submission_origin` 字段，而不是把它塞回 tier

### T2. `autonomy_mode` 与 `human_assistance` 的精细语义仍未完全收口

本包只冻结了：

- 哪个是 slice field
- 哪个是 evidence field

但没有彻底定义：

- `human_assisted` 与 `approval_only / interactive` 的边界遥测

这部分仍需与 D 包（Governance Hardening）联动。

### T3. `ranking_eligibility` 迁到 M4 会让对象更纯，但实现跳转更多

优点：

- 边界正确
- 规范更稳

缺点：

- 实现层需要多看一个 policy object

如果主控更看重 draft2 的“最小改动”，可先采用 advisory 兼容方案。

### T4. `trust_tier` 与 `publication_state` 双轴化后，UI 会稍复杂

例如一个结果可能是：

- `trust_tier = verified`
- `publication_state = disputed`

这比单一状态更复杂，但这是**必要复杂度**，因为它真实反映了协议需要表达的治理事实。

---

## 9. 建议主控整合时优先落下的 5 句规范句

1. **关于 canonical tier：**
   > `trust_tier` 是 OHBP v0.1 的唯一权威分层字段，storage enum 仅允许 `community`、`reproduced`、`verified`。

2. **关于 Self-reported：**
   > `Self-reported` 是来源描述，不是 canonical trust tier enum；相关结果在规范层统一归入 `trust_tier = community`。

3. **关于 publication state：**
   > `publication_state` 与 `trust_tier` 正交；`provisional`、`disputed`、`invalidated` 等属于平台治理状态，而非信任层级。

4. **关于 M2/M4 边界：**
   > Benchmark / execution 层最多输出治理建议，不直接裁决榜单资格；最终资格由 M4 的 ranking / governance policy 决定。

5. **关于 board slice：**
   > `board_slice` 是派生对象，不是上传对象；其 `trust_tier`、`comparison_mode`、`budget_class` 等字段必须来自 canonical source-of-truth，而不得由 CLI 直接声明。

---

## 10. 本包的最小交付判断

若主控将本包整合进 draft2，则 IR-01 / IR-07 / IR-20 至少可以做到：

- **IR-01**：trust tier 命名冻结，UI / API / DB / CLI 有机会共用一套状态机  
- **IR-07**：`ranking_eligibility` 不再污染 M2 的对象边界  
- **IR-20**：字段归属矩阵首次形成 single source of truth appendix

当前我对该修订包的判断是：

> **足够精炼，且可以被主控直接吸收进 draft2，不需要推倒重写。**
