# OHBP / harnessbench 网站 MVP PRD

> 文档类型：网站 MVP PRD / IA / 前端架构草案  
> 来源基线：`E:/工作区/10_Projects_项目/harness测评网站/docs/ohbp-v0.1/ohbp-v0.1.md`（正式 v0.1）  
> 约束：协议优先于产品；网站不是协议真源，只是协议对象与平台裁决结果的可视化表层。  
> 当前阶段：MVP（配合 schema、CLI、validator、upload API 一起落地）

---

## 0. 产品定义与边界

### 0.1 一句话定义

OHBP 网站 MVP 不是“又一个大模型排行榜站”，而是一个 **协议对象可视化 + 分层榜单浏览 + 证据链追溯 + validator 入口** 的薄网站。

### 0.2 产品目标

把正式 `v0.1` 协议中的以下能力，以公开可用、低歧义、强可追溯的方式呈现出来：

1. 让用户快速理解 **哪个结果能信、为什么能信、为什么暂时不能信**。
2. 让网站对外只展示 **协议允许公开的 public evidence surface**，不把 sealed 审计通道误暴露成公开网页内容。
3. 让榜单、详情页、Protocol 文档、Validator Playground 之间形成闭环：
   - 从榜单到证据一跳可达
   - 从协议到 validator 一跳可达
   - 从 validator 到 CLI / schema 一跳可达
4. 让网站默认遵守 v0.1 的公开原则：
   - `trust_tier`、`publication_state`、`board_admission_policy` 三者共同决定上榜资格
   - `scorecard_view` 派生于 `research_view`
   - 默认主榜只看 Verified

### 0.3 MVP 非目标

MVP 明确不做：

1. 不做大而全社区产品（评论、社交 feed、积分系统、个人主页）
2. 不在网页内替代 CLI 执行 benchmark
3. 不在公开网站中直接浏览 sealed audit bundle
4. 不在网站前端自创第二套 ranking / trust / evidence 语义
5. 不先做复杂运营后台；MVP 优先 public surface + validator public tooling

### 0.4 网站角色定位

网站在总体系统中的位置应严格服从以下顺序：

```text
协议 -> schema -> CLI -> upload API / verifier -> 薄网站
```

因此网站的职责不是定义规则，而是消费以下权威对象：

- `manifest.json`
- `verification_record`
- `board_slice`
- `benchmark health snapshot`
- `run-group-registration.json`
- `completeness-proof.json`
- validator / verifier 输出

---

## 1. 网站 MVP 的目标用户、核心任务、成功指标

## 1.1 目标用户

### A. 决策者 / 使用者
关心：
- 哪个 harness 在某个固定模型条件下更值得用
- 结论是否可信
- 成本 / 延迟 / 稳定性是否可接受

### B. Framework Author / Harness 作者
关心：
- 我的 harness 在哪个 slice 中表现如何
- 为什么结果没有进入 Official Verified Board
- 离 Reproduced / Verified 还差哪些证据与门槛

### C. Reproducer / Auditor
关心：
- 哪些 run-group 值得复现
- 哪些结果 evidence 完整但尚未升 tier
- 如何追溯某个 entry 的 registration、manifest、tolerance、health、audit 历史

### D. Protocol Implementer / Tool Builder
关心：
- schema / canonical fields / object boundaries 是什么
- validator 如何解释失败原因
- 自己的 CLI / wrapper / upload 流程该怎样对接协议

## 1.2 核心任务（按优先级）

### JTBD-1：看榜但不被误导
用户进入网站后，能先看到 **Official Verified Board**，并明确知道：
- 当前是在什么 slice 下比较
- 当前结果属于哪个 `trust_tier`
- 当前是否只是 cluster/tier，不是真正 ordinal rank
- 证据通道和 benchmark health 有何限制

### JTBD-2：从分数追到证据
用户从榜单点击某个条目后，能在 **一跳之内** 进入该结果详情页，并切换：
- `scorecard_view`
- `research_view`

