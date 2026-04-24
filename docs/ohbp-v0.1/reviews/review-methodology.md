# Reviewer A（方法论 / benchmark scientist）审核意见

## 结论先说

**结论：draft1 的方法论骨架是对的，尤其是 `protocol ≠ benchmark ≠ ranking policy`、`run group > single run`、`benchmark health 独立展示` 这三条，已经把项目从“排行榜想法”拉到了“测量协议想法”。**

但以本轮方法论标准看，**draft1 还不能宣称接近满分，也不建议直接冻结为正式 v0.1**。  
我在本轮重点审查范围内：

- **未发现 P0**
- **发现 5 个 P1**

这些 P1 主要集中在：

1. **统计口径尚未完全闭环**
2. **verified 主榜的随机性与可重复性门槛不够硬**
3. **部分对象边界仍有轻微泄漏**
4. **某些“看似科学”的衍生量仍带有隐含产品政策**

所以我的总体判断是：

> **这是一版“方向正确、骨架成熟、但尚未形成可无歧义执行的方法论草案”的 draft1。**  
> 适合进入 draft2 修订，不适合宣称方法论维度满分。

---

## 审核范围

本次按要求已阅读：

- `E:/工作区/10_Projects_项目/harness测评网站/task_plan.md`
- `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/rubric.md`
- `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1-draft1.md`

并重点审查：

- `docs/ohbp-v0.1/modules/foundations.md`
- `docs/ohbp-v0.1/modules/benchmark-execution.md`
- `docs/ohbp-v0.1/modules/metrics-uncertainty.md`

---

## 一、按 6 维 rubric 的模块评分

> 说明：这里的“协议完整性”是**相对于模块职责范围**打分，不是要求单个模块独自覆盖全协议。

### 1) M1 `foundations.md`

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 9/10 | 最大优点是把对象边界先讲清，再谈上传、验证、排名；这一步非常关键。 |
| 协议完整性 | 8/10 | 作为 foundations 已覆盖目标/非目标/原则/术语，但对后续模块的强制约束还偏“原则性”，缺少几个会影响统计闭环的显式钩子。 |
| 治理与反作弊 | 8/10 | 已把分层信任、争议、污染、作弊当成协议问题，而不是运营补丁；但本模块不负责给出硬规则，所以只能给高分但不到满分。 |
| 可实现性 | 9/10 | 明确 MVP-first、CLI-first、生态中立，落地路径非常稳。 |
| 生态兼容性 | 9/10 | 对 preset / custom adapter / 多平台并存的姿态是正确的。 |
| 文档清晰度 | 9/10 | 结构清楚、术语表有用、边界意识强。 |

**小结**：`foundations.md` 是当前草案里最稳的一块，已经具备“正式规范导言”的质感。

**模块总分：52/60**

---

### 2) M2 `benchmark-execution.md`

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8/10 | Card / Package / Contract / Lane / Health 的拆分是正确的，但仍有轻微 policy 泄漏。 |
| 协议完整性 | 8/10 | 核心对象齐全，字段骨架也够用；但任务状态、可计入分母的任务集合、subset / exclusion 规则还不够硬。 |
| 治理与反作弊 | 7/10 | 对 public vs hidden、缓存与持久记忆、环境冻结有意识，但 imported benchmark 的最小审计门槛仍偏原则化。 |
| 可实现性 | 9/10 | lane 设计与 v0.1 轻量起手的判断非常务实。 |
| 生态兼容性 | 8/10 | 支持 imported / mirrored / private_hosted 很好，但不同 evaluator / hosted split 的统一方式还需再硬一点。 |
| 文档清晰度 | 8/10 | 总体清楚，但 `ranking_eligibility` 这类字段会让边界略显模糊。 |

**小结**：M2 的对象设计强，尤其是 Execution Contract 被正确抬升为“可比性中心对象”；当前主要问题不是少对象，而是**少几条决定统计口径的硬规则**。

**模块总分：48/60**

---

