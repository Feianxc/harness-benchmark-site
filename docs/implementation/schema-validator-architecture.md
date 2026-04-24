# OHBP v0.1 Implementation Stage — Schema / Validator Architecture

> 角色：Design Worker D1  
> 范围：只定义 implementation-stage 的 schema 与 validator 架构，不改协议主稿，不写代码。  
> 上游基线：`E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1.md`

---

## 0. 设计立场

从正式 `v0.1` 出发，implementation-stage 的首要目标不是“把所有规则都塞进 JSON Schema”，而是把协议拆成三层可执行工件：

1. **Schema layer**
   - 负责对象形状、字段类型、枚举、条件必填的基础表达
   - 目标是把 prose-first 规则收敛成 machine-readable object contract

2. **Protocol semantics layer**
   - 负责 cross-file refs、digest 绑定、条件性 MUST、tier gate、autonomy gate、board admission prerequisite
   - 这层才是真正把 v0.1 的“MUST / MUST NOT”落成规则系统

3. **Evidence integrity layer**
   - 负责 `checksums.sha256`、bundle digest、trace hash chain、sealed/public 双通道、redaction、state reset / cache / external KB 证明
   - 目标是防止“结构合法但证据不可信”

因此，**JSON Schema 不是 validator 的替代品**；它只是 validator 的第一层。

同时，坚持协议已冻结的三条实现原则：

- **`manifest.json` 是 runtime identity 与 evidence join 的单一真源**
- **`verification_record` 是平台裁决真源，不是 CLI 自报真源**
- **raw workspace ≠ final bundle；validator 永远以 canonical final bundle 为检查对象**

---

## 1. 推荐的 monorepo 目录结构

推荐把 monorepo 分成 “schema / canonicalization / validator / fixtures / app surfaces” 五个稳定边界：

```text
/
  apps/
    hb-cli/
      # CLI 实现；只消费 schema/validator，不自行定义协议语义
    verifier-worker/
      # 平台侧 intake / replay / reproduce / verification worker
    web/
      # 薄网站 / research & scorecard surface；只消费平台裁决与派生数据

  packages/
    ohbp-schema/
      schema/
        common/
          base.schema.json
          digest.schema.json
          enums.schema.json
          refs.schema.json
          identity.schema.json
          time.schema.json
        protocol/
          benchmark-card.schema.json
          task-package.schema.json
          execution-contract.schema.json
          benchmark-health-record.schema.json
        bundle/
          manifest.schema.json
          aggregate.schema.json
          artifact-manifest.schema.json
          evaluator-report.schema.json
          run-group-registration.schema.json
          completeness-proof.schema.json
          interaction-summary.schema.json
          environment-report.schema.json
          trace-integrity.schema.json
          state-reset-report.schema.json
          cache-report.schema.json
          redactions.schema.json
          attestation.schema.json
        line-records/
          task-result-entry.schema.json
          interaction-log-entry.schema.json
          trace-session-index.schema.json
          trace-event.schema.json
        governance/
          verification-record.schema.json
          board-admission-policy.schema.json
          board-slice.schema.json
        catalogs/
          schema-catalog.v0.1.json
          object-ownership.v0.1.json
          conditional-requirements.v0.1.json

    ohbp-canonical/
      # 只放 canonicalization / digest / ref resolution 规则说明与后续实现
      docs/
        canonical-json-profile.md
        digest-materialization-profile.md
        bundle-digest-rules.md
        ref-resolution-rules.md

    ohbp-validator-core/
      # validator 引擎壳层
      docs/
        validation-context.md
        finding-model.md
        severity-model.md

    ohbp-validator-rules/
      rulepacks/
        schema-layer/
        protocol-semantics/
        evidence-integrity/
      catalogs/
        rule-catalog.v0.1.json
        tier-gates.v0.1.json

    ohbp-fixtures/
      registry-context/
        benchmark-cards/
        task-packages/
        execution-contracts/
        benchmark-health/
      bundles/
        goldens/
        mutants/
        sealed-companions/
      expected-reports/
        schema/
        semantics/
        integrity/

  docs/
    implementation/
      schema-validator-architecture.md
      cli-architecture.md
      web-prd.md
```

