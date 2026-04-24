# M1 — Foundations

## 1. 模块定位

本模块定义 OHBP v0.1（Open Harness Benchmark Protocol）的基础问题陈述、范围边界、设计原则、对象模型与术语表。它不负责规定具体字段细节，也不直接给出榜单算法；它的职责是为后续模块提供共同前提，避免协议、benchmark、harness 与榜单政策相互混淆。

本模块应回答 5 个基础问题：

1. 我们究竟在解决什么问题。
2. OHBP v0.1 的目标是什么，不做什么。
3. 设计时遵循哪些不可轻易破坏的原则。
4. 协议对象之间如何分层、谁依赖谁。
5. 团队在后续模块中使用哪些统一术语。

---

## 2. 问题定义（Problem Statement）

### 2.1 行业现状

当前 AI agent / harness 生态已经进入“模型能力 + 系统工程能力”共同决定结果的阶段。实际表现往往同时受以下因素影响：

- 基础模型能力
- harness / scaffold / orchestration 设计
- memory 与 context 管理策略
- 工具调用与权限边界
- prompt / rules / retry / reviewer 等系统策略
- benchmark 本身的任务设计、评分器、健康度与污染情况

行业已有大量 benchmark 与若干 leaderboard，但仍存在 4 个核心断层：

1. **比较对象混淆**：很多榜单混合比较 model、harness、prompt、tooling、benchmark-specific tuning，导致结论难以解释。
2. **证据层薄弱**：很多结果只提供摘要分数，缺乏可审计证据包，无法可靠复验。
3. **治理层不足**：best-of-N、人工干预、缓存答案、benchmark-tuning、环境作弊、伪造 trace 等问题会迅速污染榜单。
4. **测量层失真**：benchmark 会老化、污染、失效；单次运行的波动又会让“高分”缺乏稳定性与可迁移性。

### 2.2 核心挑战

OHBP 面对的不是“如何再做一个排行榜网站”，而是下面这个更基础的问题：

> 如何为 agent / harness 生态提供一套公开、版本化、可审计、可复验的评测协议，使不同参与者可以在不共享同一实现细节的前提下，产出可比较的运行证据，并在分层信任体系下形成高可信结论。

### 2.3 OHBP 的回答方式

OHBP v0.1 的基本回答不是“找到唯一正确的总分”，而是：

- 定义一套统一的**协议对象与证据结构**；
- 让 benchmark、runner、harness、平台治理各司其职；
- 通过**分层信任**而不是“默认相信上传者”来管理 crowdsourced 结果；
- 通过**多维指标 + 版本快照 + 不确定性披露**来避免把产品偏好伪装成科学真理。

---

## 3. 目标与非目标（Goals / Non-goals）

## 3.1 v0.1 目标

OHBP v0.1 的目标是定义一个 **最小可行、可扩展的协议骨架**，支持从本地运行、证据打包、上传、复验到分层展示的完整闭环。

### G1. 定义统一的协议骨架
提供 benchmark card、execution contract、run manifest、evidence bundle、verification tier、ranking policy 等对象的清晰边界与协作关系。

### G2. 让“可审计证据”成为一等公民
协议优先产出可复验、可重放、可抽查的证据，而不是仅产出一个 score。

### G3. 支持“固定模型，只换 harness”等关键比较视角
协议必须能够支持至少以下分析方式：
- 固定模型，只换 harness
- 固定 harness，只换模型
- 模型 × harness 适配矩阵
- benchmark / lane 内的分层比较

### G4. 内建分层信任
协议必须天然支持 Self-reported、Reproduced、Verified 等多层结果状态，确保主榜不被自报结果直接污染。

### G5. 兼容 preset 与 custom adapter
协议不能绑定某一 agent 框架或某一产品生态，必须允许：
- 官方预置集成（preset）
- 用户自定义适配器（custom adapter）
- 多模型提供商与多 runtime 组合

### G6. 承认 benchmark 健康度是测量问题的一部分
协议必须为 freshness、contamination risk、validity、environment stability 等健康字段预留位置，避免把 benchmark 当作永恒真理。

### G7. 服务 0→1 落地
v0.1 必须足够轻，能够支持：
- CLI-first 路线
- lite lane / quick benchmark
- 薄网站展示
- 平台抽样复跑与争议处理

## 3.2 非目标

v0.1 明确**不**试图完成以下事情：

### NG1. 不定义“唯一正确”的全球总榜
OHBP 不声称存在一个放之四海而皆准的总分，也不把某一套默认权重包装成科学真理。

