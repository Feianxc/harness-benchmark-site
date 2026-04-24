# M3 — Run Data & Evidence

## 1. 模块目标

本模块定义 OHBP v0.1 中与一次评测运行及其证据包直接相关的数据对象与打包约定，覆盖：

- `Run Manifest`
- `Aggregate Metrics`
- `Task-level Results`
- `Trace Bundle`
- `Bundle Layout`
- 证据哈希与完整性建议

本模块只定义“**如何记录与携带运行事实**”，**不**定义：

- Verification tier 的判定规则（由 M4 负责）
- 排名、加权总分、置信区间公式（由 M6 负责）
- CLI 命令与 adapter 接口（由 M5 负责）
- Benchmark Card / Execution Contract 内容本身（由 M2 负责）

## 2. 设计原则

1. **证据优先于分数**：上传对象首先是可审计证据包，而不是一个摘要分数。
2. **单次运行不可变**：一个 `attempt_id` 对应一次固定 seed、固定配置、固定环境快照的运行；修改任一关键输入，必须生成新的 attempt。
3. **单 bundle 对应单 attempt**：v0.1 中一个 run bundle 表示一个单次执行结果，不把多次重复运行混装在一个 bundle 里；多次重复运行通过 `run_group_id` 关联。
4. **小对象结构化，大对象外链化**：元数据放 JSON/NDJSON，大体积日志、HAR、截图、补丁等以文件或压缩包形式引用。
5. **可重算优先**：平台不应盲信提交方提供的 score，应优先依赖 evaluator report、task 结果与 trace 进行复算或重放。
6. **默认可脱敏，但必须声明**：若出于隐私或安全原因进行脱敏，必须显式记录脱敏范围与原因，避免“静默删证据”。

## 3. 核心对象与标识

v0.1 建议最少使用以下标识：

- `study_id`：一次评测研究 / 提交批次 / 预注册实体的 ID
- `run_group_id`：一组本应共同报告的重复运行 ID（例如 5 个 seeds）
- `attempt_id`：一次单独执行的唯一 ID
- `bundle_id`：当前 bundle 的逻辑 ID；可与 `attempt_id` 相同，也可单独存在

约束：

- `attempt_id` **MUST** 全局唯一
- `run_group_id` **SHOULD** 在同一组重复运行中保持一致
- `bundle_id` **SHOULD** 与 bundle 根目录的完整性摘要绑定

## 4. Run Manifest

### 4.1 作用

`manifest.json` 是一次运行的不可变元数据入口，用于回答：

- 跑的是哪个 benchmark / split / evaluator
- 用的是哪个 harness / model / prompt / rules / memory 配置
- 在什么执行环境里跑
- 本次运行属于哪个 run group
- 预算、超时、工具权限等核心约束是什么

### 4.2 文件路径

```text
manifest.json
```

### 4.3 字段分组

#### A. 协议与对象身份

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `schema_version` | string | MUST | 当前 bundle schema 版本，例如 `ohbp.run-bundle.v0.1` |
| `study_id` | string | MUST | 预注册或研究批次 ID |
| `run_group_id` | string | SHOULD | 重复运行组 ID |
| `attempt_id` | string | MUST | 单次运行唯一 ID |
| `bundle_id` | string | SHOULD | bundle 逻辑 ID |
| `created_at` | string | MUST | ISO 8601 时间 |

#### B. Benchmark 与 evaluator 身份

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `benchmark.id` | string | MUST | benchmark 名称 |
| `benchmark.version` | string | MUST | benchmark 版本 |
| `benchmark.split` | string | MUST | `public` / `dev` / `hidden` 等 |
| `benchmark.task_manifest_hash` | string | MUST | 任务清单摘要 |
| `evaluator.id` | string | MUST | evaluator 名称 |
| `evaluator.version` | string | SHOULD | evaluator 版本 |
| `evaluator.digest` | string | MUST | evaluator 二进制/镜像/源码快照摘要 |
| `runner.digest` | string | MUST | runner 摘要 |