### 1.1 结构选择理由

#### A. `ohbp-schema` 单独成包

原因：schema 必须成为 CLI、verifier worker、网站、未来第三方实现共享的只读契约层。  
它不能埋在 CLI 内，否则 wrapper / platform / community tools 会再次发散。

#### B. `ohbp-canonical` 与 `ohbp-schema` 分离

原因：很多关键规则不是 schema 能表达的：

- `canonical_json`
- object digest 计算
- bundle digest 计算
- `$ref` / external ref 解析
- self-digest carrying object 的 digest materialization profile

这部分必须集中定义，避免 CLI 与平台各算各的 hash。

#### C. `ohbp-validator-core` 与 `ohbp-validator-rules` 分离

原因：引擎壳层应稳定，而规则集会随着 protocol version 演化。  
后续可以做到：

- `hb validate --protocol v0.1`
- 平台同时保留 `v0.1` / `v0.2` rulepack

#### D. fixtures 独立成包

原因：OHBP 的可信度不只来自 schema，也来自“每个 MUST 都有正反样例”。

#### E. app surface 只消费，不定义

`apps/hb-cli`、`apps/verifier-worker`、`apps/web` 一律不拥有 canonical field。  
它们只能消费 `ohbp-schema + ohbp-canonical + ohbp-validator-rules`。

---

## 2. 首批必须落地的 JSON Schema 列表与优先级

下面按 **MVP 必需程度** 分三档，而不是按协议章节机械排序。

### 2.1 P0 — 没有它就无法形成稳定 bundle / validation 主链

| Schema | 优先级 | 作用 | 备注 |
|---|---|---|---|
| `common/base.schema.json` | P0 | 通用元字段、版本字段、`$defs` 基础 | 所有 schema 的根 |
| `common/enums.schema.json` | P0 | canonical enums 唯一来源 | 避免重复枚举发散 |
| `common/identity.schema.json` | P0 | `study_id / run_group_id / attempt_id / bundle_id` 等 | `manifest` / `verification_record` 共享 |
| `protocol/benchmark-card.schema.json` | P0 | benchmark 对象 contract | registry-side object |
| `protocol/task-package.schema.json` | P0 | task package contract | digest 绑定入口 |
| `protocol/execution-contract.schema.json` | P0 | execution contract + tolerance policy | `tolerance_policy_ref` 的解析目标 |
| `bundle/manifest.schema.json` | P0 | runtime identity / refs / evidence join 真源 | MVP 中最核心 schema |
| `bundle/aggregate.schema.json` | P0 | run 级聚合统计 | 与 task results 对账 |
| `line-records/task-result-entry.schema.json` | P0 | `task-results.ndjson` 每行 object | NDJSON 逐行校验 |
| `bundle/artifact-manifest.schema.json` | P0 | artifact 列表与路径/摘要索引 | 与 `checksums.sha256` 对账 |
| `bundle/evaluator-report.schema.json` | P0 | evaluator 输出摘要 | score / failure / denominator 源之一 |
| `bundle/run-group-registration.schema.json` | P0 | preregistration object | Reproduced / Verified 主入口 |
| `bundle/completeness-proof.schema.json` | P0 | run-group 完整性证明 | 平台/复验主入口 |
| `governance/verification-record.schema.json` | P0 | 平台裁决对象 | 网站与官方榜单真源 |

### 2.2 P1 — 高信任 tier 的硬门槛对象

| Schema | 优先级 | 作用 | 备注 |
|---|---|---|---|
| `bundle/interaction-summary.schema.json` | P1 | autonomy verdict 输入对象 | `verification_record.autonomy_mode` 的主要依据 |
| `line-records/interaction-log-entry.schema.json` | P1 | interaction 日志逐行 contract | autonomy 降级规则需要 |
| `bundle/environment-report.schema.json` | P1 | 环境完整性证明 | Reproduced / Verified 必备 |
| `bundle/trace-integrity.schema.json` | P1 | trace 根哈希 / 链完整性对象 | evidence integrity 主入口 |
| `line-records/trace-session-index.schema.json` | P1 | trace 文件索引 | trace 完整性对账 |
| `line-records/trace-event.schema.json` | P1 | trace event 逐行 contract | per-event hash chain 校验 |
| `bundle/redactions.schema.json` | P1 | public/sealed 差异声明 | dual-channel 必需 |
| `bundle/state-reset-report.schema.json` | P1 | memory/cache reset 证明 | 高信任治理门槛 |
| `bundle/cache-report.schema.json` | P1 | cache / external KB 声明 | general-purpose eligibility 需要 |
| `bundle/attestation.schema.json` | P1 | Verified 强证明对象 | 平台控制环境 / attested runner |

