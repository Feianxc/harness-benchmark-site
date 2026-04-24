# Reviewer D2 — draft2 生态 / 产品 / adoption 审核

> 角色：第二轮独立审核 Reviewer D2  
> 审核范围：生态 / 产品 / adoption 维度为主，但按统一 6 维 rubric 对相关模块与整体 draft2 打分  
> 输入：`task_plan.md`、`rubric.md`、`draft1-issue-register.md`、`ohbp-v0.1-draft2.md`、`repair-e-adoption-launch.md`  
> 日期：2026-04-20

---

## 1. 结论先说

**我的结论是：draft2 在生态 / 产品 / adoption 维度上已经从“方向正确但飞轮偏弱”，提升到“结构基本成熟、冷启动路径可讲清、产品层与方法论边界基本站稳”。**

具体判断：

1. **trust tier 与 submission profile 已经真正拆开**，且不是只在 prose 里说说，而是进入了 canonical principle / object boundary / CLI product surface 三层。
2. **`Official Verified Board / Reproducibility Frontier / Community Lab` 三层结构是合理的**，能够同时维持“Verified 主榜纯度”与“平台早期不空心”的双目标。
3. **persona → lane → profile 路径已经清楚到足以指导 v0.1 的 onboarding 文案与最小产品实现。**
4. **`scorecard view` / `research view` 的双层视图设计是本轮最成功的收敛之一**：既增强产品可读性，又没有再次滑回“神圣总榜”叙事。
5. **draft1 中与 adoption 相关的 P1（IR-15）我认为已被实质性修复。**

但我也保留 4 个 **P2**：
- 三角色飞轮已经成立，但**角色收益面还偏“叙事化”**，对 reproducer / framework author 的产品化 credit 机制还可再明确；
- `warming_up` / `verification_in_progress` 这类产品状态，**尚未和 M10 的 canonical slice state 显式对齐**；
- `Reproducibility Frontier` 的默认排序 / 升级提示 / 候选队列语义仍偏轻；
- `workflow-clean-v1` 作为 expert lane 仍稍显边缘，persona 表没有给它一条一眼能懂的默认路径。

**Reviewer D2 结论：无 P0、无新增 P1；从生态 / 产品 / adoption 维度看，draft2 已接近定稿。**
是否进入下一轮大修，不应由 D2 维度单独触发；我更建议 **做一轮轻量修饰后，结合其他 reviewer 的结果决定是否 freeze**。

---

## 2. adoption 评分

**adoption 总评分：9.1 / 10**

相较 draft1，我给出如下判断：

- draft1：**8.7 / 10**（有明确方向，但冷启动飞轮、角色路径、视图分层还不够硬）
- draft2：**9.1 / 10**（角色、路径、视图、主榜空心期策略都已成体系）

扣分点主要不在方向错误，而在：
- 复现者与框架作者的**可见收益面**还不够明确；
- 一些产品状态词还没有完全回挂到 canonical state / slice state；
- Frontier / Lab 的“默认探索逻辑”仍偏策略说明，距离真正产品 spec 还差半步。

---

## 3. 重点审核结论（按本轮关注的 5 个问题）

### 3.1 trust tier 与 submission profile 是否已经真正拆开

**结论：是，且拆得比较干净。**

证据：
- `§3` 把 **`Submission Profile ≠ Trust Tier ≠ Publication State`** 提升为总原则；
- `§4.1` 明确拆出 `requested_trust_tier`、`trust_tier`、`publication_state` 三套正交状态；
- `§5.4` 再次把 `submission_profile` 放进 Submission & Product Surface 层，而把 `trust_tier` 留在 Governance & Ranking 层；
- `§6.5` 明确 `submission_profile` 的职责是“证据负担与 UX 档位”，不是公开可信度；
- `§9.2~§9.4` 则把 Community / Reproduced / Verified 清楚地收回到信任层级。

这意味着 draft1 里最容易发生的那种混乱——“低摩擦上传档位被误读成低信任 tier，或高 profile 自动上主榜”——在 draft2 中已经被明显抑制。

我的判断：**IR-16 已解决，且连带增强了 IR-01 在产品层的落地一致性。**

### 3.2 三角色飞轮是否足够支撑冷启动

**结论：基本足够，但还没有强到“自动长出来”。**

好的部分：
- `§13.4` 已明确把 **Uploader / Framework Author / Reproducer / Auditor** 作为一等角色；
- 飞轮逻辑已经从 draft1 的“会有人来复现吧”升级成可讲的链路：
  `低门槛上传 -> Community 数据面 -> system page / preset 生态 -> reproducer 复核 -> 高价值结果升级 -> 官方结论更可信 -> 更多人继续上传`；
- `§13.6` 的 launch phases 与 baseline seeding，解决了“协议对，但首月没人来”的现实问题。

