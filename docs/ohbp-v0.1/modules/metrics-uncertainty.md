# M6 — Metrics & Uncertainty（OHBP v0.1）

> 状态：Worker 6 模块草案  
> 范围：核心指标族、重复运行、置信区间与 rank spread、model vs harness 分离、ablation、benchmark validity / freshness / contamination 的统计展示

---

## 1. 模块目标与边界

本模块定义 OHBP v0.1 中与**结果度量、重复实验、不确定性披露、模块归因、benchmark 健康展示**相关的最小规范。

本模块**解决**的问题：

1. 平台应该默认公开哪些指标，而不是只给一个总分。
2. 单次 run 如何升级为可比较的 run group。
3. 榜单如何展示 CI、rank spread 与重复运行稳定性。
4. 如何在统计口径上区分 **model 贡献** 与 **harness 贡献**。
5. 如何把 memory / planner / reviewer / multi-agent 等模块能力转化为 **可量化 ablation 证据**。
6. benchmark 的 validity / freshness / contamination 应如何作为**独立统计层**展示，而不是偷偷混进 agent 分数。

本模块**不解决**的问题：

1. 不定义具体 benchmark 任务内容；该职责属于 Benchmark & Execution 模块。
2. 不定义完整 JSON Schema；该模块只提出必须被其他模块承载的统计字段。
3. 不规定产品总榜权重；如需总分，属于 Ranking Policy 的显式产品政策，不得伪装成科学真理。

---

## 2. 设计原则

### 2.1 原始指标优先于总分

OHBP v0.1 默认公开的是**分项指标族**，而不是神圣单分。  
任何综合分数都必须：

- 明确权重；
- 明确适用范围；
- 保留 raw metrics 与 uncertainty 视图；
- 不覆盖 benchmark health 风险提示。

### 2.2 所有公开比较都必须绑定不确定性

任何公开的“某系统优于某系统”的主张，必须同时给出：

- point estimate；
- sample size / run count；
- uncertainty（CI、IQR、std_err 或 rank spread）；
- 比较是否为 paired comparison。

### 2.3 不把 benchmark 健康问题混入 harness 原始得分

benchmark 的 validity / freshness / contamination 属于**测量环境属性**，不是 agent 能力本身。  
因此：

- 原始 agent 分数与 benchmark health 必须分开展示；
- benchmark health 可影响榜单可见性、默认过滤与解释语境；
- benchmark health 不应静默折算进 harness 分数。

### 2.4 以 run group 为最小比较单位

单个 run 只能作为观察值；**run group** 才是排行榜与比较分析的基本单位。  
run group 指：在相同 benchmark 版本、evaluator、harness 版本、model snapshot、budget policy、tool policy、prompt/rules/config 哈希下，按预注册 seed set 执行的一组重复运行。

---

## 3. 测量层级

为避免把不同层级数据混在一起，OHBP v0.1 采用以下统计层级：

1. **Task Attempt**：单 task、单次尝试的最小观测。
2. **Run**：一组 task attempts 构成的一次完整执行，通常对应一个 seed / attempt_id。
3. **Run Group**：同配置下多次重复运行的集合，是默认对外比较单位。
4. **Leaderboard Slice**：在固定 benchmark、固定比较条件下的多个 run groups 的排序视图。
5. **Benchmark Health Snapshot**：某 benchmark 在特定时间点的健康审计快照。

### 3.1 规范要求

- **MUST**：所有公开榜单至少以 run group 为单位展示。
- **MUST**：单 run 若进入页面展示，必须显式标注“single-run / non-ranked”或相应信任等级。
- **SHOULD**：所有 leaderboard slice 都提供切换到 task-level evidence 与 run-level evidence 的入口。

---

## 4. 核心指标族

OHBP v0.1 建议把平台默认指标划分为 5 个族；主界面默认展示其中 4 个：**success、cost、latency、stability / reproducibility**。

