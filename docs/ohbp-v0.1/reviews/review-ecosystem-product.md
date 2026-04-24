# Reviewer D — 生态 / 产品 / Adoption 审核意见

> 审核角色：Reviewer D（生态 / 产品 / adoption reviewer）
> 审核范围：`task_plan.md`、`rubric.md`、`ohbp-v0.1-draft1.md` 与全部模块文件
> 审核视角：生态兼容性、CLI-first 路线、SKILL wrapper 定位、冷启动、lane 选择、平台吸引上传者与复现者的能力
> 审核日期：2026-04-20

---

## 1. 结论摘要

### 总结论
从 **生态兼容性 / 产品落地 / adoption** 视角看，`ohbp-v0.1-draft1` 的方向是**明显正确的**，并且已经形成了一个较强的一致性主线：

- 不是先做重网站，而是先做 **协议 + CLI + 证据包 + 平台复验分层**
- **CLI-first** 路线在模块之间基本一致，没有被网页形态反向绑架
- **SKILL 只是 wrapper** 的边界写得足够硬，这对避免生态锁死非常关键
- 首批 **lite lane** 选择是理性的，具备冷启动意识
- `preset + custom adapter` 的双轨设计，已经为生态兼容性打下了比较稳的底

但从 adoption 角度，这一版仍然**不能给满分**。最核心原因不是协议对象缺失，而是：

> **这版 draft1 已经较好地定义了“怎样产出可信结果”，但对“为什么生态参与者愿意持续产出可信结果”定义得还不够硬。**

也就是说，真相生产机制已经开始成型，但参与者飞轮、复现者激励、冷启动分层体验、低摩擦上传路径，仍然偏“方向正确”而非“已经可打满分”。

### 本轮总体判断
- **整体 adoption 评分：8.7 / 10**
- **结论：可进入下一轮修订，但未达到生态 / 产品维度的 10/10**
- **P0：未发现**
- **P1（本 reviewer 视角下的主要产品化阻塞）：1 个**

---

## 2. 模块级评分（生态 / 产品 / adoption 视角）

> 说明：以下分数不是“模块技术正确性总分”，而是 Reviewer D 从 adoption 视角给出的模块分。

| 模块 | 分数 | 结论 | 主要理由 |
|---|---:|---|---|
| `M1 Foundations` | **8.8 / 10** | 方向正确，边界清晰 | `Protocol over Product`、`CLI-first`、`Ecosystem Neutrality` 等原则为 adoption 提供了很好的上位约束；不足在于对参与者画像、冷启动优先级、产品级成功标准还较抽象 |
| `M2 Benchmark & Execution` | **9.2 / 10** | 本轮最强模块之一 | `core-lite-v1 / terminal-lite-v1 / workflow-clean-v1` 的 lane 选择非常符合冷启动；对重型 lane 的克制也正确；不足在于 lane 扩展后容易形成产品叙事分裂，需要更强的“默认推荐路径” |
| `M3 Run Data & Evidence` | **8.0 / 10** | 证据强，但 adoption 压力大 | 可审计性很强，但 bundle 与 trace 要求较重；对 casual user、闭源团队、企业内网用户的提交摩擦较高；需要更明确的轻量 profile / 脱敏 profile / 远程对象存储策略 |
| `M4 Trust / Governance / Ranking` | **8.4 / 10** | 治理方向正确，但参与者经济未闭环 | `Community / Reproduced / Verified` 分层是对的，默认 Verified 主榜也对；但“从 Community 升到 Reproduced / Verified 为什么值得”写得不够产品化，复现者激励仍偏弱 |
| `M5 CLI & Adapter Contract` | **9.4 / 10** | 本轮最佳模块 | CLI-first、preset + custom adapter、connected/offline、replay/reproduce 区分、SKILL wrapper 边界都非常清楚；是 adoption 主线最完整的模块；不足在于 task×seed×attempt 的执行粒度对部分长会话 IDE/agent 仍可能偏重 |
| `M6 Metrics & Uncertainty` | **8.6 / 10** | 科学性强，但产品默认面仍偏重 | 分项指标、run group、rank spread 都正确；但对普通上传者和普通读者而言，默认呈现维度仍然偏“研究视图”，需要更强的产品化摘要层 |