### 2.3 P2 — 平台派生层与后续网站能力

| Schema | 优先级 | 作用 | 备注 |
|---|---|---|---|
| `protocol/benchmark-health-record.schema.json` | P2 | benchmark health 快照对象 | 平台发布策略和 UI 警告 |
| `governance/board-admission-policy.schema.json` | P2 | 排榜与 admission policy | 主用于平台 |
| `governance/board-slice.schema.json` | P2 | slice 派生对象 | 不应阻塞 CLI MVP |

### 2.4 落地顺序建议

建议不是“一次把全部 schema 写完”，而是分三波：

#### Wave 1：CLI `pack/validate/upload` 最小闭环

- `benchmark-card`
- `task-package`
- `execution-contract`
- `manifest`
- `aggregate`
- `task-result-entry`
- `artifact-manifest`
- `evaluator-report`
- `run-group-registration`

#### Wave 2：高信任校验闭环

- `completeness-proof`
- `interaction-summary`
- `interaction-log-entry`
- `environment-report`
- `trace-integrity`
- `trace-session-index`
- `trace-event`
- `verification-record`

#### Wave 3：sealed / governance / website 细化

- `redactions`
- `state-reset-report`
- `cache-report`
- `attestation`
- `benchmark-health-record`
- `board-admission-policy`
- `board-slice`

---

## 3. Schema 间引用关系、digest / ref / cross-file consistency 校验点

## 3.1 总体关系图

实现上，推荐把 validator 的引用关系理解为四条主链：

```text
Benchmark / Task / Contract registry
  -> manifest.json
  -> run-group-registration.json
  -> completeness-proof.json
  -> verification-record.json

public final bundle
  -> checksums.sha256
  -> manifest.evidence.public_bundle_digest
  -> verification_record.subject_bundle_digest

sealed audit bundle (optional but high-trust critical)
  -> sealed checksums.sha256
  -> manifest.evidence.sealed_audit_bundle_digest
  -> verification_record.sealed_audit_bundle_digest

interaction / trace / environment reports
  -> autonomy verdict
  -> integrity verdict
  -> trust tier eligibility
```

## 3.2 推荐的 ref ownership 原则

### A. bundle 内对象的 join surface 一律经 `manifest.json`

任何消费以下信息的模块，都必须先读 `manifest.json`：

- registration
- tolerance policy
- requested trust tier
- repeatability class
- evidence channel
- public / sealed digests

也就是：

- CLI `inspect`
- bundle validator
- verifier pipeline
- board slice builder

都 **不得** 绕过 `manifest.json` 去直接抓自由浮动字段。

### B. 裁决对象由 `verification_record` 统一绑定

`verification_record.subject_ref` 是平台 adjudication anchor。  
它不只是“引用一个 bundle”，而是冻结：

- `subject_type`
- `study_id`
- `run_group_id`
- `attempt_id`
- `bundle_id`

这组 run identity 必须逐项与 `manifest.json` 对齐。

### C. JSON Schema 不承担 digest 真实性，只承担 digest 字段 contract

例如 schema 可以表达：

- 这是一个 SHA-256 字符串
- 该字段必须存在
- 某个条件下必须成对存在

但不能表达：

- digest 是否真的是按 canonical material 算出来
- cross-file 是否一致
- public bundle digest 是否与 `checksums.sha256` 真正匹配

这些都必须落到 validator 规则层。

## 3.3 必须实现的 cross-file consistency 校验点

下面列的是 MVP 必须有的 consistency 规则。

### 3.3.1 Registry / bundle binding