| 指标族 | 目的 | 主指标（v0.1） | 推荐聚合 | 说明 |
|---|---|---|---|---|
| Effectiveness（有效性） | 任务是否做成 | `task_success_rate`、`task_pass_rate`、`partial_completion_rate`（仅限 deterministic rubric） | mean / proportion + 95% CI | 主指标族；partial credit 必须由 benchmark card 预定义 |
| Efficiency（效率） | 代价与速度 | `cost_usd_median`、`latency_p50_sec`、`latency_p95_sec`、`tokens_in_median`、`tokens_out_median`、`tool_calls_median` | median + IQR；必要时 bootstrap CI | 不同 provider token 口径可能不完全一致，因此 token 指标只作辅助解释 |
| Reliability（稳定性） | 重复运行是否稳 | `success_std_err`、`run_to_run_variance`、`timeout_rate`、`crash_rate` | proportion / variance + CI | 不建议用单一“稳定性神分”；优先公开原始稳定性指标 |
| Recovery / Robustness（恢复与鲁棒性） | 异常情况下是否能恢复 | `resume_success_rate`、`fault_recovery_rate`、`degraded_mode_success_rate` | proportion + CI | 仅对定义了 fault injection 或 resume protocol 的 benchmark lane 生效 |
| Reproducibility / Transparency（复现与透明度） | 结果是否可复核 | `verification_tier`、`artifact_completeness_rate`、`rerun_agreement_rate` | categorical + proportion | 该族影响可信度解释，不与 success 混为一体 |

### 4.1 指标定义约束

#### A. Effectiveness

- `task_success_rate = succeeded_tasks / eligible_tasks`
- `partial_completion_rate` 仅在 benchmark card 明确给出 deterministic partial rubric 时允许进入公开展示。
- 如 benchmark 同时存在 “严格 pass” 与 “实用完成度”，二者必须分列显示，不得合并成隐式单分。

#### B. Efficiency

- 成本默认以 **observed cost** 为准，而不是理论 list price。
- 价格快照必须与 run manifest 绑定，避免价格变动污染历史比较。
- 对高偏态指标（成本、时延、token），v0.1 默认以 **median + IQR** 作为主展示口径。

#### C. Reliability

- `timeout_rate` 与 `crash_rate` 必须与 success 分开展示。
- `success_std_err` 应来自 repeated runs，而不是 task 内部 step 级别噪声。

#### D. Recovery / Robustness

- 仅当 benchmark card 或 execution contract 定义了 resume / injected fault / degraded mode 时，方可计算对应指标。
- 无定义的 lane 不应伪造“鲁棒性分数”。

#### E. Reproducibility / Transparency

- `verification_tier` 至少应区分：`self_reported`、`reproduced`、`verified`。
- `rerun_agreement_rate` 仅在存在官方复跑或第三方复跑时统计。

---

## 5. Repeated Runs（重复运行协议）

### 5.1 核心原则

OHBP v0.1 明确反对用**单次最佳 run**代表系统能力。  
排名与比较应建立在**预注册 run group**之上。

### 5.2 Run group 最小约束

构成同一 run group 的所有 runs，以下字段必须一致：

- `benchmark_id`
- `benchmark_version`
- `split`
- `evaluator_digest`
- `runner_digest`
- `harness_name`
- `harness_version`
- `harness_commit`
- `model_provider`
- `model_name`
- `model_version / snapshot`
- `prompt_hash`
- `rules_hash`
- `memory_config_hash`
- `tool_policy_id`
- `budget_policy_id`
- `timeout_policy_id`

允许变化的字段仅包括：

- `attempt_id`
- `seed` 或 `attempt_index`
- 与执行随机性相关但已预注册的有限字段

### 5.3 最低重复次数

OHBP v0.1 建议采用以下最低门槛：

| 层级 | 最低 run 数 | 用途 |
|---|---:|---|
| Self-reported | 1 | 社区观察层，不进入官方主榜 |
| Reproduced | 3 | 初步公开比较、副榜或研究视图 |
| Verified | 5 | 官方主榜默认最低门槛 |
| Flagship claim / 白皮书 | 10（全量或代表性子集） | 用于高置信度对外宣称 |

### 5.4 必须上传全量 attempts

- **MUST**：一旦 run group 预注册了 seed set，就必须上传该 run group 的**全量 attempts**。
- **MUST NOT**：主榜不得按 `best_of_k` 排序。
- **MAY**：若平台允许 `curated_best_of_k` 或 `human_assisted` 赛道，必须显式分榜，并上传全部 rollout。

### 5.5 Seed 与随机性

- **MUST**：若底层 provider 支持固定 seed，则必须记录 `seed`。
- **SHOULD**：若底层 provider 不支持真实 seed，至少记录 `attempt_index`、provider 版本、请求时间窗与其他可追溯随机性元数据。
- **MUST**：榜单页必须区分 “true seeded” 与 “pseudo repeated” 两类重复运行。

### 5.6 Subset 使用限制

若 benchmark 因成本过高使用 subset：

- subset 必须在 benchmark card 中被命名并版本化；
- subset 结果不得与 full benchmark 结果混排；
- 页面必须明确显示 `subset_name` 与 `subset_size`。

---

## 6. 不确定性：CI、IQR、StdErr、Rank Spread

