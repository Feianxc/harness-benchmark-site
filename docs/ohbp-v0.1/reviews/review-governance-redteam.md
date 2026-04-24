# Reviewer B 审核报告（治理 / 反作弊 / 红队）

> 角色：OHBP 审核组 Reviewer B  
> 审核日期：2026-04-20  
> 审核范围：`task_plan.md`、`docs/ohbp-v0.1/rubric.md`、`docs/ohbp-v0.1/ohbp-v0.1-draft1.md`，重点审查 `modules/run-data-evidence.md`、`modules/trust-governance-ranking.md`、`modules/cli-adapter.md`

---

## 1. 执行结论

**结论先说：draft1 的治理方向是对的，但目前还不能宣称“高可信主榜可上线”。**  
它已经建立了正确的骨架：

- 把 `Community / Reproduced / Verified` 分层
- 明确主榜默认只看 `Verified`
- 明确排名单位是 `run-group` 而不是 best run
- 明确要有 dispute / invalidation / benchmark freeze
- 明确 benchmark health 不是附属品

这些方向都对，而且是这个项目最难得的地方。

但从红队 / 反作弊角度看，**draft1 目前仍停留在“治理原则明确”，还没完全进入“治理约束闭环”**。  
当前最主要的问题不是理念，而是：

> **若把 draft1 直接用于高信任提交，仍可能被 best-of-N、选择性上报、hidden split 泄漏、环境作弊、伪造 trace、未披露人工干预、缓存答案 / 持久记忆污染等方式穿透。**

我的综合判断：

- **本轮不通过“满分”条件**
- **无明确 P0**（关键对象已基本齐）
- **有多项 P1**（足以阻断“高可信主榜”宣称）

---

## 2. 打分

### 2.1 按 Rubric 的整体评分

| 维度 | 评分 | 评语 |
|---|---:|---|
| 方法论严谨性 | 8/10 | 协议 / benchmark / ranking policy 的边界相对清楚，且承认 benchmark health 与 contamination。 |
| 协议完整性 | 7/10 | 核心对象基本齐全，但高信任 tier 所需的强约束字段还没完全落死。 |
| 治理与反作弊 | 6/10 | 方向正确、威胁模型也提到了，但多处仍是声明级/建议级，不足以形成硬约束闭环。 |
| 可实现性 | 8/10 | CLI-first、分层信任、lite lane 路线务实。 |
| 生态兼容性 | 8/10 | preset + custom adapter 的设计合理，没有被单一生态锁死。 |
| 文档清晰度 | 8/10 | 文档可读性较好，模块边界总体清晰。 |

### 2.2 Reviewer B 的治理可信度评分

**整体 draft1 治理可信度：6.8 / 10**

解释：
- **6 分以上**：说明它已经不是“空想 PRD”，而是有治理意识的协议初稿。
- **不到 8 分**：说明它还不足以支撑“平台级高可信主榜”。
- **距离 10 分的主要缺口**：不是缺理念，而是缺 **可验证的预注册闭环、tamper-evident 执行证明、hidden split 双通道证据模型、autonomy 证明、缓存/持久记忆隔离证明**。

### 2.3 重点模块评分

| 模块 | 评分 | Reviewer B 评语 |
|---|---:|---|
| M3 `run-data-evidence.md` | 7/10 | 证据包结构清楚，但对高信任 tier 来说，完整性与防篡改要求偏软，很多关键项还是 SHOULD/MAY。 |
| M4 `trust-governance-ranking.md` | 8/10 | 治理架构是当前 draft1 最强模块；但它依赖 M3/M5 提供的硬约束还不够强，因此存在“政策正确、执行可穿透”的问题。 |
| M5 `cli-adapter.md` | 6/10 | CLI 生命周期设计对，但对 attempt 完整性、人工交互遥测、环境证明、connected/offline 升级路径约束不够硬。 |

---

## 3. 当前草案最强的地方

