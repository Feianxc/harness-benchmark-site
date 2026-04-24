# Repair Packet D — Governance Hardening（IR-11 / IR-12 / IR-13 / IR-14）

> 负责范围：Governance Hardening
> 目标：把 draft1 中“治理原则正确但证据仍偏声明式”的部分，收敛成 draft2 可直接整合的规范性对象、MUST 字段与模块改动点。
> 约束说明：本 packet 只处理 IR-11～IR-14，不试图在此文中完成所有枚举命名统一问题；若与术语修复流 A 存在交叉，以其最终 canonical enum 为准，但本 packet 给出的治理硬约束应保留。

---

## 0. 结论先说

**draft2 在治理层必须把“声明”升级成“可验证承诺 + 可审计证据 + 可分级公开”。**

围绕 IR-11～IR-14，建议新增四条硬主线：

1. **双通道证据模型**：任何高信任、hidden/holdout/rotating split、或存在审计脱敏需求的结果，必须同时存在 `public bundle` 与 `sealed audit bundle`，并用 digest 绑定。
2. **高信任环境完整性与防篡改**：`Reproduced` / `Verified` 不再只依赖“有 bundle”，而必须具备环境摘要、trace 根摘要、artifact manifest、attestation/official runner 证明等最小闭环。
3. **交互遥测与 autonomy 证据边界**：`autonomous` / `approval-only` / `interactive` 不再只靠上传者声明，必须有统一 `interaction-log.jsonl` 与计数字段支持审计。
4. **memory / cache / external KB 的隔离与证明**：高信任通用榜结果不能只声明“没用记忆/缓存”，而必须证明其状态作用域、命名空间、reset 策略与外部知识源边界。

如果以上四条不落成规范对象，draft2 依然只能算“治理意识强”，不能算“高可信主榜协议”。

---

## 1. IR-11：public bundle / sealed audit bundle 双通道证据模型

### 1.1 设计目标

要同时满足两件事：

- **平台与公众能看到足够多的公开证据**，避免“黑箱榜单”；
- **hidden split / holdout / rotating benchmark 的关键内容不能过早泄漏**，避免 benchmark 被快速污染、逆向、缓存答案或训练污染。

因此 draft2 应把“一个 bundle”升级为“**两个互相绑定的证据通道**”。

### 1.2 建议新增的 canonical 模型

#### A. Public Bundle

用于公开展示、轻量复核、研究引用与长期索引。

**Public Bundle MUST 包含：**

- `manifest.json`（可公开字段版本）
- `aggregate.json`
- `task-results.ndjson` 的公开可发布子集或脱敏版本
- `artifact-manifest.json`
- `checksums.sha256`
- `redactions.json`（如有脱敏）
- `release_policy.json` 或 manifest 中等价字段
- `audit-summary.json`（至少说明 tier、审计结论、是否存在 sealed 通道）
- `trace skeleton`：保留事件时间顺序、事件类型、调用边界、长度/大小信息，但不得泄漏 hidden task/gold answer

**Public Bundle MUST NOT 包含：**

- 可直接重建 hidden split 任务内容、gold answer、grader secret、canary 题面或私有评估脚本的原始材料
- 在 benchmark 仍 active 时足以支持 benchmark-specific 微调或答案缓存的完整 payload
- 未声明释放策略的完整原始 trace

#### B. Sealed Audit Bundle

用于平台、授权审计者、争议处理与高信任复核。

**Sealed Audit Bundle MUST 包含：**

- 完整 `manifest.json`
- 完整 `task-results.ndjson`
- 完整 trace（含 payload 引用或受控正文）
- evaluator 中间产物 / replay 所需材料
- `interaction-log.jsonl`
- `environment-report.json`
- `state-reset-report.json`
- `cache-report.json`
- `attestation.json`（或等价官方执行证明）
- 必要时的 network / proxy / mount / workspace snapshot 摘要

Sealed Audit Bundle 可以不对公众开放，但其存在、摘要与释放策略必须进入公开元数据。

### 1.3 建议新增字段

建议在 `manifest.json` 或独立 `evidence-channel-manifest.json` 中新增：

