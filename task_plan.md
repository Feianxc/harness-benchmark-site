# OHBP / harnessbench 长期任务计划

## 任务目标

产出 **选项 A：《OHBP / harnessbench 协议草案 v0.1》** 的高质量初稿，并采用多 AGENT 设计 → 多 AGENT 审核 → 迭代修订的方式推进，形成可持续扩展的长期工作流。

## 当前共识

- 不先做“大而全网站”，先做 **开放协议 + CLI 执行层 + 证据包 + 平台复验分层**
- 主榜必须默认只看 **Verified**
- 不追求“唯一总分”，优先多维度、可复现、可审计
- 平台核心不是上传分数，而是上传 **可审计运行证据**

## 迭代停止条件（执行化）

为避免“满分”概念过于模糊，暂定义为：

1. 审核组对协议草案 6 个维度全部给出 **10/10**
2. 无 P0 / P1 级缺陷
3. 无“关键字段缺失”或“治理层无法落地”的问题

若出现不可兼得的设计 trade-off，则记录为“结构性权衡”，不伪造满分。

## 评分维度（统一 rubric）

1. 方法论严谨性
2. 协议完整性
3. 治理与反作弊
4. 可实现性
5. 生态兼容性
6. 文档清晰度

## 阶段计划

### Phase 0 — 初始化与落盘
- [complete] 建立 planning files
- [complete] 建立协议模块清单
- [complete] 建立评分 rubric 与 stop condition

### Phase 1 — 第一轮独立模块设计
- [complete] 拉起设计 AGENT 团队
- [complete] 独立设计各协议模块
- [complete] 汇总为统一草案 v0.1-draft1

### Phase 2 — 第一轮独立审核
- [complete] 拉起审核 AGENT 团队
- [complete] 对模块与整体分别评分
- [complete] 生成问题清单与修订建议

### Phase 3 — 迭代修订
- [complete] 汇总 draft1 issue register
- [complete] 拉起新的修订 AGENT 团队并产出 repair packets
- [complete] 生成 draft2 主控整合蓝图
- [complete] 修补关键问题并生成 v0.1-draft2
- [complete] 进入下一轮审核

### Phase 4 — 收敛与定稿
- [complete] 完成第二轮审核并汇总 focused patch 问题台账
- [complete] 进行 draft3 focused convergence patch
- [complete] 达到停止条件
- [complete] 输出正式协议草案
- [complete] 规划下一阶段（schema / CLI / PRD）

### Phase 5 — 实现阶段（schema / CLI / validator / mock platform / web）
- [complete] 收敛 implementation 设计文档
- [complete] 补齐 `architecture-review.md`
- [complete] 冻结统一 `build-blueprint.md`
- [complete] 初始化 monorepo 根骨架
- [in_progress] 拉起第一轮实现 AGENT 团队
- [pending] 整合 schema/core、validator/cli、platform/web 三条主线
- [pending] 第一轮实现评审与修正
- [pending] 跑通 CLI + mock intake + web MVP 全链路 smoke

## 模块草案（待确认）

1. Protocol Overview & Principles
2. Benchmark Card / Task Package / Execution Contract
3. Run Manifest / Evidence Bundle
4. Verification Tiers / Ranking Policy / Governance
5. CLI Workflow / Adapter Contract / Bundle Layout
6. Metrics / Uncertainty / Benchmark Health

## 风险日志

| 风险 | 描述 | 当前策略 |
|---|---|---|
| 目标过大 | 容易从协议草案滑向平台全设计 | 严格先做 Option A |
| 满分目标模糊 | 无限迭代风险 | 采用明确定义的 rubric + stop condition |
| crowdsourced 数据失真 | 自报数据不可信 | 分层信任：community / reproducible / verified |
| benchmark 报废 | 公开后污染与失真 | 引入 benchmark health / freshness / contamination |
| 审核后仍有 P1 | 第一轮设计虽成型，但尚未达到 stop condition | 先修 canonical object / tolerance / completeness / governance P1 |
| implementation 第二真源 | CLI / web / verifier 各自重造协议语义 | 冻结 build blueprint + owner 表 + review team |
| worker 热文件冲突 | 多 agent 同时修改 root files 或共享接口 | 主控保留 hot files，worker 严格按目录边界写入 |

## 错误记录

| 错误 | 尝试 | 处理 |
|---|---|---|
| 暂无 | - | - |

### Phase 6 — Public beta 上线准备（2026-04-24）
- [complete] 全面梳理上线差距，新增 `docs/上线计划/01-上线差距与执行计划.md`
- [complete] 新增 `.impeccable.md`，冻结前端去 AI 味设计上下文
- [complete] Web server 增加 `/healthz`、安全头、`robots.txt`、`sitemap.xml`
- [complete] 修正 robots sitemap 为绝对 URL，并支持 `PUBLIC_SITE_URL`
- [complete] 前端第一轮去模板化：字体、色彩、移动端顶栏、hero tile、文案密度
- [complete] 新增 public beta 单人运营检查清单
- [complete] 跑通 Web build/test、全仓 build/test/lint、Web smoke、Lighthouse mobile 初检
- [pending] 生产 HTTPS 域名下复跑 Lighthouse 与最终 smoke
- [pending] 根据目标平台补部署说明 / CI / Terms / Privacy