### NG2. 不统一所有 benchmark 的任务内容
OHBP 是协议层，不是单一 benchmark 内容标准。不同 benchmark 可以在同一协议下并存。

### NG3. 不规定 harness 的内部架构
协议不要求 harness 必须采用特定 topology、memory、planner 或 tool router 设计，只要求其在协议合同内产出结果与证据。

### NG4. 不承诺一次性解决全部作弊问题
v0.1 只定义最低可行的治理骨架与证据需求，不承诺从协议层彻底消除所有作弊与投机行为。

### NG5. 不把平台页面、商业策略或运营决策写死进协议
协议与产品展示层分离；同一协议之上可以有多种页面与排序策略。

### NG6. 不要求所有参与者公开全部私有实现细节
v0.1 可要求必要的 hash、声明、环境摘要与证据，但不默认强制公开全部 prompt 原文、私有规则库或商业代码。

---

## 4. 设计原则（Design Principles）

以下原则是 OHBP v0.1 的基础约束。后续模块若与这些原则冲突，必须显式记录 trade-off，而不是隐式破坏。

### P1. 证据优先于声明（Evidence over Claims）
协议默认不相信“上传者的自我陈述”，而是优先相信可验证的 artifacts、trace、evaluator report 与复验结果。任何主榜结论都应可追溯到证据链。

### P2. 协议优先于产品（Protocol over Product）
OHBP 首先是开放协议，不是某个网站页面或某个单体应用。CLI、SDK、网站、数据 API、第三方镜像都只是协议的不同接口。

### P3. 测量与政策分离（Measurement separated from Policy）
“如何收集和验证结果”属于协议问题；“如何展示、加权和排序”属于 ranking policy 问题。二者必须分层，避免把政策偏好伪装成测量事实。

### P4. 对象边界清晰（Clear Object Boundaries）
benchmark、execution contract、harness、run、verification tier、ranking policy 是不同对象。协议必须明确每个对象的责任与变更边界。

### P5. 一切关键对象都必须版本化（Version Everything Critical）
至少 benchmark、evaluator、runner、harness、config、pricing snapshot、ranking policy 都应支持版本标识或快照定位。

### P6. 分层信任而非单层真相（Layered Trust over Single Truth）
OHBP 不把所有结果混成一张榜。不同信任等级必须可区分、可审计、可分别消费。

### P7. 优先确定性评分（Deterministic First）
只要能用 deterministic evaluator、schema validation、trace replay、程序化验证解决，就不应默认依赖主观评审或 LLM judge。

### P8. 比较应尽量同类同条件（Compare Like with Like）
协议必须支持在同模型、同预算、同工具权限、同 benchmark 版本等约束下做 apples-to-apples 比较。

### P9. Benchmark 健康是协议的一部分（Benchmark Health is First-class）
结果解释不能脱离 benchmark 健康状态。污染风险、老化程度、环境不稳定性与任务有效性都必须可记录、可展示。

### P10. 先做能落地的最小闭环（MVP-first）
OHBP v0.1 应优先支持 lightweight lanes、CLI-first、thin website、平台抽样复验，不依赖超重基础设施作为前提。

### P11. 生态中立（Ecosystem Neutrality）
协议不应假设参与者来自同一工具链、同一平台或同一商业生态。官方 preset 与第三方 adapter 都应是合法一等入口。

### P12. 可争议、可修正、可归档（Disputable, Revisable, Archivable）
协议必须允许 disputes、invalidation、changelog、archived versions 的存在，承认评测系统本身会进化和纠错。

---

## 5. 对象边界与分层模型（Object Boundaries）

## 5.1 总体分层

OHBP v0.1 采用四层分离：

1. **协议层（Protocol Layer）**：规定对象、字段类别、工作流、最低约束。
2. **基准层（Benchmark Layer）**：定义任务包、评分器、环境合同、健康元数据。
3. **执行层（Execution Layer）**：由 harness、model、adapter、runtime 在协议合同内实际跑任务并产出证据。
4. **治理与展示层（Governance & Presentation Layer）**：对上传结果进行验证、审计、分级、排序、展示与争议处理。

这四层可以由同一组织实现，也可以由不同组织协作实现；但在概念上必须分离。

## 5.2 核心对象定义与边界