### 模块排序（按 adoption 贡献）
1. **M5 CLI & Adapter Contract**
2. **M2 Benchmark & Execution**
3. **M1 Foundations**
4. **M6 Metrics & Uncertainty**
5. **M4 Trust / Governance / Ranking**
6. **M3 Run Data & Evidence**

这个排序并不代表 M3/M4 质量差，而是说明：
- 它们更偏“正确治理与证据”
- 但在 adoption 摩擦上天然更重

---

## 3. 整体 adoption 评分

## 3.1 总分
**8.7 / 10**

## 3.2 打分解释
这个分数意味着：

- 已经明显超过“空想型协议”
- 已经具备作为 v0.1 草案继续推进的资格
- 但距离“生态兼容性与 adoption 满分”还有一段明显距离

差距主要不在“概念混乱”，而在：
1. **参与者飞轮设计还不够硬**
2. **轻量体验与强证据之间的桥还不够产品化**
3. **复现者角色虽然被治理承认，但还没被产品真正奖励**

## 3.3 按 rubric 的映射判断
从 Reviewer D 视角看：

- **方法论严谨性**：高
- **协议完整性**：高
- **治理与反作弊**：高
- **可实现性**：中高
- **生态兼容性**：中高偏高
- **文档清晰度**：高

真正拖 adoption 后腿的，不是概念清晰度，而是：

> **平台把“结果可信”定义得比较完整，但把“生态为什么愿意贡献可信结果”定义得还不够完整。**

---

## 4. 本轮最认可的产品化优点

## 4.1 CLI-first 路线是对的，而且在 draft1 中已经形成一致性
这是本 reviewer 最认可的一点。整份草案没有滑向“先做网站收截图”，而是统一收敛到：

- 协议先行
- CLI 为标准执行层
- 网站是展示与治理层
- SKILL / plugin 只是入口包装

这条线一旦守住，OHBP 才有可能成为真正的生态底座，而不是某个单生态的内置功能。

## 4.2 SKILL wrapper 定位非常健康
M5 把下面这条写得足够明确：

> **SKILL 是 wrapper，不是协议。**

这点非常关键，因为它同时解决了两个问题：
- 不被单一 agent 生态锁死
- 不产生“双协议”问题

从 adoption 看，这意味着你可以：
- 先用 CLI 做标准执行层
- 后续再分别给 Codex、Claude Code、OpenHands、generic CLI 做包装入口
- 不破坏核心证据链与 bundle 结构

## 4.3 首批 lane 选择理性，说明团队有冷启动意识
`core-lite-v1`、`terminal-lite-v1`、`workflow-clean-v1` 的组合是合理的：

- `core-lite-v1` 负责一句命令、快速 onboarding、协议联调
- `terminal-lite-v1` 负责抓住当前最强需求场景
- `workflow-clean-v1` 负责抓 tool orchestration 与多步流程价值

这比一开始就冲 WebArena / OSWorld / MLE-bench 之类重场景要健康得多。

## 4.4 preset + custom adapter 双轨是 adoption 成败关键，目前方向是对的
如果只有 preset，没有 custom adapter，就会被生态锁死；
如果只有 custom adapter，没有 preset，就会没有冷启动。

draft1 在这点上做得是对的，而且 M5 已经把两者落到“最终都解析成真实 adapter 身份”的方向上，这是平台长期可信度的关键。

---

## 5. 最重要的产品化风险

## 5.1 P1 级产品化风险：冷启动会卡在“规范很好，但没人愿意持续跑”
这是我认为当前 draft1 在 adoption 维度的**头号风险**。

### 风险表述
当前协议已经比较充分地规定了：
- 如何跑
- 如何打包
- 如何分层
- 如何复验
- 如何治理

