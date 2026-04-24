# M2 — Benchmark & Execution（OHBP v0.1 Draft）

状态：`draft-v0.1`  
模块负责人：`Worker 2`  
适用范围：OHBP / harnessbench 的 **Benchmark Card、Task Package、Execution Contract、lane 设计、benchmark health 元数据**。

---

## 1. 模块目标与边界

本模块回答 5 个问题：

1. **一个 benchmark 在协议里如何被唯一标识与描述**
2. **一次评测到底跑的是哪一组任务与资源**
3. **不同 harness 在什么执行条件下才算“可比”**
4. **平台首批应该支持哪些 lane，哪些 lane 暂不纳入旗舰主榜**
5. **benchmark 是否仍然健康、仍然新鲜、是否存在污染风险，如何被结构化表达**

本模块**不负责**定义以下内容：
- Run Manifest / Evidence Bundle（归 M3）
- Verification Tiers / Ranking Policy / Audit Flow（归 M4）
- CLI Commands / Adapter Contract（归 M5）
- 重复运行、CI、rank spread、模型/框架归因统计（归 M6）

换句话说：

> **M2 定义“测什么、跑什么、在什么条件下跑”；不定义“跑完怎么上传、怎么验、怎么排”。**

---

## 2. 规范性用语

本模块采用以下规范性词汇：
- **MUST**：必须；不满足则不应视为符合 OHBP v0.1
- **SHOULD**：强烈建议；若偏离，必须有明确理由并记录 trade-off
- **MAY**：可选；允许实现方按需要启用

---

## 3. 核心对象关系

OHBP v0.1 在 Benchmark & Execution 层定义 5 个对象：

1. **Benchmark Card**  
   基准的公开说明书，描述“它是什么、测什么、由谁维护、当前是否推荐使用”。

2. **Task Package**  
   一次可执行评测所需的任务、资源、评估器绑定信息与包级元数据，要求版本固定、内容寻址。

3. **Execution Contract**  
   一组可比运行条件：环境、工具权限、网络策略、预算上限、缓存策略、人工介入策略等。

4. **Lane**  
   面向展示与提交的“轨道”。它把某个 benchmark 版本、某个 task package、某个 execution contract 绑定成一个可发布的比较单元。

5. **Benchmark Health Record**  
   对 benchmark / lane / split 当前健康状态的审核记录，覆盖 freshness、contamination、validity、environment stability 等字段。

它们的关系如下：

```text
Benchmark Family
  └─ Benchmark Card (versioned)
       ├─ exposes Lane A
       │    ├─ binds Task Package digest X
       │    ├─ binds Execution Contract digest Y
       │    └─ has Health Record H1
       ├─ exposes Lane B
       │    ├─ binds Task Package digest X2
       │    ├─ binds Execution Contract digest Y2
       │    └─ has Health Record H2
       └─ has Benchmark-level Health Record H0
```

### 3.1 可比性的最小条件

一个可进入 OHBP 比较视图的 run，**MUST** 至少能唯一引用：
- 一个 `benchmark_id + benchmark_version`
- 一个 `task_package_digest`
- 一个 `execution_contract_digest`
- 一个 `lane_id`

若其中任一对象无法被唯一定位，该 run **不得**被视为“可比较结果”。

---

## 4. Benchmark Card

## 4.1 定义

**Benchmark Card** 是 benchmark 的规范说明书，而不是运行结果摘要。  
它用于告诉平台、上传者、审核者和浏览者：

- benchmark 的能力目标是什么
- 任务来源是什么
- 使用何种 evaluator
- 当前是否仍建议作为公开比较依据
- 健康状态如何

Benchmark Card **MUST 是公开可读对象**。即使某些 split 为 hidden/holdout，Card 本身也必须公开，以保证平台透明度。

---

## 4.2 必填字段