#### C. Harness 身份

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `harness.name` | string | MUST | harness / scaffold 名称 |
| `harness.version` | string | SHOULD | 版本号 |
| `harness.commit` | string | SHOULD | Git commit 或等价快照 |
| `harness.repo_url` | string | MAY | 仓库地址 |
| `harness.agent_topology` | string | SHOULD | `single` / `planner-executor` / `multi-agent` / `reviewer-loop` |
| `harness.memory_system` | string | SHOULD | `none` / `summary` / `vector` / `episodic` / `graph` / `custom` |
| `harness.context_strategy` | string | SHOULD | `full` / `retrieve` / `compress` / `sliding` / `staged` |
| `harness.prompt_hash` | string | MUST | 主提示词摘要 |
| `harness.rules_hash` | string | SHOULD | 规则系统摘要 |
| `harness.memory_config_hash` | string | SHOULD | 记忆系统配置摘要 |
| `harness.tool_manifest_hash` | string | SHOULD | 工具清单摘要 |

#### D. 模型与推理配置

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `model.provider` | string | MUST | 提供方 |
| `model.name` | string | MUST | 模型名 |
| `model.snapshot` | string | SHOULD | 版本快照或发布日期 |
| `model.temperature` | number | SHOULD | 采样温度 |
| `model.max_output_tokens` | integer | MAY | 输出上限 |
| `model.reasoning_mode` | string | MAY | `default` / `low` / `high` / `none` |
| `model.router_model` | string | MAY | 路由模型 |
| `model.subagent_models` | array[string] | MAY | 子 agent 模型列表 |

#### E. 执行政策与声明

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `policy.seed` | integer | MUST | 当前 attempt 的 seed |
| `policy.timeout_sec` | integer | MUST | 单次运行总超时 |
| `policy.max_cost_usd` | number | SHOULD | 成本上限 |
| `policy.max_steps` | integer | SHOULD | 最大步骤数 |
| `policy.tool_policy_id` | string | SHOULD | 工具权限策略 ID |
| `policy.internet_access` | string | SHOULD | `none` / `allowlist` / `open` |
| `policy.human_assistance` | string | MUST | `none` / `approval-only` / `interactive` |
| `policy.benchmark_specific` | boolean | MUST | 是否 benchmark-specific |
| `policy.benchmark_tuned` | boolean | MUST | 是否针对 benchmark 特调 |
| `policy.persistent_memory_enabled` | boolean | SHOULD | 是否开启持久记忆 |
| `policy.cache_policy` | string | SHOULD | `disabled` / `session` / `global` |
| `policy.best_of_k` | integer | SHOULD | 本 attempt 是否为 best-of-k 工作流的一部分 |
| `policy.followed_evaluation_protocol` | boolean | MUST | 是否遵守官方协议 |

#### F. 环境快照

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `environment.os_image` | string | SHOULD | OS / 容器镜像名 |
| `environment.container_digest` | string | SHOULD | 容器摘要 |
| `environment.arch` | string | MAY | 架构，如 `x86_64` |
| `environment.python_version` | string | MAY | Python 版本 |
| `environment.hardware.cpu` | string | MAY | CPU 摘要 |
| `environment.hardware.gpu` | string | MAY | GPU 摘要 |
| `environment.hardware.ram_gb` | number | MAY | 内存 |
| `environment.network_policy_digest` | string | SHOULD | 网络策略摘要 |
| `environment.locale` | string | MAY | 语言环境 |
| `environment.timezone` | string | MAY | 时区 |

### 4.4 最小示例

