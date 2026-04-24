# Harness 测评网站 / OHBP 项目 AGENTS

## 1. 项目一句话

这是一个面向普通用户与评测参与者的 **Harness Benchmark / Leaderboard 网站原型**：

- 普通用户关心：**我用 Claude Code / Codex / OpenCode，到底该先试哪个 harness？**
- 评测参与者关心：如何提交、校验、验证、沉淀证据与最终形成可信榜单。

---

## 2. 当前项目分层

### A. Consumer 层（当前前端主线）
面向普通用户的导购/比较层：

- 首页：按宿主给默认答案
- Host leaderboard：按宿主看 Top picks / Full board
- Compare：多维对比热力矩阵

这一层的核心任务是：

1. 先回答默认答案
2. 再帮助用户缩小 shortlist
3. 最后再下钻证据层

### B. Evidence / Protocol / Validator 层
面向评测、协议、提交、验证：

- Evidence boards
- Protocol
- Validator playground

这一层不是普通用户首屏决策层，而是可信度与底层机制层。

---

## 3. 当前最重要的真实性边界

**非常重要：当前 consumer 榜单不是 verifier-backed 的真实公开排行榜。**

它目前是：

- `curated_host_fit_demo`
- 策展导购层
- 静态演示数据驱动

不能把当前页面表述成：

- “真实世界已验证结论”
- “已经收集大量用户实验后的最终真榜”
- “官方证据层结论”

正确表述应是：

- selection guide
- curated guide
- host-fit demo
- editorial synthesis / awaiting verification

---

## 4. 当前数据来源：到底数据是怎么来的

### 当前状态
当前站点里的 consumer 数据 **不是在线抓取、不是数据库实时聚合、不是用户上传结果统计**。

它来自本地静态 view-model：

- `E:/工作区/10_Projects_项目/harness测评网站/packages/view-models/src/consumer-leaderboards.ts`

### 关键数据结构

#### 1) Harness 基础画像
在 `consumer-leaderboards.ts` 里定义：

- `HARNESSES`

每个 harness 有一组静态策展分：

- `specification`
- `planning`
- `execution`
- `context`
- `setup`
- `fitByHost`
- `bestFor`
- `watchOuts`
- `scenarioTags`

#### 2) 场景决策分
在同文件里定义：

- `DECISION_SCORES`

当前包含：

- `newProject`
- `existingRepo`
- `longTask`
- `multiAgent`

#### 3) 宿主默认推荐
同文件定义：

- `TOP_CARD_CONFIGS`

决定每个宿主的默认 pick，例如：

- Claude Code 默认：`gstack`
- Codex 默认：`speckit`
- OpenCode 默认：`superpowers`
- General 默认：`openspec`

### 当前 overall score 公式
`consumer-leaderboards.ts` 中：

```ts
overallScore(profile, hostId) =
  round(capabilityAverage(profile) * 0.55 + profile.fitByHost[hostId] * 0.45)
```

其中：

- `capabilityAverage = (specification + planning + execution + context + setup) / 5`
- 再和该宿主下的 `host fit` 做加权

### 当前 score level 分档

- `>= 85` → `very_high`
- `>= 75` → `high`
- `>= 60` → `medium`
- `< 60` → `low`

### 当前 compare 页的维度
当前 consumer compare 使用的核心维度：

- `new_project`
- `existing_repo`
- `long_task`
- `setup_speed`
- `multi_agent`
- `context_control`
- `claude_fit`
- `codex_fit`
- `opencode_fit`

### 结论
**当前 consumer 页里的分数，本质上是“静态策展数据 + 规则映射 + 前端 view-model 组合”，不是线上真实评测统计结果。**

---

## 5. 当前前端主线目标（非常重要）

当前主线程 / 后续默认前端线程的目标是：

> **把这个项目做成更像 Artificial Analysis / Arena 的 benchmark 网站体验。**

重点不是协议细节，而是：

1. 普通用户一眼能看懂
2. 默认答案压倒性明确
3. 页面更图形化、更像 benchmark-site
4. 去 AI 味、去模板味、去“说明页感”

### 重点回答的问题

首页：

- 我用哪个工具？
- 默认先试哪个 harness？

榜单页：

- 这个宿主下 Top 1 / Top 3 是谁？
- 第二名是不是更适合某种场景？

对比页：

- 我 shortlist 里的几个 harness 差在哪？

---

## 6. 当前设计方向

前端方向参考：