### 3) M6 `metrics-uncertainty.md`

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8/10 | run group、CI、rank spread、health 分离这些方向都对；但几个关键量还存在隐含歧义。 |
| 协议完整性 | 8/10 | 指标族、重复运行、ablation、health 展示都覆盖到了；但 task disposition、publication threshold、lift 定义不够闭环。 |
| 治理与反作弊 | 7/10 | 明确反对 best-of-k 和 single-run 排榜是加分项；但对 pseudo repeated 是否足以进入 verified 的门槛还不够硬。 |
| 可实现性 | 7/10 | 方法上合理，但一些推荐统计做法对 v0.1 MVP 仍偏重，需要更明确的降级路径。 |
| 生态兼容性 | 8/10 | 对不同 provider 的 token 口径差异有自觉，属于加分；但模型 silent update 风险只被部分吸收。 |
| 文档清晰度 | 8/10 | 大部分章节写得清楚，但 `score(...)` 这类抽象量会让读者重新掉回“神圣总分”的坑。 |

**小结**：M6 是最接近“科学化”的模块，但也是最容易在细节上失真的模块。当前问题不在大方向，而在**几条若不钉死就会造成榜单失真的定义**。

**模块总分：46/60**

---

## 二、整体 `ohbp-v0.1-draft1.md` 评分

| 维度 | 分数 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8/10 | 已经摆脱“网站 PRD”思路，进入协议思路；但还没到“无歧义统计规范”的程度。 |
| 协议完整性 | 8/10 | 六大对象层级基本成形，draft1 能看出完整系统轮廓。 |
| 治理与反作弊 | 8/10 | 分层信任与主榜默认 Verified 的方向正确；但方法论上还缺几条关键门槛定义。 |
| 可实现性 | 8/10 | CLI-first、lite lane、薄网站路线可行。 |
| 生态兼容性 | 8/10 | 对 preset/custom adapter、多 benchmark 并存的兼容思路是成立的。 |
| 文档清晰度 | 8/10 | draft1 作为汇总稿可读性不错，但它目前更像“结构化摘要”而不是“可直接执行规范”。 |

**整体总分：48/60**

我的结论是：

> **draft1 已经足够好，值得进入下一轮修订；但离“6 维全部 10/10、无 P0/P1”的停止条件还有明显距离。**

---

## 三、P0 / P1 问题清单

## P0

**本轮重点审查范围内未发现 P0。**

说明：  
我没有看到“缺少关键对象导致无法上传 / 无法复验”的断裂；当前问题更像是**对象都在，但少几条决定结果是否真的可比较的硬规则**。

---

## P1

### P1-1：缺少统一的 task disposition / denominator 规范

**影响模块**：M2、M3、M6、draft1

当前草案已经有：

- `task_success_rate = succeeded_tasks / eligible_tasks`
- `timeout_rate`
- `crash_rate`
- `partial_completion_rate`

但还没有一个统一、规范化的 **task outcome state machine** 去回答下面这些问题：

- `eligible_tasks` 的正式定义是什么？
- `timeout` / `crash` / `evaluator_error` / `policy_violation` / `redacted` / `not_attempted` / `skipped` 是否计入分母？
- hidden split 因平台侧故障造成的缺失任务怎么处理？
- subset / partial package / rerun failure 时，哪些 task 还能进入 paired comparison？

**为什么这是 P1**：  
如果任务状态和分母不统一，success rate、CI、delta、rank spread 都会失真。看起来只是一个字段问题，实质上是**比较单位不稳定**。

**建议修复方向**：  
在 M2+M3+M6 间补一份统一的 task disposition 规范，至少定义：

- task terminal states
- 是否计入 numerator / denominator
- 是否允许 repair / rerun
- evaluator error 与 system failure 的归类方式

---

### P1-2：`true seeded` 与 `pseudo repeated` 的 verified 门槛没有钉死

**影响模块**：M6、draft1，连带 M4

M6 已经正确地区分：

- `true seeded`
- `pseudo repeated`

这是很好的意识。  
但 draft1 还没有明确规定：

- pseudo repeated 能否进入 Verified 主榜？
- 如果可以，需要满足什么附加条件？  
  例如：
  - 平台控制环境复跑
  - provider snapshot 固定
  - 请求时间窗约束
  - stronger attestation
- 如果不可以，是否只能进入 Reproduced 或附特殊标签的 Verified-subtype？

**为什么这是 P1**：  
主榜默认只看 Verified，而今天很多 provider 根本不给稳定 seed。若这条不钉死，Verified 会变成“看起来很科学、实则随机性未封住”的状态。

**建议修复方向**：  
在 M4/M6 联动中明确定义：