| 对象 | 定义 | 负责回答的问题 | 不负责回答的问题 | 典型产物 |
|---|---|---|---|---|
| **Protocol（协议）** | OHBP 定义的一组对象、字段约束、工作流与信任分层规则 | 结果应该如何描述、打包、上传、复验、分层 | 哪个 benchmark 最好、哪个 harness 最强、首页怎么排序 | schema、state machine、bundle contract |
| **Benchmark（基准）** | 某一类任务集合及其 evaluator、环境要求、健康元数据 | 在特定任务家族中测什么、怎么判分、何时失效 | 平台默认如何加权总榜、哪个 harness 应排第几 | benchmark card、task package、health card |
| **Harness（被测系统）** | 执行任务的 agent / scaffold / orchestration system，可含 model、memory、tools、rules 等系统设计 | 在给定合同下如何完成任务并产出结果 | 平台是否信任它的分数、榜单如何聚合它的成绩 | repo、binary、service、adapter profile |
| **Ranking Policy（排序政策）** | 平台或消费者采用的聚合、过滤、展示和权重规则 | 哪些结果进入哪张榜、按什么权重排序、如何展示 CI | benchmark 的原始判分逻辑、run 的底层真实性本身 | leaderboard rule、weight preset、filter preset |

### 关键边界说明

#### A. Protocol ≠ Benchmark
- 协议规定“一个 benchmark 应如何被描述与接入”。
- benchmark 决定“具体测哪些任务、如何评分”。
- 同一协议可以承载多个 benchmark；同一 benchmark 也可能被多个平台消费。

#### B. Benchmark ≠ Ranking Policy
- benchmark 给出原始任务与 evaluator；
- ranking policy 决定如何消费这些结果，例如是否只看 verified、是否按成本归一化、是否分 general-purpose / tuned 榜。
- 因此同一个 benchmark 可以对应多种榜单视图。

#### C. Harness ≠ Protocol Participant Identity
- harness 是被测系统，不等于“上传账号”“组织”“提交者”。
- 一个 harness 可以有多个运行者、多个版本、多个 adapter、多个模型组合。

#### D. Ranking Policy ≠ Scientific Truth
- 排序政策是可审计、可替换、可版本化的产品/治理选择；
- 它可以帮助用户决策，但不应被描述成唯一科学结论。

## 5.3 对象依赖关系

可以将对象关系概括为：

**Benchmark + Execution Contract + Harness + Runtime Context → Run → Evidence Bundle → Verification Tier → Ranking Policy Consumption**

其中：

- **Run** 是某次执行事实；
- **Evidence Bundle** 是可审计证据封装；
- **Verification Tier** 是平台或第三方对该 run 可信程度的判定；
- **Ranking Policy** 消费的是“被允许进入某榜单的结果集合”，而不是未经分层的原始上传流。

## 5.4 v0.1 规范性边界

### 协议层 MUST
- 定义核心对象与对象边界；
- 定义 run 与 evidence 的最低描述能力；
- 定义验证层级状态；
- 定义支持 benchmark health 的元数据能力；
- 定义 ranking policy 与 measurement 的分离原则。

### 协议层 SHOULD
- 支持 preset 与 custom adapter 双路径；
- 支持 future extensions，不把 v0.1 锁死为单一生态；
- 支持 thin website / CLI-first 的 MVP 实现。

### 协议层 MUST NOT
- 把某一特定 benchmark 写成协议唯一合法基准；
- 把某一特定 leaderboard 权重写成唯一正确结论；
- 把某一类 harness 内部实现写死为合规前提；
- 把“可展示页面结构”与“协议对象定义”混为一谈。

---

## 6. 术语表（Glossary）

以下术语在 OHBP v0.1 中采用统一含义。后续模块如需扩展，必须与本节兼容或显式声明覆盖关系。

### Agent
执行任务的智能体实体，可以是单 agent，也可以是多 agent 系统中的某一角色。

### Adapter
将某个具体 harness 接入 OHBP 执行合同的桥接层。它负责把任务包输入映射到被测系统的调用方式，并把输出映射回协议要求的结果结构。

### Aggregate Metrics
一次 run 或一组 runs 的聚合指标，如 success rate、cost、latency、stability、timeout rate。

### Benchmark
用于评测的一组任务、评分器、环境要求及健康元数据的集合。benchmark 是被协议承载的内容对象，不等于协议本身。

### Benchmark Health
对 benchmark 当前测量有效性的结构化描述，通常包括 freshness、contamination risk、task validity、outcome validity、environment stability 等字段。

### Benchmark-specific Tuning
为某个特定 benchmark 或 split 做的专门优化，包括 prompt 特调、规则硬编码、缓存答案、任务特征利用等。该状态应被声明与分层，而非默认视作通用能力。

### Bundle
一次上传或归档的结果封装，至少包含 manifest、聚合结果、task 级结果与 trace/evidence 引用。

