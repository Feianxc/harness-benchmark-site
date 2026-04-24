# Repair Packet E — Adoption & Launch（IR-15 / IR-16 / IR-17 / IR-18）

> 负责人：Draft2 修订团队 E  
> 范围：Adoption / Launch / 冷启动产品层 / 参与者激励闭环  
> 仅覆盖问题：`IR-15`、`IR-16`、`IR-17`、`IR-18`  
> 依赖但不替代：A 流（术语/枚举统一）、B 流（registration/tolerance/公开门槛）、C 流（bundle/CLI 合同收敛）、D 流（治理加固）

---

## 1. 结论先说

本修订流的核心判断是：

> **draft2 必须把“可信结果生产协议”补成“可信结果生产 + 参与者持续供给”的最小产品闭环。**

这不意味着把运营策略硬编码进协议；相反，应该补三层清晰边界：

1. **Trust tier**：公共可信度分层（Community / Reproduced / Verified，最终命名以 A 流统一为准）
2. **Submission profile**：提交时的证据负担与摩擦档位（本 packet 建议：`community-light` / `reproducible-standard` / `verified-full`）
3. **Presentation view**：用户读结果的默认视图（`scorecard view` / `research view`）

如果这三层不拆开，draft2 会继续出现两个问题：
- 生态参与者不知道“我该走哪条路径、为什么值得走”
- 平台在主榜早期稀疏时只能在“原则正确”和“产品太空”之间二选一

本 packet 的修复主张是：
- **不改变“默认官方主榜只看 Verified”的原则**
- **但明确 Community → Reproduced → Verified 的升级路径与收益差**
- **并用 submission profile、persona 默认路径、双层视图，把冷启动做成可运营的薄产品闭环**

---

## 2. 设计边界：哪些该进协议，哪些不该写死

为避免违反 `M1 / NG5（不把平台页面、商业策略或运营决策写死进协议）`，建议将 Adoption & Launch 的修复分成两层：

### 2.1 建议进入 draft2 规范主文的内容

这些内容应作为 draft2 的**稳定对象或稳定关系**写入：

- `submission profile` 这一层概念存在，且**明确不等于** trust tier
- 不同 profile 对应不同最低证据负担与默认可进入流程
- persona → recommended lane 的默认路径
- `scorecard view` 与 `research view` 的双层呈现原则
- Community / Reproduced / Verified 的升级路径与支持计数逻辑
- 主榜空心期的默认展示层次：
  - 官方 Verified 主榜
  - Reproduced 次级发现层
  - Community 活动流 / 实验层

### 2.2 建议作为非规范性 launch guidance 的内容

这些内容**不应**冻结为协议硬字段，但应在 draft2 明确建议：

- badge / featured / credit / bounty 的具体数值与运营规则
- 首页 hero 文案与页面布局细节
- 具体积分算法
- sponsor credit / compute credit 的商业实现

换句话说：

> **协议里写“需要有上传者/框架作者/复现者的收益路径与升级路径”；但不要把“奖励 50 credits 还是 500 credits”写成协议规范。**

---

## 3. 参与者三角色激励闭环

本 packet 建议把平台参与者最少明确为三类一等角色：

1. **Uploader（上传者）**：运行并提交结果的人
2. **Framework Author（框架作者）**：维护 harness / preset / adapter / integration 的人
3. **Reproducer / Auditor（复现者 / 审计者）**：独立 replay / reproduce / 审查他人结果的人

### 3.1 角色闭环总图

```text
Uploader 提交 community-light / reproducible-standard
    -> 平台生成可分享 scorecard 与系统页归属
    -> Framework Author 获得更多公开样本与适配反馈
    -> Reproducer 从“待复现队列”领取任务并完成 replay / reproduce
    -> 结果升入 Reproduced / Verified，支持计数上升
    -> 平台主结论更可信，系统页曝光更高
    -> 更多用户愿意用同一 CLI/profile 再提交
```

### 3.2 Uploader（上传者）激励闭环