```json
{
  "schema_version": "ohbp.run-bundle.v0.1",
  "study_id": "study_20260420_001",
  "run_group_id": "rg_8b97d2",
  "attempt_id": "att_0f7742",
  "bundle_id": "bndl_0f7742",
  "created_at": "2026-04-20T20:40:00Z",
  "benchmark": {
    "id": "core-lite-v1",
    "version": "2026-04",
    "split": "public",
    "task_manifest_hash": "sha256:..."
  },
  "evaluator": {
    "id": "core-lite-eval",
    "version": "0.1.0",
    "digest": "sha256:..."
  },
  "runner": {
    "digest": "sha256:..."
  },
  "harness": {
    "name": "example-harness",
    "version": "1.2.0",
    "commit": "abc123",
    "agent_topology": "planner-executor",
    "memory_system": "summary",
    "context_strategy": "retrieve",
    "prompt_hash": "sha256:...",
    "rules_hash": "sha256:...",
    "memory_config_hash": "sha256:...",
    "tool_manifest_hash": "sha256:..."
  },
  "model": {
    "provider": "openai",
    "name": "gpt-5",
    "snapshot": "2026-04-15",
    "temperature": 0,
    "reasoning_mode": "default"
  },
  "policy": {
    "seed": 42,
    "timeout_sec": 3600,
    "max_cost_usd": 25.0,
    "max_steps": 500,
    "tool_policy_id": "toolpol-default-v1",
    "internet_access": "allowlist",
    "human_assistance": "none",
    "benchmark_specific": false,
    "benchmark_tuned": false,
    "persistent_memory_enabled": false,
    "cache_policy": "disabled",
    "best_of_k": 1,
    "followed_evaluation_protocol": true
  },
  "environment": {
    "os_image": "ubuntu-22.04",
    "container_digest": "sha256:...",
    "arch": "x86_64",
    "network_policy_digest": "sha256:..."
  }
}
```

## 5. Aggregate Metrics

### 5.1 作用

`aggregate.json` 用于保存**单个 attempt 在任务集合层面的观测汇总**。它是展示与快速索引入口，但不应取代 task 级明细与 evaluator 原始报告。

### 5.2 原则

- `aggregate.json` 中的值 **SHOULD** 可由 `task-results.ndjson` 与 evaluator report 推导或校验
- 该文件记录**观测值**与**统计摘要**，不记录平台政策加权分
- 与 ranking 相关的跨 attempt 聚合（如 rank、CI、rank spread）不属于本文件职责

### 5.3 建议字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `tasks_total` | integer | MUST | 任务总数 |
| `tasks_completed` | integer | MUST | 已完成任务数 |
| `tasks_succeeded` | integer | MUST | 成功任务数 |
| `tasks_failed` | integer | MUST | 失败任务数 |
| `tasks_partial` | integer | MAY | 部分完成任务数 |
| `success_rate` | number | MUST | 成功率 |
| `partial_rate` | number | MAY | 部分完成率 |
| `timeout_count` | integer | SHOULD | 超时数 |
| `crash_count` | integer | SHOULD | 崩溃数 |
| `wall_clock_sec_total` | number | MUST | 总耗时 |
| `wall_clock_sec_p50` | number | MAY | 任务级时延中位数 |
| `wall_clock_sec_p95` | number | MAY | 任务级时延 p95 |
| `cost_usd_total` | number | SHOULD | 总成本 |
| `cost_usd_avg_per_task` | number | MAY | 平均任务成本 |
| `token_input_total` | integer | MAY | 总输入 token |
| `token_output_total` | integer | MAY | 总输出 token |
| `tool_calls_total` | integer | MAY | 总工具调用 |
| `evaluator_score_raw` | number | MAY | evaluator 原始总分 |
| `evaluator_score_unit` | string | MAY | 分值单位，如 `ratio` / `points` |
| `replayable` | boolean | SHOULD | 是否具备重放所需证据 |
| `redaction_applied` | boolean | SHOULD | 是否做过脱敏 |

### 5.4 示例

```json
{
  "tasks_total": 20,
  "tasks_completed": 20,
  "tasks_succeeded": 14,
  "tasks_failed": 6,
  "tasks_partial": 1,
  "success_rate": 0.70,
  "partial_rate": 0.05,
  "timeout_count": 2,
  "crash_count": 0,
  "wall_clock_sec_total": 1842.4,
  "wall_clock_sec_p50": 73.1,
  "wall_clock_sec_p95": 210.7,
  "cost_usd_total": 11.28,
  "cost_usd_avg_per_task": 0.564,
  "token_input_total": 182340,
  "token_output_total": 40122,
  "tool_calls_total": 311,
  "evaluator_score_raw": 0.70,
  "evaluator_score_unit": "ratio",
  "replayable": true,
  "redaction_applied": false
}
```

## 6. Task-level Results

### 6.1 作用

`task-results.ndjson` 是 bundle 的核心事实表。一行表示一个 task 在当前 attempt 下的结果记录。