### Community Result
通过基础 schema 校验的社区上传结果，但未经独立复现或平台复跑，不应直接进入官方主榜。

### Contamination Risk
benchmark 题目、答案、轨迹或衍生信息被训练数据、缓存、公开资料或系统记忆污染的风险等级。

### Custom Adapter
由第三方或用户自己编写的 adapter，用于接入非官方 preset 的 harness。

### Deterministic Evaluator
在相同输入和环境前提下应给出一致评分结果的 evaluator。OHBP 优先鼓励 deterministic scoring。

### Evidence Bundle
可审计证据集合，包含足以支撑复算、重放、抽查或争议处理的原始或派生 artifacts。

### Execution Contract
规定一次 benchmark 运行必须遵守的执行条件，如 timeout、budget、工具权限、网络策略、环境镜像、输出模式等。

### Freshness
benchmark 对当前能力边界是否仍具代表性的状态标签。它不是历史发布日期的简单同义词，而是一个需要持续治理的健康字段。

### Harness
被测的系统工程封装，可包含模型选择、prompt、memory、planner、reviewer、tooling、rules、retry policy 等组成部分。

### Lane
同一协议或 benchmark 体系下的赛道/任务族，用于区分不同场景或不同复杂度层级，如 core-lite、terminal-lite、workflow-clean。

### Manifest
对一次 run 的结构化元数据描述，通常包含 benchmark 版本、runner 版本、harness 标识、模型信息、配置哈希、环境摘要等。

### Model
执行过程中调用的基础模型或模型组合。协议上必须允许“固定模型，只换 harness”与“固定 harness，只换模型”两种比较视角。

### OHBP
Open Harness Benchmark Protocol。一个用于描述、执行、上传、验证与消费 harness 评测结果的开放协议族。

### Policy
围绕结果使用方式的规则集合。在本协议语境中，最关键的是 ranking policy 与 governance policy。policy 可以版本化、并存与替换。

### Preset
协议或平台官方维护的标准接入配置，面向常见 harness / model / lane 提供低摩擦运行体验。

### Protocol
定义对象、工作流、字段约束、状态机与最低兼容要求的规范层。protocol 决定“如何表示和交换结果”，不直接决定“谁是第一名”。

### Ranking Policy
对结果进行过滤、聚合、排序、展示与分榜的规则集合。ranking policy 消费的是经过治理分层后的结果，而非未经甄别的原始上传。

### Reproduced Result
已经被第三方或平台按既定容差复现的结果状态，高于 self-reported，低于官方 verified。

### Run
在给定 benchmark、execution contract、harness、model 与环境上下文下进行的一次实际执行事件。

### Self-reported Result
由提交者本地或自管环境运行后上传的结果状态，仅完成基础校验，尚未被平台或第三方独立复验。

### Trace
按时间顺序记录执行过程中的关键事件流，可包含 tool 调用、输入输出引用、错误、重试、人工交互、环境事件等。

### Trust Tier / Verification Tier
平台或第三方对结果可信度所授予的层级状态，如 Self-reported、Reproduced、Verified。该层级影响结果可进入的榜单与展示范围。

### Verified Result
经平台官方运行、抽样复跑、重放校验或其他高信任流程核验通过的结果状态。默认主榜应优先消费此类结果。

### Versioned Snapshot
可唯一定位某对象在某时点定义的版本标识。OHBP 要求关键对象尽可能具备版本化能力，以支持归档、争议处理与历史对比。

---

## 7. Foundations 模块输出要求（供后续模块对齐）

后续模块在扩展具体对象时，应与本模块保持一致，至少满足以下约束：

1. 不混淆 protocol、benchmark、harness、ranking policy 的责任边界。
2. 不把自报结果直接描述为“平台真相”。
3. 不把单一总分表述为唯一科学结论。
4. 不忽略 benchmark health、freshness 与 contamination 问题。
5. 不引入与 MVP-first、CLI-first、生态中立原则相冲突的重依赖。

若后续模块必须突破以上约束，必须在对应模块中显式记录：
- 为什么突破；
- 替代方案为何不成立；
- 对可实现性、治理或兼容性的影响。

---

## 8. 小结

OHBP v0.1 Foundations 的核心立场可以浓缩为一句话：

> OHBP 不是一个“分数上传格式”，也不是一个“单一总榜算法”，而是一套将 benchmark、harness、证据、验证与排序政策分层组织起来的开放评测协议骨架。

只有先把问题定义、对象边界与设计原则讲清楚，后续的 schema、CLI、证据包、验证层级与榜单治理才不会在实现阶段重新纠缠成一团。