1. `verified_seeded`
2. `verified_pseudo_repeated`
3. 哪些榜单默认只吃前者
4. 后者是否必须带警示标签或降权显示

---

### P1-3：`harness_lift` / `model_lift` 使用抽象 `score(...)`，与“拒绝神圣总分”相冲突

**影响模块**：M6、draft1

M6 前面用了大量篇幅强调：

- 多维指标优先
- 不把产品偏好包装成科学真理
- benchmark health 不得静默折算进分数

但到 `harness_lift` / `model_lift` 时，又回到了：

```text
score(harness, model, benchmark)
```

这个 `score` 没有被正式定义。  
它会让读者自然理解成某个单一综合分，等于把前文的边界又绕回去了。

**为什么这是 P1**：  
这不是措辞小问题，而是会把整个协议重新引回“隐含单分 + 默认权重”的旧路。

**建议修复方向**：  
把 lift 改成显式的多指标差值，例如：

- `effectiveness_lift`
- `cost_lift`
- `latency_lift`
- `stability_lift`

如果确实需要单值 `score`，必须声明它只是某个 **ranking policy 的派生量**，不是方法论基础量。

---

### P1-4：M2 中 `ranking_eligibility` 让 benchmark/execution 层轻微泄漏到 ranking policy 层

**影响模块**：M2、draft1

M1 最强的一条就是：

> `Benchmark ≠ Ranking Policy`

但 M2 的 lane 字段里直接放了：

- `ranking_eligibility = community_only / reproducible_ok / verified_ok`

这会带来一个边界问题：

- lane 本身是在描述 benchmark + contract 的执行对象
- 但 `ranking_eligibility` 已经在部分决定“这个对象允许进入哪类榜”

我理解作者是想提供治理提示，但在方法论上它更像：

- governance-consumed advisory
而不是
- benchmark 层事实属性

**为什么这是 P1**：  
rubric 明确把“protocol / benchmark / policy 混淆”视为阻断项之一。这里虽未完全混淆，但已经开始泄漏。

**建议修复方向**：  
二选一：

1. 把 `ranking_eligibility` 移到 M4 的 policy / governance 对象  
2. 或保留该字段，但明确它只是 **advisory gating hint**，最终可见性仍由 ranking policy 决定

---

### P1-5：未定义 board slice 公开发布的最低统计门槛

**影响模块**：M6、draft1

M6 已定义：

- `rank_p05 / rank_p50 / rank_p95`
- `top1_probability / top3_probability`
- paired bootstrap / clustered bootstrap

但还缺一组很关键的“发布阈值”：

- 至少多少 `n_runs` 才允许显示 rank spread？
- 若 paired grid 不完整到什么程度，delta comparison 必须降级为 non-paired？
- `n_tasks` 低于多少或 exclusion 过高时，主榜是否必须隐藏 top-k 概率？
- subset lane 是否需要单独的最小样本量门槛？

**为什么这是 P1**：  
没有 publication threshold，就可能出现：

- 小样本
- 缺失样本
- 不完整 paired 数据

也照样生成很“精致”的排名概率与 rank band，形成**伪精确**。

**建议修复方向**：  
新增 `board publication guardrails`，至少规范：

- min run-group size
- min paired coverage
- max excluded-task ratio
- insufficient-data 时的降级展示规则

---

## 四、结构性 trade-off（不是 bug，但必须留档）

### Trade-off 1：开放证据 vs benchmark 污染

你们已经正确地把 benchmark health 纳入协议层。  
但越强调：

- open trace
- open artifacts
- open reproduction

就越会提高：

- overfitting
- trace leakage
- answer caching
- contamination speed

**结论**：  
这不是能“彻底解决”的矛盾，必须通过：

- delayed release
- redaction policy
- hidden split rotation

来治理，而不是靠一句“全部开源”。

---

### Trade-off 2：统计严谨性 vs 评测成本

M6 采用：

- repeated runs
- bootstrap
- paired delta
- rank spread

这是正确方向。  
但对真实用户和早期平台而言，**5-run verified + 10-run flagship** 的成本会很高。

**结论**：  
必须明确一个降级路线：

- MVP 哪些统计必须做
- 哪些只是推荐做

否则平台会在“方法论正确”和“用户根本不跑”之间卡死。

---

### Trade-off 3：协议中立 vs 高信任验证