下表为 v0.1 推荐的必填字段：

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `benchmark_id` | string | MUST | 稳定 slug，例如 `core-lite` |
| `benchmark_family_id` | string | MUST | 家族级标识，例如 `core`, `terminal`, `workflow` |
| `benchmark_version` | string | MUST | 版本号，建议显式日期或 semver，例如 `v1.0.0` 或 `2026-04` |
| `title` | string | MUST | 人类可读名称 |
| `summary` | string | MUST | 1–3 段摘要，说明 benchmark 测什么、不测什么 |
| `steward` | object | MUST | 维护方信息，至少含名称与联系渠道 |
| `source_class` | enum | MUST | `first_party` / `imported` / `mirrored` / `private_hosted` |
| `capability_targets` | string[] | MUST | 主测能力标签，例如 `repo_coding`, `terminal_ops`, `workflow_orchestration`, `memory_carryover` |
| `primary_constructs` | string[] | MUST | 需映射到平台构念：`effectiveness`, `efficiency`, `reliability`, `recovery`, `reproducibility` |
| `task_count_total` | integer | MUST | 总任务数 |
| `split_manifest` | object | MUST | 各 split 的数量与可见性，例如 `public/dev/hidden` |
| `evaluator_mode` | enum | MUST | `deterministic`, `programmatic_partial`, `human_review`, `hybrid` |
| `default_lane_ids` | string[] | MUST | 默认关联的 lane |
| `recommended_status` | enum | MUST | `active`, `watchlist`, `legacy`, `deprecated` |
| `health_record_ref` | string | MUST | 当前默认健康记录的 ID 或 digest |
| `changelog_url` | string | SHOULD | 变更日志链接或内部引用 |
| `upstream_url` | string | MAY | 上游 benchmark 或项目主页 |
| `license` | string | MAY | 任务包/资源的许可信息 |
| `created_at` | datetime | MUST | 创建时间 |
| `updated_at` | datetime | MUST | 最近更新时间 |

---

## 4.3 设计约束

### A. Benchmark Card 不等于“榜单页”
Card 只声明 benchmark 身份与测量边界，不承载平台 UI 排序逻辑。

### B. Benchmark Card 不等于 Task Package
同一个 benchmark version **可以**对应多个 Task Package，例如：
- `public-dev`
- `verified-hidden`
- `lite-subset`

### C. Benchmark Card 不等于 Execution Contract
同一个 Task Package **可以**在不同 Execution Contract 下运行，例如：
- `quick-low-budget`
- `reference-budget`
- `strict-no-network`

这三者必须分离，否则协议会把“任务本体”“运行条件”“展示策略”混为一谈。

---

## 4.4 推荐字段补充

以下字段虽非 v0.1 强制，但强烈建议加入：

| 字段 | 说明 |
|---|---|
| `non_goals` | 明确不测什么，避免过度解读 |
| `environment_type` | `hermetic_cli`, `simulated_workflow`, `managed_browser`, `live_web`, `desktop_os` |
| `supports_hidden_split` | 是否存在平台保留或轮换的隐藏集 |
| `supports_repeated_runs` | 是否支持多次运行与稳定性评估 |
| `recommended_for_flagship_ranking` | 是否适合作为主榜旗舰 benchmark |
| `known_limitations` | 已知局限、污染争议或 evaluator 风险 |

---

## 5. Task Package

## 5.1 定义

**Task Package** 是“本次实际可运行的任务包”。  
它必须将任务、资源、环境初始化引用、评估器绑定信息打包成一个**版本固定、内容寻址**的单元。

Task Package 的设计目标：
- 让 run 能明确说明“到底跑的是哪一批任务”
- 让平台能做重放、复验和差分比较
- 让 public split 与 hidden split 在协议层上被清楚区分

---

## 5.2 Task Package 的强约束

1. 每个 Task Package **MUST** 有唯一 `package_id` 与 `package_digest`
2. 任何任务集、资源、评估器绑定、初始状态引用的变化，**MUST** 产生新 digest
3. public/dev 与 hidden/holdout **MUST NOT** 使用同一个 package digest
4. public 包 **MUST NOT** 内含 gold answer、gold patch、hidden solution、可直接反解评分器的私有答案资产
5. hidden 包 **MAY** 只暴露红线后的任务描述与远程拉取令牌，不要求完整离线公开

---

## 5.3 推荐目录结构

v0.1 建议 Task Package 采用如下布局：

```text
task-package/
  package.json
  tasks.ndjson
  assets/
  setup/
  evaluator/
  docs/
```

其中：
- `package.json`：包级元数据
- `tasks.ndjson`：逐任务定义
- `assets/`：静态资源、数据文件、模板文件、输入样本
- `setup/`：可选环境初始化引用
- `evaluator/`：评估器入口或评估器 digest 引用
- `docs/`：包说明、已知限制、可见性策略

---