同时看到：
- `subject_ref`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`（若存在）
- `autonomy_mode`
- `publication_state`
- `decision_reason_codes[]`
- 审计 / dispute / correction / invalidation 历史

### JTBD-3：知道为什么“不能上榜”
当某个 slice 尚未形成稳定排序，或某条结果未达主榜门槛时，网站必须明确展示：
- `warming_up`
- `verification_in_progress`
- `insufficient_evidence`
- `comparison_only`
- `ranked_tiered`
- `ranked_ordinal`

而不是把所有条目硬排成一个虚假的排名。

### JTBD-4：让开发者自助检查 bundle / manifest
通过 **Validator Playground**，用户可以上传 `manifest.json` 或整包 bundle，立刻得到：
- schema 错误
- digest / reference binding 错误
- registration / tolerance / evidence 字段缺失
- admission 风险提示
- 下一步修复建议

### JTBD-5：把协议理解成本降下来
通过 **Protocol** 页面，用户不读完整文档也能理解：
- 对象边界
- tier / publication / profile 区分
- board admission 逻辑
- public / sealed 双通道规则
- scorecard / research 的关系

## 1.3 成功指标（MVP）

### 业务与产品指标
1. **Verified 首屏占比**：公开首页流量中，≥ 60% 的榜单访问首先落到 Official Verified Board。
2. **研究追溯率**：从榜单进入详情后，≥ 35% 的用户进一步打开 `research_view`。
3. **Protocol → Tool 转化率**：Protocol 页面访问者中，≥ 20% 继续点击 Validator Playground 或 CLI 文档入口。
4. **Validator 完成率**：进入 Validator Playground 的用户中，≥ 50% 完成一次有效校验。
5. **上传修复回流率**：收到 validator 错误的用户中，≥ 25% 进行第二次修正校验。

### 协议一致性指标
1. **主榜纯度**：Official Verified Board 中 100% 条目都满足：
   - `trust_tier = verified`
   - `publication_state = published`
   - 符合当前 `board_admission_policy`
2. **一跳追溯覆盖率**：100% 上榜条目能在一跳内进入详情页，并看到对应 `research_view`。
3. **badge 完整率**：95% 以上公开结果卡片能显示完整的：
   - `trust_tier`
   - `autonomy_mode`
   - `evidence_channel_mode`
   - `visibility_class`
   - `health warning`
4. **零伪排序**：所有 `< 3` eligible entries 的 slice 不显示 ordinal rank。
5. **双通道正确率**：涉及 `public_plus_sealed` 的公开结果，100% 显示 `sealed_audit_bundle_digest` 与 redaction 说明，而不暴露 sealed 原文内容。

---

## 2. 网站 IA / Sitemap

## 2.1 顶层信息架构

```text
/
├─ /boards
│  ├─ /boards/official-verified
│  ├─ /boards/reproducibility-frontier
│  ├─ /boards/community-lab
│  └─ /boards/[slice_id]
├─ /entries/[entry_id]
│  ├─ ?view=scorecard
│  └─ ?view=research
├─ /protocol
│  ├─ /protocol/overview
│  ├─ /protocol/object-model
│  ├─ /protocol/trust-and-publication
│  ├─ /protocol/evidence-and-validator
│  └─ /protocol/benchmark-health
├─ /playground
│  └─ /playground/validator
├─ /benchmarks/[benchmark_id]
├─ /lanes/[lane_id]
└─ /about
```

## 2.2 导航分区

### Primary Nav
- Boards
- Protocol
- Validator Playground
- Benchmarks
- About

### Secondary Nav（Boards 内）
- Official Verified Board
- Reproducibility Frontier
- Community Lab
- Slice Detail

### Secondary Nav（Entry Detail 内）
- Scorecard
- Research
- Audit History
- Artifacts & Digests

## 2.3 IA 原则

1. **榜单优先，但协议兜底**：新用户先看到结论，但任何结论都必须能追到规则与证据。
2. **详情页而非弹窗页**：复杂 evidence / research 内容必须有独立 URL。
3. **URL 可分享**：筛选器、slice、视图模式都写入 URL query，方便讨论与复现。
4. **对象命名直接使用 canonical field**：避免前端另造近义字段。
5. **Protocol 不做营销页**：它应是规范浏览器，不是品牌故事页。

---

## 3. 首批页面范围

## 3.1 P0 页面（MVP 必做）

| 页面 | 路由建议 | 页面目标 | 主要用户 |
|---|---|---|---|
| 首页 / 导航页 | `/` | 解释“这不是普通排行榜”，把用户引导到 Boards / Protocol / Validator | 全部 |
| Official Verified Board | `/boards/official-verified` | 展示默认官方可信榜单 | 决策者 / 作者 |
| Reproducibility Frontier | `/boards/reproducibility-frontier` | 展示接近高信任的结果、待复现单与升级路径 | 作者 / 复现者 |
| Community Lab | `/boards/community-lab` | 展示低门槛公开结果与实验趋势，但强标注非官方主结论 | 作者 / 研究者 |
| Entry Detail（Scorecard / Research 双视图） | `/entries/[entry_id]` | 承接榜单点击，做一跳追溯 | 全部 |
| Protocol | `/protocol` | 降低协议理解门槛，成为 schema/validator/board 的解释锚点 | 实现者 / 作者 |
| Validator Playground | `/playground/validator` | 自助验证 bundle / manifest / refs / digests | 实现者 / 上传者 |

## 3.2 P1 页面（MVP 可跟进）

| 页面 | 路由建议 | 目的 |
|---|---|---|
| Slice Detail | `/boards/[slice_id]` | 聚焦某个 comparison slice 的规则、排序状态与参与条目 |
| Benchmark Detail | `/benchmarks/[benchmark_id]` | 展示 benchmark health、split、lane 与 release policy |
| Lane Detail | `/lanes/[lane_id]` | 展示 lane 的适用 persona、推荐 profile、governance hint |
| About | `/about` | 说明项目定位、协议版本、开放边界、FAQ |

## 3.3 各核心页面定义

### A. 首页 `/`

**定位**：不是营销首页，而是协议化 benchmark 平台入口页。  
**必须传达的三点**：
1. 网站不直接相信自报分数
2. Official Board 默认只看 Verified
3. CLI / Validator / Protocol 才是系统核心链路

**MVP 模块**：
- Hero：一句话定义 + 三个入口
- 三层公开面卡片：Verified / Frontier / Community
- 协议对象速览
- 推荐起手 lane
- “为什么 harness 评测需要协议而不是只看榜”说明

### B. Official Verified Board `/boards/official-verified`

**定位**：默认主榜。  
**规则**：仅展示满足当前 board policy 的 `verified + published` 条目。

**MVP 模块**：
- Board Header：当前 board、版本、更新时间
- Slice Selector：
  - 默认 `fixed_model_compare_harness`
  - 再切 `fixed_harness_compare_model`
  - `system_combination` 放二级
- Eligibility Banner：解释当前 slice state
- Ranking Table / Cluster Table
- Uncertainty & Confidence Strip
- Benchmark Health Warning
- Compare Drawer
- Entry Row → 详情页

**关键交互**：
- 如果 slice state = `ranked_tiered`，只显示 cluster，不显示 1/2/3 名
- 如果 slice state = `comparison_only`，切换为 head-to-head 布局
- 如果 slice state = `insufficient_evidence`，显示 warming_up，而不是空表

### C. Reproducibility Frontier `/boards/reproducibility-frontier`

**定位**：平台冷启动飞轮核心页。展示“最接近官方可信结论”的候选面。

**MVP 模块**：
- Frontier Summary：当前待复现数量、待验证数量、升级完成率
- Near-Verified Candidates
- Reproduce Queue
- Missing Evidence Reasons
- Replay / Reproduce 可行性标签
- “How to promote to Verified” 说明区

**关键交互**：
- 每条结果要清楚区分：
  - 已 reproduced 未 verified
  - evidence 充分但 waiting for audit
  - 证据缺字段 / 证据通道不符 / autonomy 降级 / health 不允许
- 支持“按缺口原因过滤”

### D. Community Lab `/boards/community-lab`

**定位**：低门槛公开实验面，不伪装成主榜。

**MVP 模块**：
- Feed / Table 双视图
- Community disclaimer
- Trend by slice / model / harness
- Recent uploads
- Popular presets / lanes
- Escalation CTA：如何升级到 reproducible_standard / verified_full

**关键交互**：
- 默认按时间 / 活跃度排序，而不是权威排名
- 可以展示“实验雷达”与趋势，但必须突出 `community` 与 `provisional` / `submitted` 状态
- 对未完成平台校验的条目做醒目风险标识

### E. Entry Detail `/entries/[entry_id]`

**定位**：所有榜单的证据详情承接页。  
**页面结构**：顶部固定结果摘要；中部 `Scorecard` / `Research` 双 tab；底部历史与引用。

#### Scorecard Tab
面向普通用户，显示：
- 结果结论
- 主要指标
- 相对 baseline 差异
- 成本 / 延迟 / 支持数
- trust / autonomy / evidence / health badges
- why this is eligible / not eligible

#### Research Tab
面向研究 / 审计，显示：
- `subject_ref`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `manifest` identity refs
- registration / completeness / tolerance 摘要
- task terminal states / denominators
- trace / artifact refs
- audit history / dispute history / correction history
- benchmark health full snapshot

**关键交互**：
- Scorecard 与 Research 切换不改语义，只改信息密度
- 提供“复制 canonical refs”按钮
- 对 redacted evidence 给出显式 redaction explanation

### F. Protocol `/protocol`

**定位**：协议浏览器。  
**目标**：让开发者不读整篇主稿，也能找到 object boundary 与关键规则。

**MVP 模块**：
- Protocol Overview
- Object Model Map
- Canonical Fields Glossary
- Trust Tier vs Publication State vs Submission Profile
- Evidence Channel Rules
- Ranking Policy & Slice Gate
- Benchmark Health & Release Policy
- Implementation links：schema、CLI、validator

**关键交互**：
- 支持字段搜索
- 对每个 canonical field 提供：定义、值域、owner、消费对象、常见误用
- 协议页面必须可链接到具体小节锚点

### G. Validator Playground `/playground/validator`

**定位**：公共自助校验工作台。  
**目标**：把“为什么我的 bundle 不能上榜 / 不能升 tier”变成可执行诊断。

**MVP 模块**：
- Upload Panel：上传 `manifest.json` / final bundle / sample bundle
- Validation Mode Selector：
  - Schema only
  - Bundle integrity
  - Admission readiness
- Result Summary：通过 / 警告 / 失败
- Error Explorer：按 category 分类
- Fix Guide：下一步建议
- Sample Cases：合格示例 / 典型错误示例

**错误分类建议**：
- schema_error
- missing_required_field
- invalid_digest_binding
- registration_manifest_mismatch
- tolerance_ref_missing
- verification_binding_missing
- evidence_channel_ineligible
- autonomy_telemetry_incomplete
- publication_gate_not_met

---

## 4. 页面级组件与数据依赖

## 4.1 共享组件层

### 共享展示组件
- `TrustTierBadge`
- `PublicationStateBadge`
- `AutonomyModeBadge`
- `EvidenceChannelBadge`
- `VisibilityClassBadge`
- `BenchmarkHealthBadge`
- `RankStateBanner`
- `DigestChip`
- `EligibilityReasonList`
- `MetricDeltaCard`
- `BoardFilterBar`
- `ResearchSection`
- `AuditHistoryTimeline`

### 共享交互组件
- `SlicePicker`
- `ComparisonModeSwitch`
- `ScorecardResearchTabs`
- `ProtocolObjectSidebar`
- `ValidatorDropzone`
- `ValidationIssueTable`
- `CopyCanonicalRefButton`

## 4.2 共享数据对象（前端只消费，不定义）

前端必须围绕以下对象建模，不额外发明平行语义：

1. `board_slice`
2. `verification_record`
3. `manifest.json` 的公开可读投影
4. `benchmark health snapshot`
5. `run-group-registration` 摘要
6. `completeness-proof` 摘要
7. validator 输出
8. `scorecard_view` 派生模型
9. `research_view` 派生模型

## 4.3 页面 × 组件 × 数据依赖

| 页面 | 核心组件 | 必需数据 | 可选增强数据 |
|---|---|---|---|
| 首页 | Hero、BoardTriptych、ProtocolOverview、LaneCards | board summary、lane summary、protocol version | latest verified highlight、frontier stats |
| Official Verified Board | SlicePicker、RankStateBanner、RankingTable、HealthBanner | `board_slice`、entry scorecard summary、`verification_record` 摘要、health summary | baseline diffs、uncertainty chart |
| Reproducibility Frontier | FrontierStats、CandidateTable、GapReasonFilter | frontier queue、promotion blockers、replay/reproduce status | claim actions、estimated audit ETA |
| Community Lab | FeedTable、TrendChart、RiskLegend | community entries、submission profile、publication state | preset popularity、upload trend |
| Entry Detail | SummaryHeader、Tabs、AuditHistoryTimeline、DigestRefs | `scorecard_view`、`research_view`、`verification_record`、manifest public projection、health snapshot | ablation、raw artifact preview（仅 public） |
| Protocol | ObjectMap、FieldGlossary、RulePanels | protocol sections、schema index、field glossary | version diff、examples |
| Validator Playground | Dropzone、ValidationSummary、IssueExplorer、FixGuide | validator result、schema catalog、rule catalog | sample bundles、saved reports |

## 4.4 推荐 API / BFF 视图模型

为避免前端直接拼协议原始对象，建议由 BFF（Backend For Frontend）提供稳定视图模型：

### Boards
- `GET /api/boards/official-verified?slice=...`
- `GET /api/boards/reproducibility-frontier?slice=...`
- `GET /api/boards/community-lab?slice=...`
- `GET /api/boards/slices/[slice_id]`

返回应至少包含：
- board metadata
- slice state
- entry summaries
- admission notes
- benchmark health summary
- filters metadata

### Entry Detail
- `GET /api/entries/[entry_id]/scorecard`
- `GET /api/entries/[entry_id]/research`
- `GET /api/entries/[entry_id]/history`

### Protocol
- `GET /api/protocol/index`
- `GET /api/protocol/objects/[object_id]`
- `GET /api/protocol/fields/[field_id]`

### Validator
- `POST /api/validator/schema-check`
- `POST /api/validator/bundle-check`
- `POST /api/validator/admission-check`

## 4.5 数据依赖原则

1. **前端不直连 sealed 数据仓**：public 网站只能消费 public projection 与 sealed digest。
2. **Scorecard 只来自 research projection**：不能单独维护第二套 summary 规则。
3. **Board page 不直接拼接 raw manifest**：应消费 `board_slice + scorecard summary`。
4. **Protocol 页面优先消费 schema / spec index**：避免手写重复文案与主稿漂移。
5. **Validator 结果必须 machine-readable**：错误码、字段路径、严重级别、修复建议结构化返回。

---

## 5. 推荐前端技术栈与交互策略

## 5.1 推荐技术栈

### Web App Framework
- **Next.js（App Router）+ React + TypeScript**

原因：
1. 适合公共页面 SEO 与直达分享
2. 兼容 SSR / ISR / RSC，适合榜单与协议文档混合场景
3. 便于后续接 BFF / upload / verifier 服务

### UI / Design System
- **Tailwind CSS + shadcn/ui（或等价 headless 组件层）**

原因：
- MVP 需要高信息密度而非营销视觉堆砌
- 方便做 badge、table、tabs、filter bar、timeline、drawer 等结构化组件

### Data Layer
- **TanStack Query**：服务端状态获取与缓存
- **TanStack Table**：榜单 / 明细 / validator issue 列表
- **Zod / schema-generated types**：承接 schema 团队产出的 JSON Schema / OpenAPI 类型

### Visualization
- **Vega-Lite**（优先）或同级图表方案

适合：
- uncertainty / CI
- cost-latency scatter
- trend / cluster / support count
- benchmark health 小型诊断图

### Content / Protocol Rendering
- **MDX + schema-driven reference pages**

原则：
- Protocol 页面不是静态 marketing copy
- 优先把 `v0.1` 对象、字段、schema index 编译成 reference content

## 5.2 前端架构建议

### Route Strategy
- 公开榜单与协议内容：SSR / ISR
- 复杂筛选与切换：客户端增强
- Validator Playground：客户端交互 + 服务端校验 API

### Data Strategy
- 用 BFF 将底层协议对象投影成页面模型
- schema 作为类型真源，前端只做轻量派生
- 每个页面都暴露 `data provenance` 信息（例如 last audited / protocol version / policy version）

### State Strategy
- URL 作为筛选真源：
  - `slice`
  - `comparison_mode`
  - `lane`
  - `autonomy_mode`
  - `benchmark_tuned`
  - `view=scorecard|research`
- 本地 UI 状态只保留临时交互（drawer、tab、copy feedback）

## 5.3 关键交互策略

### 策略 1：默认先给结论，再给证据
- 列表页先是 scorecard density
- 详情页提供一键切到 research
- 不要求普通用户先理解所有协议对象

### 策略 2：所有“不能比较 / 不能排名”的情况都要产品化呈现
必须内建以下 UI 状态：
- `warming_up`
- `verification_in_progress`
- `insufficient_evidence`
- `comparison_only`
- `ranked_tiered`
- `ranked_ordinal`

### 策略 3：显式展示“为什么可信”与“为什么暂不可信”
每个条目都应能展开：
- admission satisfied because ...
- admission blocked because ...
- what is missing next ...

### 策略 4：保护协议边界
- `submission_profile` 不与 `trust_tier` 混用
- `declared_autonomy_mode` 不直接当榜单标签
- sealed 只显示 digest / policy / history，不显示 raw content

### 策略 5：研究视图做成真正的 investigation workspace
Research view 不是加长版详情文案，而应支持：
- object refs copy
- digest copy
- 历史时间线
- bundle / artifact / trace 引用
- 规则匹配状态
- dispute / correction 可追溯性

## 5.4 性能与体验要求（MVP）

1. 首屏榜单页面在常规网络下应做到可读 skeleton 快速出现
2. 筛选切换不应整页白屏刷新
3. 详情页必须支持深链接直达某个 tab
4. Protocol 页面字段搜索延迟应尽量低，支持快捷定位
5. Validator Playground 的单次反馈应尽量在短时间内给出结构化结果

## 5.5 安全与公开边界

1. 公共站点绝不直接暴露 sealed bundle 下载入口
2. 对 `public_plus_sealed` 结果，网页只展示：
   - `sealed_audit_bundle_digest`
   - `release_policy`
   - `redaction_policy_id`
   - 状态说明
3. validator 若支持上传整包，需明确告知：
   - playground 默认仅用于 public validation
   - 涉敏感 sealed 审计应走受控 verifier 通道

---

## 6. 评审清单

## 6.1 协议一致性评审
- [ ] 网站是否严格使用 canonical fields，而不是近义自造字段？
- [ ] `trust_tier` / `publication_state` / `submission_profile` 是否严格区分？
- [ ] Scorecard 是否完全可追溯到 Research？
- [ ] 是否任何排名展示都受 `board_admission_policy` 控制？
- [ ] `< 3` eligible entries 时是否避免伪 ordinal 排名？

## 6.2 治理与反作弊评审
- [ ] Official Verified Board 是否只接纳 verified + published + eligible 条目？
- [ ] `autonomy_mode` 是否来自 `verification_record`，而不是上传声明？
- [ ] `public_plus_sealed` 是否只展示公开允许的 metadata？
- [ ] 是否清楚展示 benchmark health 对 release policy 的影响？
- [ ] 是否有 dispute / correction / invalidation 历史入口？

## 6.3 信息架构评审
- [ ] 用户能否在 1 次点击内从榜单进入研究视图？
- [ ] 是否能清楚理解三层公开面：Verified / Frontier / Community？
- [ ] Protocol 页面是否足以支撑实现者快速对接 schema / CLI / validator？
- [ ] 页面数量是否克制，没有在 MVP 阶段扩张为复杂社区网站？

## 6.4 前端实现评审
- [ ] 是否采用 schema-driven types，而不是手写临时类型？
- [ ] 是否已有 BFF 视图层，避免前端直接拼 raw protocol objects？
- [ ] 筛选器是否 URL stateful，便于分享和审计？
- [ ] 图表与榜单是否支持 uncertainty / cluster / non-rank 状态表达？

## 6.5 产品风险评审
- [ ] 是否错误地把 Community 结果包装成“官方结论”？
- [ ] 是否让网站承担了本应由 CLI / verifier 承担的职责？
- [ ] 是否因为追求美观而隐藏了 admission / evidence / health 的关键约束？
- [ ] 是否遗漏了冷启动场景下的 `warming_up` 与 queue 展示？

---

## 7. MVP 结论（供实现阶段直接采用）

1. **网站 MVP 应定义为“薄网站 + 深证据详情 + validator 工作台”，而不是社区化排行榜站。**
2. **默认信息入口必须是 Official Verified Board，但必须并列展示 Reproducibility Frontier 与 Community Lab，承认冷启动空心期。**
3. **Entry Detail 必须是独立 URL，并内建 `scorecard_view` / `research_view` 双视图，这是协议一致性的核心页面。**
4. **Protocol 页面必须做成规范浏览器，与 schema / validator 一体化，而不是普通介绍页。**
5. **前端数据层必须基于 schema + BFF 视图模型，避免前端重新发明 ranking / trust / evidence 语义。**
