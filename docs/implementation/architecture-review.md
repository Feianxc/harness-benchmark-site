# Architecture Review R1 — OHBP implementation monorepo blueprint

> 角色：Architecture Reviewer R1  
> 范围：仅评审 implementation blueprint 是否能收敛成一个可执行 monorepo build blueprint；不改协议主稿，不写实现代码。  
> 评审输入：
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/implementation/schema-validator-architecture.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/implementation/cli-validator-architecture.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/implementation/web-prd-mvp.md`
> - `E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1.md`

---

## 1. 结论先说

**结论：这三份实现设计可以收敛成一个可执行的 TypeScript monorepo build blueprint，而且方向是对的；但在真正开工前，主控必须先统一“包边界、对象真源、派生接口、阶段闸门”四件事，否则会很快在 package 命名、validator/verifier 职责、Web 消费对象上出现第二真源。**

更具体地说：

1. **`schema-validator-architecture.md`** 已经给出了最稳的协议工程骨架：
   - schema / canonical / rules 三层拆分
   - `manifest.json` 作为 join surface
   - fixture-first
   - validator 三层执行模型

2. **`cli-validator-architecture.md`** 给出了最合理的落地顺序：
   - 先打通 `init -> run -> pack -> validate -> inspect -> upload(mock)`
   - `pack` 是 raw workspace 到 canonical final bundle 的唯一归一化边界
   - validator 与 verifier 必须严格分层

3. **`web-prd-mvp.md`** 给出了正确的网站定位：
   - 网站必须是薄网站
   - 默认入口是 Official Verified Board
   - Entry Detail / Protocol / Validator Playground 是 MVP 核心页
   - 前端只能消费 schema 与 BFF 视图模型，不能重造协议语义

因此，**这三份文档不是互相冲突，而是分别覆盖了“协议工程骨架 / CLI 主线 / 网站呈现层”三段。**

但目前它们还没有自动收敛为“同一份实施蓝图”，主要缺在以下 4 个统一动作：

- **统一 monorepo package 命名与 owner 边界**
- **统一 CLI / validator / verifier / web 之间的共享对象清单**
- **统一 mock verifier / BFF / Website 所依赖的派生物 contract**
- **统一阶段闸门与验收标准**

如果这 4 项先收口，那么 implementation 可以直接进入执行；如果不先统一，后面会在“类型定义看似相同，实际语义不同”上反复返工。

---

## 2. 哪些设计决策应直接采纳

以下设计决策建议**直接采纳，不再反复讨论**。

### 2.1 协议工程层：直接采纳

#### A. 三件套拆分
直接采纳：
- `schema`
- `canonical`
- `validator-rules`

理由：这和 `ohbp-v0.1.md` 的 object-first / evidence-first 结构完全一致。JSON Schema 只表达结构合同，digest / cross-file / tier gate 不能硬塞进 schema。

#### B. `manifest.json` 是 bundle 侧唯一 join surface
直接采纳：
- registration
- tolerance policy
- repeatability
- evidence channel
- public / sealed digests
- run identity

都先经 `manifest.json` 进入消费层。CLI、validator、verifier、web 都不得绕过它直接抓“自由浮动字段”。

#### C. `verification_record` 是平台裁决真源
直接采纳：
- `trust_tier`
- `publication_state`
- `autonomy_mode`
- `subject_ref`
- `subject_bundle_digest`

都只能由 verifier 产出，不能由 CLI 或网站自报。

#### D. raw workspace ≠ final bundle
直接采纳：
- `run` 只负责 raw outputs
- `pack` 是唯一 canonicalization 边界
- validator 永远检查 final bundle，不直接裁决 raw workspace

这是整个实现闭环最重要的工程边界之一。

#### E. fixtures-first
直接采纳：
- goldens + mutants
- registry context fixtures
- expected validation reports

如果第一周不做 fixtures，后面的 schema / validator / verifier 都会进入“能跑但不可信”的状态。

### 2.2 CLI / platform flow：直接采纳

#### A. MVP 主线只打通 6+1 命令
直接采纳：
- `hb doctor`
- `hb init`
- `hb run`
- `hb pack`
- `hb validate`
- `hb inspect`
- `hb upload --dry-run|--endpoint <mock>`

这条主线足以构成 implementation MVP 的闭环，优先级明显高于 `replay / reproduce` 的完整实现。

#### B. validator 与 verifier 严格分层
直接采纳：
- validator：本地确定性校验
- verifier：平台裁决 / completeness / trust / publication / autonomy

这是防止 CLI 越权“冒充平台”的关键边界。

#### C. mock intake / mock verifier 先行
直接采纳：
- 不一开始就做复杂后端
- 先让上传、receipt、verification outputs、scorecard/research 派生物打通

这能让前端尽早消费真实派生对象，而不是被迫靠假数据猜协议。

### 2.3 网站 / 产品面：直接采纳

#### A. 网站是薄网站
直接采纳：
- 网站不是协议真源
- 网站不是执行面
- 网站不是 sealed evidence 浏览器

#### B. 默认入口是 Official Verified Board，同时保留 Frontier / Community
直接采纳：
- Official Verified Board
- Reproducibility Frontier
- Community Lab

这和协议里的 `trust_tier` / `publication_state` / slice gate 完全一致，也正确处理了冷启动空心期。

#### C. Entry Detail / Protocol / Validator Playground 是 MVP 主轴
直接采纳：
- Entry Detail：scorecard / research 双视图
- Protocol：规范浏览器
- Validator Playground：公共自助校验

这三页比“炫酷首页”更关键，应该优先。

#### D. 前端只消费 BFF / shared view models
直接采纳：
- 不在前端计算 ranking 语义
- 不在前端再发明 `trust_tier` / `publication_state` / `evidence_channel`
- scorecard 必须从 research projection 派生

---

## 3. 哪些地方需要主控在实施蓝图中统一

这部分是当前最需要主控拍板的内容。

### 3.1 统一 package 命名与 owner 边界

三份设计文档在“职责边界”上基本一致，但在包名上还未统一：

- D1 偏向：
  - `ohbp-schema`
  - `ohbp-canonical`
  - `ohbp-validator-core`
  - `ohbp-validator-rules`
  - `ohbp-fixtures`

- D2 偏向：
  - `protocol-schemas`
  - `protocol-types`
  - `validator-core`
  - `verifier-core`
  - `fixture-bundles`
  - `ui-view-models`

建议主控统一成一套最终命名，不要实现时两套并存。推荐采用：

- `@ohbp/schema`
- `@ohbp/canonical`
- `@ohbp/types`
- `@ohbp/validator-core`
- `@ohbp/validator-rules`
- `@ohbp/verifier-core`
- `@ohbp/fixtures`
- `@ohbp/view-models`

理由：
- 与正式协议名 `OHBP` 对齐
- CLI、平台、网站共享时最清晰
- 同时吸收 D1 的“协议对象层次”与 D2 的“types / verifier / shared view models”需要

### 3.2 统一“共享对象清单”

主控必须在实施蓝图里冻结：**哪些对象是 monorepo 的 shared contract，哪些只是 app 内部对象。**

建议冻结以下 shared contracts：

#### Canonical protocol contracts
- benchmark card
- task package
- execution contract
- manifest
- run-group-registration
- completeness-proof
- interaction-summary
- environment-report
- trace-integrity
- verification-record

#### Shared execution / validation contracts
- `ValidationContext`
- `ValidationReport`
- `Finding`
- `DerivedEffect`
- `UploadReceipt`

#### Shared web projection contracts
- `BoardSliceView`
- `EntryScorecardView`
- `EntryResearchView`
- `ProtocolObjectIndex`
- `ValidatorIssueView`

如果主控不提前冻结这个清单，后面 `hb inspect`、mock verifier、web BFF 很容易各自产出结构相近但不兼容的 JSON。

### 3.3 统一“谁可以生产什么对象”

建议主控明确写进实施蓝图：

| 对象 | 生产者 | 消费者 | 备注 |
|---|---|---|---|
| raw workspace | CLI `run` | CLI `pack` | 不能直接进入公开面 |
| final bundle | CLI `pack` | validator / upload / verifier | canonical input |
| validation report | validator | CLI / upload gate / web playground | 本地确定性结果 |
| completeness proof | verifier/mock verifier | board pipeline / entry detail | 平台生成 |
| verification record | verifier/mock verifier | board / entry / website | 平台真源 |
| scorecard / research views | BFF / derived pipeline | web | 只能派生，不能人工维护 |

这能有效避免“CLI 直接生成 verification_record”之类的越权实现。

### 3.4 统一 registry context 供应方式

D1 强调 validator 需要 registry context；D2 强调 CLI 需要可跑主线；Web PRD 默认平台能拿到 benchmark/lane/slice 信息。主控必须统一：

- benchmark card 从哪里读
- task package 从哪里读
- execution contract 从哪里读
- health snapshot 从哪里读
- 本地 CLI 和平台 intake 是否用相同 registry 目录结构

建议：
- 先实现一个 **file-backed registry context**，放在 monorepo 内 fixtures 与 sample registry 下
- CLI / validator / mock verifier 都先通过同一 resolver 解析
- 以后再替换成远程 registry API

### 3.5 统一 BFF 与网站数据来源

Web PRD 已经正确指出前端不应直接消费 raw protocol objects，但 ఇంకా需要主控拍板：

- BFF 是独立 app，还是内嵌在 Next.js route handlers 中
- scorecard/research 是静态派生文件，还是请求时动态拼装
- validator playground 是否直接调用 validator-core，还是走统一 API

MVP 推荐：
- **BFF 先内嵌在 Web app 内**，不要先拆独立服务
- scorecard / research 先由 mock verifier 产出或由 BFF 从 `verification_record + manifest + validation report` 派生
- validator playground 走服务端 action / API route，底层复用 `@ohbp/validator-core`

### 3.6 统一阶段闸门

三份设计文档都提到了阶段，但没有形成单一“进下一阶段前必须满足什么”的 gate。主控应统一为：

- Phase 1 没有稳定 schema + canonical + fixtures，不进入 CLI 核心开发
- Phase 2 没有 pass/fail fixtures 跑通，不进入 mock verifier
- Phase 3 没有 mock verification outputs，不进入 Web MVP
- Phase 4 没有 Entry Detail / Protocol / Playground 三页串通，不宣称“网站成功”

---

## 4. 推荐的 monorepo 目录结构与阶段顺序

## 4.1 推荐 monorepo 目录结构

建议采用 **TypeScript monorepo**，目录结构如下：

```text
E:/工作区/10_Projects_项目/harness测评网站/
  apps/
    hb-cli/
      # CLI：doctor/init/run/pack/validate/inspect/upload(mock)
    mock-intake/
      # MVP 上传入口与 receipt 产出
    verifier-worker/
      # mock verifier / derived outputs / board pipeline
    web/
      # Next.js 薄网站 + BFF

  packages/
    schema/
      # JSON Schema 2020-12；canonical object shape
    canonical/
      # canonical_json / digest / bundle hash / ref resolution rules
    types/
      # 共享 TS types；由 schema 生成或严格映射
    validator-core/
      # ValidationContext / ValidationReport / engine
    validator-rules/
      # schema / semantics / integrity rulepacks
    verifier-core/
      # completeness / adjudication / projection 逻辑
    fixtures/
      # goldens / mutants / registry contexts / expected reports
    view-models/
      # Board / Entry / Protocol / Validator 页面共享投影模型

  docs/
    implementation/
      # blueprint / review / ADR
    ohbp-v0.1/
      # 已冻结协议

  registry/
    sample/
      benchmarks/
      task-packages/
      execution-contracts/
      benchmark-health/

  tooling/
    scripts/
      # build / fixture regen / smoke checks
