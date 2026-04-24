# OHBP v0.1 实现蓝图（Build Blueprint）

> 状态：implementation kickoff blueprint  
> 日期：2026-04-21  
> 上游基线：
> - `docs/ohbp-v0.1/ohbp-v0.1.md`
> - `docs/implementation/schema-validator-architecture.md`
> - `docs/implementation/cli-validator-architecture.md`
> - `docs/implementation/web-prd-mvp.md`
> - `docs/implementation/architecture-review.md`

---

## 1. 结论先行

实现阶段正式采用 **TypeScript monorepo**，并冻结以下执行原则：

1. **协议真源不在网站，不在 CLI，而在共享包**
   - `@ohbp/schema`
   - `@ohbp/canonical`
   - `@ohbp/types`
   - `@ohbp/validator-core`
   - `@ohbp/validator-rules`
   - `@ohbp/verifier-core`
   - `@ohbp/view-models`

2. **`manifest.json` 是 bundle 侧唯一 join surface**
   - registration
   - tolerance policy
   - repeatability
   - evidence channel
   - public / sealed digests
   都只允许经 `manifest.json` 进入消费层。

3. **`verification_record` 是平台裁决真源**
   - `trust_tier`
   - `publication_state`
   - `autonomy_mode`
   - `subject_ref`
   - `subject_bundle_digest`
   只能由 verifier 侧生成。

4. **`pack` 是 raw workspace → final bundle 的唯一 canonicalization 边界**
   - `run` 只负责 raw outputs
   - `validate` 只做确定性检查
   - `verifier` 才做裁决

5. **实施顺序必须严格执行**
   - Phase A: schema + canonical + fixtures
   - Phase B: validator
   - Phase C: CLI core
   - Phase D: mock intake + verifier
   - Phase E: web MVP
   - Phase F: review + hardening + polish

---

## 2. 目标交付物

本轮 implementation MVP 的成功标准是：

1. 建成 monorepo 骨架并完成 `npm install`
2. 有一套共享 schema / canonical / validator / verifier / view models 真源
3. CLI 可打通：
   - `hb doctor`
   - `hb init`
   - `hb run`
   - `hb pack`
   - `hb validate`
   - `hb inspect`
   - `hb upload --dry-run`
4. mock intake / verifier 可产出：
   - `UploadReceipt`
   - `completeness-proof`
   - `verification-record`
   - board / entry 页面可消费的派生视图
5. 网站可展示：
   - `/`
   - `/boards/official-verified`
   - `/boards/reproducibility-frontier`
   - `/boards/community-lab`
   - `/entries/[entry_id]`
   - `/protocol`
   - `/playground/validator`

---

## 3. Monorepo 冻结结构

```text
apps/
  hb-cli/
  mock-intake/
  verifier-worker/
  web/
packages/
  schema/
  canonical/
  types/
  validator-core/
  validator-rules/
  verifier-core/
  fixtures/
  view-models/
registry/
  sample/
tooling/
  scripts/
docs/
  implementation/
  ohbp-v0.1/
```

### 3.1 包职责

#### `@ohbp/schema`
- JSON Schema 2020-12
- canonical object shape
- schema catalog

#### `@ohbp/canonical`
- canonical JSON stringify
- object digest
- bundle digest
- checksums parser
- ref resolution helpers

#### `@ohbp/types`
- 共享 TypeScript contracts
- schema / protocol / validator / verifier / web 共享类型

#### `@ohbp/validator-core`
- `ValidationContext`
- `ValidationReport`
- finding / severity / derived effects
- rule execution engine

#### `@ohbp/validator-rules`
- schema layer rules
- protocol semantics rules
- evidence integrity rules

#### `@ohbp/verifier-core`
- upload receipt
- completeness proof generation
- verification record generation
- board / entry 派生逻辑

#### `@ohbp/fixtures`
- goldens
- mutants
- sample raw workspaces
- sample registry context
- expected reports

#### `@ohbp/view-models`
- `BoardSliceView`
- `EntryScorecardView`
- `EntryResearchView`
- `ProtocolObjectIndex`
- `ValidatorIssueView`

### 3.2 App 职责

#### `apps/hb-cli`
- 用户入口
- 不持有协议真义
- 只能调用共享包

#### `apps/mock-intake`
- mock 上传入口
- 存 receipt
- 转交 verifier worker

#### `apps/verifier-worker`
- 调用 `@ohbp/verifier-core`
- 生成 platform-side derived outputs

#### `apps/web`
- Next.js 薄网站 + BFF
- 只消费 `@ohbp/view-models`
- 不重造 ranking / trust / evidence 语义

---

## 4. 共享对象清单（冻结）

以下对象属于 monorepo shared contracts，不允许 app 私造平行版本：

### 4.1 Protocol Objects
- `benchmark-card`
- `task-package`
- `execution-contract`
- `manifest`
- `aggregate`
- `artifact-manifest`
- `evaluator-report`
- `task-result-entry`
- `run-group-registration`
- `completeness-proof`
- `interaction-summary`
- `environment-report`
- `trace-integrity`
- `verification-record`

