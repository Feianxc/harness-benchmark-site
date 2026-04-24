# Reviewer C2（实现 / 协议工程，替补）审核意见

> 审核模式：快速审查 / 最小可用版  
> 审核范围：`task_plan.md`、`rubric.md`、`ohbp-v0.1-draft1.md` 与 `modules/*.md`

## 1. 结论先说

**结论：draft1 的工程方向是对的，但还不适合冻结为正式 v0.1；建议直接进入 draft2 修订。**

我从实现 / 协议工程角度的判断是：

- **未发现 P0**
- **发现 4 个主要 P1**
- **发现 4 个主要 P2**
- **整体实现评分：45/60**

核心问题不是“理念错了”，而是：

> **跨模块对象已经基本齐了，但还没有收敛成唯一、可直接编码的 canonical 接口集合。**

也就是说，当前 draft1 已经足够支持下一轮修订，但还不足以直接进入 schema/CLI/backend 的稳定实现阶段。

---

## 2. M1-M6 与整体 draft1 简表评分

> 评分维度仍按统一 rubric：方法论严谨性 / 协议完整性 / 治理与反作弊 / 可实现性 / 生态兼容性 / 文档清晰度。

| 对象 | 方法论 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 总分 | 快评 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **M1 Foundations** | 9 | 8 | 8 | 8 | 9 | 9 | **51/60** | 边界清楚，是整套协议最稳的底座。 |
| **M2 Benchmark & Execution** | 8 | 7 | 7 | 7 | 8 | 8 | **45/60** | 对象拆分正确，但部分字段仍未和 M3/M5/M6 完全闭环。 |
| **M3 Run Data & Evidence** | 7 | 7 | 7 | 6 | 7 | 8 | **42/60** | bundle 结构方向对，但文件名/字段名/来源对象仍有冲突。 |
| **M4 Trust / Governance / Ranking** | 8 | 7 | 8 | 6 | 8 | 8 | **45/60** | 治理原则成熟，但缺少可直接实现的 registration / tolerance canonical object。 |
| **M5 CLI & Adapter Contract** | 8 | 7 | 7 | 8 | 9 | 8 | **47/60** | CLI-first 路线很强，但 adapter 输出合同还不足以自动填满 M3 manifest。 |
| **M6 Metrics & Uncertainty** | 8 | 7 | 7 | 6 | 8 | 8 | **44/60** | 指标体系对，但依赖的 run-group / policy / tolerance 还没完全落成唯一实现口径。 |
| **整体 draft1** | 8 | 7 | 7 | 7 | 8 | 8 | **45/60** | 已具备 draft2 修订基础，未达到停止条件。 |

---

## 3. 最阻断实现的 P1

## P1-1：bundle 契约在 M3 / M5 之间还未收敛为唯一实现口径

这是当前**最直接阻断编码**的问题。

### 具体表现
- M3 根目录使用的是 `task-results.ndjson`，M5 本地 bundle 目录写的是 `task_results.ndjson`
- M3 使用 `artifact-manifest.json`，M5 目录示例写的是 `bundle_manifest.json`
- M3 明确 bundle 根目录应有 `checksums.sha256`，M5 的最小 bundle 目录示例没有把它列进 canonical 结构

### 为什么是 P1
如果 bundle 文件名和最小目录结构都没有唯一规范，`pack` / `upload` / `replay` / `server intake validation` 无法稳定互操作。

### 修订方向
- 在 draft2 中冻结 **唯一 bundle 根目录规范**
- 明确哪些文件名是 **MUST**、哪些是 **MAY**
- 让 M3 与 M5 使用同一命名，不再并行出现两套写法

---

## P1-2：关键字段闭环未完成，M2/M3/M5/M6 之间存在“定义了但不能稳定产出”的问题

### 具体表现
- M2 把 `task_package_digest`、`execution_contract_digest` 视为可比性最小条件；但 M3 的 manifest 字段表没有把这两个对象完整落成 canonical manifest 字段
- M5 强调 `adapter digest`、preset 解析结果、launcher 定义是证据链的一部分；但 M3 manifest 当前没有对应的 adapter 级字段
- M6 依赖 `budget_policy_id`、`tool_policy_id` 等稳定 ID；但 M2 更多是对象级 `budget_policy`，M3 只部分记录 `tool_policy_id`

### 为什么是 P1
如果字段没有单一挂载点：
- backend 无法稳定构建 leaderboard slice
- reproduce 无法知道“同一系统”到底以什么 fingerprint 判等
- fixed-model / fixed-harness 视图会在实现时不断补丁化

### 修订方向
- 给 `manifest.json` 增补一组 **canonical runtime identity fields**：
  - `task_package_digest`
  - `execution_contract_digest`
  - `adapter_digest`
  - `preset_id` / `adapter_resolution_digest`
  - `budget_policy_id`
  - `tool_policy_id`
- 统一“对象 ID”和“对象内容”的边界：哪些只存 digest，哪些需要对象快照

---

## P1-3：缺少 run-group registration / completeness proof 对象，CLI 到 verification 仍断一截

### 具体表现
- M4 要求 Reproduced / Verified 有 preregistration / declaration
- M5 有 `init`、`study.json`、connected mode
- 但当前 draft1 没有一个正式对象把“平台签发的 run-group 计划”回填进 bundle

### 为什么是 P1
没有这个对象，平台很难程序化证明：
- 当前上传是不是完整的 run-group
- 是否存在 best-of-N 后挑选上传
- offline 初始化的结果能否升级进入更高 tier

### 修订方向
draft2 应新增一个 canonical object，名字可类似：
- `study-registration`
- `run-group-manifest`
- `attempt-set-proof`