## 5.4 `package.json` 最低字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `package_id` | string | MUST | 包级稳定标识 |
| `benchmark_id` | string | MUST | 所属 benchmark |
| `benchmark_version` | string | MUST | 所属 benchmark 版本 |
| `lane_id` | string | MUST | 该包默认绑定的 lane |
| `split` | enum | MUST | `public`, `dev`, `hidden`, `holdout`, `lite` |
| `package_digest` | string | MUST | 内容摘要 |
| `task_schema_version` | string | MUST | 任务记录 schema 版本 |
| `task_count` | integer | MUST | 任务数量 |
| `asset_manifest_digest` | string | SHOULD | 资源摘要 |
| `evaluator_digest` | string | MUST | 绑定评估器摘要 |
| `visibility` | enum | MUST | `open`, `sealed`, `platform_hosted` |
| `setup_mode` | enum | SHOULD | `none`, `scripted`, `image_ref`, `platform_managed` |
| `created_at` | datetime | MUST | 创建时间 |
| `notes` | string | MAY | 包级说明 |

---

## 5.5 单任务记录最低字段

`tasks.ndjson` 中每个任务对象建议至少包含：

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `task_id` | string | MUST | 任务唯一 ID |
| `objective` | string | MUST | 任务目标描述 |
| `capability_tags` | string[] | MUST | 能力标签 |
| `difficulty_band` | enum | SHOULD | `easy`, `medium`, `hard`, `very_hard` |
| `initial_state_ref` | string | SHOULD | 初始状态引用 |
| `asset_refs` | string[] | SHOULD | 所需资源引用 |
| `expected_output_schema_ref` | string | MUST | 期望输出 schema |
| `scoring_mode` | enum | MUST | `pass_fail`, `partial`, `schema`, `test_suite`, `trace_replay` |
| `timeout_sec` | integer | MAY | 任务级超时覆盖 |
| `safety_flags` | string[] | MAY | 安全或权限标签 |
| `notes` | string | MAY | 仅任务级注释 |

### 任务定义的边界要求

- `objective` 应描述任务目标，而非引导上传者复现某种提示词风格
- `expected_output_schema_ref` 应指向结构化输出要求，而非模糊文字说明
- 若任务依赖私有答案、密封判定逻辑或远程评分服务，public 包中不得泄漏对应资产

---

## 6. Execution Contract

## 6.1 定义

**Execution Contract** 是 OHBP 可比性的核心对象。  
它描述：

> **同一个 benchmark / task package，必须在什么运行条件下执行，结果才可并列比较。**

Execution Contract 不是“某个 harness 的内部设计说明”，而是平台对所有参与者施加的一组统一外部条件。

---

## 6.2 Execution Contract 的最低字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `execution_contract_id` | string | MUST | 合约 ID |
| `execution_contract_version` | string | MUST | 合约版本 |
| `execution_contract_digest` | string | MUST | 合约内容摘要，用于 run 级唯一引用 |
| `benchmark_id` | string | MUST | 绑定 benchmark |
| `benchmark_version` | string | MUST | 绑定版本 |
| `lane_id` | string | MUST | 所属 lane |
| `task_package_digest` | string | MUST | 绑定任务包摘要 |
| `environment_profile` | object | MUST | 环境类型、镜像、OS、架构等 |
| `filesystem_policy` | object | MUST | 文件系统读写范围 |
| `network_policy` | object | MUST | 网络模式与白名单策略 |
| `tool_policy` | object | MUST | 允许工具、禁止工具、工具代理规则 |
| `budget_policy` | object | MUST | 成本、时长、步数、token 等约束 |
| `retry_policy` | object | SHOULD | 重试次数、自动恢复策略 |
| `seed_policy` | object | MUST | 随机种子与重复运行要求 |
| `cache_policy` | object | MUST | 禁止/限制跨 run 缓存 |
| `human_assistance_policy` | object | MUST | 是否允许人工审批或人工交互 |
| `logging_policy` | object | MUST | 必须记录的 trace 事件级别 |
| `output_contract` | object | MUST | 结果输出与 artifact 的最低要求 |
| `evaluator_binding` | object | MUST | evaluator digest、调用方式、是否本地/远程评分 |
| `attestation_requirement` | object | MAY | 对签名 runner / attestation 的要求 |
| `notes` | string | MAY | 说明或例外 |

---

## 6.3 合约必须固定的比较条件

为了让不同 harness 的结果具备横向可比性，Execution Contract **MUST** 至少固定：

### A. 运行环境
- OS / architecture
- container 或 image digest
- 关键 runtime 版本
- 允许挂载的路径

