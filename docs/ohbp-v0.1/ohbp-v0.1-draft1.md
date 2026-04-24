# OHBP / harnessbench 协议草案 v0.1-draft1

> 状态：第一轮模块设计已汇总，待进入第一轮独立审核  
> 日期：2026-04-20  
> 目标：产出一套开放、版本化、可复现、可审计的 **Open Harness Benchmark Protocol**

---

## 0. 本稿定位

这不是“一个网站 PRD”，也不是“一个 benchmark 内容集”。  
本稿定义的是一个协议草案，用来支持：

- 用统一 CLI 或 wrapper 执行 benchmark
- 为任意 harness / agent / scaffold 产出结构化证据包
- 把结果按信任等级纳入平台
- 在 **固定模型，只换 harness** 等可比切片内形成高可信结论

本稿遵循一个总原则：

> **证据优先于分数；协议优先于产品；分层信任优先于单一总榜。**

---

## 1. 协议要解决的问题

OHBP 试图解决的不是“如何再做一个排行榜页面”，而是：

1. 现有结果经常把 **model / harness / prompt / tool / benchmark-tuning** 混在一起
2. 很多结果只有摘要分，缺少 **可审计证据包**
3. 自报结果极易被 **best-of-N、人工干预、缓存答案、伪造 trace、环境作弊** 污染
4. benchmark 本身会 **老化、污染、失真**
5. 单次 run 波动很大，容易把“运气好的一次”误当成能力

因此，OHBP v0.1 的回答不是“神圣总榜”，而是：

- 定义统一对象边界
- 定义统一执行与证据合同
- 定义分层信任与治理体系
- 定义多维指标与不确定性披露

---

## 2. v0.1 的目标与非目标

### 2.1 目标

OHBP v0.1 目标是定义一个 **最小可行协议骨架**，支持从本地运行、证据打包、上传、复验到分层展示的闭环。

核心目标：

1. 定义统一协议对象：
   - Benchmark Card
   - Task Package
   - Execution Contract
   - Run Manifest
   - Evidence Bundle
   - Verification Tier
   - Ranking Policy

2. 让“可审计证据”成为一等公民

3. 支持三类关键比较视角：
   - 固定模型，只换 harness
   - 固定 harness，只换模型
   - model × harness 适配矩阵

4. 内建分层信任：
   - Community
   - Reproduced
   - Verified

5. 兼容：
   - preset
   - custom adapter
   - 多模型提供商
   - 多 agent / harness 生态

6. 将 benchmark health 纳入协议层，而非事后补丁

### 2.2 非目标

v0.1 明确不做：

1. 不定义唯一正确的全球总榜
2. 不统一所有 benchmark 的具体题目内容
3. 不规定 harness 内部架构必须怎么设计
4. 不承诺一次性解决全部作弊问题
5. 不把产品页面和运营策略写死进协议
6. 不强制公开全部私有 prompt 与商业代码

---

## 3. 核心设计原则

OHBP v0.1 以以下原则为准：

1. **Evidence over Claims**
2. **Protocol over Product**
3. **Measurement separated from Policy**
4. **Clear Object Boundaries**
5. **Version Everything Critical**
6. **Layered Trust over Single Truth**
7. **Deterministic First**
8. **Compare Like with Like**
9. **Benchmark Health is First-class**
10. **MVP-first**
11. **Ecosystem Neutrality**
12. **Disputable / Revisable / Archivable**

---

## 4. 对象边界

OHBP 明确区分以下对象：

### 4.1 Protocol
负责定义：
- 对象
- 工作流
- 最低字段要求
- 信任分层

### 4.2 Benchmark
负责定义：
- 测什么
- 任务集合
- evaluator
- 健康元数据

### 4.3 Harness
负责定义：
- 如何在合同内执行任务
- 如何产出结果与证据

### 4.4 Ranking Policy
负责定义：
- 哪些结果进哪张榜
- 如何过滤
- 如何聚合
- 如何展示

关键边界：

- `Protocol ≠ Benchmark`
- `Benchmark ≠ Ranking Policy`
- `Harness ≠ 上传者身份`
- `Ranking Policy ≠ Scientific Truth`