1. **`manifest.benchmark.id/version/split/lane_id`**
   - 必须与外部 benchmark card context 一致

2. **`manifest.task_package_digest`**
   - 必须能在 task package context 中重算并匹配

3. **`manifest.execution_contract_digest`**
   - 必须能在 execution contract context 中重算并匹配

4. **`manifest.tolerance_policy_ref`**
   - canonical 值固定为 `execution_contract#/verification_policy/tolerance_policy`
   - validator 必须能解析到 execution contract 内部对象

5. **`manifest.tolerance_policy_digest`**
   - 必须等于被 `tolerance_policy_ref` 解析出的 tolerance policy object digest

### 3.3.2 Registration / completeness binding

6. **`manifest.registration_ref`**
   - canonical 值固定为 `run-group-registration.json`
   - 若为 `null`，bundle 不得声称是 Reproduced / Verified candidate

7. **`manifest.registration_digest`**
   - 必须等于 registration object 的 canonical digest

8. **`manifest.requested_trust_tier`**
   - 必须等于 `run-group-registration.json.requested_trust_tier`

9. **`manifest.repeatability_class`**
   - 必须等于 `run-group-registration.json.repeatability_class`

10. **`completeness-proof.json.registration_digest`**
    - 必须等于 `manifest.registration_digest`

11. **`completeness-proof.json.run_group_id`**
    - 必须等于 `manifest.run_identity.run_group_id`

### 3.3.3 Evidence channel binding

12. **`manifest.evidence.public_bundle_digest`**
    - 必须等于 `sha256(utf8_bytes(checksums.sha256))`

13. **`public_plus_sealed`**
    - `public_bundle_digest` 与 `sealed_audit_bundle_digest` 必须同时存在

14. **sealed digest**
    - 必须以 sealed companion bundle 的 `checksums.sha256` 用同一算法重算

15. **`visibility_class != public_full` 或 `evidence_channel_mode = public_plus_sealed`**
    - `redaction_policy_id` 必须存在

16. **public bundle 发生 redaction / omission**
    - `redactions.json` 必须存在，且路径覆盖必须能解释：
      - `task-results.ndjson`
      - `trace/events/*`
      - `payloads/*`
      - `interaction-log.jsonl`
      中被隐藏/替换的内容

### 3.3.4 Verification binding

17. **`verification_record.subject_ref.subject_type`**
    - 必须固定为 `attempt_bundle`

18. **`verification_record.subject_ref.*`**
    - `study_id / run_group_id / attempt_id / bundle_id`
    - 必须逐项等于 `manifest.json` 的 run identity

19. **`verification_record.subject_bundle_digest`**
    - 必须等于 verifier 侧对 public bundle 的重算 digest

20. **`verification_record.public_bundle_digest`**
    - 正常情况下必须等于 `manifest.evidence.public_bundle_digest`
    - 若不一致，必须同时存在 correction / dispute reason code

21. **`verification_record.sealed_audit_bundle_digest`**
    - 若存在 sealed 通道，正常情况下必须等于 `manifest.evidence.sealed_audit_bundle_digest`
    - 若不一致，也必须要求 correction / dispute reason code

22. **`verification_record.interaction_summary_digest`**
    - 必须可由 `interaction-summary.json` 重算得到

### 3.3.5 Autonomy / interaction binding

23. **`interaction-summary.json` 与 `interaction-log.jsonl`**
    - event counts 必须能对账

24. **`approval_only`**
    - 必须满足无 freeform input、无 manual command/file write/editor write、且 `approval_target_linkage_complete = true`

25. **`interactive` 自动降级**
    - 任一自动降级触发条件成立时，validator 必须拒绝 `autonomous` / `approval_only` 的更高展示资格

26. **`tty_input_digest = ZERO_INPUT_V1`**
    - 仅在无任何人类 TTY 文本输入时允许

### 3.3.6 Trace / environment / state binding

27. **`trace-integrity.trace_root_hash`**
    - 必须与 trace files 重算一致

28. **`event_chain_complete = true`**
    - 必须满足二选一：
      - `event_hash_chain_mode = per_event_hash_chain`
      - `attested_trace_contract_ref` 可解析且有效

