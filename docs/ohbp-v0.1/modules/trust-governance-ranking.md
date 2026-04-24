# M4 — Trust / Governance / Ranking（OHBP v0.1）

> 状态：Draft / Normative  
> 模块范围：verification tiers、ranking policy、community / reproduced / verified 分层、audit flow、dispute / invalidation、anti-cheat baseline  
> 依赖关系：  
> - M3 提供 `run manifest`、`evidence bundle`、`trace bundle`、`artifact manifest` 的字段与格式  
> - M6 提供核心指标、重复运行、CI / rank spread、模型 vs harness 分离方法  
> 非目标：  
> - 不在本模块定义 benchmark card 结构（见 M2）  
> - 不在本模块定义 CLI 命令与 adapter 细节（见 M5）  
> - 不在本模块定义完整前端页面信息架构；这里只定义可公开宣称的排名与状态规则

---

## 1. 设计原则

OHBP v0.1 的信任与治理层遵循以下原则：

1. **Evidence > Score**  
   平台信任的是可审计证据链，不是上传者自报的分数摘要。

2. **Tier Separation > Mixed Ranking**  
   不同信任等级的结果必须分层展示，禁止把自报结果直接混入默认官方榜。

3. **Comparable Slices > Global Total Order**  
   排名只在可比切片（same benchmark version, same execution contract family, same trust tier, same policy envelope）内成立，不定义一个放之四海而皆准的全局单榜。

4. **Run-Group > Best Single Run**  
   排名单位是完整 `run-group`（或 `run-set`），不是单次最好成绩。

5. **Auditability > Convenience**  
   允许轻量入口，但进入更高信任等级必须接受更严格的证据、复算和复跑。

6. **Preserve History > Silent Rewrite**  
   争议、纠错、降级、失效都应保留公开记录，不允许静默改榜。

7. **Govern the Benchmark, not only the Submitter**  
   若 benchmark 本身被 exploit、污染、过时或评分器失真，平台必须允许冻结切片、重算榜单、下调 benchmark 健康状态。

---

## 2. 核心对象与术语

### 2.1 Attempt

一次具体执行尝试。通常对应一个 seed、一个任务集合、一个完整执行过程。

### 2.2 Run Group

OHBP 的排名基本单位。`run-group` 是在同一 `benchmark version + execution contract + system fingerprint + policy flags` 下预先声明并执行的一组 attempts。  

一个 `run-group` 至少应包含：

- `study_id`
- `run_group_id`
- 固定的 benchmark / evaluator / runner 标识
- 固定的 harness / model / prompt / rules / memory / tool policy 指纹
- 声明好的 attempts 集合（例如 3 次、5 次）
- 对应的完整 evidence bundle

### 2.3 System Fingerprint

用于识别“被比较对象”的最小指纹。v0.1 建议至少包含：

- `harness_name`
- `harness_version`
- `harness_commit`
- `model_provider`
- `model_name`
- `model_version_or_snapshot`
- `prompt_hash`
- `rules_hash`
- `memory_config_hash`
- `tool_manifest_hash`
- `execution_contract_digest`
- `benchmark_id`
- `benchmark_version`
- `autonomy_mode`
- `benchmark_tuned_flag`

系统指纹不同，则默认视为不同系统，不应合并为同一排行榜行。

### 2.4 Board Slice

一个可比较 leaderboard 切片。v0.1 中，一个切片至少由以下维度唯一确定：

- `benchmark_id`
- `benchmark_version`
- `lane / split class`
- `execution_contract_digest`
- `trust_tier`
- `autonomy_mode`
- `benchmark_tuned_flag`
- `budget_class`
- `comparison_mode`

其中 `comparison_mode` 至少支持：

1. **fixed-model → compare harness**
2. **fixed-harness → compare model**
3. **system combination board（model + harness）**

> 规范性要求：任何公开排名声明都必须指明自己属于哪个 `board slice`。

### 2.5 Publication State

结果在平台上的公开状态，与 trust tier 不同。v0.1 定义：

- `submitted`
- `rejected`
- `published`
- `provisional`
- `disputed`
- `corrected`
- `invalidated`
- `archived`

---

## 3. Verification Tiers（验证分层）

OHBP v0.1 采用三层公开信任体系：**Community / Reproduced / Verified**。  
这三层是规范性分层，不允许混排为单一官方总榜。

### 3.1 Tier 总览