OHBP 想保持：

- preset + custom adapter
- 多生态接入
- 不锁死单一平台

但 Verified 又要求越来越强的：

- runner control
- attestation
- replay / rerun
- environment sealing

**结论**：  
生态中立和高验证强度天然有张力。  
建议接受“Community 更开放，Verified 更收敛”的现实，而不是试图让所有入口都天然同等可信。

---

### Trade-off 4：轻量 lane 启动 vs 外部效度

`core-lite-v1 / terminal-lite-v1 / workflow-clean-v1` 是对的。  
但它们越受控、越干净，越可能被质疑“不代表真实世界”。

**结论**：  
v0.1 必须接受：

- 先用轻量 lane 建可信闭环
- 再逐步扩展到 live / desktop / heavy benchmark

而不是试图在第一版同时解决“可信”与“全世界真实任务”。

---

### Trade-off 5：多指标科学性 vs 产品传播性

M6 正确地拒绝单一神圣总分。  
但用户、媒体、社区天然更爱：

- 一张榜
- 一个分
- 一个冠军

**结论**：  
平台最终大概率仍会有某种“产品榜”。  
重点不是永远不做，而是：

> **把它清楚标注为 ranking policy 的产物，而不是协议层真理。**

---

## 五、最重要的 5 条修订建议

### 建议 1：补一份统一的 `task outcome / disposition` 规范

这是 draft2 里我最优先建议补的内容。  
没有这份规范，success / timeout / crash / exclusion / evaluator failure 的分母都不稳。

建议至少定义：

- task terminal states
- numerator / denominator inclusion rules
- retry / rerun legality
- evaluator failure 归因
- hidden split 缺失任务的处理

---

### 建议 2：把 `pseudo repeated` 的 verified 资格和显示规则写死

不要只区分 seeded vs pseudo。  
要写成规范：

- 哪类可以进主榜
- 哪类只能进副榜
- 哪类必须警示显示
- 平台复跑是否能补足其缺陷

这条不补，主榜的可信度上限会很低。

---

### 建议 3：删除或重写 M6 中所有未定义的 `score(...)`

把 lift 明确改成：

- 某个具体指标的差值
- 或者某个 policy-defined aggregate 的差值

并显式标注：

- “这是政策派生量，不是协议基础量”

这样才能保持整个 draft 的方法论一致性。

---

### 建议 4：把 `ranking_eligibility` 从 benchmark-execution 对象中解耦

最佳方案是移到 M4。  
如果暂不移动，也至少要补一句强规范：

> `ranking_eligibility` 仅是 benchmark/lane 对治理层的建议信号，最终可见性与分榜资格由 Ranking Policy 决定。

这样可以避免对象边界被未来实现慢慢腐蚀。

---

### 建议 5：新增 `board publication guardrails`

建议在 M6 或 M4 加一节，明确：

- 何时允许显示 rank spread
- 何时允许显示 top-k probability
- paired comparison 的最小 coverage
- exclusion ratio 高到什么程度必须降级展示
- insufficient data 时 UI 必须怎样退化

这会显著降低“伪精确排行榜”的风险。

---

## 六、最终裁定

### 本轮方法论裁定

- **是否通过进入下一轮修订：通过**
- **是否达到满分停止条件：未达到**
- **是否建议直接冻结为 v0.1：不建议**

### 我对当前稿子的定位

这份 draft1 最大的价值，不是它已经“完美”，而是它已经做对了最难的一步：

> **先把对象边界和测量哲学讲清楚，而不是先做 UI、先做总榜、先做营销式分数。**

接下来要补的，不是大改世界观，而是把以下几个“若不钉死就会失真”的点补硬：

1. task disposition
2. pseudo repeated 的 verified 门槛
3. lift 的单分歧义
4. lane 与 ranking policy 的边界
5. 排名发布阈值

如果这 5 条在 draft2 得到修复，我预计：

- M1 基本可以冲到 9–10
- M2 可以上到 9
- M6 有机会进入 9
- 整体 draft2 才有资格开始谈“无 P1”

---

## Reviewer A 一句话结论

> **OHBP draft1 已经具备“正确的方法论方向”，但还没有具备“无歧义统计执行力”；要从好想法升级成高可信协议，下一步必须把分母、随机性门槛、派生指标语义和排名发布阈值全部钉死。**