### 6.1 默认统计展示规则

OHBP v0.1 建议平台默认同时展示：

- point estimate；
- `n_runs`；
- `n_tasks`；
- 95% CI 或 IQR；
- 若参与排序，则展示 `rank_spread`。

### 6.2 成功率类指标

适用指标：

- `task_success_rate`
- `task_pass_rate`
- `partial_completion_rate`
- `timeout_rate`
- `crash_rate`

推荐做法：

1. **默认 95% CI**
2. 对 leaderboard 比较使用**按 task 聚类的 bootstrap**或 paired bootstrap
3. 不把 task 内部 step 当成独立样本

原因：task-level 难度差异远大于 step-level 噪声，按 step 计样本会虚高置信度。

### 6.3 成本 / 时延 / token 类指标

推荐口径：

- 主展示：`median + IQR`
- 若需 CI：使用 bootstrap median CI

不推荐把高偏态指标默认用 mean 作为榜单首页唯一口径，因为极少数长尾 run 会严重扭曲解释。

### 6.4 差值比较（Delta）

当平台声明 “A 比 B 强” 时，必须优先报告：

- `delta_success`
- `delta_cost`
- `delta_latency`
- `delta_timeout`
- 各自的不确定性区间

推荐使用：

- **paired bootstrap**（同 task、同 seed grid）；
- 或 matched comparison（同 benchmark slice、同 repeated-run protocol）。

### 6.5 Rank spread

OHBP v0.1 采用类似 Arena 的思想，但不强制使用 Elo。  
对于 benchmark score 型榜单，rank spread 通过**重复重采样后的排名分布**获得。

推荐公开字段：

- `rank_p50`
- `rank_p05`
- `rank_p95`
- `top1_probability`
- `top3_probability`

推荐解释方式：

- 若 `rank_p05` 到 `rank_p95` 区间较宽，说明该系统的公开名次不稳；
- 若多个系统 rank spread 高度重叠，则应在 UI 上显示“同 tier / 难分先后”，而不是暗示微小差距就是确定排名。

### 6.6 Tie / Tier 机制

OHBP v0.1 **SHOULD** 提供 tier 视图，而不是强迫所有系统形成严格线性排序。  
当以下任一条件成立时，平台应考虑将相邻条目标为同 tier：

- paired delta 的 95% CI 跨越 0；
- rank spread 高度重叠；
- top-k probability 差距极小；
- benchmark slice 样本量尚不足以稳定区分。

---

## 7. Model vs Harness 分离

OHBP v0.1 不把“model + harness 组合分数”误写成“harness 实力”。  
要分离两者，平台至少需要 3 个默认比较视角。

### 7.1 三张默认比较视图

#### View A：固定模型，只换 harness

用于回答：

- 在同样模型条件下，哪个 harness 带来净提升？
- memory / planner / reviewer 等系统工程是否真的创造额外价值？

这是 OHBP 平台的**灵魂主榜**。

#### View B：固定 harness，只换模型

用于回答：

- 某 harness 是否只对特定模型有效？
- 同一 orchestration 策略对不同模型的适配度如何？

#### View C：Model × Harness 适配矩阵

用于回答：

- model 与 harness 的交互项是否显著？
- 是否存在“强模型配弱 harness 反而不如次强模型配好 harness”的情况？

### 7.2 最小统计约束

若要比较 harness 主效应，以下字段必须固定：

- `benchmark_id`
- `benchmark_version`
- `split`
- `model_provider`
- `model_name`
- `model_version`
- `verification_tier`
- `budget_policy_id`
- `tool_policy_id`

若要比较 model 主效应，以下字段必须固定：

- `benchmark_id`
- `benchmark_version`
- `split`
- `harness_name`
- `harness_version`
- `harness_commit`
- `verification_tier`
- `budget_policy_id`
- `tool_policy_id`

### 7.3 推荐衍生指标

#### Harness Lift

相对于同模型下的 thin baseline harness：

`harness_lift = score(harness, model, benchmark) - score(thin_baseline, same_model, same_benchmark)`

#### Model Lift

相对于同 harness 下的 reference model：

`model_lift = score(harness, model, benchmark) - score(same_harness, reference_model, same_benchmark)`

#### Interaction Effect（推荐研究视图）

在研究/分析页中，平台 **SHOULD** 支持以 mixed-effects 或析因设计方式估计 interaction effect，但这不是 v0.1 主榜的硬性前提。

### 7.4 规范要求