| Tier | 定义 | 最低要求 | 可进入的榜单 | 可宣称强度 |
|---|---|---|---|---|
| **Community** | 上传者自管环境运行并提交证据包，平台仅做基础校验 | schema 合法、关键 hash 齐全、至少 1 次 attempt、最小证据包存在 | Community Board / Run Explorer | “community-submitted result”，不得宣称为平台验证结论 |
| **Reproduced** | 结果可被平台复算/重放，且有独立复现或等价复验支撑 | 完整 run-group、全 attempts 披露、平台 replay / rescore 成功、默认至少 3 次 attempts、满足容差 | Reproduced Board；可作为 Verified 的候选支撑 | “reproduced under OHBP v0.1”，但不是默认官方主榜结论 |
| **Verified** | 结果由平台控制环境或平台官方评分通道确认，且通过升级审计 | 默认至少 5 次 attempts、平台复跑或 hidden/rotating split 官方评分、完整证据链、通过风险审计 | Official Verified Board（默认主榜） | “officially verified under OHBP v0.1” |

### 3.2 Community Tier（社区层）

Community 允许最低摩擦上传，但不是“随便传个分数”。

**Community 公开的最低要求：**

- 必须提交 `run manifest`
- 必须提交 `aggregate metrics`
- 必须提交 `task-level results`
- 必须提交 `artifact manifest hash`
- 必须声明：
  - `autonomy_mode`
  - `benchmark_tuned_flag`
  - `persistent_memory_enabled`
  - `cache_policy`
  - `human_assistance`
- 必须提供最小 trace 证据：
  - 完整 trace bundle，或
  - 明确标注的 redacted trace bundle + 非公开审计副本

**Community 的限制：**

- 不得进入默认主榜
- 不得与 Reproduced / Verified 混合聚合
- 平台不得把 Community 结果作为“官方推荐结论”引用

### 3.3 Reproduced Tier（可复现层）

Reproduced 表示“这不是单纯自报，平台或独立复现者已经确认它大体可重现”。

**Reproduced 的最低要求：**

1. 完整 `run-group` 上传，而不是单次 best run  
2. 平台已校验所有 preregistered / declared attempts 均已提交  
3. 平台 `rescore` 或 `replay` 成功  
4. 满足以下之一：
   - 独立第三方按同配置复现，结果落在容差内
   - 平台在公开可重放子集上重放成功，结果落在容差内
5. 默认至少 **3 次 attempts**

**Reproduced 的作用：**

- 可进入 `Reproduced Board`
- 可为后续 `Verified` 提供先验支持
- 可作为公开方法学论文或比较分析的次级引用来源

### 3.4 Verified Tier（官方验证层）

Verified 是 v0.1 的默认官方结论来源。

**Verified 的最低要求：**

1. 满足 Reproduced 的全部要求  
2. 默认至少 **5 次 attempts**  
3. 满足以下之一：
   - 平台官方 runner 在平台控制环境中执行完整评测
   - 用户提交预测/轨迹，分数由平台端官方 evaluator / hidden split 通道计算
   - 平台对高影响结果进行抽样复跑并通过
4. 通过平台风险审计与反作弊基线检查
5. 未处于 `disputed` / `invalidated` 状态

**Verified 的特权与义务：**

- 进入默认官方主榜
- 允许被平台作为“当前官方结论”引用
- 必须接受更严格的后续抽检、重跑与争议审查

### 3.5 非规范扩展：Attestation Flag

v0.1 不把 `attested` 定义为独立公开 trust tier，但允许实现层增加附加标记，例如：

- `official_runner_attested`
- `tee_attested`
- `signed_trace`

这些标记可提高审计优先级或降低风险分，但**不能单独替代 Reproduced / Verified**。

---

## 4. Ranking Policy（排名政策）

### 4.1 排名的基本立场

OHBP v0.1 **不定义单一、跨切片、跨信任等级、跨 benchmark 的神圣总榜**。  
排名只在 `board slice` 内成立。

### 4.2 官方默认榜单

平台的默认官方榜单必须满足：

- `trust_tier = Verified`
- `autonomy_mode = autonomous`
- `benchmark_tuned_flag = false`（默认通用榜）
- `comparison_mode = fixed-model → compare harness`

> 这条规则是为了把“模型贡献”和“harness 贡献”拆开，避免平台退化为模型榜。

### 4.3 强制分榜维度

以下维度在 v0.1 中必须分开，**不得混榜**：

1. **Trust Tier**  
   Community / Reproduced / Verified 必须分开

2. **Autonomy Mode**  
   `autonomous` / `human-assisted` / `approval-only` / `interactive`

3. **Benchmark Tuning Status**  
   `benchmark_tuned = true` 与 `false` 必须分开

4. **Benchmark Version / Execution Contract**  
   不同 benchmark version、不同 evaluator、不同 execution contract 不可直接混排

