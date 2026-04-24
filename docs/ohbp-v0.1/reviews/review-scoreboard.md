# Reviewer E — OHBP v0.1 Draft1 正式评分板

> 角色：总评主席 / Scoring Chair  
> 日期：2026-04-20  
> 写入范围：仅本文件  
> 依据：`task_plan.md`、`rubric.md`、`ohbp-v0.1-draft1.md`、`modules/*.md`

---

## 0. 本地进度与状态快照

### 0.1 本地落盘进度
基于当前工作区文件状态，本地已落盘内容如下：

- `docs/ohbp-v0.1/ohbp-v0.1-draft1.md` 已存在
- `docs/ohbp-v0.1/modules/` 下 M1–M6 六个模块文件已存在
- `docs/ohbp-v0.1/reviews/` 在本次写入前为空

### 0.2 阶段判断
按 `task_plan.md` 口径，当前项目状态可判断为：

- **Phase 1（第一轮独立模块设计）**：本地已完成并汇总为 `draft1`
- **Phase 2（第一轮独立审核）**：进行中
- **Phase 3（修订）**：尚未开始

### 0.3 关于“子 AGENT 状态”
由于当前是崩溃后重启场景，本评分板只能依据**本地已落盘文件**恢复进度，**不能把崩溃前运行时中的 agent 进程状态视为仍然存活**。因此，本次审查以“落盘工件”为准，而非运行时会话状态。

---

## 1. 总评结论

**结论：draft1 质量明显高于一般概念稿，已经具备进入 draft2 修订的基础，但尚未达到“满分停止条件”。**

### 1.1 是否达到停止条件
**未达到。**

原因：
1. 6 个维度并未全部达到 10/10
2. 仍存在 **P1 级问题**
3. 存在若干跨模块接口未完全收敛，尚不足以宣称“可直接作为 v0.1 正式规范定稿”

### 1.2 当前总体判断
- **P0：无**
- **P1：有**
- **P2：有**
- **P3：有**

### 1.3 评语（一句话）
这版 draft1 的优点是**方向对、骨架清、治理意识强、CLI-first 路线稳**；主要短板是**跨模块规范仍偏 prose-first，少数关键状态/容差/完整性证明还没有收敛为唯一实现口径**。

---

## 2. 评分口径说明

本评分板严格按 `rubric.md` 的 6 个维度给出 10 分制评分：

1. 方法论严谨性
2. 协议完整性
3. 治理与反作弊
4. 可实现性
5. 生态兼容性
6. 文档清晰度

说明：
- 对单模块评分时，按“该模块在其职责范围内，对该维度的完成质量”评分
- **不是**要求每个模块都单独覆盖整套协议全部能力
- 但若某模块的边界与其他模块接口不稳，仍会在“完整性 / 清晰度 / 可实现性”中扣分

---

## 3. 模块评分总表

| 对象 | 方法论 | 完整性 | 治理反作弊 | 可实现性 | 生态兼容 | 文档清晰 | 总分 | 结论 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **M1 Foundations** | 9 | 8 | 7 | 9 | 9 | 9 | **51/60** | 骨架稳，边界清，是全稿的强模块 |
| **M2 Benchmark & Execution** | 9 | 9 | 8 | 8 | 8 | 8 | **50/60** | 对象拆分好，lane 与 health 设计成熟 |
| **M3 Run Data & Evidence** | 8 | 9 | 8 | 8 | 8 | 8 | **49/60** | 证据包设计扎实，但 run-group 完整性证明仍缺口 |
| **M4 Trust / Governance / Ranking** | 8 | 9 | 9 | 7 | 8 | 8 | **49/60** | 治理骨架强，但落地口径还需收敛 |
| **M5 CLI & Adapter Contract** | 8 | 8 | 7 | 9 | 9 | 8 | **49/60** | CLI-first 路线正确，adapter 接口很有执行感 |
| **M6 Metrics & Uncertainty** | 9 | 8 | 7 | 7 | 8 | 9 | **48/60** | 方法论强，但部分统计推荐仍偏研究态 |
| **Draft1 Overall** | 9 | 8 | 8 | 8 | 9 | 8 | **50/60** | 已可进入下一轮修订，不可宣称满分 |

---

## 4. 分模块评语

