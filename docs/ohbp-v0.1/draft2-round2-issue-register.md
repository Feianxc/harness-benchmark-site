# OHBP / harnessbench v0.1-draft2 第二轮审核问题台账

> 状态：基于第二轮独立审核汇总，作为 focused convergence patch 输入  
> 日期：2026-04-20  
> 输入依据：`reviews-round2/*.md`

---

## 1. 结论先说

**draft2 已从“修补中”进入“接近定稿”，但仍未达到 stop condition。**

第二轮审核的共识非常清楚：

- **P0：无**
- **仍有残余 P1**
- **不建议本轮直接冻结为正式 v0.1**
- **建议进入一轮 focused convergence patch，而不是回到大改**

当前最重要的判断不是“方向对不对”，而是：

> **剩余问题已经从“大骨架缺失”收缩为“canonical object / schema closure / field binding 的最后收口”。**

---

## 2. 第二轮审核快照

| 来源 | 结论摘要 |
|---|---|
| `review-draft2-methodology.md` | **P1：1**；方法论已显著进步，但 `pseudo_repeated` 的 registration-level audit 字段闭环未完成 |
| `review-draft2-governance-redteam.md` | **P1：2**；治理可信度 **8.1/10**；双通道证据与 autonomy schema 仍未完全关闭 |
| `review-draft2-ecosystem-product.md` | **无新增 P1**；adoption **9.1/10**；整体已接近定稿 |
| `review-draft2-implementation.md` | **P1：3**；已接近 object-first / rule-first，但 schema convergence 仍差最后一轮 |
| `review-draft2-scoreboard.md` | **stop condition 未达到**；总体 **53/60**；唯一跨模块 P1 指向 public / sealed 双通道 object 化不足 |

---

## 3. 聚合后的 round2 主结论

### 3.1 已关闭或基本关闭的问题

以下问题本轮可视为**已关闭**或**已从 P1 降为收尾项**：

1. task disposition / denominator 基本闭环
2. `score(...)` 已退出协议核心
3. run-group registration / completeness proof 已进入主文
4. tolerance policy 已有唯一挂载点
5. environment integrity / trace 基础门槛已大幅强化
6. memory / cache / external KB 的隔离证明已基本进入协议主文
7. trust tier / submission profile / publication state 已明显分离
8. 冷启动飞轮、双层视图、三层公开产品面已基本成型

### 3.2 仍未关闭的 P1 类型

第二轮审核后，剩余 P1 已高度收敛为以下 6 类：

1. **public / sealed 双通道证据模型未完全 canonical object 化**
2. **autonomy schema 尚未完全闭口**
3. **`pseudo_repeated` 的 registration-level audit 字段未冻结**
4. **`requested_trust_tier` 在 registration 对象中发生命名回退**
5. **`manifest.json` 对 registration / tolerance 尚未完全成为唯一真源**
6. **`verification_record` 缺少被裁决对象的 canonical binding**

---

## 4. 去重后的 P1 问题

| ID | 级别 | 问题摘要 | 主要来源 | 影响对象/章节 | 建议修复流 |
|---|---|---|---|---|---|
| R2-01 | P1 | public / sealed 双通道证据模型仍偏 prose，未冻结为 canonical object + canonical fields | Scoreboard / Governance | Evidence model / M3 / M4 / M5 / main draft | F1 |
| R2-02 | P1 | autonomy schema 仍有未闭口字段，`approval_only` / `interactive` 的机审边界未完全冻结 | Governance | `autonomy_mode` / interaction summary / M4 / M5 / main draft | F1 |
| R2-03 | P1 | `pseudo_repeated` gate 缺少 registration-level 审计字段闭环 | Methodology | `run-group-registration.json` / M2 / M3 / main draft | F2 |
| R2-04 | P1 | `requested_trust_tier` 在 registration 对象里回退成 `requested_tier`，破坏 canonical naming | Implementation | registration schema / main draft | F2 |
| R2-05 | P1 | `manifest.json` 对 registration / tolerance 还未完全成为唯一真源 | Implementation | `manifest.json` / bundle contract / main draft | F2 |
| R2-06 | P1 | `verification_record` 缺少被裁决对象的 canonical binding，bundle → platform verification 仍未完全闭环 | Implementation | `verification_record` / M4 / main draft | F2 |

---

## 5. 每个 P1 的 focused patch 验收标准

### R2-01：public / sealed 双通道 canonicalization

**focused patch 必须补齐：**