| 字段 | 要求 | 说明 |
|---|---:|---|
| `evidence_channel_mode` | MUST | `public_only` / `public_plus_sealed` |
| `public_bundle_digest` | MUST | 公开证据包摘要 |
| `sealed_audit_bundle_digest` | MUST if `public_plus_sealed` | 密封审计包摘要 |
| `visibility_class` | MUST | 如 `public_minimal` / `public_redacted` / `sealed_platform_only` / `sealed_authorized_auditors` |
| `release_policy` | MUST | 公开/延迟公开/仅退休后公开/永不公开原文但保留 digest |
| `delayed_release_at` | SHOULD | 若延迟公开，给出时间点 |
| `retirement_release_policy` | SHOULD | benchmark 退役后的释放策略 |
| `public_redaction_profile_id` | SHOULD | 脱敏规则版本 |
| `sealed_access_policy` | SHOULD | 哪类审计者可访问 sealed 通道 |

### 1.4 哪些场景必须启用双通道

以下情况 **MUST** 使用 `public_plus_sealed`：

1. `hidden` / `holdout` / `rotating` split 的 `Reproduced` / `Verified`
2. 任何进入默认官方主榜、但公开全文会泄漏 benchmark integrity 的结果
3. 任何因隐私、商业机密、密钥、私有代码而做了 trace/payload 脱敏，但仍想进入 `Reproduced` / `Verified` 的结果
4. 任何需要平台端 official evaluator 或 sealed replay 才能完成高信任审计的结果

以下情况可以 `public_only`：

- 纯 `Community` 且 benchmark 为公开 split，且无高风险泄漏材料
- 明确声明“不申请高信任 tier”的本地自报结果

### 1.5 规范性建议

- `hidden split` 的 `Verified` **MUST** 具备 Sealed Audit Bundle；缺失时不得进入 `Verified`。
- Public Bundle **MUST NOT** 成为 Sealed Audit Bundle 的全文镜像。
- 平台 **MUST** 在公开层展示 `sealed_audit_bundle_digest`、`release_policy`、`visibility_class`，使公众知道“还有一层被密封但可审计的证据”。
- benchmark 仍 active 时，平台 **SHOULD NOT** 公开会泄漏 hidden split 的完整 payload；但 **MUST** 保留 sealed 通道供争议、抽检与复验使用。

---

## 2. IR-12：高信任 tier 的 MUST 级环境完整性与 trace 防篡改要求

### 2.1 结论

draft1 当前对 `container_digest`、`network_policy_digest`、链式 trace hash、`attestation.json` 等要求偏软。对于 `Reproduced` / `Verified`，这些字段不能继续停留在 SHOULD/MAY。

### 2.2 建议的高信任最小证明集合

建议把高信任 tier 的环境与 trace 完整性要求分为两层。

#### A. Reproduced 最低门槛（MUST）

1. `environment.container_digest` 或等价运行镜像摘要
2. `environment.network_policy_digest`
3. `artifact-manifest.json` 覆盖全部关键证据文件
4. `checksums.sha256`
5. `trace_root_hash`
6. 关键 trace 事件具备链式哈希（`prev_event_hash` + `event_hash`）
7. `environment-report.json`
8. 不允许仅靠可变外部 URI 作为唯一证据；若有外链，平台或提交者 **MUST** 提供固定 digest、size、media type，且平台 **SHOULD** 镜像

#### B. Verified 最低门槛（MUST）

除 Reproduced 全部要求外，再增加：

1. `attestation.json` **或** `official_runner_attested=true` 二者至少其一成立
2. `mount_manifest_hash`
3. `env_allowlist_hash`
4. `workspace_snapshot_hash_before`
5. `workspace_snapshot_hash_after`
6. `network_proxy_log_digest`（若 lane 允许联网）
7. 平台控制环境、平台官方评分通道、或平台授权 runner 的证明链
8. 对进入官方主榜的高影响结果，平台 **MUST** 能把公开证据与 sealed 审计证据通过 digest 串起来验证一致性

### 2.3 建议新增文件 / 报告

#### `reports/environment-report.json`

至少包含：

- `container_digest`
- `base_image`
- `runner_digest`
- `evaluator_digest`
- `network_policy_digest`
- `mount_manifest_hash`
- `env_allowlist_hash`
- `workspace_snapshot_hash_before`
- `workspace_snapshot_hash_after`
- `official_runner_attested`
- `attestation_ref`

#### `reports/trace-integrity.json`

至少包含：

- `trace_root_hash`
- `hash_algorithm`
- `event_chain_complete`
- `trace_file_count`
- `missing_event_ranges`
- `payload_coverage_ratio`

