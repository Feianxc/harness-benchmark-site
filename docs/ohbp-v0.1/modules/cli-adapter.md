# M5 — CLI & Adapter Contract

> 模块定位：本模块定义 OHBP / harnessbench 的**标准执行层**，覆盖 CLI 命令族、preset 与 custom adapter 合同、bundle 打包上传生命周期、replay / reproduce 接口，以及 SKILL 作为 wrapper 的边界。
> 
> 规范边界：
> - 本模块规定“**命令如何驱动协议对象流转**”。
> - `Benchmark Card / Task Package / Execution Contract` 的字段规范由 M2 定义。
> - `Run Manifest / Evidence Bundle` 的字段规范由 M3 定义。
> - `Verification Tiers / Ranking Policy / Audit` 的等级与治理规则由 M4 定义。
> - 本模块只定义 CLI 与 adapter 的**行为合同**、**最小输入输出**与**生命周期**。

---

## 1. 设计目标

OHBP v0.1 的 CLI-first 原则如下：

1. **CLI 是标准执行层，网站不是执行层**  
   排行页、资料页、争议页是展示与治理表层；真正的协议入口必须是可脚本化、可版本化、可复验的 CLI。

2. **SKILL / plugin / slash command 只是 wrapper，不是协议本身**  
   任何生态入口都必须最终落到同一套 CLI 命令与同一套 bundle 结构，避免被单一 agent 生态锁死。

3. **先统一证据流，再统一体验**  
   v0.1 的目标不是覆盖所有 agent 产品，而是让不同 harness 至少能通过统一合同产出可审计 bundle。

4. **preset 降低上手门槛，custom adapter 保证生态开放**  
   内置 preset 负责“开箱即用”；custom adapter 负责“任何人都能接”。二者都必须收敛到相同的 run/bundle 结构。

5. **run、pack、upload、replay、reproduce 必须分层**  
   协议上保留显式步骤，便于审计、断点恢复与独立复现；产品层可以提供一键封装命令，但不得绕过中间产物。

---

## 2. CLI 总体定位

### 2.1 Canonical Binary

OHBP v0.1 规定的标准命令名为：

```bash
harnessbench
```

可选短别名：

```bash
hb
```

实现可通过 `uvx harnessbench`、pipx、独立二进制或其他分发方式提供，但**协议语义以 `harnessbench` 命令族为准**。

### 2.2 执行模式

CLI 必须支持两种执行模式：

1. **Connected mode**  
   CLI 与平台交互，拉取 benchmark manifest、study_id、run_group_id、seed set、上传凭证等；用于进入 reproducible / verified 流程。

2. **Offline mode**  
   CLI 仅做本地执行与 bundle 产出；用于本地调试、社区自报、私有环境演练。离线结果默认只能进入 `self-reported / community` 流程，除非后续补齐平台要求的注册与复验步骤。

### 2.3 生命周期状态

CLI 层面至少存在如下状态：

```text
initialized -> executed -> packed -> uploaded -> replayed / reproduced
```

对应目录对象：

```text
study/      平台或本地初始化后的运行上下文
run/        单次 run-set 的原始执行目录
bundle/     规范化、可上传、可校验的证据包
remote/     平台接收后的记录与状态
```

---

## 3. CLI 命令族

### 3.1 核心命令总表

| 命令 | 作用 | 最小产物 | 是否协议必需 |
|---|---|---|---|
| `doctor` | 检查运行环境、依赖、凭证、权限 | 诊断报告 | SHOULD |
| `init` | 初始化 study / run-group 上下文，解析 benchmark 与 policy | `study.json` | MUST |
| `run` | 执行 benchmark / lane / task set，生成原始 run 目录 | `run/` | MUST |
| `pack` | 将原始 run 目录归一化为 OHBP bundle | `bundle/` | MUST |
| `upload` | 将 bundle 上传到平台并获取状态 | `remote receipt` | SHOULD |
| `replay` | 用既有 bundle 复算 evaluator / 验证证据完整性 | `replay report` | SHOULD |
| `reproduce` | 用原始 manifest 重新执行相同 run-set，产出对比结果 | `reproduce report` | SHOULD |
| `inspect` | 查看 bundle / run / study 的元数据与状态 | 文本/JSON 输出 | MAY |
| `preset list` | 列出可用 preset | preset 清单 | SHOULD |
| `adapter init` | 生成 custom adapter 模板 | `adapter.yaml` | SHOULD |
| `adapter validate` | 校验 adapter 配置与最小 I/O 合同 | 校验报告 | SHOULD |