| 环节 | 用户动机 | 平台给出的即时回报 | 升级触发 | 长期回报 |
|---|---|---|---|---|
| 首次上传 | 想快速知道“我的 harness 在标准流程里表现如何” | 一键跑通、生成 shareable scorecard、获得系统页归属 | 结果被其他人查看/比较 | 形成公开 profile 与历史曲线 |
| 二次上传 | 想进入更高可信层或更有说服力的比较 | 平台提示“距离 Reproduced 还差哪些证据” | 补齐 preregistration、全 run-group、replayable 证据 | 进入 Reproduced 候选池 |
| 持续上传 | 想让版本迭代被追踪、让结果被引用 | 系统页展示版本变化、支持计数、slice 最佳记录 | 被复现者成功验证 / 被主榜引用 | 获得更高可见性与可信度 |

**对 Uploader 的最低产品承诺：**
- 不是“传完一包文件就没了”，而是**立刻得到一个可分享、可比较、可升级的结果页**
- 平台必须告诉上传者：
  - 当前在哪个 trust tier
  - 离下一层差什么
  - 哪个 reproducer / 官方队列可能接手
  - 哪个 lane / profile 更适合下一次提交

### 3.3 Framework Author（框架作者）激励闭环

| 环节 | 作者动机 | 平台给出的回报 | 升级触发 | 长期回报 |
|---|---|---|---|---|
| 接入 preset / adapter | 想让更多人低摩擦地使用自己的 harness | 官方/社区 preset 列表、接入文档、样例 bundle | 更多用户用同一 preset 上传 | 形成“该框架在固定模型下的公共表现” |
| 获得用户提交 | 想要真实世界配置分布与对比数据 | 系统页归并到同一 harness family / adapter family | 出现独立 submitter 支持 | 提升系统页可信度与外部引用价值 |
| 冲击高信任层 | 想获得“不是作者自己说，而是平台或第三方也能复现”的证明 | 进入 reproduce queue / verified candidate queue | 支持计数与 agreement rate 上升 | 获得 Reproduced / Verified 标签与更强传播力 |

**对 Framework Author 的最低产品承诺：**
- 平台不能只给“单 run 成绩”，还要给**系统页（system page）**
- system page 至少应显示：
  - fixed-model slice 下的代表 run-group
  - 独立 submitter 数
  - reproduced / verified 支持数
  - 版本演进轨迹
  - benchmark-tuned / general-purpose 标记

### 3.4 Reproducer / Auditor（复现者 / 审计者）激励闭环

| 环节 | 复现者动机 | 平台给出的即时回报 | 升级触发 | 长期回报 |
|---|---|---|---|---|
| 领取待复现任务 | 想做公共审计或建立可信声誉 | reproduce queue、明确的优先级与任务说明 | 成功产出 replay / reproduce report | 获得 reproducer credit / badge / 公开署名 |
| 完成复现 | 想证明自己能稳定复核他人结果 | 复现结果直接影响系统页 support_count / agreement_rate | 连续命中高价值复现 | 获得更高优先队列权重、成为官方审计候选 |
| 持续审计 | 想建立“独立可信第三方”的身份 | 个人 profile 展示成功复现数、参与争议处理记录 | 参与升级审计 / disputed case | 成为平台可信审计供给侧 |

**对 Reproducer 的最低产品承诺：**
- Reproducer 必须是产品上的一等身份，不只是 M4 文本里“可能有独立第三方复现”
- 平台至少应提供：
  - `reproduce queue`
  - `needs reproduction` 标记
  - 成功复现后的公开 credit / support 归属
  - 失败复现后的结构化 diff 与争议入口

### 3.5 三角色合成飞轮

建议在 draft2 明确写出以下飞轮逻辑：

1. **低门槛上传** 产生 Community 数据面
2. **框架作者聚合这些数据**，形成 system page 与 preset 生态
3. **复现者把一部分高价值结果升格为 Reproduced**
4. **平台再从高价值 Reproduced 中挑选 Verified 候选**
5. **Verified 结论带来传播与信任**，反过来吸引更多上传与复现

> 没有第 2、3 步，Community 只会变成噪声堆积；没有第 4、5 步，主榜会长期空心。

---