最少需要：
- `registration_id`
- `registration_receipt`
- `attempt_plan_hash`
- `declared_attempt_count`
- `declared_seed_set`
- `connected_init_required_for_tier`

---

## P1-4：Reproduced / Verified 的容差规则还没有唯一实现挂载点

### 具体表现
- M4 多处写“满足容差”
- M5 的 `reproduce` 说要判断是否达到容差条件
- M6 提供了 CI、delta、rank spread 的统计建议
- 但当前没有一个正式对象定义：**容差规则到底归谁管、如何被 CLI/backend 共用**

### 为什么是 P1
没有唯一容差对象，平台无法稳定判定：
- 何时从 Community 升到 Reproduced
- 何时从 Reproduced 升到 Verified
- replay 成功但 rerun 有偏差时如何自动裁决

### 修订方向
在 draft2 中新增一个唯一策略对象，例如：
- `reproduction_tolerance_policy`

至少明确：
- 作用域（benchmark / lane / execution contract / verification tier）
- 指标维度（success / cost / latency / crash / timeout）
- 默认阈值与 override 规则
- `replay` 与 `reproduce` 各自适用的判定方式

---

## 4. 主要 P2

## P2-1：trust tier 命名还不够统一
当前同时存在：
- `Community`
- `Self-reported`
- `self_reported`
- `community/self-reported`

这会直接影响：
- API enum
- 前后端筛选条件
- 数据库存储与状态机实现

**建议**：draft2 一次性冻结 canonical enum，并定义 display label 与 storage enum 的区别。

---

## P2-2：`ranking_eligibility` 仍轻微污染对象边界
M2 当前把 `ranking_eligibility` 放在 lane 上，容易让 benchmark/execution 层提前承载 ranking policy 语义。

**建议**：保留为 advisory signal，最终榜单资格由 M4 的 policy / governance 对象决定。

---

## P2-3：custom adapter 最小输出合同还不足以自动生成完整 manifest
当前 M5 要求 adapter 最少产出：
- `result.json`
- `trace.jsonl`
- `artifacts/`
- `stdout.log`
- `stderr.log`

但 M3 manifest 还需要：
- `harness.prompt_hash`
- `harness.rules_hash`
- `harness.memory_config_hash`
- `policy.benchmark_tuned`
- `policy.cache_policy`
- `policy.persistent_memory_enabled`
等。

这些信息当前没有稳定来源，落地时容易退化成“手工补字段”或“各 adapter 自行发挥”。

**建议**：增加 `adapter-metadata.json` 或在 `result.json` 中冻结最小 metadata schema。

---

## P2-4：offline → higher tier 的升级路径仍有实现歧义
M5 允许 offline 结果后续补齐注册与复验；M4 又强调更高 tier 需要 run 前声明。当前没有唯一状态机说明：
- offline 结果是否允许晋级 Reproduced
- 是否允许晋级 Verified
- 需要补哪些证明对象

**建议**：draft2 直接写死：
- 哪些 tier 必须从 connected init 开始
- 哪些 tier 允许离线后补交
- 补交的最低证明对象是什么

---

## 5. bundle / CLI / verification / preset-adapter 的接口闭环判断

## 5.1 Bundle 闭环判断
**当前判断：未闭环。**

原因：
- 文件命名未统一
- canonical root layout 未冻结
- M2 关键 digest 没有完整落进 M3 manifest
- M5 `pack` 和 M3 bundle 规范仍有双源事实

---

## 5.2 CLI 闭环判断
**当前判断：主流程已成形，但未闭环。**

优点：
- `doctor -> init -> run -> pack -> upload -> replay / reproduce` 主干是对的
- connected / offline 两模式已明确
- replay 与 reproduce 已被正确区分

缺口：
- `init` 产物与 M4 trust upgrade 的正式对象没有固定 schema
- `run-group` 完整性证明缺失
- `reproduce` 的判定仍缺 tolerance canonical policy

---

## 5.3 Verification 闭环判断
**当前判断：治理原则闭环，工程对象未闭环。**

优点：
- Community / Reproduced / Verified 三层制度明确
- 默认官方主榜只看 Verified 是对的

缺口：
- Reproduced / Verified 升级所需的 machine-readable proof 不够
- preregistration、full attempts、容差判断还没有唯一实现接口

---

## 5.4 Preset / Custom Adapter 闭环判断
**当前判断：生态设计正确，协议接口未完全闭环。**

优点：
- preset 与 custom adapter 已被拉平
- `SKILL 只是 wrapper` 的边界清楚

缺口：
- adapter identity 没完整落入 manifest
- preset resolution 结果没有固定证据对象
- custom adapter 的 metadata 输出仍不足以支撑 M3 所需字段

---

## 6. 是否建议进入 draft2 修订

**建议：是，立即进入 draft2 修订。**

但前提是 draft2 第一优先级不要再扩 scope，而是先补齐下面这 4 个实现闭环：

1. **冻结唯一 bundle 根目录与文件名规范**
2. **补全 manifest 的 canonical runtime identity 字段**
3. **新增 run-group registration / completeness proof 对象**
4. **新增唯一的 reproduction / verification tolerance policy 对象**

如果这四件事不先补，后续：
- JSON Schema
- CLI 原型
- 上传 API
- backend 校验器
- replay / reproduce

都会在实现阶段重新发散。

---

## 7. Reviewer C2 的一句话结论

> **draft1 已经具备“进入 draft2 修订”的成熟度，但还不具备“直接冻结为可实现协议”的收敛度。当前最缺的不是理念，而是 4 个 canonical object / canonical interface。**