#### 3.2 命令设计原则

- 所有命令都必须支持 `--json` 机器可读输出。
- 所有状态转换都必须留下可追踪本地元数据，而不是只在 stdout 中给出结果。
- 一键命令（如 `run --upload`）只允许作为复合操作存在，其行为必须等价于显式的 `run -> pack -> upload`。
- CLI 必须默认保留失败 attempts、超时 attempts 与中止 attempts，不允许只保留成功记录。

---

## 4. 命令语义与行为合同

### 4.1 `doctor`

用途：在用户真正开跑前验证本地环境是否满足 lane、preset 或 adapter 的最低要求。

至少检查：

- CLI 版本与协议版本兼容性
- Python / uv / Docker / 浏览器 runtime 等依赖
- API key / 平台 token 是否存在
- benchmark lane 所需磁盘、网络、权限
- preset / adapter 所需外部可执行文件是否可调用

示例：

```bash
harnessbench doctor --preset codex --lane core-lite-v1
```

`doctor` 不参与排名，但其输出应写入 run provenance，用于解释后续失败原因。

### 4.2 `init`

用途：初始化一次 study 或 run-group。

最小责任：

- 解析目标 benchmark / lane / split / policy
- 创建本地 study 目录
- 在 connected mode 下向平台申请：
  - `study_id`
  - `run_group_id`
  - 允许的 seed 列表
  - benchmark manifest 与 digest
  - execution contract 摘要
  - 上传令牌或临时凭证
- 在 offline mode 下生成本地 provisional study 元数据，并显式打上 `offline=true`

示例：

```bash
harnessbench init --lane core-lite-v1 --mode connected
```

输出应至少包含：

- `study.json`
- benchmark manifest 缓存路径
- execution contract 缓存路径
- study / run-group identifiers

### 4.3 `run`

用途：用 preset 或 custom adapter 执行指定 lane / benchmark / task set。

最小责任：

- 读取 `study.json`、benchmark manifest、execution contract
- 决定本次 run-set 的任务顺序、seed 与预算边界
- 调用 preset resolver 或 custom adapter launcher
- 为每个 task × seed 生成 attempt 目录
- 收集原始 stdout / stderr / trace / outputs / task result
- 在 run 结束后产出 run summary，但**不直接视为上传包**

示例：

```bash
harnessbench run --study ./.hb/study.json --preset codex --model openai/gpt-5
harnessbench run --study ./.hb/study.json --adapter ./adapter.yaml --model anthropic/claude-opus
```

协议要求：

- `run` 必须记录所有 attempts；默认不允许“只保留最好一次”。
- `run` 不得自己定义排行榜分数；其职责是产出原始执行证据与局部统计。
- `run` 必须把所有协议关键 digests 固化到本地 metadata 中，例如 benchmark digest、adapter digest、prompt/rules hash、环境摘要等。

### 4.4 `pack`

用途：把 run 目录归一化为 OHBP 标准 bundle。

最小责任：

- 检查 run 目录结构是否完整
- 检查 attempts 是否与 study / run-group 要求一致
- 归一化文件名、目录结构与 JSON schema
- 生成 artifact manifest、hash manifest、Merkle root（若实现）
- 将原始 run 目录压缩或索引为 bundle 目录 / bundle 文件

示例：

```bash
harnessbench pack ./runs/run_20260420_001 --out ./bundles/run_20260420_001
```

`pack` 必须是一个**确定性**过程：在相同输入目录与相同协议版本下，生成同一逻辑 bundle。

### 4.5 `upload`

用途：将 bundle 提交给平台。

最小责任：

- 先提交 bundle metadata 与 digests
- 获取平台分配的对象存储上传地址或直传策略
- 上传 bundle 主体与大文件 artifacts
- 接收平台回执（submission id、状态、下一步动作）

示例：

```bash
harnessbench upload ./bundles/run_20260420_001 --server https://api.harnessbench.example
```

协议要求：

- `upload` 必须把平台返回的 submission receipt 落盘到本地。
- 如果 study 是 offline 初始化的，平台必须显式将其标记为 `self-reported candidate`，不得伪装成 verified 提交。
- `upload` 成功不代表进榜，只代表平台已接收并进入下一步校验 / 复算 / 复验流程。

### 4.6 `replay`

用途：对既有 bundle 做**证据重放**与**分数复算**，尽量不重新调用原模型。