- **MUST**：任何 “harness 最强” 的公开主张都必须说明是在哪个 fixed-model slice 下成立。
- **MUST NOT**：将跨模型混合平均后的组合分数直接命名为“纯 harness 排名”。
- **SHOULD**：为每个主要 leaderboard slice 提供 thin baseline 对照。

---

## 8. Ablation（模块归因）

很多 harness 会宣称自己强在：

- memory
- planner
- context compressor
- reviewer loop
- multi-agent orchestration
- rules / guardrails

OHBP v0.1 要求这些主张尽可能转化为**可重复的 ablation 证据**。

### 8.1 何时必须做 ablation

若系统在 profile、论文式说明、官网描述或提交元数据中声称某模块是核心贡献，则：

- **SHOULD**：提供至少一个 matched ablation profile；
- **MUST**：若平台把该模块写进“贡献摘要”或“能力标签”，必须存在对应 ablation 证据或明确标记“未验证”。

### 8.2 Ablation 的配对条件

full system 与 ablated system 的以下条件必须一致：

- benchmark slice
- model snapshot
- harness version（除被拿掉的模块）
- tool policy
- budget cap
- timeout policy
- seed set / repeated-run protocol

### 8.3 推荐 canonical ablations

并非每个 harness 都有全部模块，但平台可推荐如下通用 profile：

- `full`
- `thin_baseline`
- `no_memory`
- `no_planner`
- `no_reviewer`
- `single_agent_only`
- `no_persistent_memory`
- `no_compression`

### 8.4 Ablation 报告字段

每个 ablation 对比至少应公开：

- `delta_success`
- `delta_cost`
- `delta_latency`
- `delta_timeout`
- `delta_crash`
- `delta_rank`（可选）
- 对应 95% CI

### 8.5 推荐展示方式

主张模块价值时，平台不应只展示“成功率增加了 X”。  
应同时展示：

- 成功率增益；
- 成本增益或成本恶化；
- 时延增益或时延恶化；
- 稳定性变化；
- 置信区间是否稳定支持该主张。

例如：

- `memory_gain`
- `planner_overhead`
- `reviewer_net_lift`
- `delegation_roi`

都应定义为**成对差值**，而不是营销标签。

---

## 9. Benchmark Health：Validity / Freshness / Contamination 的统计展示

OHBP v0.1 要求所有公开 benchmark 都有独立的 **Benchmark Health Card / Snapshot**。  
其作用是告诉用户：**这个 benchmark 本身现在值不值得信。**

### 9.1 Health 与 Score 的关系

- benchmark health 是解释层与治理层对象；
- harness score 是性能层对象；
- 二者必须并列呈现，不应静默相加。

### 9.2 最低健康字段

每个 benchmark health snapshot 至少包含：

- `task_validity`
- `outcome_validity`
- `environment_stability`
- `freshness_tier`
- `contamination_tier`
- `reporting_completeness`
- `last_audit_at`
- `health_snapshot_version`

### 9.3 Validity 展示

推荐拆成两类：

#### A. Task Validity

任务是否真的在测目标能力。  
推荐以结构化 rubric 分数或等级显示，并附最近一次审计时间。

#### B. Outcome Validity

评分器是否真的在判断“做对了”。  
推荐披露：

- evaluator 类型（deterministic / hybrid / human-assisted）
- 已知误判率（如有）
- 最近一次评分器修订
- unresolved disputes 数量

### 9.4 Freshness 展示

freshness 不应只看 benchmark 年龄，建议综合以下信号：

1. 距离最近任务刷新或 split 更新的时间；
2. 榜单头部是否接近饱和；
3. 分数分布是否已高度压缩；
4. 新模型 / 新 harness 是否仍能拉开区分度；
5. 是否存在大量已公开解答 / 轨迹 / 派生教程。

OHBP v0.1 推荐 freshness tier：

- `fresh`
- `active`
- `aging`
- `legacy`

并建议公开以下辅助统计：

- `days_since_last_refresh`
- `frontier_median_success`
- `leaderboard_iqr`
- `top10_spread`
- `open_solution_exposure_count`（如可用）

### 9.5 Contamination 展示

污染风险建议使用 tier + 证据计数双重展示。

推荐 contamination tier：

- `low`
- `medium`
- `high`

推荐辅助统计：

- `public_exposure_score`
- `exact_match_anomaly_rate`
- `canary_hit_rate`
- `suspected_leak_incidents`
- `gold_trace_exposure_level`

说明：

- `exact_match_anomaly_rate` 仅作为风险信号，不等于作弊定罪；
- `canary_hit_rate` 与 `suspected_leak_incidents` 应来自专门审计流程；
- 高 contamination 风险会影响结果解读与榜单默认展示优先级，但不应 retroactively 改写历史原始分数。