5. **Comparison Mode**  
   fixed-model vs fixed-harness vs combination 不得混淆

### 4.4 排名单位：Run Group，不是截图成绩

公开排名必须以完整 `run-group` 为准，而不是：

- 单次最好 run
- 人工挑选的 showcase run
- 只上传成功样本的局部结果

**规范性要求：**

- `run-group` 必须披露 attempts 总数
- 排名依据必须来自整个 `run-group` 的聚合结果
- 平台不得按 `max(score)` 进行官方排名

### 4.5 排名显示：排名带不确定性，不伪装成精确序

排名展示必须至少包含：

- 主效果指标（由 M6 定义，通常为 success rate / task score）
- 95% CI 或等价不确定性区间
- rank spread / rank band
- attempts 数
- 独立 submitter 支持数（如适用）
- cost 与 latency 的展示指标
- `last_audited_at`
- `dispute_status`

**规范性要求：**

- 当两条结果的主效果指标在统计上难以区分时，平台应展示 **rank band** 或共享排名区间
- 平台不得在 UI 上暗示不存在的精确差距

### 4.6 排名排序规则（公开切片内）

v0.1 的公开排序政策如下：

1. **Primary order**：按该切片的主效果指标排序（见 M6）  
2. **If statistically indistinguishable**：进入相同 rank band  
3. **Deterministic UI tie-breaker only**：  
   - 更低 `median cost`
   - 更低 `p95 latency`
   - 更早 `verified_at`
   - 更小 `run_group_id`（仅为稳定 UI）

> 注意：tie-breaker 只用于稳定列表顺序，不应被当作强因果或强优劣结论。

### 4.7 System View 与 Run View

v0.1 建议平台同时支持两种视图：

1. **Run View**  
   每个 `run-group` 独立显示，适合审计与细查

2. **System View**  
   以 `system fingerprint` 聚合展示“某一配置”的代表成绩

**System View 的保守规则：**

- 默认只选择一个“canonical reference run-group”作为主分数来源
- 额外的 reproduced / verified run-groups 不直接叠加成更高分，而是贡献：
  - `support_count`
  - `independent_submitter_count`
  - `agreement_rate`
- 同一组织或关联账户的多次重复提交，默认不增加独立支持数

这样做的目的，是防止通过大量重复上传来“刷统计权重”。

### 4.8 Composite Index 的边界

平台未来可以提供产品化综合指数，但在 v0.1 中：

- Composite index 不是规范核心
- 若实现，必须：
  - 明示权重
  - 提供 raw metrics
  - 提供 normalized metrics
  - 不得替代基础分榜

---

## 5. Audit Flow（审计流程）

OHBP v0.1 的审计流程分为 **准入审计、复算/重放审计、升级审计、持续审计** 四段。

### 5.1 Step 0 — Registration / Declaration

对于 Reproduced 与 Verified 候选提交，平台应要求在运行前声明：

- `study_id`
- `run_group_id`
- benchmark / evaluator / runner 版本
- seed 或 attempt 计划
- budget cap
- tool/network policy
- 关键 policy flags

Community 层可以不强制 preregistration，但进入更高等级时应补齐声明链。

### 5.2 Step 1 — Intake Validation

平台自动检查：

- schema 是否合法
- 必需字段是否齐全
- hash / digest 是否存在且格式正确
- attempt 数量是否满足 tier 最低要求
- 是否提交了所有声明过的 attempts
- `autonomy_mode`、`benchmark_tuned_flag`、`human_assistance` 是否已声明

未通过者：

- 可被拒绝公开（`rejected`）
- 或降级为更低 tier

### 5.3 Step 2 — Integrity Screening

平台对 bundle 执行完整性与异常扫描，包括但不限于：

- 重复 trace / 重复 outputs 检测
- cost / latency / token 使用的异常值检测
- 未声明缓存、未声明外部知识库的痕迹
- suspicious exact-match 模式
- benchmark 泄漏/答案缓存特征
- 环境摘要与执行合同不匹配
- 人工干预痕迹与 `autonomy_mode` 不一致

任一高风险命中时，结果进入 `provisional` 或 `disputed` 阶段，不得直接升入 Verified。

### 5.4 Step 3 — Rescore / Replay

平台必须尽量不相信用户计算出的最终分数，而是以官方 evaluator 为准：

- 对 deterministic benchmarks：平台重新 `rescore`
- 对 browser / workflow benchmarks：平台基于 trace / HAR / network capture `replay`
- 对 hidden split：只接受平台端官方评分

如果平台无法复算/重放：

- 不得进入 Reproduced / Verified
- 最多保留在 Community

### 5.5 Step 4 — Escalation Audit