- [Artificial Analysis](https://artificialanalysis.ai/)
- [Arena Leaderboard](https://arena.ai/leaderboard)

### 当前已经确认的设计原则

1. **默认答案优先，解释后置**
2. **分数 / 热力 / 排名优先，长文说明后置**
3. **consumer 层不伪装成 verified truth**
4. **Protocol / Validator 不应该抢普通用户主导航**
5. **双语必须正常**
6. **移动端必须不炸**

### 当前明确要避免

- 说明文过多
- 卡片过于同质化
- AI 常见紫蓝渐变 / 泛 SaaS 味
- 首屏出现太多“这是免责声明”的内容
- consumer 页面像 docs / protocol site

---

## 7. 当前项目状态（供新线程快速接力）

### 已完成

- consumer 三页已经完成 benchmark 风格重构：
  - 首页
  - host leaderboard
  - compare
- 已完成：
  - hero host overview
  - host default cards
  - host backup picks
  - Top 3 picks
  - full board compact table / detailed card dual view
  - compare preset selector（All / Claude / Codex / OpenCode）
  - compare density toggle（compact / detailed）
  - compare insight cards（default / backup / long-task strongest）
  - compare heatmap preset filtering
  - methodology 折叠化
  - leaderboard rationale/watch-outs 折叠化
  - compare cell 文案压缩
  - 英文桌面 / 中文移动端验证

### 当前前端风格定位

- visual-first benchmark site
- consumer-first decision router
- evidence/protocol 为第二层

---

## 8. 当前最关键的代码文件

### 前端主文件
- `E:/工作区/10_Projects_项目/harness测评网站/apps/web/src/render.ts`

### consumer 数据与排名逻辑
- `E:/工作区/10_Projects_项目/harness测评网站/packages/view-models/src/consumer-leaderboards.ts`

### consumer view-model 类型
- `E:/工作区/10_Projects_项目/harness测评网站/packages/view-models/src/types.ts`

### web 路由测试
- `E:/工作区/10_Projects_项目/harness测评网站/apps/web/src/server.test.ts`

### 当前 consumer 交互状态参数

- Compare:
  - `preset=all|claude|codex|opencode`
  - `density=compact|detailed`
- Leaderboard:
  - `density=compact|detailed`

这些 query params 已接入 SSR HTML 渲染，并会在语言切换中保留。

---

## 9. 运行与验证

仓库根目录：

- `E:/工作区/10_Projects_项目/harness测评网站`

### 常用命令

```bash
npm run build
npm run test
npm run dev:web
npm run dev:mock-intake
```

### 本地地址

- Web: `http://127.0.0.1:3000`
- Mock intake: `http://127.0.0.1:4010`

### 本轮额外验证端口

- Web preview（本轮前端验证）:
  - `http://127.0.0.1:3001`
  - `http://127.0.0.1:3002`

### 运行日志

- `E:/工作区/10_Projects_项目/harness测评网站/.workspace/run-logs/web-demo.stdout.log`
- `E:/工作区/10_Projects_项目/harness测评网站/.workspace/run-logs/web-demo.stderr.log`
- `E:/工作区/10_Projects_项目/harness测评网站/.workspace/run-logs/mock-demo.stdout.log`
- `E:/工作区/10_Projects_项目/harness测评网站/.workspace/run-logs/mock-demo.stderr.log`

### 截图目录

- `E:/codex_media/harness_demo_20260421/`

---

## 10. 后续线程协作建议

### A. 前端线程
前端线程默认只做：

- 视觉层级
- 交互体验
- 页面布局
- 双语排版
- 移动端适配
- 去 AI 味 / 去模板味
- benchmark-site 风格靠拢

### B. 算法线程
用户准备单开新线程研究：

- 测评算法
- 排名算法
- submission schema
- validator / verifier
- 用户上传数据
- 高可信度榜单机制

**前端线程不要擅自把 demo 静态分数说成真实算法输出。**

---

## 11. 后续默认优化优先级（前端）

如果新线程继续做前端，优先做这些：

1. 首页进一步做成“宿主 selector + 单一默认答案 + 备选”路由化首屏
2. compare 增加 shortlist / sort / host-aware 列筛选
3. compact leaderboard 再压密度，减少列宽浪费
4. Protocol / Validator 在 desktop consumer 顶栏继续下沉
5. 更强的视觉识别与品牌记忆点
6. consumer / evidence 两层之间的跳转层级再收紧

---

## 12. 工作方式要求

- 默认用简体中文回答
- 先给结论，再给步骤
- 先读后改
- 不对未读代码做推测
- 给出验证证据
- 未经用户要求，不 commit / push

---

## 13. 给新线程的最短背景摘要

如果你是新线程接手者，请先记住这三句：

1. **当前 consumer 榜单是静态策展 demo，不是真实验证榜。**
2. **用户现在把“测评算法研究”与“前端体验优化”分线程处理。**
3. **本线程默认目标是把网站做得更像 benchmark-site，并让普通用户一眼看懂默认答案。**