对象依赖链为：

```text
Benchmark + Execution Contract + Harness + Runtime Context
  -> Run
  -> Evidence Bundle
  -> Verification Tier
  -> Ranking Policy Consumption
```

---

## 5. 协议对象总览

### 5.1 Benchmark & Execution 层

该层定义五个对象：

1. **Benchmark Card**
2. **Task Package**
3. **Execution Contract**
4. **Lane**
5. **Benchmark Health Record**

最小可比条件：

- `benchmark_id + benchmark_version`
- `task_package_digest`
- `execution_contract_digest`
- `lane_id`

若缺任一对象，结果不得视为“可比较”。

### 5.2 Run Data & Evidence 层

该层定义：

- `study_id`
- `run_group_id`
- `attempt_id`
- `bundle_id`

并规定：

> **一个 bundle 对应一次 attempt；多次重复运行通过 run_group_id 关联，不在 v0.1 混装。**

标准 bundle 至少包含：

```text
manifest.json
aggregate.json
task-results.ndjson
checksums.sha256
artifact-manifest.json
trace/
reports/
artifacts/
payloads/
```

增强项可包括：

- `redactions.json`
- `attestation.json`
- Merkle root
- 链式事件哈希

---

## 6. CLI-first 执行层

OHBP v0.1 明确：

> **CLI 是标准执行层；SKILL / plugin / slash command 只是 wrapper。**

Canonical command：

```bash
harnessbench
```

可选别名：

```bash
hb
```

核心命令族：

- `doctor`
- `init`
- `run`
- `pack`
- `upload`
- `replay`
- `reproduce`
- `inspect`
- `preset list`
- `adapter init`
- `adapter validate`

生命周期必须等价于：

```text
init -> run -> pack -> upload
```

一键命令可以存在，但不能跳过中间证据落盘。

### 6.1 preset 与 custom adapter

- preset：降低上手成本
- custom adapter：保证开放性

二者最终都必须解析成：

- adapter 配置
- adapter digest
- launcher 定义
- capability 声明

### 6.2 Custom Adapter 最小合同

CLI 传入：

- `OHBP_STUDY_ID`
- `OHBP_RUN_GROUP_ID`
- `OHBP_ATTEMPT_ID`
- `OHBP_BENCHMARK_MANIFEST`
- `OHBP_EXECUTION_CONTRACT`
- `OHBP_TASK_PACKAGE`
- `OHBP_OUT_DIR`
- `OHBP_WORK_DIR`
- `OHBP_SEED`
- `OHBP_MODEL_REF`

adapter 至少产出：

- `result.json`
- `trace.jsonl`
- `artifacts/`
- `stdout.log`
- `stderr.log`

v0.1 规范执行粒度为：

> **一个 adapter 调用处理一个 task × seed × attempt**

---

## 7. Verification Tiers 与治理

OHBP v0.1 不允许把所有上传结果混成一张榜。  
规范三层信任体系：

### 7.1 Community

- 用户自管环境运行
- 平台只做基础 schema / hash 检查
- 可以公开展示
- **不得进入默认官方主榜**

### 7.2 Reproduced

满足：

- 完整 run-group
- 全 attempts 披露
- 平台 replay / rescore 成功
- 有独立复现或等价复验支撑
- 默认至少 **3 runs**

### 7.3 Verified

满足：

- 至少 **5 runs**
- 平台控制环境复跑 / 官方评分 / 抽样复跑
- 完整证据链
- 通过风险审计

默认官方主榜只显示：

- `Verified`
- `autonomous`
- `benchmark_tuned = false`
- `fixed-model -> compare harness`

---

## 8. Ranking Policy

OHBP v0.1 **不定义神圣全局总榜**。  
排名只在 `board slice` 内成立。

一个切片至少由以下维度唯一确定：

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

1. `fixed-model -> compare harness`
2. `fixed-harness -> compare model`
3. `system combination board`

规范要求：