29. **`environment-report.network_proxy_log_digest`**
    - 若环境允许联网，应能在证据物料中找到对应对象或 receipt

30. **`state-reset-report.cache_namespace`**
    - 应与 `cache-report.cache_namespace` 一致

31. **`cache-report.external_kb_enabled = true`**
    - `external_kb_digest_list` 必须非空；否则结果不得进入高信任层

## 3.4 digest / canonicalization 的实现注意点

implementation-stage 必须单独定义 `digest materialization profile`，否则会踩两类坑：

### 坑 A：self-digest carrying object 的循环哈希

协议对象里存在类似：

- `registration_digest`

这类“对象内携带自身 digest”的字段。  
如果实现时直接对“包含 digest 字段的完整 JSON”做哈希，会产生循环定义。

因此建议在 `ohbp-canonical` 中冻结：

- **object-specific digest projection profile**

即：明确哪些字段参与 object digest materialization，哪些字段是随 digest 回填的 envelope field。  
这不是修改协议语义，而是把实现时必须一致的哈希投影规则集中定义。

### 坑 B：bundle digest 与 object digest 混淆

必须强制区分：

- **object digest**
  - 来自 `canonical_json(object projection)`

- **bundle digest**
  - 来自 `sha256(utf8_bytes(checksums.sha256))`

这二者不可混用，字段命名也不能复用。

---

## 4. Validator 的 rule layers

推荐把 validator 设计成“同一 finding 模型，不同 rule layers 叠加执行”的架构。

## 4.1 输入上下文

validator 不应只接收一个 bundle path；应接收一个 **Validation Context**：

```text
ValidationContext
  - protocol_version
  - public_bundle_root
  - sealed_bundle_root (optional)
  - registry_context
    - benchmark_card
    - task_package
    - execution_contract
    - benchmark_health_snapshot (optional in MVP)
  - platform_context
    - verification_record (optional for local validate; required for platform adjudication)
  - validation_mode
    - local_pack
    - local_validate
    - platform_intake
    - reproduced_audit
    - verified_audit
```

这样 CLI 与平台可以共用一套规则，但按 mode 决定必须项。

## 4.2 Layer 1 — Schema layer

### 职责

- 校验 JSON object shape
- 校验 required fields / enums / formats
- 校验 NDJSON 每行记录的 object shape
- 校验文件名是否命中 canonical 名称

### 适合放在这层的规则

- `manifest.json` 必填字段
- `verification_record.subject_ref.subject_type` 枚举必须是 `attempt_bundle`
- `requested_trust_tier` / `trust_tier` / `publication_state` / `autonomy_mode` 枚举合法
- `interaction-summary.json` 必须包含各计数字段

### 不应放在这层的规则

- digest 是否真的匹配
- `approval_only` 是否应降级成 `interactive`
- `public_plus_sealed` 是否真的有 companion sealed bundle
- `trace_root_hash` 是否能重算

## 4.3 Layer 2 — Protocol semantics layer

### 职责

- 执行 cross-file refs 与 conditional MUST
- 执行 trust-tier gate / repeatability gate / publication gate
- 执行 manifest 作为单一 join surface 的语义检查
- 执行 autonomy 与 slice 资格的协议逻辑

### 适合放在这层的规则

- `manifest.registration_ref = null` 时禁止声称高信任候选
- `pseudo_repeated` 时必须有 `submission_window` / `request_template_hash` / `provider_snapshot_lock` 或 `provider_release_window`
- `public_plus_sealed` 时必须要求 sealed digest 字段
- hidden / holdout / rotating split 的高信任结果必须使用 dual-channel evidence
- 缺失 interaction telemetry 时不得进入 `autonomous` / `approval_only` slice

### 输出形式

建议产出：

- `rule_id`
- `severity`
- `subject_ref`
- `object_path`
- `decision_effect`
  - `reject_bundle`
  - `downgrade_tier_eligibility`
  - `downgrade_autonomy_mode`
  - `mark_ineligible_for_slice`
  - `warn_only`

## 4.4 Layer 3 — Evidence integrity layer

### 职责