## 4. 提交 profile 设计（修复 IR-16）

### 4.1 核心原则

`submission profile` 是**提交时的证据负担与 UX 档位**，不是 trust tier。

建议采用以下稳定区分：

- **Profile 决定：** 用户需要准备多少证据、CLI 默认要求多重、平台默认把结果送到哪条 intake 流程
- **Trust tier 决定：** 结果经过平台校验/复验/官方验证后，最终被公开标为什么层级

因此：
- `community-light` **通常**只会进入 Community
- `reproducible-standard` **目标**是进入 Reproduced，但如果审计失败，也可能停留在 Community
- `verified-full` **目标**是进入 Verified，但如果未完成平台控制复跑，也可能先停在 Reproduced

### 4.2 推荐的三档 profile

| Profile ID | 目标人群 | 主要目标 | 典型入口 | 最低证据负担 | 允许的脱敏/替代 | 默认结果去向 |
|---|---|---|---|---|---|---|
| `community-light` | 首次上传者、闭源团队、快速试跑者 | 低摩擦接入、先形成公共样本 | wrapper 一键命令或 CLI offline/connected | 当前 M3 最小 bundle + 最小 trace 骨架 + 基本声明字段 | 允许 redacted trace、允许部分大对象外链、允许离线初始化 | Community intake |
| `reproducible-standard` | 认真比较的 uploader、框架作者、独立研究者 | 进入可 replay / 可 reproduce 的次级可信层 | CLI connected mode + preregistered run-group | 完整 run-group、全 attempts 披露、可 replay evaluator 证据、环境与 policy digest、复现所需最小上下文 | 允许受控脱敏，但不得破坏 replay / reproduce | Reproduced candidate intake |
| `verified-full` | 冲击官方结论的团队、平台合作方、旗舰 claim 提交方 | 进入官方验证通道 | 平台控制 runner / 官方评分通道 / 升级审计通道 | `reproducible-standard` 全量要求 + 更强审计材料 + 平台控制复跑或 hidden scoring 所需材料 | 允许 public/sealed 双通道，但 public 版不得破坏公开说明 | Verified candidate intake |

### 4.3 每档 profile 的产品语义

#### A. `community-light`

定位：
- 解决“我先跑起来再说”的问题
- 让平台快速积累多样化 harness / model / adapter 样本
- 兼容闭源、私有环境、还没准备好公开全部细节的团队

建议要求：
- 与 M3 当前最小 bundle 对齐
- 至少要有可审计的 task-level 结果与最小 trace 骨架
- 必须显式声明脱敏范围
- 默认不承诺能直接 reproduce

建议产品行为：
- 允许 wrapper 一键执行
- 上传后立刻生成 scorecard
- 明确显示“如何升级到 reproducible-standard”

#### B. `reproducible-standard`

定位：
- 解决“我希望别人真的能复核我这套 harness”的问题
- 作为 uploader、framework author、reproducer 三方协作的默认工作层

建议要求：
- connected mode 或等价 preregistration 流程
- 完整 run-group 与全 attempts 披露
- replayable evaluator 输出
- reproduce 所需的最小配置 / digest / resolution 信息
- 对 redacted 内容提供非公开审计副本或 sealed counterpart（与 D 流协同）

建议产品行为：
- 上传后自动进入 `needs reproduction` 候选队列
- 系统页上明确展示“还差几次独立支持 / 哪些校验已完成”
- 默认作为 Reproduced Board 的供给层

#### C. `verified-full`

定位：
- 解决“我要进入官方默认结论层”的问题
- 面向高影响结果、旗舰 claim、平台合作评测

建议要求：
- 满足 reproducible-standard
- 接受平台控制环境、平台官方评分通道，或等价强度的升级审计
- 满足更强 trace / sealed audit / attestation 要求（细节由 D 流与 C 流冻结）

建议产品行为：
- 进入专门的 verified candidate queue
- 如果切片尚未达到公开门槛，则展示为“verification in progress / warming up”
- 不因高 profile 而自动进榜；仍以实际审计结论为准

### 4.4 profile 与 trust tier 的推荐映射