### 9.6 Health 的默认 UI 行为

OHBP v0.1 建议：

- 默认榜单支持按 `freshness_tier` 与 `contamination_tier` 过滤；
- `aging` / `legacy` benchmark 仍可查询，但需明显标黄或标灰；
- `high contamination` benchmark 结果需附强提示语，不得无标签混入“官方综合视图”。

---

## 10. 推荐统计方法

OHBP v0.1 推荐而非强制以下方法：

| 场景 | 推荐方法 | 说明 |
|---|---|---|
| 成功率 / pass rate CI | task-clustered bootstrap 或 paired bootstrap | 避免把 step 误当独立样本 |
| timeout / crash CI | Wilson 或 clustered bootstrap | 小样本场景更稳健 |
| 成本 / 时延 / token 区间 | median + IQR；需要时 bootstrap median CI | 适合长尾分布 |
| 配对差值（A vs B） | paired bootstrap | 优先在同 task×seed grid 上进行 |
| rank spread | 对 leaderboard slice 反复重采样后取 rank 分布 | 输出 p05/p50/p95 与 top-k 概率 |
| model×harness 研究分析 | mixed-effects / factorial model | 用于研究页，不是 v0.1 主榜硬前提 |

---

## 11. 本模块要求其他模块承载的最小字段

尽管 Schema 不在本模块定义，但为保证统计层可落地，以下字段应由其他模块承载：

### 11.1 Run / Run Group 级字段

- `run_group_id`
- `attempt_id`
- `seed`
- `n_runs`
- `n_tasks`
- `subset_name`（如有）
- `verification_tier`
- `price_snapshot_id`

### 11.2 聚合统计字段

- `task_success_rate`
- `partial_completion_rate`
- `timeout_rate`
- `crash_rate`
- `cost_usd_median`
- `latency_p50_sec`
- `latency_p95_sec`
- `tokens_in_median`
- `tokens_out_median`
- `tool_calls_median`
- `success_std_err`
- `ci_level`
- `ci_lower`
- `ci_upper`

### 11.3 排名与差值字段

- `rank_p05`
- `rank_p50`
- `rank_p95`
- `top1_probability`
- `top3_probability`
- `paired_baseline_ref`
- `delta_success`
- `delta_cost`
- `delta_latency`

### 11.4 Benchmark Health 字段

- `health_snapshot_version`
- `task_validity`
- `outcome_validity`
- `environment_stability`
- `freshness_tier`
- `contamination_tier`
- `reporting_completeness`
- `last_audit_at`

---

## 12. v0.1 最低落地要求（Normative Summary）

### MUST

1. 平台默认以 **run group** 而非单 run 进行排序。
2. 所有公开比较必须同时展示 point estimate、样本量与 uncertainty。
3. Verified 主榜最低应有 **5 runs** 的 repeated-run 证据，或等价严格度的复跑协议。
4. 主榜不得按 `best_of_k` 排名。
5. “harness 排名”必须说明所处的 fixed-model slice，不得把跨模型平均包装成纯 harness 排名。
6. benchmark health 必须独立展示 freshness / contamination / validity 信息。

### SHOULD

1. 首页默认展示 success、cost、latency、stability / reproducibility，而不是单一总分。
2. 榜单默认提供 rank spread 或 tier 视图。
3. 主要 harness 应尽量提供 matched ablation 证据。
4. 平台应提供 thin baseline 作为 harness lift 参考。

### MUST NOT

1. 不得把 benchmark health 静默折算进 agent 原始分数。
2. 不得把自报单次 run 的分数无不确定性地放入官方主榜。
3. 不得在未固定 model snapshot 的情况下宣称“纯 harness 优势”。

---

## 13. 结构性权衡（需后续评审）

本模块明确记录以下 trade-off，避免伪装成“唯一正确答案”：

1. **CI 方法复杂度 vs MVP 可实现性**  
   v0.1 推荐 clustered / paired bootstrap，但实现上可先从清晰的 bootstrap 管线做起，不要求首版就支持所有复杂实验设计。

2. **高质量 repeated runs vs 评测成本**  
   Verified 采用 5 runs 是在可信度与成本之间的折中；高价值结论仍应鼓励 10-run 级别验证。

3. **benchmark health 公开透明 vs 结果可读性**  
   health 信息维度多，UI 上需要控制复杂度；但不能因追求简洁而省略 freshness / contamination 提示。

4. **单一榜单传播性 vs 多视角科学性**  
   多视角会牺牲传播上的简单，但这是避免把产品偏好伪装成科学结论的必要代价。