### 3.1 分层信任做对了
`Community / Reproduced / Verified` 的分层是对的，而且“默认主榜只看 Verified”这条必须保留。  
这是防止自报分数直接污染官方结论的第一道硬墙。

### 3.2 排名单位做对了
明确 `run-group > best single run`，并要求披露全量 attempts，这个方向完全正确。  
如果没有这条，平台一定退化成 best-of-N 竞赛。

### 3.3 争议 / 失效 / benchmark freeze 做对了
多数协议初稿只讲上传，不讲下架与纠错。draft1 在这里是加分项。  
尤其是：
- dispute state
- invalidation
- benchmark-level freeze
- 保留历史而非静默删改

这些都非常重要。

### 3.4 M5 没把 SKILL 误当底座
`CLI 是标准执行层，SKILL 只是 wrapper` 这条必须保留。  
从治理角度看，这能显著减少生态分叉与“同名不同规”的协议腐蚀。

---

## 4. P0 / P1 问题清单

## 4.1 P0

**本轮未发现明确 P0。**

理由：
- draft1 已具备最小对象骨架
- 上传、证据、tier、排名、治理这些一级对象已存在
- 不属于“缺关键对象导致无法上传 / 无法复验”的状态

但这不意味着可以过关；因为下面的 P1 足以阻断“高可信主榜”宣称。

---

## 4.2 P1-1：缺少可验证的 run-set 预注册绑定，best-of-N / 选择性上报 仍可穿透高信任 tier

### 问题
M4 正确要求：
- Reproduced / Verified 必须提交完整 `run-group`
- 不允许 best run 排榜
- 应有 preregistration / declaration

但 M3 / M5 当前**还没有把“预注册的 attempts 计划”做成可验证对象**。  
也就是说，协议现在能表达“应该上传全部 attempts”，但还不够能证明“上传者没有先本地跑 20 次，只挑 5 次来注册 / 上传”。

### 为什么严重
如果没有一个平台签发且可回填到 bundle 的 **run-set commitment**，那么：
- `run_group_id` 只是一个标签，不是承诺
- `policy.best_of_k` 只是自报字段，不是可验证边界
- 平台难以知道：这组 attempts 是否真的是预先声明的完整集合

这会直接伤到：
- best-of-N 防线
- 选择性上报防线
- Reproduced / Verified 的可信性

### 涉及文件
- `ohbp-v0.1-draft1.md` §7, §8
- `modules/trust-governance-ranking.md` §3, §5, §7
- `modules/run-data-evidence.md` §3, §4
- `modules/cli-adapter.md` §4.2, §4.3, §6

### 建议升级为 MUST 的补强
为 study / run-group 新增**平台签发的预注册承诺对象**，至少包括：
- `registration_id`
- `registration_receipt`
- `attempt_plan_hash`
- `declared_attempt_total`
- `attempt_index`
- `seed_list_hash`
- `submission_window`
- `platform_nonce`

并要求：
- Reproduced / Verified **MUST** 将 `registration_receipt` 回填入 `manifest.json`
- 平台 **MUST** 能验证某个 `run_group_id` 的 attempts 是否完整上传
- 未绑定预注册承诺的结果，不得升为 Reproduced / Verified

---

## 4.3 P1-2：hidden split / private audit 证据没有双通道模型，污染与泄漏风险仍然过高

### 问题
draft1 承认：
- hidden split 需要平台端评分
- trace 可以 redacted
- benchmark contamination/freshness 要治理

但当前协议**没有严格定义“公开 bundle”与“密封审计 bundle”的双通道结构**。  
M3 现在只有一个 bundle 观念，M4 也没有把 hidden split 的证据发布策略写成强规则。

### 为什么严重
如果 hidden split 的：
- task 细节
- 完整 trace
- 关键 artifact
- evaluator 中间产物

在高分结果公开后被过早释放，就会出现：
- benchmark-tuning 加速
- 答案缓存 / 记忆污染
- 训练污染
- evaluator reverse engineering