| Submission profile | 默认目标 tier | 审计失败时可回落 | 备注 |
|---|---|---|---|
| `community-light` | Community | 不适用 | 低摩擦入口，不伪装高信任 |
| `reproducible-standard` | Reproduced | Community | 重点在 replay / reproduce 能力 |
| `verified-full` | Verified | Reproduced / Community | 重点在官方验证通道与升级审计 |

### 4.5 对 CLI 与 bundle 的最小接口建议

本 packet 不冻结字段名，但建议 draft2 至少支持下列产品语义：

- CLI 允许显式选择 `submission profile`
- upload receipt 中反映：
  - 目标 profile
  - 当前 trust tier
  - 下一升级所缺条件
  - 是否进入 reproduce queue / verified queue
- bundle / remote metadata 中保留 profile 信息，便于后续 UI 与统计分层

> 具体字段名、命令参数名与 receipt 结构由 C 流收敛；本流只要求“profile 层”必须可见且不与 trust tier 混淆。

---

## 5. 主榜空心期的过渡产品策略（修复 IR-15）

### 5.1 不改原则，只改默认发现路径

本 packet 明确支持：

- **默认官方主榜仍然只展示 Verified**
- 但平台首页与默认探索路径不应只有一个空榜

建议把早期平台的公开产品层拆成三层：

1. **Official Verified Board**
   - 官方默认结论层
   - 可以暂时稀疏，但不能取消

2. **Reproducibility Frontier**
   - 展示最有希望升级、已具 replay/reproduce 证据的系统
   - 是早期平台最重要的“供给层”

3. **Community Lab / Feed**
   - 展示最新提交、活跃 adapter、热门 lane、待复现候选
   - 负责维持活跃度，不承担官方结论职责

### 5.2 建议的 launch phases

#### Phase 0 — Seeded Protocol Launch

目标：先让协议和 CLI 可跑、可看、可分享。

建议动作：
- 平台自己提供 2–3 个官方 baseline / reference system
- 发布 1-click 样例和公开 bundle 样本
- 首页明确“官方主榜建设中，但协议已开放”

#### Phase 1 — Community Ramp

目标：快速积累多样化上传。

建议动作：
- 强推 `core-lite-v1 + community-light`
- 允许 wrapper 一键跑
- 强化“最新提交”“热门 harness”“待复现候选”流

#### Phase 2 — Reproduce Market

目标：把“数据多”变成“数据可复核”。

建议动作：
- 上线 reproduce queue
- 对高关注结果打 `needs reproduction`
- 平台与社区 reproducer 共同积累 Reproduced 供给层

#### Phase 3 — Selective Verified Launch

目标：在少量切片上形成可信的默认官方结论。

建议动作：
- 只挑**一个 onboarding lane + 一个 prestige lane** 做重点验证
- 其余 lane 先保留在 Reproduced / Research 发现层
- 对外只宣传“这些 slice 已进入官方验证期”

#### Phase 4 — Broaden Verified Coverage

目标：等 reproduce / audit 供给稳定后，再扩大 Verified 覆盖面。

### 5.3 主榜空心时的默认 UI 行为

当某个 slice 的 Verified 结果不足以形成稳定公开排序时，建议：

- 保留该 slice 的 `Official Verified Board` 入口
- 显示 `warming up` / `verification in progress` 状态
- 同页下方提供：
  - 当前官方 baseline
  - 最接近 Verified 的 Reproduced 候选
  - 等待复现 / 等待审计的 run-group

这样做的好处是：
- 不破坏“Verified 才是默认主榜”原则
- 又不会让用户误以为平台什么都没有

### 5.4 官方 baseline seeding 的作用

建议 draft2 明确承认：

> **v0.1 早期主榜不可能完全依赖自然上传，平台需要适度 baseline seeding。**

baseline seeding 的作用不是“替代社区”，而是：
- 给出最小比较锚点
- 验证协议链路可用
- 为 reproducer 提供练手对象
- 避免主榜首月完全空心

---

## 6. Persona → Recommended Lane 默认路径（修复 IR-17）

### 6.1 launch 期只重点宣传两条产品路径