- `evidence_channel_mode`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `visibility_class`
- `release_policy`
- `redaction_policy_id` 或等价字段
- public vs sealed artifact 对照表

**验收标准：**

- hidden / holdout / rotating split 的高信任结果何时必须双通道，写成 MUST
- public / sealed 如何 digest 绑定，写成规范对象关系
- CLI / bundle / research view 不再各自理解一套“双通道”

### R2-02：autonomy schema closure

**focused patch 必须补齐：**

- `tty_freeform_input_detected`
- 零输入 sentinel 语义
- `approval_only` 事件如何映射到 trace / action
- `interaction-log.jsonl` / `interaction-summary.json` 的最小闭环字段

**验收标准：**

- `approval_only` 与 `interactive` 的自动降级条件可程序化判断
- `autonomous` 的零输入标准不是 prose，而是可审计字段

### R2-03：`pseudo_repeated` registration-level 字段闭环

**focused patch 必须补齐至少一组等价字段：**

- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock` / `provider_release_window`

**验收标准：**

- `pseudo_repeated` 的 narrow window / 近似随机性控制可在 registration 阶段冻结
- 审核时不再依赖 prose 判断“差不多在同一时间窗”

### R2-04：`requested_trust_tier` 命名回退

**focused patch 必须统一：**

- registration 对象使用 `requested_trust_tier`
- 不再保留 `requested_tier` 作为并行 machine field

**验收标准：**

- main draft 内 canonical naming 与 round1 A 包一致
- CLI / registration / verification record 使用同一字段名

### R2-05：`manifest.json` 对 registration / tolerance 的唯一真源不足

**focused patch 必须补齐 canonical refs：**

- `registration_ref` / `registration_digest`
- `tolerance_policy_ref` / `tolerance_policy_digest`

并明确：

- 这些字段的 canonical path
- 它们与 `run-group-registration.json`、`completeness-proof.json` 的关系

**验收标准：**

- M6 不再需要自由浮动字段名引用 registration / tolerance
- `manifest.json` 真正成为 runtime + verification 关键引用的单一入口

### R2-06：`verification_record` 缺少 subject binding

**focused patch 必须补齐：**

- `subject_bundle_id` / `subject_bundle_digest`
- 或等价的 `subject_ref`
- 必要时增加 `subject_run_group_id`

**验收标准：**

- `verification_record` 明确裁决的是哪个对象
- bundle → verification → ranking 的链条可被稳定跟踪

---

## 6. P2 跟进项（不阻断 focused patch）

| ID | 级别 | 问题摘要 | 主要来源 | 建议 |
|---|---|---|---|---|
| R2-07 | P2 | framework author / reproducer 的收益面仍偏叙事化 | D2 | 后续补 system page / queue / credit 字段说明 |
| R2-08 | P2 | `warming_up` / `verification_in_progress` 与 canonical slice state 未显式映射 | D2 | 补产品状态词到 slice state 的 mapping 表 |
| R2-09 | P2 | `Reproducibility Frontier` 默认排序 / 候选队列语义仍偏轻 | D2 | 补默认排序与升级提示规则 |
| R2-10 | P2 | `workflow-clean-v1` 的 persona 路径仍偏弱 | D2 | 补 expert lane 的 persona 入口 |
| R2-11 | P2 | publishable floor 的字段归属仍不够硬 | E2 / A2 | 明确属于 lane / board admission policy / execution contract 中哪一处 |
| R2-12 | P2 | `scorecard_view` / `research_view` 缺最小 schema 表 | E2 | 后续补 appendix，不阻断 focused patch |

---

## 7. 建议的 focused patch 分工

### F1：Evidence Channel + Autonomy Closure

负责：

- R2-01
- R2-02

目标：

- 把治理剩余 P1 从 prose 收口到 object / field / MUST 表

### F2：Registration / Manifest / Verification Binding Closure

负责：

- R2-03
- R2-04
- R2-05
- R2-06

目标：

- 完成 canonical naming、registration refs、verification binding 的最后收口

---

## 8. 下一步推荐顺序

1. 先做 **focused patch blueprint**
2. 再拉起一轮小范围 patch agents（建议只要 2 组）
3. 主控生成 `ohbp-v0.1-draft3.md` 或 `draft2.1`
4. 再拉起一轮**极小 reviewer 团队**验证 P1 是否清零

---

## 9. 当前总判断

当前项目已进入非常明确的状态：

> **不是“是否值得做”，也不是“方向是否正确”，而是“再做一轮 focused convergence patch，就有机会第一次接近 stop condition”。**