以下情况必须触发升级审计：

- 冲进前列或对榜单名次有显著影响
- 与历史成绩相比跃升异常
- 与同 slice 的成本/时延分布严重偏离
- 被举报或被 anomaly detector 命中
- benchmark 本身近期被发现存在 exploit 风险

升级审计可包括：

- 平台抽样复跑
- 独立 reproducer 复现
- 要求补交未公开审计副本
- 手工比对关键任务的 trace 与 outputs

### 5.6 Step 5 — Publication Decision

审计后的决策包括：

- `publish as Community`
- `promote to Reproduced`
- `promote to Verified`
- `downgrade`
- `hold as provisional`
- `reject`
- `open dispute`

所有升级、降级、纠错都应保留审计记录。

### 5.7 Step 6 — Continuous Monitoring

结果一旦公开，不代表永久稳定。平台应持续监控：

- benchmark exploit 新证据
- 重复复现失败
- benchmark contamination / freshness 变化
- 新的作弊模式

平台有权在后续：

- 重跑
- 降级
- invalidation
- 冻结整个 benchmark slice

---

## 6. Dispute / Invalidation（争议与失效）

### 6.1 争议触发源

争议可由以下主体触发：

- 平台自动检测系统
- 平台审核人员
- 提交者本人（申请纠错）
- 独立复现者
- 公开用户举报
- benchmark 维护方

### 6.2 争议类型

v0.1 至少支持以下 dispute types：

- `evaluator_bug`
- `metadata_mismatch`
- `incomplete_disclosure`
- `human_intervention_misclassified`
- `benchmark_tuning_misclassified`
- `trace_or_artifact_integrity`
- `environment_violation`
- `non_reproducibility`
- `benchmark_contamination`
- `reward_hacking / evaluator_exploit`

### 6.3 争议状态机

争议状态建议使用：

- `open`
- `under_review`
- `awaiting_submitter_response`
- `resolved_no_change`
- `resolved_corrected`
- `resolved_downgraded`
- `resolved_invalidated`
- `benchmark_frozen`

### 6.4 争议期间的榜单策略

结果进入争议流程后：

- 可继续公开，但必须显示 `disputed` 标记
- 若影响主榜核心结论，平台可临时冻结该行排名
- 高风险争议下，平台可先从默认官方榜隐藏，待审后恢复或失效

### 6.5 Invalidation（失效）

以下情况可导致 invalidation：

1. 发现关键元数据虚假或缺失  
2. 发现未披露的人为干预  
3. 发现 benchmark 答案缓存 / 泄漏 / exploit  
4. 平台复跑无法达到容差要求  
5. 发现 benchmark 或 evaluator 存在影响排名结论的系统性缺陷  

### 6.6 Invalidation 后的处理

失效后平台应：

- 把结果状态改为 `invalidated`
- 从对应官方榜单移除
- 保留公开审计记录与原因说明
- 尽量保留证据包引用（若无安全/隐私阻碍）
- 如问题源于 benchmark / evaluator，而非提交者作弊，应同时标记 benchmark issue

### 6.7 Correction（纠错）与 Reinstatement（恢复）

如果问题是可纠正的：

- 平台可执行 `corrected` 重算
- 纠错后的结果必须生成新的 audit record
- 原始结果不得静默覆盖

如果争议被证明不成立，可恢复到原 tier，但应保留完整 docket 历史。

---

## 7. Anti-Cheat Baseline（反作弊基线）

v0.1 的反作弊基线不是“保证绝对安全”，而是规定**最低必需控制**。  
benchmark-specific module 可以在此基础上进一步加严。

### 7.1 威胁模型与最低控制

| 威胁 | 最低必需控制 | 额外建议控制 |
|---|---|---|
| **Best-of-N / 选择性上报** | Reproduced / Verified 必须以 `run-group` 提交；必须披露全部 attempts；不得以 best run 排名 | preregistration；平台端 attempt count 校验 |
| **隐藏人工干预** | 必须声明 `autonomy_mode` 与 `human_assistance`；人工辅助与全自动必须分榜 | 记录 TTY / approval / editor interaction log |
| **Benchmark tuning 伪装成通用能力** | 必须声明 `benchmark_tuned_flag` 与 `benchmark_specific`； tuned 与 general-purpose 分榜 | hidden / rotating split；跨 benchmark transfer check |
| **缓存答案 / 持久记忆污染** | 必须声明 `cache_policy`、`persistent_memory_enabled`、`memory_scope` | run-id 命名空间隔离缓存；canary / honeytoken tasks |
| **伪造 trace / 伪造 score** | 平台必须 rescore / replay；关键 artifact 必须有 hash manifest | 链式 hash trace；签名 runner / attestation |
| **环境作弊** | 必须记录 `execution_contract_digest`、`container_digest`、`network_policy_digest` | Verified 使用 hermetic environment / allowlist proxy |
| **Sybil / 重复账号刷支持数** | 独立 submitter 需按组织归并；同一关联实体不重复计独立支持数 | 组织认证、公开关联声明、速率限制 |
| **Evaluator exploit / reward hacking** | 平台保留审计与 invalidation 权利；发现 exploit 可冻结榜单切片 | 对 top rows 做对抗式复跑；建立 exploit 回归测试 |

