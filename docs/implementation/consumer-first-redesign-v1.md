# OHBP / harnessbench Consumer-First 改版蓝图（v1）

> 日期：2026-04-21  
> 目标：把当前 protocol-first MVP 改造成普通用户一眼可理解的 harness leaderboard 网站，同时保留现有 protocol / validator / evidence 能力作为可信后端。

---

## 1. 改版总原则

### 1.1 新默认视角

当前默认视角：

- 协议对象
- 证据链
- board admission

改版后默认视角：

- 我正在用哪个宿主？
- 在这个宿主上，哪种 harness 最适合？
- 如果我要看证据，再继续下钻

### 1.2 新产品分层

```text
第一层：消费级选型层
- 首页
- Host-specific Leaderboards
- Compare

第二层：解释与证据层
- Boards
- Entry Detail

第三层：协议与工具层
- Protocol
- Validator Playground
```

### 1.3 Truthfulness / 真实性要求

- Host-specific harness 榜单在本轮先作为 **curated compatibility demo** 落地
- 必须显式标注：
  - 这是产品层 market map / host-fit leaderboard
  - 当前不是 community-submitted + verifier-backed 的最终真榜
- 现有 `/boards/*`、`/entries/*` 继续承担 protocol-backed / evidence-backed 的可信层

---

## 2. 新站点 IA

```text
/
├─ /leaderboards
│  ├─ /leaderboards/general
│  ├─ /leaderboards/claude-code
│  ├─ /leaderboards/codex
│  └─ /leaderboards/opencode
├─ /compare
├─ /boards/official-verified
├─ /boards/reproducibility-frontier
├─ /boards/community-lab
├─ /entries/[entry_id]
├─ /protocol
└─ /playground/validator
```

### 新主导航

- Leaderboards
- Compare
- Evidence Boards
- Protocol
- Validator

---

## 3. 首页结构

### 3.1 Hero

- 主标题：帮助用户快速找到最适合当前宿主的 Harness
- 副标题：先给出 Claude Code / Codex / OpenCode 的最佳组合，再把依据追溯到 evidence layer

### 3.2 Host Selector

四张入口卡：

- Claude Code
- Codex
- OpenCode
- General

### 3.3 Quick Picks

六张 quick-pick 卡：

- Best overall
- Best for Claude Code
- Best for Codex
- Best for OpenCode
- Best for large repos
- Best low-overhead workflow

### 3.4 Compare Preview

展示用户最关心的 5 个 framework 在几个维度上的差异：

- Specification
- Planning
- Execution
- Context
- Best fit

### 3.5 Evidence Bridge

解释：

- Leaderboard 回答“怎么选”
- Boards / Entries 回答“为什么能信”
- Protocol / Validator 回答“规则与工具是什么”

---

## 4. Host-specific Leaderboards

### 4.1 支持的 host

- `general`
- `claude-code`
- `codex`
- `opencode`

### 4.2 页面结构

1. Host hero
2. Top pick cards
3. Leaderboard table
4. Scenario chips
5. Why this host ranking is different
6. Link to evidence / methodology

### 4.3 表格列

- Rank
- Harness
- Overall
- Specification
- Planning
- Execution
- Context
- Setup
- Best for
- Watch-outs
- Evidence

### 4.4 顶部 3 个推荐卡

- Best overall for this host
- Best for greenfield / spec-heavy work
- Best for existing repos / incremental work

---

## 5. Compare 页面

### 5.1 Compare 目标

用于承接用户给的那种矩阵式需求：

- GSD
- gstack
- SpecKit
- OpenSpec
- Superpowers
- BMAD Method

### 5.2 页面结构

1. Compare hero
2. Framework pills
3. Matrix table
4. Best-fit scenarios
5. Host fit notes

### 5.3 Compare 维度

- Specification
- Planning
- Execution
- Context
- Team model
- Best fit
- Claude Code fit
- Codex fit
- OpenCode fit

---

## 6. 数据层策略

### 6.1 本轮新增数据层

新增一套 consumer-facing 的 curated dataset：

- Host metadata
- Harness profiles
- Host-specific ranking rows
- Compare matrix
- Quick picks

### 6.2 现有 verifier-backed 数据继续保留

现有数据继续服务：

- Evidence Boards
- Entry detail
- Protocol-backed story

### 6.3 本轮不做的事

- 不把 curated leaderboard 伪装成 protocol-verified 榜单
- 不强行从现有 publication 数据里推导 Claude Code / Codex / OpenCode 榜

---

## 7. 最小实现拆分

### 7.1 View-model / data

- 新增 consumer leaderboard view models
- 新增 host / harness / compare 数据

### 7.2 Web routes / render

- 新增 `/leaderboards` 与 `/compare`
- 重写首页为 consumer-first
- 保留 boards / entries / protocol / validator

### 7.3 Tests

- 首页 host selector
- leaderboards route
- compare route
- invalid route + lang continuity
- evidence route 回归

---

## 8. MVP Stop Condition

以下全部满足即视为本轮完成：

1. 首页已经不再以 protocol-first 方式组织
2. Claude Code / Codex / OpenCode / General 四个榜单都可访问
3. Compare 页面可访问，并展示矩阵
4. 中英双语在新页面可正常工作
5. Boards / Entries / Protocol / Validator 旧能力未回归
6. build / test / browser smoke 全通过