适用场景：

- deterministic evaluator 的本地复核
- 浏览器 / workflow 任务基于 HAR、network trace、artifact 的离线复算
- 平台收到 bundle 后的快速一致性检查

示例：

```bash
harnessbench replay ./bundles/run_20260420_001
```

协议要求：

- `replay` 原则上不重新运行 harness，不重新生成新答案，而是依据 bundle 进行 evaluator 层重放。
- `replay` 必须输出 replay report，明确：
  - schema 是否通过
  - hash 是否一致
  - evaluator 是否成功复算
  - 原始 aggregate 与复算 aggregate 是否一致

### 4.7 `reproduce`

用途：在相同 benchmark / execution contract / seed / adapter 配置下，重新跑一遍原 run-set，并与参考 bundle 比较。

示例：

```bash
harnessbench reproduce ./bundles/run_20260420_001 --adapter ./adapter.yaml --out ./reproduced/run_20260420_001
```

协议要求：

- `reproduce` 必须从源 bundle 读取最小可复现上下文：
  - benchmark digest
  - execution contract
  - run manifest
  - seed 列表
  - adapter / preset resolution 结果
- `reproduce` 必须产出：
  - 新 run 目录
  - 新 bundle
  - reproduce diff report
- `reproduce` 与 `replay` 必须严格区分：
  - `replay` = 不重新执行 harness，以 bundle 为输入复算 evaluator
  - `reproduce` = 重新执行 harness，再比较新旧结果

---

## 5. Preset 与 Custom Adapter

### 5.1 术语定义

#### Preset

preset 是由 OHBP 维护方或生态合作方发布的**受维护适配配置**，用于降低常见 harness / agent 的接入成本。preset 不直接等于某个产品名，而是一个**版本化适配器分辨结果**。

一个 preset 至少包括：

- 逻辑名称：如 `codex`、`claude-code`、`openhands`、`generic-cli`
- preset 版本
- launcher 定义
- 能力声明（是否支持 browser、是否支持 task isolation 等）
- 默认 env / path 检查逻辑
- 对应 adapter digest

#### Custom Adapter

custom adapter 是用户自带的接入配置，适合：

- 私有 harness
- 未内置的开源 agent
- 企业内部 runtime
- 研究原型

custom adapter 必须遵守 OHBP 的最小 I/O 合同，即：**接受标准输入上下文，产出标准输出目录结构**。

### 5.2 设计原则

1. **preset 与 custom adapter 在协议层地位相同**  
   二者都必须最终解析为具体 adapter 配置与 digest。

2. **排行榜记录解析后的 adapter 身份，而不是模糊 preset 名称**  
   平台展示可以保留 `preset=codex`，但证据链必须记录解析后的 launcher、digest、版本、附加配置哈希。

3. **preset 负责易用性，custom adapter 负责开放性**  
   任何只支持 preset、不支持 custom adapter 的实现，都不符合 OHBP v0.1 的生态兼容性目标。

### 5.3 Custom Adapter 最小合同

v0.1 规定 custom adapter 以 `adapter.yaml` 为入口。推荐最小形态如下：

```yaml
schema_version: ohbp-adapter/v0.1
name: my-agent
version: 0.1.0
entrypoint: python my_runner.py
mode: task
supported_lanes:
  - core-lite-v1
outputs:
  result_file: result.json
  trace_file: trace.jsonl
  artifacts_dir: artifacts
capabilities:
  browser: false
  terminal: true
  network_access: allowlist
```

#### 必需输入

CLI 在调用 adapter 时，必须以命令参数或环境变量形式向其提供：

- `OHBP_STUDY_ID`
- `OHBP_RUN_GROUP_ID`
- `OHBP_ATTEMPT_ID`
- `OHBP_BENCHMARK_MANIFEST`
- `OHBP_EXECUTION_CONTRACT`
- `OHBP_TASK_PACKAGE`
- `OHBP_OUT_DIR`
- `OHBP_WORK_DIR`
- `OHBP_SEED`
- `OHBP_MODEL_REF`（若由 CLI 注入模型标识）

#### 必需输出

adapter 在 `OHBP_OUT_DIR` 下至少产出：

- `result.json`：本 attempt 的任务结果与局部统计
- `trace.jsonl` 或协议允许的 trace 变体
- `artifacts/`：最终输出、diff、截图、HAR、其他证据
- `stdout.log`
- `stderr.log`