### B. 网络条件
- `none`
- `allowlist`
- `proxied_open`

任何“可自由联网”的 lane 都必须在 contract 里显式声明，而不能隐式允许。

### C. 工具权限
例如：
- `shell`
- `browser`
- `python`
- `search`
- `file_ops`
- `api_call`

工具名与能力边界必须规范化，否则“tool call 次数”与“工具使用权限”无法比较。

### D. 预算
至少包括：
- `max_wall_clock_sec`
- `max_cost_usd`
- `max_steps`
- 如可得，`max_tokens_in` / `max_tokens_out`

### E. 随机性与重复
必须声明：
- 种子来源
- 是否固定 seed 集合
- 是否要求 run-set 而不是单次 run

### F. 缓存与持久记忆
必须声明：
- 是否允许缓存
- 缓存作用域（`none`, `session`, `run_group`）
- 是否允许 persistent memory
- 何种持久记忆会被视为 benchmark-specific 泄漏风险

### G. 人工介入
至少区分：
- `none`
- `approval_only`
- `interactive`

v0.1 默认假设主榜旗舰 lane 优先使用 `none` 或严格声明的 `approval_only`。

---

## 6.4 合约变更规则

以下任一变化都**必须**视为 Execution Contract 的版本变化：
- 镜像 digest 变化
- 网络策略变化
- 工具权限变化
- 预算上限变化
- 缓存策略变化
- 人工辅助策略变化
- evaluator 绑定变化

若变更影响可比性，则平台不得将变更前后结果直接混入同一比较单元。

---

## 6.5 合约的定位原则

### Principle 1 — 合约固定外部条件，不干预内部实现
OHBP 不规定 harness 如何写 planner、memory、rules、sub-agent。  
OHBP 只规定：它们在什么外部条件下被公平比较。

### Principle 2 — 先支持可落地的轻量环境
v0.1 以 hermetic / simulated / deterministic lane 为先，不把 live web / desktop OS 作为旗舰主榜起点。

### Principle 3 — 比较条件必须“先公开、后执行”
Execution Contract 必须先于 run 被确定；不允许事后按结果回填比较条件。

---

## 7. Lane 设计

## 7.1 定义

**Lane** 是平台对外展示和接收提交的最小比较轨道。  
一个 lane 绑定：
- 一个 benchmark version
- 一个或一组 task package
- 一个 execution contract
- 一组明确的健康与推荐状态

> **榜单比较的单位不是 benchmark family，而是 lane。**

因为同一个 benchmark family 可能同时有：
- quick lane
- lite lane
- hidden verified lane
- legacy reference lane

它们的可比性、健康状态、适用场景可能完全不同。

---

## 7.2 Lane 的必填字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `lane_id` | string | MUST | 轨道 ID，例如 `core-lite-v1` |
| `lane_version` | string | MUST | 轨道版本 |
| `benchmark_id` | string | MUST | 所属 benchmark |
| `benchmark_version` | string | MUST | 所属版本 |
| `lane_family` | enum | MUST | `core`, `terminal`, `workflow`, `browser`, `research`, `legacy_reference` |
| `lane_tier` | enum | MUST | `quick`, `lite`, `reference`, `verified_hidden`, `legacy` |
| `task_package_digests` | string[] | MUST | 关联任务包摘要 |
| `execution_contract_id` | string | MUST | 绑定的合约 |
| `environment_type` | enum | MUST | `hermetic_cli`, `simulated_workflow`, `managed_browser`, `live_web`, `desktop_os` |
| `ranking_eligibility` | enum | MUST | `community_only`, `reproducible_ok`, `verified_ok` |
| `health_record_ref` | string | MUST | 当前 lane 健康记录 |
| `notes` | string | MAY | lane 说明 |

---

## 7.3 OHBP v0.1 首批推荐 lane

### 1) `core-lite-v1`
**定位**：最小可行公共入口 lane。  
**目标**：让用户“一句命令”即可跑通一个受控、快速、低成本的 benchmark。  
**特征**：
- 小规模 deterministic 任务集
- 无需重型基础设施
- 默认 hermetic 环境
- 无开放互联网
- 适合冷启动、协议联调、社区试跑

**建议用途**：
- 协议联调
- 适配器联调
- 社区 onboarding
- 自定义 harness 的第一条接入路径

---