虽然 M2 当前列出三条首批 lane，但从 adoption 角度建议在 launch 叙事中只重点主推：

- **Onboarding lane**：`core-lite-v1`
- **Prestige lane**：`terminal-lite-v1`

`workflow-clean-v1` 保留为重要的专家/扩展 lane，但不应在第一屏把叙事打散。

### 6.2 persona 默认路径表

| Persona | 默认第一站 | 推荐 profile | 下一步 | 目标状态 |
|---|---|---|---|---|
| 首次体验者 / Casual Builder | `core-lite-v1` | `community-light` | 跑通后切到 connected mode，再补 `reproducible-standard` | 先完成公开首跑，再形成可复核样本 |
| 框架作者 / Harness Maintainer | `core-lite-v1` | `reproducible-standard` | 稳定后转 `terminal-lite-v1`，争取独立复现支持 | 建立 system page 与支持计数 |
| 独立复现者 / Auditor | `core-lite-v1` 校准工具链；随后优先接 `terminal-lite-v1` 的待复现单 | `reproducible-standard` | 用 `replay` / `reproduce` 完成公共审计 | 成为 Reproduced 供给侧 |
| 闭源团队 / Enterprise Team | `core-lite-v1` 或 `terminal-lite-v1` | `community-light`（可 redacted） | 对高价值结果升级到 `reproducible-standard`，必要时走 sealed audit | 在不暴露私有资产下获取公共可信度 |
| 冲击官方结论的旗舰团队 | `terminal-lite-v1` | `verified-full` | 对关键 claim 补齐平台控制复跑或官方评分 | 进入 Verified 主榜 |
| 工具编排 / 多 agent 研究者 | `workflow-clean-v1` | `reproducible-standard` | 若 claim 重要，再申请 `verified-full` | 用结构化 workflow 结果支撑研究结论 |

### 6.3 推荐的 onboarding 文案逻辑

建议 draft2 明确推荐如下用户引导顺序：

1. **先问用户是谁**： casual / framework author / reproducer / enterprise / flagship claimant
2. **再推荐 lane**：默认不让用户一上来面对全部 lanes
3. **最后推荐 profile**：告诉他“先选轻量入口还是高可信入口” 

换句话说：

> **先分 persona，再分 lane，再分 profile；不要反过来让用户先看一堆 benchmark 和证据要求。**

---

## 7. `scorecard view` 与 `research view` 的双层呈现（修复 IR-18）

### 7.1 为什么必须双层

当前 M6 对研究展示已经较强，但默认产品层还不够薄。

建议 draft2 明确：

- **Research view 是规范与审计上的真源**
- **Scorecard view 是给更广泛读者的压缩视图**

任何出现在 scorecard view 的结论，都必须能深链回 research view 的证据与统计细节。

### 7.2 两种视图的分工

| 视图 | 目标读者 | 默认场景 | 应展示什么 | 不应做什么 |
|---|---|---|---|---|
| `scorecard view` | 决策者、普通上传者、框架作者、媒体读者 | 首页、系统页、分享卡片、默认对比页 | trust tier、slice 标签、主指标、样本量、CI/rank band、成本/延迟摘要、support_count、health 提醒、last_audited_at | 不得伪装成“精确全序总榜”；不得隐藏 uncertainty；不得省略 tier |
| `research view` | 研究者、审计者、复现者、争议处理者 | run-group 详情页、下载页、审计页 | 全 attempts、task-level 明细、trace / report 链接、ablation、agreement rate、audit trail、争议状态、health snapshot | 不得只给摘要不给证据；不得把 UI 便捷性凌驾于审计完整性之上 |

### 7.3 `scorecard view` 的建议字段

建议 scorecard 至少显示：

- `trust tier`
- `fixed-model / fixed-harness / combination` slice 标签
- `lane_id`
- 主效果指标（如 success rate）
- `n_runs` 与 `n_tasks`
- 95% CI 或 rank band
- `median cost` / `p95 latency`
- `support_count` / `independent_submitter_count`（如适用）
- `benchmark_tuned` / `general-purpose` 标记
- `autonomy mode`
- `health warning`（freshness / contamination / validity 摘要）
- `last_audited_at`