#### 必需行为

- adapter 必须把非零退出码与错误原因暴露给 CLI；CLI 不得吞掉失败。
- adapter 必须接受 task package 作为唯一权威任务输入；不得从未声明路径读取 benchmark gold 数据。
- adapter 若带有本地缓存、长记忆或共享状态，必须通过配置显式声明，并被 CLI 记录到 manifest 中。

### 5.4 Adapter 执行粒度

OHBP v0.1 的规范执行粒度为：

- **一个 adapter 调用处理一个 task × seed × attempt**

原因：

- 便于隔离失败
- 便于保存全量 attempts
- 便于 replay / reproduce
- 便于不同 harness 的 apples-to-apples 比较

批处理、并行化或多任务 session 可以由 CLI 或 preset 在实现层优化，但其观测结果必须等价于上述粒度。

---

## 6. Bundle 打包与上传生命周期

### 6.1 逻辑阶段

从协议视角，bundle 生命周期分为 5 段：

1. **Study registration**：获得 benchmark / contract / seed 边界
2. **Execution**：产出原始 attempts 与局部日志
3. **Normalization / packing**：归一化为标准 bundle
4. **Submission**：将 bundle 及 digests 上传到平台
5. **Server-side processing**：平台做 schema 校验、复算、抽样复跑、状态升级

### 6.2 本地目录建议

CLI SHOULD 采用如下本地目录约定：

```text
.hb/
  study.json
  cache/
  runs/
    run_<timestamp>_<id>/
      metadata/
      attempts/
      logs/
      raw_artifacts/
  bundles/
    run_<timestamp>_<id>/
      manifest.json
      aggregate.json
      task_results.ndjson
      artifacts/
      bundle_manifest.json
```

说明：

- `runs/` 保存原始执行产物，便于调试与二次打包
- `bundles/` 保存协议归一化后的提交产物
- 具体字段规范由 M3 负责，本模块只规定目录与生命周期关系

### 6.3 打包行为要求

`pack` 阶段至少做以下检查：

- attempts 数是否覆盖 study 要求的全部 seeds / tasks
- 失败 attempts 是否仍在 bundle 中
- trace / stdout / stderr / result 是否齐全
- 所有大文件是否进入 artifact manifest
- 关键 digests 是否可复算

若检查失败，CLI：

- MUST 阻止 bundle 被标记为 `reproducible candidate`
- MAY 允许加 `--allow-incomplete` 继续打包，但 bundle 必须显式标记为 `incomplete=true`，默认只能进入 community/self-reported 通道

### 6.4 上传行为要求

`upload` 阶段推荐采用“两阶段提交”：

#### 阶段 A：metadata registration
先提交：

- bundle digest
- manifest 摘要
- aggregate 摘要
- 文件大小与 artifact 索引

平台返回：

- submission id
- upload urls / upload token
- 期望的 artifact 列表

#### 阶段 B：artifact upload
再上传：

- bundle 主文件
- 大型 trace / screenshots / HAR / diffs 等二进制证据

平台完成后返回 receipt，其中至少包含：

- `submission_id`
- `received_at`
- `declared_tier`
- `server_status`（received / schema_ok / replay_ok / under_review ...）
- 下一步动作（等待复算、补传文件、进入抽样复跑等）

### 6.5 一键命令

为降低使用门槛，CLI MAY 提供：

```bash
harnessbench run --preset codex --lane core-lite-v1 --upload
```

但其行为必须等价于：

```bash
harnessbench init ...
harnessbench run ...
harnessbench pack ...
harnessbench upload ...
```

一键命令不得省略中间落盘，也不得隐藏失败 attempts。

---

## 7. Replay / Reproduce 接口设计

### 7.1 `replay` 的目标

`replay` 的目标不是“再跑一遍模型”，而是验证：

- bundle 内部结构是否自洽
- evaluator 是否能基于证据重新计算结果
- 原 bundle 宣称的 aggregate 是否可信

因此，`replay` 更接近“**证据重放器**”。

#### `replay` SHOULD 支持的输入

- 本地 bundle 目录
- bundle 压缩包
- 平台 run URL / submission URL

#### `replay` SHOULD 输出

- `replay_report.json`
- schema 校验结果
- digest 校验结果
- evaluator 复算结果
- 原值与复算值的 diff

### 7.2 `reproduce` 的目标

`reproduce` 面向独立复现者、审核组与平台复验流程，其核心目标是：