- 重算 hash / digest
- 验证 checksums 覆盖面
- 验证 public / sealed 对称性
- 验证 trace hash chain / attested trace contract
- 验证 redaction 声明是否闭环
- 验证 environment / state reset / cache / external KB 证明材料

### 适合放在这层的规则

- `public_bundle_digest` 是否真等于当前 bundle 的 `checksums.sha256`
- `subject_bundle_digest` 是否等于 verifier 重算值
- `trace_root_hash` 是否由 trace 文件集合重建成功
- `event_chain_complete = true` 时每个 event 是否都可串到链上
- `redactions.json` 是否完整覆盖被省略路径
- `state_reset_proof` 是否存在且与 reset verdict 一致

### 这层的实现原则

- 只信原始证据，不信摘要自报
- 所有“可重算”的结论都必须重算
- 所有“只由平台可见”的 sealed 证据都必须有独立 digest 与可审计访问轨迹

## 4.5 建议的 validator 输出模型

建议统一输出一个 machine-readable `ValidationReport`：

```text
ValidationReport
  - protocol_version
  - validation_mode
  - bundle_digest
  - overall_verdict
  - findings[]
  - derived_effects
  - computed_digests
  - object_inventory
```

其中 `findings[]` 最少包括：

- `finding_id`
- `rule_id`
- `layer`
- `severity`
- `message`
- `object_ref`
- `path`
- `expected`
- `observed`
- `blocking`

这样 CLI、平台 intake、网站 research view 可以共用同一结果结构。

---

## 5. 适合作为 v0.1 MVP 的 sample bundle / fixture 策略

fixture 设计必须遵循一个原则：

> **不要做一个巨大但没人敢改的 demo bundle；要做一组“小而全、可变异、每条规则可定位”的 goldens + mutants。**

## 5.1 fixture 分层

### A. Golden fixtures（正例）

至少应有以下 6 组：

1. **`community-minimal-public-only`**
   - 最小 public bundle
   - 无 registration / completeness / verification_record
   - 用于验证 CLI 基础产物

2. **`reproduced-true-seeded-complete`**
   - 有 registration / completeness / interaction / environment / trace
   - `repeatability_class = true_seeded`

3. **`reproduced-pseudo-repeated-complete`**
   - 明确包含：
     - `submission_window`
     - `randomness_fingerprint_hint`
     - `request_template_hash`
     - `provider_snapshot_lock` 或 `provider_release_window`

4. **`verified-hidden-public-plus-sealed`**
   - hidden/holdout/rotating lane
   - public bundle 为 redacted / summary
   - sealed companion bundle 完整存在

5. **`verified-approval-only`**
   - interaction telemetry 完整
   - 可以合法分类为 `approval_only`

6. **`verified-interactive-downgraded`**
   - bundle 结构合法，但因 freeform input / manual command 等被自动降级为 `interactive`
   - 用于证明 validator 不只是“看上传者声明”

### B. Mutant fixtures（反例）

每个 mutant 只破坏一条关键规则，方便精确回归：

1. `missing-registration-for-reproduced`
2. `registration-digest-mismatch`
3. `tolerance-policy-digest-mismatch`
4. `completeness-run-group-mismatch`
5. `sealed-required-but-missing`
6. `redaction-without-redactions-json`
7. `subject-ref-mismatch`
8. `subject-bundle-digest-mismatch`
9. `interaction-summary-log-count-mismatch`
10. `approval-only-with-freeform-input`
11. `trace-root-hash-broken`
12. `event-chain-incomplete-but-claimed-complete`
13. `external-kb-enabled-without-digests`
14. `global-cache-on-general-board`

### C. Registry context fixtures

由于 bundle 不能单独解释全部 ref，fixtures 必须附带 companion registry context：

- benchmark card
- task package
- execution contract
- optional benchmark health snapshot

### D. Expected validation reports

每个 fixture 都要配一份期望输出：

- pass/fail
- expected finding codes
- expected tier eligibility effect
- expected autonomy effect

这能让 schema 改动与 rule 改动都可做快照回归。

## 5.2 fixture 内容策略

### 必须做的事