也就是说，**平台越成功，benchmark 越快死。**

### 涉及文件
- `ohbp-v0.1-draft1.md` §10, §11
- `modules/run-data-evidence.md` §7, §8
- `modules/trust-governance-ranking.md` §5, §8
- `modules/cli-adapter.md` §6, §7

### 建议升级为 MUST / SHOULD 的补强
为 hidden / holdout / rotating split 明确双通道：

1. **Public Bundle**
   - 可公开的最小证据
   - 不包含会泄漏 hidden split 的原始任务关键内容
   - 只保留必要统计、脱敏 trace 骨架、审计摘要

2. **Sealed Audit Bundle**
   - 完整证据
   - 仅平台和授权审核者可见
   - 用于 replay / rerun / dispute

并新增字段：
- `release_policy`
- `visibility_class`
- `sealed_bundle_digest`
- `public_bundle_digest`
- `delayed_release_at`
- `retirement_release_policy`

建议规则：
- hidden split 的 Verified **MUST** 使用 sealed audit bundle
- Public Bundle **MUST NOT** 含可直接重构 hidden task/gold answer 的内容
- hidden split 全量原始 trace **SHOULD NOT** 在 benchmark 仍 active 时公开

---

## 4.4 P1-3：高信任 tier 对环境完整性与 trace 防篡改要求过软，环境作弊 / 伪造 trace 仍可能混入

### 问题
M4 写了很多正确的反作弊要求，但到了 M3/M5，很多关键防线仍停留在：
- `container_digest` = SHOULD
- `network_policy_digest` = SHOULD
- `prev_event_hash / event_hash` = SHOULD
- `attestation.json` = MAY

也就是说，**高信任 tier 还没有一组真正硬性的“执行证明”最小门槛。**

### 为什么严重
这会让下面几类攻击仍有穿透空间：
- 修改 PATH / wrapper 伪造工具调用
- 私下挂载 benchmark gold 文件或历史答案
- 事后修补 trace
- 伪造 stdout/stderr 与 artifacts 的一致性
- 用声明替代真正的 hermetic execution

如果平台只靠 replay / rescore，而不要求足够强的 provenance，某些“后处理过的假 bundle”依然可能过关。

### 涉及文件
- `modules/run-data-evidence.md` §7, §8, §9
- `modules/trust-governance-ranking.md` §5.3, §5.4, §7
- `modules/cli-adapter.md` §4, §5, §6

### 建议升级为 MUST 的补强
至少对 Reproduced / Verified 增加分层要求：

#### Reproduced 最低门槛
- `container_digest` 或等价运行镜像摘要 **MUST** 存在
- `network_policy_digest` **MUST** 存在
- `artifact-manifest.json` **MUST** 覆盖全部关键证据文件
- trace 根摘要（如 `trace_root_hash`）**MUST** 存在

#### Verified 最低门槛
- 链式 trace 哈希 **MUST** 存在
- `attestation.json` 或 `official_runner_attested=true` **MUST** 其一成立
- 不允许依赖可变的外部对象 URI 作为唯一证据；平台 **MUST** 镜像或固定化这些对象
- 平台控制环境或平台代理网络日志摘要 **MUST** 可追溯

建议新增字段：
- `mount_manifest_hash`
- `env_allowlist_hash`
- `trace_root_hash`
- `network_proxy_log_digest`
- `official_runner_attested`
- `workspace_snapshot_hash_before`
- `workspace_snapshot_hash_after`

---

## 4.5 P1-4：autonomous / human-assisted 只有声明，没有可审计的人类交互遥测规范

### 问题
M4 很正确地要求：
- autonomy mode 必须分榜
- `human_assistance` 必须声明

但 M3 / M5 并没有把“**如何证明自己真的是 autonomous**”写成标准事件或证据要求。  
现在更多还是：
- 让上传者声明自己是 `autonomous`
- 平台在高风险时再人工调查