### M1 — Foundations
**优点**
- 问题定义、目标/非目标、设计原则、对象边界都很清楚
- `Protocol ≠ Benchmark ≠ Ranking Policy` 的边界划分是本稿最稳的基础
- “证据优先、协议优先、分层信任”三条主轴定得很准

**扣分点**
- Trust tier 术语与后续模块尚未完全统一成单一 canonical 命名表
- Foundations 提供了原则，但缺少一个“全稿统一枚举 / canonical object table”的硬接口

**主席判断**
- M1 可直接保留为 draft2 的主体基础，不建议大改结构
- 下一轮应主要补“术语—字段—枚举”统一表，而不是重写原则

### M2 — Benchmark & Execution
**优点**
- `Benchmark Card / Task Package / Execution Contract / Lane / Health Record` 五对象拆得很合理
- lane 设计兼顾 MVP-first 与后续扩展，避免一开始被重 benchmark 拖死
- health record 已被当作一等对象，而不是榜单 UI 注释

**扣分点**
- benchmark / lane / split 三级 health 继承与覆盖规则还不够统一
- `ranking_eligibility`、`lane_tier` 等字段虽有方向，但仍需与 M4/M6 的榜单切片字段完全对齐

**主席判断**
- M2 是整套协议里最接近“可落规范”的模块之一
- 下一轮重点应做“字段归一”和“对象引用关系图”

### M3 — Run Data & Evidence
**优点**
- `manifest.json + aggregate.json + task-results.ndjson + trace/ + reports/ + artifacts/` 的 bundle 骨架合理
- 用 NDJSON 做 task-level 事实表是对的，利于流式处理和审计
- 事件哈希、artifact manifest、attestation 等增强项位置也放对了

**扣分点**
- 当前 bundle 主要定义的是 **attempt 级** 工件；但 **run-group 级完整性证明** 还没有一个唯一对象承载
- 若没有“预注册 seed 集 / 预期 attempt 数 / 已上传 attempt 集合证明”，平台难以从协议层真正证明“没有选择性上报”

**主席判断**
- M3 的单次 run 证据设计已足够扎实
- 但它是本稿里最典型的“局部强、系统闭环还差一步”的模块

### M4 — Trust / Governance / Ranking
**优点**
- `Community / Reproduced / Verified` 三层制度明确，且默认主榜只看 Verified，方向正确
- audit flow、dispute/invalidation、anti-cheat baseline 都具备协议意识
- 明确禁止 best-of-N 直接进主榜，这一点非常关键

**扣分点**
- `Reproduced` 与 `Verified` 的“满足容差”仍停留在原则表述，尚未归一到一个可实现的 canonical 规则对象
- 争议、冻结、重算、恢复等流程很完整，但 v0.1 的最小实现口径需要再收紧，否则工程实现会分叉

**主席判断**
- M4 是治理最强模块，但也是最容易因“规则很多、实现口径不唯一”而出问题的模块
- 下一轮应优先把 tier 判定条件写成“唯一判定表”

### M5 — CLI & Adapter Contract
**优点**
- 非常明确地把 CLI 定位为标准执行层，把 SKILL 降为 wrapper，这是正确决策
- `init -> run -> pack -> upload` 生命周期定义清楚
- preset 与 custom adapter 被拉到同一协议平面，生态兼容性很好

**扣分点**
- adapter 的中间输出（如 `result.json`、`trace.jsonl`）与 M3 最终 bundle 产物之间仍需一张明确的“规范映射表”
- connected / offline 与 tier 升级关系已提到，但与 M4/M6 还需要更硬的对接说明

**主席判断**
- M5 是很好的工程抓手，适合后续直接变成 CLI 规格说明
- 但要避免“CLI 里隐含了协议判断逻辑，而协议文档本身没收敛”的风险

### M6 — Metrics & Uncertainty
**优点**
- 反对单一神圣总分，改为 success / cost / latency / stability / reproducibility，判断正确
- run-group 作为最小可比较单位，这一点非常关键
- model 与 harness 分离、ablation、health 展示都具备很强的方法论意识

**扣分点**
- clustered bootstrap、paired bootstrap、rank spread、top-k probability 等建议是对的，但对 v0.1 MVP 来说还缺“默认 fallback 统计口径”
- 研究级分析与平台级默认展示之间，仍需要更明确的降阶实现方案

**主席判断**
- M6 是“学术质量最高”的模块之一
- 但它需要被进一步压缩成“v0.1 默认必做”和“研究增强项”两个层次

---