```

### 4.1.1 为什么是这套结构

#### `packages/schema`
唯一承载结构合同，不被 app 私有化。

#### `packages/canonical`
冻结 digest / canonicalization，防止 CLI 和平台各算各的。

#### `packages/types`
吸收 D2 的 `protocol-types` 需求，避免 Web / CLI 手写重复类型。

#### `packages/validator-core + validator-rules`
吸收 D1 的 rule-engine 拆分，保证规则版本化。

#### `packages/verifier-core`
把平台裁决独立出来，不让 validator 越权。

#### `packages/view-models`
吸收 Web PRD 的 BFF 视图模型要求，避免前端直接对 raw object 做 ad hoc 派生。

#### `apps/mock-intake` + `apps/verifier-worker`
保留 D2 的 mock upload / verifier 路线，让网站能尽快消费“真的平台派生物”。

### 4.1.2 不建议的结构

不建议：
- 把 schema 放进 CLI 内部
- 把 verifier 和 validator 混成一个包
- 让 web 直接依赖 raw bundle 文件结构做 UI 逻辑
- 让 mock server 成为协议语义的拥有者

---

## 4.2 推荐阶段顺序

### Phase 0 — Workspace / toolchain / conventions

目标：
- monorepo 初始化
- package naming 冻结
- TS / build / test / lint 基线
- fixtures 与 registry sample 目录落位

验收：
- 所有 package 能成功 build
- schema/types/validator/verifier/web 的依赖方向清晰

### Phase 1 — Schema + Canonical + Core fixtures

目标：
- 落地 P0 / P1 核心 schema
- 落地 canonical JSON / object digest / bundle digest / ref resolution 规则
- 首批 goldens + mutants 建好

建议最低对象：
- benchmark-card
- task-package
- execution-contract
- manifest
- aggregate
- task-result-entry
- artifact-manifest
- evaluator-report
- run-group-registration
- completeness-proof
- interaction-summary
- environment-report
- trace-integrity
- verification-record

验收：
- schema 可稳定校验 fixtures
- digest / ref 规则能对 goldens 与 mutants 形成稳定差异

### Phase 2 — Validator MVP

目标：
- `ValidationContext`
- `ValidationReport`
- schema / semantics / integrity 三层 rulepack
- local validation CLI 接口

验收：
- goldens 全 pass
- mutants 按预期 fail
- 报告包含稳定 finding codes 与 derived effects

### Phase 3 — CLI core MVP

目标：
- `hb doctor`
- `hb init`
- `hb run`
- `hb pack`
- `hb validate`
- `hb inspect`

实现要点：
- 先配 sample adapter
- `run` 产出 raw workspace
- `pack` 产出 canonical final bundle
- `validate` 只调用 validator，不自行造语义
- `inspect` 基于 bundle + validation report 输出本地 research 雏形

验收：
- 可以从 sample registry + sample adapter 跑出一个 pass bundle
- 同一 raw workspace 重复 `pack` 产出相同 bundle digest

### Phase 4 — Upload / mock intake / mock verifier

目标：
- `hb upload --dry-run`
- `hb upload --endpoint <mock>`
- receipt 落盘
- mock verifier 生成：
  - `completeness-proof`
  - `verification-record`
  - `scorecard/research` 派生物

验收：
- 本地 bundle 能进入 mock intake
- 平台侧能生成 subject-bound verification outputs

### Phase 5 — Web MVP

目标：
- 首页
- Official Verified Board
- Reproducibility Frontier
- Community Lab
- Entry Detail（scorecard/research）
- Protocol
- Validator Playground

验收：
- 网站只消费 `view-models` / BFF
- Entry Detail 能一跳追到 evidence 摘要
- Playground 能消费 validator 报告并输出结构化错误

### Phase 6 — Review / hardening / polish

目标：
- review agents 做架构、协议一致性、前端数据边界、fixture 完整性、冷启动 UX 评审
- 把 P1 / P2 风险收口

验收：
- 无第二真源
- 无 sealed 泄漏路径
- 无 validator / verifier 越权重叠
- 无“看似榜单，其实不满足 slice gate”的 UI 漏洞

---

## 5. 风险与验收清单

## 5.1 关键风险

### 风险 1：第二真源回流

表现：
- CLI 自己算 `trust_tier`
- Web 前端自己拼 `autonomy_mode`
- mock verifier 直接绕过 `manifest.json`

后果：
- 与协议 `ohbp-v0.1.md` 偏离
- 排榜、详情、验证报告互相打架

控制措施：
- 冻结 owner 表
- 所有 app 只消费共享包
- review 时优先扫“谁在生产 canonical field”

### 风险 2：schema 过载，规则失真

表现：
- 试图用 JSON Schema 表达 digest / hash chain / cross-file MUST
- 把 semantics 与 integrity 逻辑塞进 schema 注释或自定义 hack

后果：
- validator 规则不可维护
- 很多 MUST 无法真正机审

控制措施：
- 坚持 schema / canonical / rules 三层
- 每条规则先判定归属层

### 风险 3：validator 与 verifier 重新耦合

表现：
- validator 开始直接给 `verified`
- verifier 又复制一套 layout/digest 校验

后果：
- 逻辑重复
- 本地结果和平台结果不一致

控制措施：
- verifier 依赖 validator 输出或复用其引擎
- 平台只在此基础上做 completeness / tier / publication / autonomy 裁决

### 风险 4：网站消费了错误层级的数据

表现：
- Board 页面直接读 raw manifest
- Entry detail 直接显示 sealed 内容
- Scorecard 不是从 research projection 派生

后果：
- UI 语义漂移
- 公开边界破裂

控制措施：
- 强制 BFF / view-models
- 明确 public projection 与 sealed digest 的边界

### 风险 5：fixtures 不足，导致“看起来能跑”

表现：
- 只有 happy path
- 没有 mutants
- 没有 expected validation reports

后果：
- digest/ref/tier 逻辑一改就坏
- review 难以定位回归

控制措施：
- 每新增关键规则都配 golden 或 mutant
- CI 必跑 fixture matrix

### 风险 6：实施顺序倒置

表现：
- 先做页面
- 再反推协议对象
- 再补 validator

后果：
- 前端字段先污染语义
- 大量返工

控制措施：
- 严格按 Phase 0 → 6 顺序推进
- 阶段 gate 未过不进入下阶段

---

## 5.2 验收清单

### A. 协议工程验收
- [ ] `manifest.json` 确实是 bundle 侧唯一 join surface
- [ ] `verification_record` 确实是平台裁决真源
- [ ] schema / canonical / rules 分层清晰
- [ ] P0 / P1 核心对象均有 schema

### B. validator 验收
- [ ] goldens 全通过
- [ ] mutants 全按预期失败
- [ ] `ValidationReport` 输出稳定、可机读
- [ ] digest / ref / evidence channel / trace integrity 都能重算

### C. CLI 验收
- [ ] `hb init -> hb run -> hb pack -> hb validate -> hb inspect` 全链路打通
- [ ] `pack` 是唯一 raw → bundle 归一化边界
- [ ] 同输入重复 `pack` 产出相同 bundle digest
- [ ] CLI 不越权生产 `verification_record`

### D. mock verifier / upload 验收
- [ ] `hb upload --dry-run` 可生成稳定 payload
- [ ] mock intake 能回 receipt
- [ ] mock verifier 能产出 `completeness-proof` 与 `verification-record`
- [ ] `verification_record.subject_ref + subject_bundle_digest` 完整绑定 attempt bundle

### E. Web MVP 验收
- [ ] Official Verified Board / Frontier / Community 三层公开面全部落地
- [ ] Entry Detail 拥有 `scorecard` / `research` 双视图
- [ ] Protocol 页面能按 canonical field / object 浏览
- [ ] Validator Playground 能显示结构化错误与修复建议
- [ ] 前端不暴露 sealed 原始内容

### F. 总体验收
- [ ] monorepo 中没有第二套协议字段命名体系
- [ ] 没有 app 私自产生 canonical truth
- [ ] 没有跨层职责泄漏
- [ ] 构建顺序、测试顺序、发布顺序都可执行

---

## 6. 最终评审建议

如果只给主控一句执行建议，我的评审结论是：

> **以 D1 的协议工程拆分为骨架，以 D2 的 CLI/validator/mock-verifier 闭环为实施主线，以 D3 的薄网站/BFF/view-models 为消费层；先冻结 monorepo 包边界与共享对象清单，再进入编码。**

这三份设计已经足够支撑一个真正可执行的 monorepo build blueprint。下一步不该再扩大讨论面，而应该把“统一命名、统一对象、统一阶段 gate”写成实施蓝图并开工。