- 重跑同一 run-set
- 比较新旧 run 的统计一致性
- 判断结果是否达到 reproducible / verified 所需的容差条件

#### `reproduce` SHOULD 支持的输入

- 源 bundle
- 源 run URL
- 新的 adapter / preset 解析结果（默认使用源配置）
- 新的执行环境说明（如容器镜像）

#### `reproduce` SHOULD 输出

- 新 run 目录
- 新 bundle
- `reproduce_report.json`
- 与源 bundle 的 task-level diff
- 环境差异摘要

### 7.3 二者协作关系

推荐的审核路径：

```text
先 replay，再 reproduce
```

原因：

- replay 更快，能先发现 schema/hash/evaluator 层问题
- reproduce 更贵，应在 replay 通过后再做

---

## 8. SKILL 作为 Wrapper 的定位

### 8.1 规范结论

OHBP v0.1 明确规定：

> **SKILL、plugin、IDE command、chat command 都只能是 CLI 的 wrapper；它们不是协议层对象，也不能定义独立 bundle 格式。**

#### 这样设计的原因

1. 避免被单一 agent 生态绑死  
   如果协议直接建立在某个 agent skill 机制上，OHBP 将失去“任何 harness 都能接”的开放性。

2. 避免出现“双规范”  
   一旦 SKILL 自己再定义上传结构、trace 结构、元数据字段，就会与 CLI 产生语义分叉。

3. 保持可脚本化与 CI 友好  
   CLI 更适合本地终端、CI/CD、容器、远程 worker、平台复验节点。

### 8.2 Wrapper 能做什么

SKILL / plugin MAY 提供：

- 安装与引导文案
- 调用 `harnessbench doctor`
- 帮用户生成 preset / adapter 命令
- 触发 `run --upload`
- 在 agent 会话中展示运行进度与结果 URL

但它不得：

- 改写 CLI 生成的 manifest 字段语义
- 自定义 bundle 结构
- 跳过 `pack`
- 伪装平台等级（例如把 self-reported 展示成 verified）

### 8.3 推荐工作流

在 Codex/Claude 等生态中，推荐工作流为：

```text
/benchmark quick --preset codex --upload
```

其底层应展开为：

```bash
harnessbench doctor ...
harnessbench init ...
harnessbench run ...
harnessbench pack ...
harnessbench upload ...
```

wrapper 只负责用户体验，不承担协议裁判角色。

---

## 9. MVP 建议与非目标

### 9.1 v0.1 MVP 建议

为了确保可实现性，CLI & Adapter Contract 模块在 v0.1 应优先支持：

1. 一个 canonical CLI 实现
2. connected/offline 两种模式
3. `doctor / init / run / pack / upload / replay / reproduce` 这 7 个主命令
4. 2-4 个内置 preset（如 `codex`、`claude-code`、`generic-cli`）
5. 一个最小 `adapter.yaml` 合同
6. 一个规范 bundle 目录与两阶段上传流程

### 9.2 v0.1 非目标

以下内容不应阻塞 v0.1：

- 所有 agent 产品的原生深度接入
- 多机分布式调度协议
- 远程沙箱编排系统
- 所有语言 SDK
- 完整 GUI / 网站流程替代 CLI

---

## 10. 对其他模块的接口要求

为了避免模块间边界漂移，M5 对其他模块提出如下接口要求：

### 对 M2 的要求

M2 必须提供 CLI 可直接消费的对象：

- benchmark manifest
- task package 引用方式
- execution contract 文件格式
- lane / split / policy 标识

### 对 M3 的要求

M3 必须明确 bundle 最小字段与文件规范，至少让 `pack` / `replay` 可实现。

### 对 M4 的要求

M4 必须明确：

- connected/offline 初始化各自对应的默认 tier
- incomplete bundle 如何降级
- replay / reproduce 结果如何影响 tier 升降

---

## 11. 模块总结

OHBP v0.1 在 CLI & Adapter Contract 上的核心判断是：

1. **CLI 是协议主入口**
2. **preset 负责易用性，custom adapter 负责开放性**
3. **run / pack / upload / replay / reproduce 是不可折叠的协议阶段**
4. **bundle 是上传与复验的唯一公共载体**
5. **SKILL 只能是 wrapper，不能成为协议分叉点**

这使 OHBP 能在不依赖单一网站、单一 agent 产品、单一生态的前提下，先建立一条**统一执行 → 统一证据 → 统一复验**的最小闭环。