### 7.4 `research view` 的建议字段

建议 research view 至少包括：

- 全 run-group attempt 列表
- task-level 明细与 terminal states
- replay / reproduce report
- trace bundle / artifact manifest / sealed bundle 引用
- 容差判定结果与 agreement 解释
- audit history / dispute history / invalidation history
- ablation 结果（如有）
- benchmark health snapshot 全量字段

### 7.5 两层视图的严格关系

建议写入 draft2 的原则：

1. **Scorecard 派生于 Research，不得独立造语义**
2. **如果某项结论无法在 Research view 中追溯，就不得出现在 Scorecard**
3. **默认分享链接可以落在 Scorecard，但必须一跳到达 Research**
4. **研究视图中的 raw metrics 与 uncertainty 优先级高于产品化综合标签**

---

## 8. 建议改动到哪些模块、哪些段落

以下不是直接改稿，而是给主控整合 draft2 时的落点建议。

### 8.1 `ohbp-v0.1-draft1.md`

| 建议位置 | 改动方向 |
|---|---|
| `§7 Verification Tiers 与治理` | 增加一段：trust tier 与 submission profile 的区别；补 Community → Reproduced → Verified 的升级路径说明 |
| `§8 Ranking Policy` | 增加“默认官方主榜 + Reproducibility Frontier + Community Lab”的产品层次说明（非规范性推荐） |
| `§11 v0.1 推荐起手形态` | 补 launch phases、onboarding lane / prestige lane、baseline seeding、空心期策略 |
| `§14 一句话定义` | 可微调一句，使其不只描述分层，还点出“开放提交 + 升级验证 + 薄网站展示”的闭环 |

### 8.2 `modules/foundations.md`（M1）

| 建议位置 | 改动方向 |
|---|---|
| `§3.1 / G7 服务 0→1 落地` | 增加“0→1 不只是 CLI-first，还需要 contributor / reproducer flywheel” |
| `§4 / P10 MVP-first` | 增加“薄网站不等于无产品闭环，至少要有 profile、角色路径、升级提示” |
| `§4 / P11 生态中立` | 增加“任何 wrapper 的职责是把更多人带进协议，而不是发明第二套语义” |
| `§6 Glossary` | 新增术语：`submission profile`、`uploader`、`framework author`、`reproducer`、`scorecard view`、`research view` |
| `§7 Foundations 模块输出要求` | 增加“其他模块必须承载角色路径与视图分层，不得只给对象不给入口” |

### 8.3 `modules/benchmark-execution.md`（M2）

| 建议位置 | 改动方向 |
|---|---|
| `§7.3 首批推荐 lane` | 在每个 lane 下补“推荐 persona”与“推荐 submission profile” |
| `§7.4 暂缓 lane` | 明确 launch 期不把叙事重点放在太多 lane 上，避免 onboarding 分裂 |
| `建议新增 §7.6 Launch recommendation` | 固化 `core-lite-v1 = onboarding lane`、`terminal-lite-v1 = prestige lane`、`workflow-clean-v1 = expert lane` 的默认路径 |

### 8.4 `modules/run-data-evidence.md`（M3）

| 建议位置 | 改动方向 |
|---|---|
| `§8 Bundle Layout` 后 | 建议新增小节：`Submission Profiles`，定义三档 profile 对 bundle 负担与可脱敏边界的影响 |
| `§9 完整性建议` | 补充：不同 profile 下 public bundle / sealed bundle / redaction 的最小关系（需与 D 流联动） |
| `§11 v0.1 最小必选项（MUST）` | 增加 profile 分层说明：MUST 是底线，但更高 profile 需要额外证据，不得混为“一档提交” |

### 8.5 `modules/trust-governance-ranking.md`（M4）