- 禁止把不同 trust tier 混榜
- 禁止把 benchmark-tuned 与 general-purpose 混榜
- 禁止把 single-run best score 当作正式排名依据
- 公开榜必须显示不确定性，而不是假装差距绝对精确

---

## 9. 指标体系与不确定性

OHBP v0.1 采用五个核心指标族：

1. **Effectiveness**
2. **Efficiency**
3. **Reliability**
4. **Recovery / Robustness**
5. **Reproducibility / Transparency**

首页默认建议展示：

- success
- cost
- latency
- stability
- reproducibility

### 9.1 run group 是最小比较单位

不是单次 run 排榜，而是拿相同配置下的一组 repeated runs 比较。

重复运行最低门槛：

- `self-reported`: 1 run
- `reproduced`: 3 runs
- `verified`: 5 runs
- `flagship claim`: 10 runs

### 9.2 不确定性披露

默认展示：

- point estimate
- `n_runs`
- `n_tasks`
- 95% CI 或 IQR
- `rank_spread`

排序不再假装线性确定，而要支持：

- `rank_p05`
- `rank_p50`
- `rank_p95`
- `top1_probability`
- `top3_probability`

### 9.3 model 与 harness 分离

平台默认应提供三张表：

1. 固定模型，只换 harness
2. 固定 harness，只换模型
3. model × harness 适配矩阵

并支持：

- `harness_lift`
- `model_lift`

### 9.4 Ablation

对模块归因，推荐 canonical ablations：

- `full`
- `thin_baseline`
- `no_memory`
- `no_planner`
- `no_reviewer`
- `single_agent_only`
- `no_persistent_memory`
- `no_compression`

至少报告：

- `delta_success`
- `delta_cost`
- `delta_latency`
- `delta_timeout`
- `delta_crash`
- 对应 95% CI

---

## 10. Benchmark Health 是协议组成部分

每个 benchmark / lane / split 都应带健康元数据：

- `task_validity`
- `outcome_validity`
- `environment_stability`
- `freshness_tier`
- `contamination_tier`
- `reporting_completeness`
- `last_audit_at`
- `health_snapshot_version`

建议 freshness：

- `fresh`
- `active`
- `aging`
- `legacy`

建议 contamination：

- `low`
- `medium`
- `high`

这些字段必须：

- 版本化
- 可追溯
- 不可静默覆盖历史

---

## 11. v0.1 推荐起手形态

产品顺序：

1. 协议
2. CLI
3. 上传 API
4. 薄网站
5. 平台抽样复跑

V1 推荐先只上三条 lane：

1. `core-lite-v1`
2. `terminal-lite-v1`
3. `workflow-clean-v1`

不建议一开始就把以下作为旗舰主榜：

- 完整 WebArena
- OSWorld
- MLE-bench
- TheAgentCompany
- SWE-bench Verified 作为前沿主打 benchmark

---

## 12. 当前待审核问题

以下问题留给下一轮独立审核组重点打分：

1. `adapter.yaml` 字段是否还需更严格
2. connected / offline 与 trust tier 的衔接是否足够硬
3. M3 的完整性增强项哪些应上升为 MUST
4. reproduced 与 verified 的容差规则是否需更明确
5. benchmark health 是否需要单独 snapshot 对象索引
6. 总榜政策是否还需更强地防止“伪科学总榜”误用

---

## 13. 模块文件索引

本 draft1 由以下模块组成：

- `docs/ohbp-v0.1/modules/foundations.md`
- `docs/ohbp-v0.1/modules/benchmark-execution.md`
- `docs/ohbp-v0.1/modules/run-data-evidence.md`
- `docs/ohbp-v0.1/modules/trust-governance-ranking.md`
- `docs/ohbp-v0.1/modules/cli-adapter.md`
- `docs/ohbp-v0.1/modules/metrics-uncertainty.md`

---

## 14. draft1 的一句话定义

> **OHBP / harnessbench v0.1 不是“任意上传分数的平台协议”，而是“任何人都能通过统一 CLI / Adapter 合同产出可审计证据，并被平台按 Community / Reproduced / Verified 分层纳入公共知识库与排行榜”的开放评测协议。**