### 2.4 规范性建议

- `Verified` 结果若没有 `trace_root_hash`，**不得** 进入默认官方主榜。
- `Verified` 结果若不能证明执行环境与声明的 `execution_contract_digest` 一致，**必须** 降级或标记 `provisional`。
- Public Bundle 中可以不公开全部原始 trace，但 **MUST** 公开 `trace_root_hash`、`artifact-manifest` 与 `attestation` 摘要，以支持外部核对。
- 平台 **MUST** 禁止“事后修补 trace 再重新打包但不改变审计摘要”的情况；一旦 trace 或 artifact 变化，bundle digest 与 trace root 必须变化。

---

## 3. IR-13：autonomous / approval-only / interactive 的证据化边界与交互遥测

### 3.1 结论

`autonomy_mode` 不能再只是上传者主观声明；必须有统一的交互遥测与可审计边界。否则默认官方榜中的 “autonomous only” 没有硬证据支撑。

### 3.2 建议定义三种可审计叶子模式

> 注：若术语流 A 后续要保留 `human-assisted`，建议把它作为展示层 umbrella label，而不是审计层 leaf enum。本 packet 只要求 draft2 至少把以下三种叶子模式的证据边界写死。

#### A. `autonomous`

定义：从 `run start` 到 `attempt end` 期间，**不存在任何人类自由输入、自由编辑、自由命令执行、自由 prompt 修改或审批事件**；允许的人工动作仅限：

- 启动 run 前的预配置
- 终止 / 中断 / 紧急停止
- 平台侧只读观测

**硬要求：**

- `human_event_count = 0`
- `approval_event_count = 0`
- `manual_file_write_detected = false`
- `tty_input_digest` 为空哨兵值或不存在且被明确定义为“零输入”
- 必须有完整 `interaction-log.jsonl`

#### B. `approval-only`

定义：人类只能对系统发起的**预定义审批请求**做 `approve / deny / abort`，但**不能**：

- 输入自由文本指令
- 手动修改文件
- 手动执行新命令
- 手动改 prompt / rules / memory 配置

**硬要求：**

- 必须记录全部审批事件
- `interactive_event_count = 0`
- `manual_file_write_detected = false`
- `tty_freeform_input_detected = false`
- 审批事件须能映射到 trace 中对应 action/request

#### C. `interactive`

定义：存在任意人类自由输入、自由命令、手工文件修改、IDE 编辑、手工补丁、追加 prompt、粘贴脚本等行为。

**硬要求：**

- 必须记录全部可观察到的人类交互事件
- 必须显式标记发生过的事件类型
- 不得被展示成 `autonomous` 或 `approval-only`

### 3.3 建议新增交互遥测对象

#### `interaction-log.jsonl`

每条事件至少包含：

| 字段 | 要求 | 说明 |
|---|---:|---|
| `event_id` | MUST | 事件 ID |
| `attempt_id` | MUST | attempt 归属 |
| `timestamp` | MUST | 时间戳 |
| `actor_type` | MUST | `human` / `agent` / `platform` |
| `interaction_type` | MUST | `approval_request` / `approval_granted` / `approval_denied` / `tty_input` / `editor_write` / `manual_command` / `session_attach` / `session_detach` / `abort` |
| `target_ref` | SHOULD | 关联 task/trace/action |
| `content_digest` | SHOULD | 输入内容或编辑内容摘要 |
| `content_redacted` | SHOULD | 是否脱敏 |
| `policy_classification` | SHOULD | 该事件是否被计入 autonomous / approval-only / interactive 判定 |

#### `interaction-summary.json`

至少包含：

- `autonomy_mode_declared`
- `human_event_count`
- `approval_event_count`
- `interactive_event_count`
- `tty_input_digest`
- `editor_interaction_detected`
- `manual_file_write_detected`
- `manual_command_detected`
- `classification_verdict`

### 3.4 规范性建议

- 所有申请 `Reproduced` / `Verified` 的结果 **MUST** 产出 `interaction-log.jsonl` 与 `interaction-summary.json`。
- 缺少交互遥测的结果，**不得** 进入 `autonomous` 的 `Reproduced` / `Verified` 切片。
- `approval-only` 若出现自由文本输入、手工改文件、手工命令，则 **MUST** 自动降为 `interactive`。
- 多 agent 协作不构成人类干预；但任何人工接管、补丁、手工 approval，都必须在遥测中可见。