还不够硬的地方：
- 对 **framework author** 的收益，目前更多是叙事上的 system page / preset ecology，缺少更明确的公开 credit surface；
- 对 **reproducer** 的收益，目前主要体现在“公共审计的重要性”，但缺少更清晰的 queue / badge / support accumulation 语义；
- 对 **uploader** 的升级路径虽然写清了，但“升级后具体获得什么”还可再具体一点。

因此我的结论不是“飞轮不存在”，而是：

> **飞轮的骨架已建立，足以支撑 v0.1 冷启动；但若进入产品实施，仍应补一层更明确的角色收益设计。**

### 3.3 `Official Verified Board / Reproducibility Frontier / Community Lab` 三层结构是否合理

**结论：合理，而且是 draft2 adoption 层最关键的修复。**

理由：
- `Official Verified Board` 保住了协议的核心姿态：**默认官方结论只看 Verified**；
- `Reproducibility Frontier` 提供了“可信度正在形成”的中间供给层，避免早期平台除了空榜什么都没有；
- `Community Lab / Feed` 则承担活跃度和探索面，不再冒充官方结论层。

这三层刚好对应三种不同任务：
- **Official Verified Board**：公共结论
- **Reproducibility Frontier**：升级与观察
- **Community Lab**：发现与流量入口

我认为这套结构同时满足了：
1. 不让 Community 污染主榜；
2. 不让主榜空心到没人看；
3. 不强迫所有结果都走同一条高摩擦路径。

### 3.4 persona → lane → profile 路径是否清晰

**结论：已经清晰到足够进入实现。**

我认为 `§13.2` 和 `§13.3` 的组合，已经形成了很好的 launch 叙事：
- 先把 lane 压缩成 onboarding / prestige 两条主叙事；
- 再通过 persona 表把“谁先去哪里、交哪档证据、下一步怎么升”说清楚。

这比 draft1 有明显进步：
- draft1 更像是“这里有很多 lane，请你自己理解”；
- draft2 已经转化成“你是谁 -> 推荐走哪条路 -> 提交什么 profile -> 再怎么升级”。

我唯一保留的意见是：
- `workflow-clean-v1` 虽然被定位为 expert lane，但在 persona 表里没有一条特别鲜明的默认路径；
- 这不构成阻断，但如果后续想强化多-agent / workflow harness 的参与度，最好补一个清晰 persona 映射。

### 3.5 scorecard / research 双层视图是否足够产品化且不伤方法论

**结论：是，本轮收敛得很好。**

这部分我给高评价，因为 draft2 不只是“做两个页面”，而是明确了三件关键事：

1. **Scorecard 派生于 Research，不得独立造语义**；
2. **任何能在 Scorecard 出现的结论，都必须能追溯到 Research**；
3. **Research view 继续保留 task-level、attempt-level、audit-level 真源。**

这意味着：
- 产品层可以变薄、变易读；
- 但不会牺牲协议的可审计性；
- 也不会重新把“便于传播的摘要卡片”错误升级为“科学真相”。

对 v0.1 而言，这已经足够产品化，而且没有伤到方法论底盘。

---

## 4. 按 6 维 rubric 对相关模块与整体 draft2 打分

> 说明：D2 主要覆盖与 adoption 直接相关的模块：M1 Foundations、M2 Benchmark/Execution（lane 叙事）、M4 Trust/Governance/Ranking、M5 CLI/Adapter/Product surface、M6 Metrics/Uncertainty；并对整体 draft2 给出综合分。

| 模块 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 小结 |
|---|---:|---:|---:|---:|---:|---:|---|
| M1 Foundations | 8.8 | 8.4 | 8.2 | 9.0 | 9.2 | 9.0 | 原则层已经把“协议优先、产品不越权、profile≠tier”讲清楚 |
| M2 Benchmark / Execution | 8.6 | 8.5 | 8.2 | 9.2 | 9.1 | 8.8 | lane 叙事明显变清楚，但 expert lane 的 persona 接法仍可更完整 |
| M4 Trust / Governance / Ranking | 9.1 | 9.0 | 9.1 | 8.8 | 9.0 | 9.0 | 三层公开结构与 tier 纯度控制较成熟，未牺牲主榜可信度 |
| M5 CLI / Adapter / Product Surface | 8.8 | 8.7 | 8.5 | 9.3 | 9.1 | 8.8 | profile 进入 CLI surface 很关键，但 uploader / reproducer 收益面仍偏薄 |
| M6 Metrics / Uncertainty | 9.1 | 8.9 | 8.8 | 8.9 | 8.9 | 9.2 | scorecard / research 双层视图收敛很好，产品层没有反噬研究层 |
| **整体 draft2** | **8.9** | **8.8** | **8.7** | **9.2** | **9.3** | **9.1** | **综合 54.0 / 60；D2 维度已接近定稿** |

### 4.1 综合解释