## 5. 整体稿件（draft1）综合判断

### 5.1 整体优点
1. **总方向正确**：没有滑向“任意上传分数排行榜”
2. **主线清楚**：协议 → CLI → 证据包 → 分层信任 → 薄网站
3. **治理意识成熟**：best-of-N、benchmark-tuning、人工干预、环境作弊、trace 伪造都已进入协议视野
4. **对象边界清楚**：protocol / benchmark / harness / ranking policy 的分层成立
5. **生态策略正确**：preset + custom adapter 并存，不被单一生态锁死

### 5.2 整体短板
1. **跨模块 canonical object / canonical enum 仍不足**
2. **run-group 级“完整性证明”尚未落成唯一契约对象**
3. **Reproduced / Verified 容差规则未形成唯一实现口径**
4. **少数关键字段命名在模块间尚未完全归一**
5. **部分统计建议还没有降阶到 v0.1 默认最小实现**

---

## 6. 是否达到“满分停止条件”

### 结论
**未达到。**

### 对照 `task_plan.md` 的停止条件

#### 条件 1：6 个维度全部 10/10
- **未满足**

#### 条件 2：无 P0 / P1
- **未满足**（存在 P1）

#### 条件 3：无关键字段缺失 / 治理层无法落地
- **部分未满足**：虽无“大对象缺失”，但仍有若干关键收口对象未统一，影响复验与主榜防污染的最终落地

---

## 7. 必须修的 P0 / P1

## 7.1 P0（本轮结论：无）
当前 draft1 已经覆盖：
- benchmark card / execution contract
- run manifest / evidence bundle
- verification tiers / ranking policy
- CLI / adapter
- metrics / uncertainty

因此**不存在“缺少关键对象导致协议无法成立”的 P0**。

---

## 7.2 P1（必须在 draft2 收敛）

### P1-1：Trust tier 命名与 canonical enum 未完全统一
**问题**
- M1/M5/M6 中仍存在 `Self-reported` / `self_reported` / `community` 并行表达
- M4 主体使用 `Community / Reproduced / Verified`
- 当前缺少一张“规范级唯一命名映射表”，说明：显示名、API 枚举、排序资格、默认展示位置之间的关系

**为什么是 P1**
如果 trust tier 本身的 canonical enum 不统一，平台很容易在实现层混淆：
- community 是否等价于 self-reported
- reproduced 与 reproducible 的语义边界
- CLI / API / 榜单 / UI 是否共享同一状态机

这会直接影响主榜防污染与接口稳定性。

**要求**
draft2 必须补一个单一真源表，至少统一：
- API 枚举值
- UI 显示名
- 状态机迁移关系
- 排名资格
- 最低证据要求

### P1-2：run-group 完整性证明对象缺失
**问题**
- M3 强在 attempt 级证据包，但 run-group 级“完整性证明”尚无唯一对象
- M4/M5/M6 都强调“必须上传全量 attempts、不得只传最好一次”，但还缺少一个明确的协议对象承载：
  - 预注册 seed set / attempt set
  - 预期 attempt 总数
  - 已完成 / 已上传 attempt 列表
  - completeness verdict

**为什么是 P1**
如果没有这个对象，协议层很难真正证明“全量 attempts 已披露”，best-of-N 与选择性上报仍可能在工程上漏过去。

**要求**
draft2 必须增加一个 canonical object（名称可为 `run-group-manifest` / `study-registration` / `attempt-set-proof`），并定义其与 M3/M4/M5 的关系。

### P1-3：Reproduced / Verified 的“容差规则”未收敛为唯一规范对象
**问题**
- M4 多次要求“满足容差”
- M5 在 replay / reproduce 中提到要判断是否达到容差
- draft1 末尾也主动承认这是待审核问题
- 但当前没有明确：容差规则究竟挂在 benchmark、lane、execution contract、verification policy 还是 ranking policy 上

**为什么是 P1**
没有唯一容差对象，就无法稳定判定：
- 何时算 reproduced
- 何时算 verified through rerun
- deterministic 与 stochastic lane 分别用什么口径

这直接影响 verification tier 的落地与争议处理。

**要求**
draft2 必须给出唯一挂载点和字段组，例如：
- `reproduction_tolerance_policy`
- `verification_agreement_policy`
并说明其所属模块、默认值、lane override 规则。

---

## 8. 建议修的 P2