### 4.2 Validation Objects
- `ValidationContext`
- `ValidationFinding`
- `ValidationReport`
- `DerivedEffect`

### 4.3 Platform / Upload Objects
- `UploadRequest`
- `UploadReceipt`
- `StoredSubmission`

### 4.4 Web View Models
- `BoardSliceView`
- `BoardEntrySummaryView`
- `EntryScorecardView`
- `EntryResearchView`
- `ProtocolObjectIndex`
- `ProtocolFieldGlossaryEntry`
- `ValidatorRunView`

---

## 5. Ownership 冻结表

| 对象 / 产物 | Owner | 消费者 | 备注 |
|---|---|---|---|
| raw workspace | `hb run` | `hb pack` | 不可直接作为公开结果 |
| final bundle | `hb pack` | validator / upload / verifier | canonical input |
| validation report | validator | CLI / playground / intake gate | 确定性结果 |
| upload receipt | mock intake | CLI / web | intake 结果 |
| completeness proof | verifier | web / research view | 平台生成 |
| verification record | verifier | boards / entry detail | 平台真源 |
| board / entry view models | verifier/BFF | web | 只派生不手写 |

---

## 6. 阶段 Gate（冻结）

## Phase A — Schema + Canonical + Fixtures

### 必做
- 建立核心 schema
- 建立 digest / canonical helpers
- 建立 goldens + mutants

### Gate
- 至少 4 个 goldens 和 4 个 mutants 可被测试读取
- `manifest` / `verification-record` / `run-group-registration` / `completeness-proof` 有稳定结构

## Phase B — Validator

### 必做
- Validation engine
- schema / semantics / integrity 三层规则
- 机器可读报告

### Gate
- goldens 全 pass
- mutants 按预期 fail
- 报告包含稳定 rule id / severity / derived effects

## Phase C — CLI Core

### 必做
- `doctor`
- `init`
- `run`
- `pack`
- `validate`
- `inspect`

### Gate
- sample raw workspace 可 pack 成稳定 bundle
- 同输入重复 pack 产出相同 bundle digest
- CLI 不越权生成 `verification_record`

## Phase D — Upload + Mock Verifier

### 必做
- `upload --dry-run`
- mock endpoint
- verifier worker
- completeness / verification / board projections

### Gate
- 本地 bundle 可进入 mock intake
- 可生成 subject-bound `verification_record`

## Phase E — Web MVP

### 必做
- 主页
- 三层 board
- entry detail
- protocol
- validator playground

### Gate
- 前端仅消费 view models / BFF
- Entry Detail 一跳可达 research
- 不暴露 sealed 原始内容

## Phase F — Review + Hardening

### 必做
- 多 AGENT review
- 修 P1 / P2
- 跑全链路 smoke

### Gate
- 无第二真源
- 无 validator / verifier 越权重叠
- CLI + mock intake + web 全链路可运行

---

## 7. 首批 fixture 矩阵

### Goldens
1. `community-minimal-public-only`
2. `reproduced-true-seeded-complete`
3. `reproduced-pseudo-repeated-complete`
4. `verified-hidden-public-plus-sealed`

### Mutants
1. `registration-digest-mismatch`
2. `sealed-required-but-missing`
3. `subject-ref-mismatch`
4. `trace-root-hash-broken`

### Sample raw workspaces
1. `sample-terminal-lite-run`
2. `sample-community-run`

---

## 8. 子 AGENT 写入边界（本轮）

### Worker I1 — schema/core
**Owner**
- `packages/schema`
- `packages/canonical`
- `packages/types`
- `packages/fixtures`

**禁止**
- 修改 CLI app
- 修改 web app

### Worker I2 — validator/cli
**Owner**
- `packages/validator-core`
- `packages/validator-rules`
- `apps/hb-cli`

**禁止**
- 修改 web app
- 修改 schema canonical 真源定义

### Worker I3 — platform/web
**Owner**
- `packages/verifier-core`
- `packages/view-models`
- `apps/mock-intake`
- `apps/verifier-worker`
- `apps/web`

**禁止**
- 修改 schema canonical 真源定义
- 修改 CLI 命令契约

### 主控
**Owner**
- 根级 workspace 配置
- cross-package integration
- 阶段 gate 执行
- review 整合

---

## 9. Hot Files

以下文件为高冲突面，优先只由主控维护：

- `/package.json`
- `/tsconfig.base.json`
- `/vitest.workspace.ts`
- `/README.md`
- `/docs/implementation/build-blueprint.md`

---

## 10. 当前执行顺序

1. 主控初始化根骨架
2. 并行拉起 I1 / I2 / I3
3. 主控整合并修热文件冲突
4. 拉起 review team
5. 修复 review issues
6. 跑真实 smoke：
   - `npm install`
   - `npm test`
   - `npm run build`
   - CLI sample run
   - mock upload/verifier
   - web pages smoke

---

## 11. Stop Condition（本轮）

本轮“实现成功”的最小定义：

1. 代码仓已形成可运行 monorepo
2. CLI 主链已可跑通
3. mock verifier 已能产出裁决对象
4. 网站 7 个核心页面可启动并读到真实结构化数据
5. 至少有一轮实现 review 与修正闭环