但还没有同等强度地规定：
- 为什么普通用户要跑
- 为什么框架作者要持续上传完整 run-group
- 为什么第三方复现者要花资源去 reproduce 别人的结果
- 为什么平台在 early stage 不会因为 Verified 门槛过高而变成“主榜空心化”

### 为什么这是 P1
因为它不是“运营以后再说”的问题，而是会直接影响协议是否能长出真实生态数据。

如果不解决，最可能出现的情况是：
- Community 层很多
- Verified 层太少
- 主榜长期稀疏
- 复现者稀缺
- 平台在方法论上正确，但在产品上冷

### 当前草案里已有的正确基础
- 已经有 `Community / Reproduced / Verified`
- 已经有 CLI-first
- 已经有 lite lane
- 已经有 preset + custom adapter

### 但还缺的产品化闭环
需要更明确写出：
1. **上传者为什么值得跑**：例如 badge、profile 排序、featured、API credits、verified priority
2. **复现者为什么值得复现**：例如 reputation、bounty、复现积分、平台 credits
3. **社区层如何向高信任层升级**：不仅是治理条件，还要有 UX 路径和收益差异
4. **早期如何避免主榜过空**：例如 staged launch、lane-by-lane verification、官方 baseline seeding

> 一句话概括：**draft1 对“真相生产”定义得更充分，对“参与者生产”定义得还不够充分。**

---

## 6. 其他重要风险（按严重度排序）

## 6.1 P2：M3 证据包门槛较重，可能压低闭源团队和普通开发者上传率
M3 的证据结构非常强，但 adoption 成本也高。

对不同用户群的压力分别是：
- **普通用户**：不知道哪些文件必须留、哪些可以简化
- **框架作者**：担心实现复杂、集成周期长
- **企业/闭源团队**：担心 trace / artifacts 暴露过多

### 建议
需要更明确地增加三种提交 profile：
- `community-light`
- `reproducible-standard`
- `verified-full`

并给每档明确：
- 必填证据
- 可脱敏证据
- 可外链对象
- 默认进入的 tier

## 6.2 P2：默认官方主榜只看 Verified 是对的，但需要更强的过渡产品层
治理上这条是对的；产品上这条会造成“看起来太空”。

### 建议
网站/协议说明中应明确三层默认入口：
- 首页 hero：Verified 官方结论
- 次级榜单：Reproduced 热门系统
- 社区页：Community 最新上传

也就是说，**不改主榜原则，但要改默认发现路径。**

## 6.3 P2：lane 叙事未来有碎片化风险
目前三条 lane 很合理，但未来如果继续加：
- browser
- desktop
- repo-heavy
- research
- multimodal

产品面很容易出现“用户不知道先跑哪条”的问题。

### 建议
需要在 M2 或 draft 总纲里增加：
- **persona → recommended lane** 映射
- **launch 阶段只主推 1 个 onboarding lane + 1 个 prestige lane**

## 6.4 P2：M5 的 adapter 调用粒度对部分 agent 产品可能偏细
“一次 adapter 处理一个 task × seed × attempt”在协议层很干净，但对某些：
- IDE 内长会话 agent
- 多任务共享上下文 agent
- 多 agent 协调 runtime

可能会让适配层很厚。

### 建议
保留当前规范粒度，但增加一句产品化解释：
- **协议观测粒度** 是 task×seed×attempt
- **实现执行粒度** 可在不破坏证据边界的前提下做 session 级复用

## 6.5 P2：M6 研究表达很强，但“默认用户理解层”仍需更薄
M6 的 raw metrics、CI、rank spread、tier 很科学，但普通读者和普通上传者不一定能快速理解。

### 建议
在 draft 层补一层默认产品摘要：
- `scorecard view`
- `research view`

前者面向决策者，后者面向研究者。

---

## 7. 对平台吸引上传者能力的评估

### 当前评分：**8.3 / 10**