### P2-1：补“字段归属矩阵 / single source of truth appendix”
当前字段散落在 M2–M6 之间，虽已大量出现，但缺少一张表说明：
- 字段名
- 所属对象
- 所属模块
- 是否 MUST
- 是否出现在 CLI / Bundle / Server / UI

### P2-2：统一 board slice 相关字段命名
例如：
- `benchmark_tuned` vs `benchmark_tuned_flag`
- `budget_class` vs `budget_policy_id`
- `community` vs `self_reported`
- `autonomy_mode` 与 `human_assistance` 的关系

当前方向已对，但 naming normalization 还差最后一步。

### P2-3：补 adapter 中间产物到最终 bundle 的映射图
M5 定义了 adapter 产出 `result.json` / `trace.jsonl`，M3 定义了最终 bundle 文件。建议补一张明确映射：
- adapter intermediate output → normalizer → bundle canonical file

### P2-4：把统计方法分成“v0.1 默认实现”与“研究增强项”
M6 方法论强，但工程团队需要更清楚：
- 哪些是 v0.1 默认必做
- 哪些可以延后到研究页 / 分析页

### P2-5：Benchmark Health Snapshot 对象可进一步独立化
当前 M2 与 M6 都已经把它当一等对象，但建议在 draft2 里更明确：
- snapshot ID
- benchmark/lane/split 三级挂载关系
- 历史保留与 supersede 规则

---

## 9. 可延后的 P3

### P3-1：Attestation / signed runner / TEE 细化规范
当前已作为增强项出现，方向对，但不应阻塞 v0.1-draft2。

### P3-2：mixed-effects / factorial 分析附录
适合作为研究附录，不应卡住协议主线。

### P3-3：更重 benchmark lane 的引入路线
如 live browser / desktop / ML-heavy，可放到后续版本规划。

### P3-4：更细颗粒度的 UI 展示文案规范
例如 rank spread 的 UI 文案、tier 呈现模板等，可后置到产品页规范。

---

## 10. 下一轮修订优先级排序

### Priority 1
**统一 Trust Tier 与 Publication State 的 canonical enum / state machine**

目标：
- 一次性统一 `Community / Self-reported / Reproduced / Verified` 的命名与枚举值
- 明确 UI 名、API 名、状态迁移、榜单资格

### Priority 2
**补 Run Group Registration / Completeness Proof 对象**

目标：
- 让“必须上传全量 attempts”从原则变成可验证对象
- 把 pre-registration、seed set、attempt cardinality、上传完整性收进一个 canonical object

### Priority 3
**定义唯一的 Reproduction / Verification Tolerance Policy**

目标：
- 明确容差规则挂载点
- 明确 deterministic / stochastic lane 的默认判定逻辑
- 让 replay / reproduce / rerun agreement 有一致口径

### Priority 4
**补跨模块字段归属矩阵 + naming normalization**

目标：
- 清除 `benchmark_tuned` / `benchmark_tuned_flag` 等分叉
- 给工程实现单一真源

### Priority 5
**压缩 M6：区分 v0.1 默认统计与研究增强统计**

目标：
- 保留方法论质量
- 同时降低 0→1 落地歧义

### Priority 6
**补 adapter intermediate → bundle canonical 的映射图**

目标：
- 让 CLI、normalizer、bundle schema 之间的责任边界更清楚

---

## 11. 建议的下一轮修订策略

建议不要直接全面重写，而应按以下策略推进：

1. **先做 cross-module normalization patch**
   - 修 canonical enum
   - 修 canonical object
   - 修字段命名统一

2. **再做 trust / run-group / tolerance 三件套补丁**
   - 这是最影响 stop condition 的部分

3. **最后做文档压缩与默认实现层级化**
   - 把“必做 / 应做 / 研究增强项”重新排版

也就是说：
> draft2 最重要的不是“加更多内容”，而是“把已经有的内容收敛成唯一实现口径”。

---

## 12. 主席最终判定

### 判定
**通过进入下一轮修订，但不得宣称满分，也不宜直接定稿。**

### 置信判断
- 方向正确：**高置信**
- 骨架可用：**高置信**
- 可直接定稿：**低置信**
- 经过一轮 focused normalization 后进入高质量 draft2：**高置信**

### 最后一行结论
> **OHBP v0.1-draft1 已经是一份“值得继续打磨的协议草案”，不是空想；但它当前更像“高质量骨架稿”，还不是“满分收敛稿”。**