### 2) `terminal-lite-v1`
**定位**：终端/工程执行能力基线 lane。  
**目标**：测 shell、文件操作、依赖处理、脚本执行、故障恢复。  
**特征**：
- hermetic CLI 容器
- 稳定文件系统与依赖快照
- 默认无 live internet
- 允许 deterministic evaluator / test-suite evaluator

**建议用途**：
- coding / devops / terminal-native harness 横评
- memory / retry / recovery 的早期测量

---

### 3) `workflow-clean-v1`
**定位**：结构化工具编排 lane。  
**目标**：测多步 workflow、API/工具选择、审批流、状态传递、恢复能力。  
**特征**：
- 使用模拟服务或受控 API stub
- 尽量避免 live web 的不稳定性
- 适合测 planner / tool router / reviewer / sub-agent coordination

**建议用途**：
- 工具编排能力验证
- “多 agent 是否真的有净收益”的早期实验底座

---

## 7.4 v0.1 明确暂缓为旗舰主榜的 lane

以下 lane **可以作为未来扩展方向**，但不建议作为 v0.1 旗舰主榜首批：

- `browser-live-reference`
- `desktop-os-reference`
- `repo-coding-heavy-reference`
- `ml-experiment-heavy-reference`

原因：
- 环境更重
- 评估稳定性更弱
- 反作弊难度更高
- 一句命令门槛更高
- benchmark health 与 contamination 风险更复杂

这不代表这些 lane 不重要，而是 v0.1 应优先建立**可复现、可比较、可治理**的轻量协议闭环。

---

## 7.5 导入外部 benchmark 的 lane 策略

OHBP 允许将外部 benchmark 包装成 lane，但需满足以下前提：

1. 已有完整 Benchmark Card
2. 能产出 Task Package digest 或等价内容引用
3. 能明确绑定 Execution Contract
4. 能给出 Benchmark Health Record
5. 至少完成一次基线审计，判断是否适合进入 `verified_ok`

若以上条件不满足，外部 benchmark 最多只能作为：
- `community_only`
- `legacy_reference`
- `watchlist`

而不应直接进入平台主榜旗舰位。

---

## 8. Benchmark Health / Freshness / Contamination

## 8.1 设计原则

benchmark 的“是否健康”不能只靠口头印象，必须结构化、可版本化、可追溯。  
因此 OHBP v0.1 定义 **Benchmark Health Record**，它可附着在：
- benchmark 级
- lane 级
- split 级

也就是说：
- 一个 benchmark family 可能整体仍然有研究价值
- 但某个 public lane 已经 aging
- 某个 hidden split 可能仍然 fresh

健康状态必须细到足以支撑治理决策，而不能只给一个模糊总评。

---

## 8.2 Health Record 必填字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---|---|
| `health_record_id` | string | MUST | 健康记录 ID |
| `health_scope` | enum | MUST | `benchmark`, `lane`, `split` |
| `applies_to_ref` | string | MUST | 绑定对象引用 |
| `assessment_version` | string | MUST | 本次评估版本 |
| `assessed_at` | datetime | MUST | 评估时间 |
| `assessed_by` | object | MUST | 评估方 |
| `recommended_status` | enum | MUST | `active`, `watchlist`, `legacy`, `deprecated` |
| `freshness_level` | enum | MUST | `fresh`, `active`, `aging`, `legacy` |
| `contamination_risk` | enum | MUST | `low`, `medium`, `high`, `unknown` |
| `task_validity` | enum | MUST | `strong`, `moderate`, `weak`, `unknown` |
| `outcome_validity` | enum | MUST | `strong`, `moderate`, `weak`, `unknown` |
| `environment_stability` | enum | MUST | `hermetic`, `managed_live`, `open_live`, `unknown` |
| `holdout_available` | boolean | SHOULD | 是否仍有未公开 holdout |
| `rotation_policy` | enum | SHOULD | `none`, `periodic`, `continuous` |
| `known_issues` | string[] | SHOULD | 已知问题列表 |
| `evidence_basis` | string[] | SHOULD | 证据来源，如 audit、上游声明、作弊分析 |
| `last_audit_at` | datetime | SHOULD | 最近审计时间 |
| `next_review_due_at` | datetime | SHOULD | 下次复查时间 |
| `notes` | string | MAY | 额外说明 |

---

## 8.3 字段语义建议

### `recommended_status`
- `active`：建议继续作为公开比较依据
- `watchlist`：仍可用，但需显著提示存在方法或治理风险
- `legacy`：保留历史参考价值，不建议作为前沿主指标
- `deprecated`：停止接收新提交或不建议再展示为正式比较对象