| 建议位置 | 改动方向 |
|---|---|
| `§3.1~§3.4 Verification Tiers` | 增加“profile ≠ tier”的说明，以及从低 profile 升到高 tier 的典型路径 |
| `§4.2 官方默认榜单` | 增加 early-stage 的产品发现层建议：Verified 主榜、Reproduced 次级发现层、Community feed |
| `§4.7 System View 与 Run View` | 增加 system page 的 adoption 字段：`support_count`、`independent_submitter_count`、`agreement_rate` 的产品化解释 |
| `§5.5~§5.6 审计与发布决策` | 增加 `needs reproduction` / `verified candidate` / `warming up` 等发布状态建议 |
| `§9 SHOULD` | 增加“平台应提供 reproducer 友好的待复现队列与升级路径” |

### 8.6 `modules/cli-adapter.md`（M5）

| 建议位置 | 改动方向 |
|---|---|
| `§2.2 执行模式` | 增加 connected/offline 与 submission profile 的映射建议 |
| `§4.5 upload` | 增加 upload receipt 对 profile、目标 tier、升级缺口、queue 状态的反馈语义 |
| `§6.4 上传行为要求` | 增加“上传后必须返回可分享结果 URL / receipt / 下一步提示”的产品要求 |
| `§7.2 reproduce` | 增加 reproduce queue / reproducer workflow 的产品化目标 |
| `§8.3 推荐工作流` | wrapper 应先帮用户选 persona / lane / profile，再展开 CLI 流程 |

### 8.7 `modules/metrics-uncertainty.md`（M6）

| 建议位置 | 改动方向 |
|---|---|
| `§6.1 默认统计展示规则` | 区分 scorecard 默认摘要字段与 research 默认展开字段 |
| `§7.1 三张默认比较视图` | 再补一层读者视角：scorecard vs research，不与 fixed-model / fixed-harness 视角冲突 |
| `§12 SHOULD` | 增加“首页默认是 scorecard view，但必须深链到 research view；不得只给综合标签不给 uncertainty” |

---

## 9. 与其他修复流的接口说明

### 对 A 流（Terminology & Canonical Objects）

本 packet 依赖 A 流完成：
- trust tier 命名统一
- self-reported / community 的最终映射统一

本流要求：
- **submission profile 不能与 trust tier 共用 enum**

### 对 B 流（Registration / Completeness / Statistical Gates）

本 packet 依赖 B 流完成：
- Reproduced / Verified 的真正升级门槛
- slice 最低公开门槛
- 容差、run-group 完整性与 terminal states

本流要求：
- 空心期的 `warming up` / `insufficient evidence` 状态，需要 B 流给出正式发布门槛支持

### 对 C 流（Bundle / CLI Contract）

本 packet 依赖 C 流完成：
- bundle 命名冻结
- CLI 字段与 receipt 的收敛

本流要求：
- CLI / upload receipt 必须能表达 profile、queue 状态、升级缺口

### 对 D 流（Governance Hardening）

本 packet 依赖 D 流完成：
- sealed audit bundle
- human interaction telemetry
- memory / cache 证明机制

本流要求：
- `reproducible-standard` 与 `verified-full` 的 public/sealed 双通道要可落地

---

## 10. 建议写进 draft2 的最短版本结论

如果主控需要一个可直接整合到 draft2 的最短结论，可压缩为以下四条：

1. **OHBP 公开可信度层与提交摩擦层必须分开：trust tier ≠ submission profile。**
2. **v0.1 至少应提供三档提交 profile：`community-light`、`reproducible-standard`、`verified-full`。**
3. **平台必须把 Uploader、Framework Author、Reproducer 作为三类一等参与者来设计路径与收益。**
4. **默认官方主榜仍只看 Verified，但首页/默认发现层必须同时提供 Reproduced frontier 与 Community feed，以避免冷启动空心化。**

---

## 11. 本 packet 的交付结论

本修复流对 IR-15 ~ IR-18 的最终建议可以概括为一句话：

> **让协议继续保持“可信度优先”，但让产品层第一次明确回答：谁来供给结果、为什么愿意供给、先走哪条 lane、交哪一档证据、结果看板怎么读。**

如果 draft2 吸收本 packet，平台会从“一个正确但偏冷的可信评测协议”，前进一步变成“一个有明确参与者路径、可冷启动、可持续生长的开放评测系统”。