这对主榜来说不够。

### 为什么严重
如果没有标准化的人类交互证据，下面这些问题会很难判：
- 人类是否中途改过文件
- 人类是否在 TTY 输入过命令
- 人类是否在 IDE 手工修补后再继续跑
- approval-only 与 interactive 的边界是什么
- 多 agent 协作时，哪个动作是 agent，哪个动作是人

这会直接威胁默认官方榜的“autonomous only”前提。

### 涉及文件
- `modules/run-data-evidence.md` §7
- `modules/trust-governance-ranking.md` §4.3, §7
- `modules/cli-adapter.md` §4.3, §5.3, §8

### 建议升级为 MUST / SHOULD 的补强
新增统一的人类交互 / 审批遥测：
- `interaction-log.jsonl`
- `human_event_count`
- `approval_event_count`
- `tty_input_digest`
- `editor_interaction_detected`
- `manual_file_write_detected`
- `human_event_refs`

规则建议：
- `autonomous` 切片的 Reproduced / Verified **MUST** 产出 interaction log
- 无 interaction log 的结果，不得升入 autonomous Verified
- `approval-only` 与 `interactive` 的边界需在 M4 中以规范性定义写死

---

## 4.6 P1-5：缓存 / 持久记忆 / 外部知识库 目前只有声明字段，没有隔离与证明机制

### 问题
当前 draft1 能声明：
- `persistent_memory_enabled`
- `cache_policy`
- `benchmark_specific`
- `benchmark_tuned`

但还不能**证明**：
- cache 真被隔离了
- 持久记忆没有跨 benchmark 污染
- 外部 KB 没在偷带答案
- run-set 内外是否共享了会话状态

### 为什么严重
这类问题在 harness 世界里不是边角料，而是高频攻击面：
- benchmark 题目和答案进入长期 memory
- 通过 global cache 实际做 best-of-history
- 外部 RAG/KB 偷带 benchmark 解答
- 看似通用 harness，实际内置 benchmark patch 库

### 涉及文件
- `modules/run-data-evidence.md` §4
- `modules/trust-governance-ranking.md` §7.1
- `modules/cli-adapter.md` §5.3

### 建议升级为 MUST / SHOULD 的补强
至少新增：
- `memory_scope`（`none/session/project/global`）
- `cache_namespace`
- `state_reset_policy`
- `external_kb_enabled`
- `external_kb_digest_list`
- `cache_root_hash`
- `state_reset_proof`

并建议规则：
- General-purpose Verified **MUST** 明示 memory / cache / KB 范围
- 使用 global cache / global memory 的结果，默认不得进通用主榜，除非该行为就是该 lane 合法设定
- 平台对 high-trust run **SHOULD** 强制 run-id 命名空间缓存隔离

---

## 5. P2 / 非阻断但应尽快补强的问题

### P2-1：独立 submitter / Sybil 防护还偏概念化
M4 提到了“按组织归并”，但尚未定义：
- identity proof 模型
- 组织 / 个人关联规则
- 独立支持数的计算口径

建议后续定义：
- `submitter_identity_class`
- `org_verified`
- `independent_submitter_policy_version`

### P2-2：外部对象存储的长期可审计性不足
M3 允许 `*_ref` 指向外部 URI，只要求 digest/size/media type。  
但对高信任 tier，建议更强：
- 平台镜像一份
- 或要求内容寻址 URI + retention 期限

### P2-3：争议处理的 SLA / retention policy 未定义
M4 的 dispute 状态机是对的，但还缺：
- 审核时限
- 提交者响应期限
- 证据保留时长
- 隐私删除与审计留存如何兼容

### P2-4：top-row 的红队复跑节奏未量化
建议对主榜前列增加固定策略：
- 周期性抽检
- 版本升级后强制复跑
- 新 exploit 曝光后的批量重审

---

## 6. 反作弊补强建议（按模块给）