- **方法论严谨性（8.9）**：产品层明显更强了，但仍保持“产品不等于科学真相”的边界。
- **协议完整性（8.8）**：profile、roles、views、三层公开面都已进入结构；剩余缺口主要是收益字段与产品状态映射。
- **治理与反作弊（8.7）**：最大优点是 Frontier / Lab 没污染 Verified 主榜；轻微扣分在于发现层状态尚未完全映射 canonical slice state。
- **可实现性（9.2）**：onboarding lane、三档 profile、launch phases、baseline seeding 都很可执行。
- **生态兼容性（9.3）**：wrapper 不得发明第二套语义这一点非常重要，且 persona / lane / profile 足够兼容不同参与者。
- **文档清晰度（9.1）**：比 draft1 明显更利于产品、协议、审计三方协作。

---

## 5. P0 / P1 / P2 清单

### P0

**无。**

### P1

**无新增 P1（D2 范围内）。**

我认为 draft1 的 adoption 主阻塞 IR-15 在 draft2 中已被实质性修复，因此我不再主张以 D2 维度单独开启新一轮大修。

### P2

#### P2-1：三角色飞轮已成立，但角色收益面仍偏叙事化

当前文本已经写出 uploader / framework author / reproducer 三角色，但真正“为什么他们会长期来”的收益面还不够具体。

建议轻量补足：
- 对 framework author：system page、preset adoption、独立支持计数的公开语义；
- 对 reproducer：复现 credit、support accumulation、公共审计贡献的展示语义；
- 对 uploader：升级 profile / 升入更高 trust tier 后的具体可见收益。

#### P2-2：产品状态词与 canonical slice state 之间还差一层映射

`§13.5` 使用了 `warming_up` / `verification_in_progress` 作为产品状态词，这很好理解；但它们尚未明确映射到 `§10.4` 的 `insufficient_evidence` / `comparison_only` / `ranked_tiered` / `ranked_ordinal`。

建议：
- 在非规范性产品注释里补一张 mapping 表；
- 避免未来 UI 文案与协议状态机各说各话。

#### P2-3：`Reproducibility Frontier` 的产品 surface 仍可更清楚

目前它的定位已经对了，但仍略偏“概念层”。

建议明确至少三件事：
- 默认排序优先看什么：support、freshness、候选强度，还是最近审计活动；
- 哪些条目会进入 Frontier；
- 用户从 Frontier 如何一跳进入 `research_view` 或待复现入口。

#### P2-4：`workflow-clean-v1` 的 persona 路径仍稍弱

draft2 已把它保留为 expert lane，这没问题；但如果 OHBP 想吸引真正做复杂 workflow / 多-agent harness 的人，最好在 persona 表或旁注里给出一条更显眼的默认路径。

这不是阻断项，但关系到后续是否能吸引“最想测 harness 的那批人”。

---

## 6. 相比 draft1 的进步

我认为 draft2 在 D2 维度的提升是**实质性结构升级，不是润色**。

### 6.1 IR-15（冷启动 / 飞轮）已被实质修复

draft1 的问题是：
- 知道要可信；
- 但没有真的回答“谁来上传、谁来复现、为什么不空心”。

draft2 现在已经补上：
- 三角色飞轮；
- launch phases；
- baseline seeding；
- Official Verified / Frontier / Lab 三层结构。

### 6.2 IR-16（submission profile 分层）已解决

draft1 只隐约在产品层谈“轻重路径”；draft2 已把 profile 收敛为可执行的稳定对象，并与 trust tier 完整拆开。

### 6.3 IR-17（persona → lane 路径）已解决

draft2 的 persona 表和 onboarding / prestige lane 叙事，已经足以指导首版 CLI / 网站 onboarding。

### 6.4 IR-18（scorecard / research 双层视图）已解决

这部分是从“可以讲”进化到“可以做”的典型：字段层次、读者对象、严格关系都比 draft1 稳定得多。

---

## 7. 剩余阻塞与最终建议

### 7.1 剩余阻塞

**从 D2 视角看，没有阻断定稿的 adoption 级 P1。**

剩余问题主要都是：
- 产品状态命名再统一一点；
- 角色收益面再明确一点；
- Frontier / expert lane 的说明再补一层。

这些更像 **v0.1-draft2 -> v0.1-final 的轻量 polish**，而不是结构性返工。

### 7.2 是否建议进入下一轮修订

我的建议是：

- **不建议因为 D2 维度单独开启一次“大修型”下一轮修订；**
- **建议做一轮轻量修饰（polish / mapping / wording closure）；**
- 然后结合其他 reviewer 的结果，决定是否可以接近 freeze。

如果其他 reviewer 也没有新增 P1，那么就 D2 维度而言：

> **我认为这份稿子已经处在“可接近定稿”的区间。**

---

## 8. 一句话总评

**draft2 成功把“可信协议”与“可冷启动产品”第一次同时讲清楚了；它还不是最终产品 spec，但已经足以支撑 v0.1 进入接近定稿阶段。**