推荐使用 NDJSON 而不是单个大数组 JSON，原因：

- 便于流式写入与读取
- 大规模 benchmark 下更适合增量处理
- 平台可按 task 粒度快速校验、索引与重算

### 6.2 文件路径

```text
task-results.ndjson
```

### 6.3 每行最少字段

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `task_id` | string | MUST | task 唯一标识 |
| `status` | string | MUST | `success` / `failure` / `partial` / `timeout` / `crash` / `skipped` |
| `score_raw` | number | MAY | task 原始得分 |
| `score_unit` | string | MAY | `ratio` / `points` 等 |
| `started_at` | string | SHOULD | 开始时间 |
| `ended_at` | string | SHOULD | 结束时间 |
| `wall_clock_sec` | number | SHOULD | task 耗时 |
| `cost_usd` | number | MAY | task 成本 |
| `token_input` | integer | MAY | 输入 token |
| `token_output` | integer | MAY | 输出 token |
| `tool_calls` | integer | MAY | 工具调用次数 |
| `trace_ref` | string | SHOULD | 对应 trace 文件或片段引用 |
| `stdout_ref` | string | MAY | 标准输出引用 |
| `stderr_ref` | string | MAY | 标准错误引用 |
| `artifact_refs` | array[string] | MAY | 补丁、截图、HAR 等引用 |
| `evaluator_result_ref` | string | SHOULD | 任务级 evaluator 结果引用 |
| `notes` | string | MAY | 附加备注，不可替代结构化字段 |

### 6.4 示例行

```json
{"task_id":"task_001","status":"success","score_raw":1,"score_unit":"ratio","started_at":"2026-04-20T20:41:00Z","ended_at":"2026-04-20T20:42:10Z","wall_clock_sec":70.1,"cost_usd":0.42,"token_input":8120,"token_output":1331,"tool_calls":12,"trace_ref":"trace/events/task_001.jsonl.zst","artifact_refs":["artifacts/task_001/final-output.json"],"evaluator_result_ref":"reports/tasks/task_001.json"}
```

## 7. Trace Bundle

### 7.1 作用

Trace bundle 用于支持：

- 事后审计
- 任务级重放 / 重算
- 争议调查
- 失败模式分析

v0.1 不强制所有 harness 使用完全相同的内部事件模型，但要求提交方导出到一个最小公共事件层。

### 7.2 推荐目录

```text
trace/
  events/
    task_001.jsonl.zst
    task_002.jsonl.zst
  sessions/
    session-index.json
```

### 7.3 最小公共事件字段

每条事件 **SHOULD** 至少包含：

| 字段 | 类型 | 要求 | 说明 |
|---|---|---:|---|
| `event_id` | string | MUST | 事件 ID |
| `attempt_id` | string | MUST | attempt 归属 |
| `task_id` | string | SHOULD | task 归属 |
| `seq` | integer | MUST | 单 task 或单 session 内递增序号 |
| `timestamp` | string | MUST | ISO 8601 时间 |
| `channel` | string | MUST | `model` / `tool` / `system` / `user` / `reviewer` |
| `event_type` | string | MUST | `prompt` / `completion` / `tool_call` / `tool_result` / `decision` / `error` / `checkpoint` 等 |
| `payload_ref` | string | MAY | 大对象引用 |
| `payload_inline` | object | MAY | 小对象内联内容 |
| `prev_event_hash` | string | SHOULD | 链式哈希前驱 |
| `event_hash` | string | SHOULD | 当前事件摘要 |
| `redaction` | object | MAY | 是否及如何脱敏 |

### 7.4 对大对象的建议

以下内容**不建议**直接内联到事件里，而应通过 `payload_ref` 引用：

- 大段 prompt / completion 全文
- 浏览器 HAR
- 截图 / 录像
- shell transcript 原文
- 补丁或产出文件

推荐按需放在：

```text
artifacts/
payloads/
reports/
```

### 7.5 脱敏

若因隐私、密钥、安全策略而脱敏：

- 必须保留事件骨架
- 必须保留长度、类型、时间顺序、调用边界
- 必须在 `redactions.json` 中登记脱敏规则、范围与原因