---

## 4. IR-14：memory / cache / external KB 的隔离与证明机制

### 4.1 结论

draft1 只要求声明 `persistent_memory_enabled`、`cache_policy`，还不够。高信任协议必须能回答：

- 状态存在于哪里；
- 作用域有多大；
- 是否在 attempt/run-group 之间 reset；
- 外部知识库是否可能偷带 benchmark 答案；
- 平台如何核验这些声明。

### 4.2 建议定义的状态作用域对象

建议把 memory / cache / external KB 统一归入 `state isolation` 子对象。

#### 建议字段

| 字段 | 要求 | 说明 |
|---|---:|---|
| `memory_scope` | MUST | `none` / `attempt` / `run_group` / `benchmark` / `project` / `global` |
| `cache_namespace` | MUST | 缓存命名空间；高信任结果必须可唯一绑定 run_group 或 attempt |
| `state_reset_policy` | MUST | `per_attempt` / `per_run_group` / `manual` / `none` |
| `state_reset_proof` | MUST for Reproduced/Verified | reset 日志、hash、删除证明或空 namespace 初始化证明 |
| `cache_root_hash_before` | SHOULD | reset 前缓存根摘要 |
| `cache_root_hash_after` | SHOULD | reset 后缓存根摘要 |
| `external_kb_enabled` | MUST | 是否启用外部知识库 / RAG |
| `external_kb_digest_list` | MUST if enabled | KB snapshot / index / corpus 的 digest 列表 |
| `external_kb_policy_id` | SHOULD | 外部知识源访问策略 |
| `memory_snapshot_digest_before` | SHOULD | 运行前记忆快照摘要 |
| `memory_snapshot_digest_after` | SHOULD | 运行后记忆快照摘要 |
| `benchmark_answer_material_declared` | SHOULD | 是否存在可能包含 benchmark answer 的材料 |

### 4.3 规则建议

#### A. 对通用主榜（general-purpose）

- `memory_scope = global` 或 `cache_policy = global` 的结果，默认 **不得** 进入通用 `Verified` 主榜，除非该 lane 明确把“跨任务长期记忆”定义为被测能力。
- `external_kb_enabled = true` 但没有 `external_kb_digest_list` 的结果，最高只能停留在 `Community`。
- `state_reset_policy` 不存在或无法提供 `state_reset_proof` 的高信任结果，**不得** 进入 `Reproduced` / `Verified`。

#### B. 对 benchmark-specific / memory-allowed lane

- 可以允许更强记忆、缓存或外部知识库；
- 但 **MUST** 分榜展示，且不能混入通用主榜；
- 平台 **MUST** 在 board slice 中显式标出该 lane 的状态允许范围。

#### C. 对 hidden / holdout benchmark

- 平台 **SHOULD** 优先要求 attempt/run-group 级 namespace 隔离；
- 外部 KB 若启用，**MUST** 至少在 sealed 通道提供 corpus/index 摘要；
- 若发现 benchmark 答案缓存或长期记忆污染，应触发 `benchmark_contamination` / `incomplete_disclosure` 争议类型。

### 4.4 建议新增证明文件

#### `reports/state-reset-report.json`

至少包含：

- `memory_scope`
- `cache_namespace`
- `state_reset_policy`
- `state_reset_proof`
- `cache_root_hash_before`
- `cache_root_hash_after`
- `memory_snapshot_digest_before`
- `memory_snapshot_digest_after`
- `reset_verdict`

#### `reports/cache-report.json`

至少包含：

- `cache_policy`
- `cache_namespace`
- `external_kb_enabled`
- `external_kb_digest_list`
- `external_kb_policy_id`
- `benchmark_answer_material_declared`
- `cache_isolation_verdict`

---

## 5. 建议新增或升级为 MUST 的字段列表

下面只列治理硬化直接需要的字段；不覆盖其它修复流负责的所有命名统一工作。

### 5.1 新增 MUST 字段