### 优点
- 有 `preset + custom adapter`
- 有 quick/lite lanes
- CLI-first 便于自动化
- 不要求一开始就大网站交互
- Self-reported / Community 给了低门槛入口

### 不足
- 上传者收益结构还不够明确
- bundle 负担偏重
- 对“我就想先一句命令试试”的产品承诺还不够具体
- 对闭源/企业用户的脱敏与私有部署叙事还不够强

### Reviewer D 判断
协议已经在“能不能让人接入”上做得不错，
但在“接入之后为什么长期愿意留在这里贡献结果”上，还需要更明确的产品化机制。

---

## 8. 对平台吸引复现者能力的评估

### 当前评分：**7.9 / 10**

这是我认为 draft1 相对更弱的一项。

### 原因
草案已经承认并尊重复现者的角色，但尚未把“复现”设计成一个有独立吸引力的产品角色。

目前缺少较明确的：
- reproducer badge / reputation
- reproduce queue / priority lane
- 平台 credits / bounty / featured status
- 复现成功后对榜单与个人 profile 的正反馈
- “我不上传自己的 harness，但我愿意做公共审计者”的身份路径

### 建议
在后续版本中把 **Reproducer** 明确设为平台三大角色之一：
1. Uploader
2. Framework Author
3. Reproducer / Auditor

否则 Reproduced 层会在制度上存在、在产品上虚弱。

---

## 9. 对 SKILL wrapper 定位的专项评价

### 评分：**9.5 / 10**

这是本 reviewer 最满意的一个专项判断。

### 理由
1. 避免单一生态锁死
2. 保持 CLI 作为标准执行层
3. 允许未来多生态包装共存
4. 不让 SKILL 分叉 bundle / manifest / tier 语义

### 剩余建议
唯一还可以补的一点是：
- 在总 draft 中增加一句更偏产品的话：
  - **“任何 wrapper 的职责是把更多人带进协议，而不是替协议发明第二套语义。”**

---

## 10. Reviewer D 给出的修订优先级

## Priority A（下一轮建议优先修）
1. **补“贡献者飞轮”与“复现者飞轮”**
   - 明确 uploader / reproducer / framework author 各自收益
   - 给出最小 reputation / badge / featured / credits 机制

2. **补提交 profile 分层**
   - `community-light`
   - `reproducible-standard`
   - `verified-full`
   让 M3 的重证据结构在 adoption 上更可承受

3. **补主榜空心期的产品过渡策略**
   - 官方 baseline seeding
   - staged verification launch
   - Verified 主榜 + Reproduced 次级发现页 + Community feed

## Priority B（第二优先级）
4. **补 persona → lane 推荐路径**
   - 普通用户先跑哪条
   - 框架作者先跑哪条
   - 企业/闭源团队先跑哪条

5. **补 scorecard view 与 research view 双层默认呈现**
   避免 M6 的科学表达压过产品理解效率

## Priority C（可后续迭代）
6. **补 preset 认证等级**
   - official preset
   - maintained community preset
   - experimental adapter

7. **补 adapter session 复用的解释层**
   避免 IDE-native / long-session harness 误认为协议天然不友好

---

## 11. 最终裁决

### Reviewer D 总裁决
**通过进入下一轮修订，但不建议以“生态 / adoption 已达满分”对外表述。**

### 最简短判断
这版协议草案在 adoption 方向上最大的优点是：
- 路线对
- 边界清
- 冷启动意识存在
- CLI-first 与 SKILL wrapper 定位健康

最大的不足是：
- **它更像一个已经开始成熟的“可信评测协议”，还不像一个已经形成强生态飞轮的“参与者系统”。**

### 最后一句评语
> **如果说 draft1 已经把“怎样让结果可信”讲到了 8.5–9 分，那它在“怎样让生态愿意持续贡献可信结果”上，目前大约还在 7.5–8.5 分区间。**
>
> 下一轮最值得补的，不是再加更多治理条款，而是把上传者、框架作者、复现者三类人的收益路径写得更硬。