## 6.1 对 M3《Run Data & Evidence》的补强

### 建议新增字段 / 文件
- `registration_receipt`
- `attempt_plan_hash`
- `attempt_index`
- `declared_attempt_total`
- `trace_root_hash`
- `mount_manifest_hash`
- `env_allowlist_hash`
- `memory_scope`
- `cache_namespace`
- `state_reset_proof`
- `interaction-log.jsonl`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `release_policy`

### 建议提升等级
以下在高信任 tier 中不应只是 SHOULD/MAY：
- `container_digest`
- `network_policy_digest`
- trace hash chain / trace root
- `attestation.json` 或等价 official runner 证明
- interaction log

### 建议新增 bundle 类型
- `public_bundle`
- `sealed_audit_bundle`
- `replay_report`
- `reproduce_report`

---

## 6.2 对 M4《Trust / Governance / Ranking》的补强

### 需要写得更硬的规则
1. **Reproduced / Verified 必须绑定平台签发的 preregistration receipt**
2. **官方主榜对 hidden/holdout lane 必须使用 sealed audit bundle 模式**
3. **autonomous Verified 必须有 interaction telemetry，否则不得入榜**
4. **General-purpose Verified 必须具备 cache/memory 隔离证明**
5. **高信任 tier 不允许只靠外部 URI 作为唯一证据**

### 建议增加的治理条款
- `evidence_visibility_policy`
- `evidence_retention_policy`
- `top_row_redteam_policy`
- `identity_aggregation_policy`
- `benchmark_release_policy`

---

## 6.3 对 M5《CLI & Adapter Contract》的补强

### 需要更强的 connected mode 约束
- Reproduced / Verified **MUST** 从 connected init 开始
- offline 结果默认只能是 Community，不能靠“补 upload”直接晋级
- connected init 时平台应下发：
  - `registration_receipt`
  - seed plan
  - nonce
  - upload contract

### 需要更强的 adapter 行为合同
adapter 除了 `result.json`、`trace.jsonl` 外，还应能产出：
- `interaction-log.jsonl`
- `state-reset-report.json`
- `environment-report.json`
- `cache-report.json`

### 需要更强的一致性要求
- `pack` 前必须检查 attempts 完整性
- `upload` 前必须检查 prereg receipt 与 attempts 集合一致
- `run --upload` 这种快捷命令不能绕过任何完整性检查

---

## 7. 建议的修订优先级

### 第一优先级（下一轮必须修）
1. 预注册 / run-set 绑定闭环
2. hidden split 的 public / sealed 双 bundle 模型
3. 高信任 tier 的环境证明与 trace 防篡改最低门槛
4. autonomous 的 interaction telemetry
5. cache / persistent memory / external KB 的隔离与声明升级

### 第二优先级（draft2 尽量补齐）
1. submitter identity / Sybil 规则
2. 争议 SLA / retention
3. top-row 红队抽检节奏
4. 外部对象存储镜像策略

---

## 8. Reviewer B 的最终裁定

### 当前裁定
**draft1 可继续进入下一轮修订，但不应宣称：**
- 已达到“高可信主榜协议”
- 已达到“反作弊闭环”
- 已达到“满分”

### 我的判断语句
更准确的说法应是：

> **draft1 已建立了正确的治理骨架，但还缺若干能把“治理原则”变成“治理硬约束”的关键协议对象。**

### 是否允许进入 draft2
**允许，而且应该立即进入 draft2。**  
因为现在最需要的不是推倒重来，而是：
- 把 M4 的好原则，压实到 M3 / M5 的硬字段与硬流程里
- 把“声明”升级成“证明”
- 把“上传结果”升级成“上传可验证承诺 + 可审计执行证据”

---

## 9. 一句话总评

> **这份 draft1 已经知道自己要防什么，但还没有完全规定“必须拿什么证据来证明自己真的防住了”。**

这就是我这轮作为 Reviewer B 的核心结论。