| 对象/文件 | 字段 | 级别 | 用途 |
|---|---|---:|---|
| manifest / evidence channel object | `evidence_channel_mode` | MUST | 声明 public-only 还是 public+sealed |
| manifest / evidence channel object | `public_bundle_digest` | MUST | 公开证据绑定 |
| manifest / evidence channel object | `sealed_audit_bundle_digest` | MUST if sealed | 密封证据绑定 |
| manifest / evidence channel object | `visibility_class` | MUST | 公开/密封可见性分类 |
| manifest / evidence channel object | `release_policy` | MUST | 释放策略 |
| reports/trace-integrity.json 或 manifest | `trace_root_hash` | MUST for Reproduced/Verified | 防篡改根摘要 |
| reports/environment-report.json | `mount_manifest_hash` | MUST for Verified | 挂载输入边界 |
| reports/environment-report.json | `env_allowlist_hash` | MUST for Verified | 环境变量白名单边界 |
| reports/environment-report.json | `workspace_snapshot_hash_before` | MUST for Verified | 运行前工作区摘要 |
| reports/environment-report.json | `workspace_snapshot_hash_after` | MUST for Verified | 运行后工作区摘要 |
| reports/environment-report.json | `network_proxy_log_digest` | MUST when network allowed in Verified | 联网证据摘要 |
| reports/environment-report.json | `official_runner_attested` | MUST for Verified unless attestation file exists | 官方执行证明 |
| interaction-summary.json | `human_event_count` | MUST | 人类事件计数 |
| interaction-summary.json | `approval_event_count` | MUST | 审批事件计数 |
| interaction-summary.json | `interactive_event_count` | MUST | 自由交互计数 |
| interaction-summary.json | `tty_input_digest` | MUST | TTY 输入摘要 |
| interaction-summary.json | `manual_file_write_detected` | MUST | 是否手工写文件 |
| interaction-summary.json | `classification_verdict` | MUST | autonomy 最终判定 |
| state isolation object / state-reset-report | `memory_scope` | MUST | 记忆作用域 |
| state isolation object / state-reset-report | `cache_namespace` | MUST | 缓存命名空间 |
| state isolation object / state-reset-report | `state_reset_policy` | MUST | reset 策略 |
| state isolation object / state-reset-report | `state_reset_proof` | MUST for Reproduced/Verified | reset 证明 |
| cache-report | `external_kb_enabled` | MUST | 是否外部 KB |
| cache-report | `external_kb_digest_list` | MUST if enabled | 外部 KB 摘要列表 |

### 5.2 建议从 SHOULD 升级为 MUST 的既有字段

| 现有字段 | 当前状态 | 建议状态 | 适用范围 |
|---|---:|---:|---|
| `environment.container_digest` | SHOULD | MUST | Reproduced / Verified |
| `environment.network_policy_digest` | SHOULD | MUST | Reproduced / Verified |
| `prev_event_hash` / `event_hash` | SHOULD | MUST | Reproduced / Verified |
| `artifact-manifest.json` | MUST in M3 minimum, but治理上需硬绑定 | MUST + 高信任完整覆盖 | Reproduced / Verified |
| `attestation.json` | MAY | MUST-or-equivalent | Verified |
| `persistent_memory_enabled` | SHOULD | MUST | 至少 Reproduced / Verified |
| `policy.cache_policy` | SHOULD | MUST | 至少 Reproduced / Verified |

---

## 6. 建议改动到哪些模块、哪些段落

### 6.1 `docs/ohbp-v0.1/ohbp-v0.1-draft1.md`

建议改动：

- **§5.2 Run Data & Evidence 层**  
  增加 `public bundle` / `sealed audit bundle` 的双通道说明，不再只写“标准 bundle”。
- **§7 Verification Tiers 与治理**  
  给 `Reproduced` / `Verified` 增加：双通道证据、交互遥测、状态隔离证明、环境 attestation 的最低要求。
- **§8 Ranking Policy**  
  明确 `autonomous` 切片必须以交互遥测为准，不得仅靠声明。
- **§10 Benchmark Health**  
  增加与 `release_policy` / `retirement_release_policy` 的联动，说明 benchmark active 期间何种证据必须 sealed。

### 6.2 `docs/ohbp-v0.1/modules/run-data-evidence.md`（M3）

建议改动：

- **§4 Run Manifest / §4.3 字段分组**  
  增加 evidence channel、environment integrity、state isolation、interaction summary 相关字段。
- **§7 Trace Bundle**  
  新增交互遥测对象；把链式 hash 从 SHOULD 提升到高信任 MUST。
- **§8 Bundle Layout**  
  改为同时定义 `public_bundle/` 与 `sealed_audit_bundle/` 的布局或其逻辑等价形式。
- **§9 证据哈希与完整性建议**  
  增加 `trace_root_hash`、`environment-report.json`、`trace-integrity.json`、`state-reset-report.json`、`cache-report.json`；把高信任门槛从建议提升到规范。