### 7.2 v0.1 的硬性底线（MUST）

以下条款属于 OHBP v0.1 的硬性底线：

1. **Self-reported / Community 结果不得进入默认官方主榜**
2. **官方排名不得按 best single run 排序**
3. **Reproduced / Verified 必须提交完整 run-group，并披露全部 attempts**
4. **官方结果必须可以被平台 rescore / replay / rerun 之一确认**
5. **不同 trust tier 不得混榜**
6. **不同 autonomy mode 不得混榜**
7. **benchmark-tuned 与 general-purpose 不得混榜**
8. **争议与 invalidation 必须保留公开历史，不得静默删改**

### 7.3 v0.1 的强建议（SHOULD）

1. Top-ranked rows 应定期抽样复跑  
2. Verified 应优先使用平台控制环境  
3. Browser / workflow benchmarks 应保留 network traces 或等价 replay 证据  
4. 平台应维护 anomaly detection 与 benchmark exploit watchlist  
5. 允许公开 artifacts 的结果应获得更高透明度标识，但不应仅因公开与否决定 trust tier

---

## 8. 与 Benchmark Health 的联动治理

Trust / Governance 模块必须与 benchmark health 联动，而不是假设 benchmark 永远有效。

### 8.1 触发 benchmark-level 动作的条件

以下情况应触发 benchmark 级别治理：

- 新发现的 evaluator bug 影响名次
- benchmark 被大规模 exploit
- hidden split 或公开样本污染严重
- 结果与真实任务外推性明显脱节

### 8.2 平台可采取的 benchmark-level 动作

- 将某个 `board slice` 标为 `watchlist`
- 冻结该切片的新 Verified 结论
- 对既有结果统一降级为 `legacy`
- 重新评分并生成 changelog
- 下线该 benchmark 作为默认官方结论来源

> 该机制是为了避免“结果看起来很正式，但 benchmark 本身已经坏了”。

---

## 9. 规范性总结（便于审核）

### MUST

- 必须采用 Community / Reproduced / Verified 三层公开信任体系
- 默认官方主榜必须只展示 Verified
- 排名单位必须是完整 run-group
- 必须分离 autonomy mode、benchmark tuning status、trust tier
- 必须提供 dispute / invalidation 流程
- 必须允许后续 re-audit 与 benchmark-level freeze

### SHOULD

- Reproduced 默认至少 3 次 attempts
- Verified 默认至少 5 次 attempts
- 结果展示应包含 CI / rank band / audit metadata
- 平台应尽量用 rescore / replay 替代相信用户自算分数
- 平台应在 System View 中采用保守聚合，防止重复上传刷支持权重

### MAY

- 可在实现层增加 attestation flag
- 可增加更多 trust 子状态，但不得削弱三层公开分离
- 可增加 composite index，但不得替代基础分榜与 raw metrics

---

## 10. 本模块解决的问题 / 明确不解决的问题

### 已解决

- 如何把自报结果与官方结论分层
- 默认主榜为何只能看 Verified
- 排名为什么不能按 best-of-N
- 争议、纠错、失效如何记录
- benchmark exploit / contamination 被发现后如何治理

### 暂不解决

- M6 中具体的 CI 计算公式与 rank spread 算法
- M3 中 evidence bundle 的字段级 schema
- M5 中 CLI / upload / replay 的具体命令接口
- 产品层的 UI 文案与视觉展示

---

## 11. Worker 4 设计结论

本模块对 OHBP v0.1 的核心贡献是：

1. 把“可信度”定义为 **分层制度**，而不是上传者自报  
2. 把“排名”定义为 **切片内的证据排序**，而不是神圣总榜  
3. 把“平台治理”定义为 **持续审计 + dispute / invalidation + benchmark freeze**  
4. 把“反作弊”定义为 **最低必需控制集**，以便后续 benchmark-specific 模块继续加严

这为后续 M3（证据结构）、M5（上传/复验链路）、M6（不确定性与排名算法）提供了清晰的治理边界。