### `freshness_level`
- `fresh`：隐藏集/轮换集仍有较强新颖性，暴露度低
- `active`：公开较多但仍有明显信号
- `aging`：任务或解答暴露度升高，信号正在衰减
- `legacy`：高度公开或已被广泛吸收，不再适合作为前沿主指标

### `contamination_risk`
- `low`：有 holdout / rotation / delayed release / 密封评估等机制
- `medium`：公开较多，但仍有一定防泄漏缓冲
- `high`：任务/答案/轨迹已广泛公开，或上游已有明确污染警告
- `unknown`：尚未做足够审计

### `task_validity`
任务是否真的在测其宣称的能力目标。

### `outcome_validity`
评分器是否真的能有效判断“做对了”。

### `environment_stability`
- `hermetic`：环境冻结，可重放性强
- `managed_live`：平台控制的动态环境，可记录但会变化
- `open_live`：开放互联网或开放桌面环境，波动性高

---

## 8.4 Health Record 的治理要求

1. Health Record **MUST** 版本化，不得直接覆盖历史记录
2. 若 benchmark 因污染、评分器漏洞、环境 exploit 被降级，平台 **MUST** 保留降级历史
3. `recommended_status` 的变化 **SHOULD** 伴随公开说明或 changelog
4. 任何作为旗舰主榜依据的 lane，**SHOULD** 有近期 `last_audit_at`
5. 缺少 Health Record 的 benchmark / lane **不应**进入 verified 主榜

---

## 8.5 v0.1 的边界决定

为避免协议初版过重，OHBP v0.1 在 health 层先做以下边界收束：

### v0.1 必做
- freshness / contamination / validity / environment stability 的结构化字段
- benchmark / lane / split 三级附着能力
- 记录 `recommended_status`
- 支持历史留痕

### v0.1 暂不强制
- 自动化 exploit 扫描体系
- 大规模 benchmark saturation 检测
- 污染概率的统一数值化模型
- 将 health 直接折算进综合总分

这些内容可以在 v0.2+ 演进，但不应阻塞 v0.1 协议定稿。

---

## 9. 模块级设计结论

本模块的核心结论如下：

1. **Benchmark Card、Task Package、Execution Contract 必须严格分离**  
   否则无法同时支持透明度、复现与可比性。

2. **Lane 才是榜单与提交的最小比较单元**  
   不是 benchmark family，也不是单个 run。

3. **Execution Contract 是 OHBP 可比性的中心对象**  
   它固定环境、预算、权限与缓存边界，是“同模型只换 harness”比较成立的前提。

4. **Health Record 必须结构化且版本化**  
   benchmark 本身也会老化、污染、失真，协议必须把这一层显式建模。

5. **v0.1 应从轻量、可落地、可治理的 lane 起步**  
   即优先 `core-lite-v1`、`terminal-lite-v1`、`workflow-clean-v1`，而不是直接把最重、最脆弱的 live web / desktop lane 当旗舰主榜。

---

## 10. 交接给其他模块的接口

为了与其他模块衔接，M2 向后续模块输出以下稳定接口：

- 向 **M3** 输出：
  - `benchmark_id`
  - `benchmark_version`
  - `lane_id`
  - `task_package_digest`
  - `execution_contract_id`
  - `execution_contract_version`
  - `execution_contract_digest`
  - `health_record_ref`

- 向 **M4** 输出：
  - `ranking_eligibility`
  - `recommended_status`
  - `freshness_level`
  - `contamination_risk`
  - `holdout_available`

- 向 **M5** 输出：
  - `environment_profile`
  - `tool_policy`
  - `network_policy`
  - `budget_policy`
  - `output_contract`
  - `evaluator_binding`

- 向 **M6** 输出：
  - `primary_constructs`
  - `evaluator_mode`
  - `seed_policy`
  - `task_validity`
  - `outcome_validity`
  - `environment_stability`

---

## 11. 本模块的开放问题（供后续审核组打分时重点关注）

1. `lane_tier` 是否需要进一步与 trust tier 解耦得更彻底  
2. `environment_type` 与 `tool_policy` 的标准枚举是否还需更细  
3. imported benchmark 的最小审计门槛是否足够清晰  
4. health record 是否应增加 `trace_release_delay_days` 以更好处理公开与污染的冲突

这些问题不阻塞 v0.1 Draft，但应成为下一轮审核的重点题目。