- 全部使用合成任务与合成 trace
- 不放真实 hidden benchmark 内容
- 保持体积小，适合 CI
- 所有 digests 固定可复算

### 不要做的事

- 不要只保留一个“超大准真实 bundle”
- 不要让 fixture 依赖真实线上 provider
- 不要把 sealed fixture 做成不可本地复验的黑盒

## 5.3 MVP 推荐的最小 fixture 矩阵

如果实现周期很紧，最小可先做 8 个：

- 4 个 goldens：
  - `community-minimal-public-only`
  - `reproduced-true-seeded-complete`
  - `reproduced-pseudo-repeated-complete`
  - `verified-hidden-public-plus-sealed`

- 4 个 mutants：
  - `registration-digest-mismatch`
  - `sealed-required-but-missing`
  - `subject-ref-mismatch`
  - `trace-root-hash-broken`

这 8 个已经足以覆盖 v0.1 的主要协议骨架。

---

## 6. 评审清单

后续任何 schema / validator 设计变更，建议按以下清单审核。

## 6.1 Schema 设计评审清单

1. **字段归属**
   - 这个字段是否有唯一 canonical owner object？
   - 是否在别的对象里重复定义成第二真源？

2. **协议对齐**
   - 该字段是否能在 `ohbp-v0.1.md` 中找到明确出处？
   - 若只是实现便利字段，是否清楚标记为 non-canonical / derived？

3. **枚举统一**
   - 是否复用了 `common/enums.schema.json`？
   - 是否偷偷发明了 alias 或展示层枚举？

4. **条件必填**
   - 该条件是 schema 可表达的，还是应进入 semantics layer？
   - 是否已经写入 `conditional-requirements.v0.1.json`？

5. **版本边界**
   - 新字段是 patch 级增加、还是会改变 protocol meaning？
   - 是否需要 schema catalog 升版本？

## 6.2 Validator 规则评审清单

1. **规则归层**
   - 这条规则属于 schema / semantics / integrity 哪一层？
   - 是否被错误地塞进 JSON Schema？

2. **来源唯一**
   - 规则是否以 `manifest.json` 为 join surface？
   - 是否绕过 manifest 直接读自由浮动字段？

3. **可重算性**
   - 这条结论是否应该由 validator 重算，而不是信上传方自报？

4. **决策影响**
   - 规则触发后，是 reject、downgrade、mark ineligible 还是 warn？
   - 这种 effect 是否稳定可复现？

5. **research view 可追溯**
   - 用户能否在 research view 里看到触发该规则的证据路径与 finding code？

## 6.3 Fixture / 回归评审清单

1. 新 schema 是否新增了至少一个 golden 或 mutant？
2. 新 rule 是否新增了对应 expected report？
3. 是否有“一条规则只坏一个地方”的最小反例？
4. 是否意外引入对真实 provider / 私有 benchmark 内容的依赖？
5. sealed 与 public 的差异是否有对称样例？

## 6.4 风险评审清单

以下四类问题如果出现，应视为 implementation-stage 的高风险信号：

1. **第二真源回流**
   - CLI、网站、verifier 各自重新解释 `trust_tier` / `autonomy_mode` / `evidence_channel`

2. **schema 过度膨胀**
   - 试图用 JSON Schema 表达所有跨文件与 hash 规则，导致规则失真

3. **fixture 装饰化**
   - 有 demo，没有 mutants，没有回归基线

4. **digest 规则不集中**
   - CLI 一套算 hash，平台一套算 hash，最终导致 bundle 永久争议

---

## 7. 最终建议（供 CLI / 平台 / 网站后续团队共享）

1. **先把 schema package、canonicalization rules、validator layers 三件套锁住，再写 CLI。**
2. **`manifest.json`、`run-group-registration.json`、`verification-record.json` 是 v0.1 的三根主锚点。**
3. **`JSON Schema = 结构合同`，`validator rules = 协议真义`，两者绝不能混写。**
4. **fixture 必须从第一天就和 schema/validator 同步建设，否则后面只会出现“看起来能跑”的假稳定。**
5. **网站和 CLI 都不应该定义协议；它们只应该消费 `schema + canonical + validator report`。**