不允许“直接删掉整段关键 trace 且不声明”。

## 8. Bundle Layout

### 8.1 推荐目录布局

```text
run_bundle/
  manifest.json
  aggregate.json
  task-results.ndjson
  checksums.sha256
  artifact-manifest.json
  redactions.json
  attestation.json
  trace/
    events/
      task_001.jsonl.zst
    sessions/
      session-index.json
  reports/
    evaluator-report.json
    tasks/
      task_001.json
  artifacts/
    task_001/
      final-output.json
      patch.diff
      stdout.txt
      stderr.txt
  payloads/
    prompt-0001.txt.zst
    completion-0001.txt.zst
```

### 8.2 布局约束

- `manifest.json`、`aggregate.json`、`task-results.ndjson` **MUST** 位于 bundle 根目录
- `reports/evaluator-report.json` **SHOULD** 存在
- 所有在 task result 或 trace 中出现的 `*_ref` **MUST** 指向 bundle 内有效相对路径，或显式声明为外部对象存储 URI
- 若使用外部对象存储，bundle **MUST** 同时包含对象摘要、大小与媒体类型
- 大文件 **SHOULD** 使用 zstd 或等价压缩

### 8.3 关于 repeated runs

v0.1 中，重复运行的聚合不要求打包进单个 bundle。推荐做法：

- 每个 attempt 一个 bundle
- 通过共同的 `study_id` + `run_group_id` 在平台端聚合

这样可以避免：

- 一个 bundle 过大
- 某次 attempt 重跑导致整组 bundle 失效
- 不同信任层级混在同一压缩包里

## 9. 证据哈希与完整性建议

### 9.1 最小要求

v0.1 最少应具备以下完整性机制：

1. **文件级 SHA-256 摘要**
2. **bundle 级文件清单**
3. **关键对象哈希回填到 manifest**

推荐文件：

- `checksums.sha256`：列出 bundle 内所有主要文件摘要
- `artifact-manifest.json`：列出路径、摘要、大小、媒体类型、是否压缩

### 9.2 artifact-manifest 建议结构

```json
{
  "hash_algorithm": "sha256",
  "files": [
    {
      "path": "manifest.json",
      "sha256": "...",
      "bytes": 2481,
      "media_type": "application/json"
    },
    {
      "path": "trace/events/task_001.jsonl.zst",
      "sha256": "...",
      "bytes": 19022,
      "media_type": "application/zstd"
    }
  ]
}
```

### 9.3 推荐增强项

以下为 **SHOULD** 或 **MAY**，不是 v0.1 硬门槛：

- **Merkle root**：对全部文件摘要再计算根摘要，便于远程校验
- **链式事件哈希**：trace 事件使用 `prev_event_hash` + `event_hash`
- **签名 runner / evaluator**：提交时记录 runner、evaluator 的签名或 digest
- **attestation.json**：记录本地证明或受控环境证明（如 `official-runner` / `tpm` / `tee` / `none`）

### 9.4 完整性与可审计性的最低结论

若缺少以下任一项，该 bundle 不应被视为“可充分审计”：

- `attempt_id`
- benchmark/evaluator/runner 的关键身份摘要
- `task-results.ndjson`
- evaluator report 或等价任务级评分证据
- 基本文件清单与摘要

## 10. 与其他模块的边界

- 本模块定义“**记录什么**”与“**如何打包**”
- M4 决定“这些证据足够进入哪个 trust tier”
- M5 决定“CLI 如何生成、上传、重放这些证据”
- M6 决定“如何从这些数据计算不确定性、排名与跨 run 聚合指标”

## 11. v0.1 最小必选项（MUST）

为避免 v0.1 滑向过重规范，本模块建议最低提交门槛为：

1. `manifest.json`
2. `aggregate.json`
3. `task-results.ndjson`
4. `reports/evaluator-report.json` 或等价 evaluator 输出
5. `artifact-manifest.json`
6. `checksums.sha256`
7. 至少一类可审计 trace（task 级 events 或等价 transcript）

如果只上传总分截图、纯摘要表、或缺少 task 级证据，则该结果最多只能作为展示素材，不应作为标准 OHBP run bundle。