- **§11 v0.1 最小必选项**  
  区分 Community minimum 与 Reproduced/Verified minimum，避免高信任要求继续隐藏在 prose 里。

### 6.3 `docs/ohbp-v0.1/modules/trust-governance-ranking.md`（M4）

建议改动：

- **§3 Verification Tiers**  
  明确哪些 tier / split 必须 sealed，哪些缺字段时必须降级。
- **§4.3 强制分榜维度**  
  将 `autonomous` / `approval-only` / `interactive` 的证据边界写成规范性条件，而不是展示标签。
- **§5 Audit Flow**  
  在 Step 1 / 2 / 4 中加入：evidence channel 校验、interaction telemetry 校验、state reset proof 校验、environment attestation 校验。
- **§6 Dispute / Invalidation**  
  增加：`sealed bundle missing`、`state isolation unverifiable`、`interaction telemetry missing`、`release policy violation` 等争议触发项。
- **§7 Anti-Cheat Baseline**  
  将 memory/cache/KB、human intervention、sealed evidence、tamper-evident trace 的控制项升级为高信任 MUST。

### 6.4 `docs/ohbp-v0.1/modules/cli-adapter.md`（M5）

建议改动：

- **§2.2 Connected mode / Offline mode**  
  connected mode 下平台应下发 evidence channel 要求、release policy、是否必须 sealed、是否必须官方 attestation。
- **§4.2 init**  
  `study.json` 中增加 evidence visibility / release contract。
- **§4.3 run**  
  CLI / adapter 必须采集 `interaction-log.jsonl`、`environment-report.json`、`state-reset-report.json`、`cache-report.json`。
- **§4.4 pack**  
  `pack` 必须验证 public/sealed 两通道完整性、trace_root_hash、一致性绑定。
- **§4.5 upload**  
  `upload` 必须支持 public bundle 与 sealed audit bundle 的分别上传与 receipt 绑定。
- **§7 replay / reproduce**  
  增加：对 sealed bundle 的受控 replay/reproduce 支持；没有 sealed access 的外部复现者至少可对 public bundle 做有限 replay。

### 6.5 `docs/ohbp-v0.1/reviews/review-governance-redteam.md`

该文件不应直接修改为规范文本，但 draft2 整合时应逐条对照 reviewer B 的以下关切完成 closing：

- hidden split 双通道证据
- 高信任环境证明与 trace 防篡改
- autonomous 的 interaction telemetry
- cache / persistent memory / external KB 的隔离证明

---

## 7. 建议写入 draft2 的规范性短句（可直接整合）

为方便主控整合，下面给出可直接吸收的短句。

1. **关于双通道证据**  
   > 对 hidden / holdout / rotating split 的 Reproduced 与 Verified 结果，协议 MUST 同时存在 Public Bundle 与 Sealed Audit Bundle，并以 digest 绑定；Public Bundle MUST NOT 泄漏足以重构 hidden task 或 gold answer 的内容。

2. **关于高信任防篡改**  
   > Reproduced 与 Verified 结果 MUST 提供 container digest、network policy digest、artifact manifest、checksums 与 trace root hash；Verified 结果还 MUST 提供 attestation 或等价 official-runner 证明。

3. **关于 autonomy 证据边界**  
   > `autonomous`、`approval-only`、`interactive` 的判定 MUST 基于交互遥测而非上传者声明；缺少 interaction log 的结果不得进入 autonomous 的高信任切片。

4. **关于状态隔离**  
   > 通用主榜中的高信任结果 MUST 声明并证明 memory scope、cache namespace、state reset policy 与 external KB 边界；global memory/global cache 默认不得进入 general-purpose official board，除非该 lane 明确允许并单独分榜。

---

## 8. Worker D 的交付结论

本 repair packet 的核心不是“再加一些安全建议”，而是把治理要求收敛为四类**可编码、可上传、可审计、可分榜**的对象：

1. `public bundle` / `sealed audit bundle`
2. `environment-report` / `trace-integrity` / attestation
3. `interaction-log` / `interaction-summary`
4. `state-reset-report` / `cache-report`

**只要 draft2 把这四类对象真正落进 M3/M4/M5，并把关键字段升级为 MUST，IR-11～IR-14 就能从“原则风险”下降为“可验证治理约束”。**
