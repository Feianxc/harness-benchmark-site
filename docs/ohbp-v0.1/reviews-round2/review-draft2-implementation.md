# OHBP v0.1-draft2 第二轮独立审核 — Reviewer C3（实现 / 协议工程）

> 审核范围：M2 / M3 / M5 / M6，以及整体 `ohbp-v0.1-draft2.md`  
> 审核依据：`task_plan.md`、`rubric.md`、`draft1-issue-register.md`、`ohbp-v0.1-draft2.md`、`repair-c-bundle-cli-contract.md`、`repair-a-terminology-canonical-objects.md`  
> 日期：2026-04-20

---

## 1. 结论先说

**结论：draft2 在实现 / 协议工程层面已经明显从 draft1 的 prose-first，推进到了“接近 object-first / rule-first”的状态；但仍有 3 个 P1 级实现阻断项，没有达到可冻结为 v0.1 的程度。**

我的判断分成 5 句：

1. **final bundle layout 已基本收敛为唯一规范**，这一点相比 draft1 是实质性跃迁。  
2. **`manifest.json` 已经接近 runtime identity 单一真源**，但还没有完全闭环，尤其是 registration / tolerance 的 canonical path 仍不够硬。  
3. **CLI → raw workspace → final bundle** 这条链已经建立；**final bundle → platform verification** 这条链还差最后一段“裁决对象绑定”。  
4. **关键字段的单一挂载点仍有缺口**，尤其体现在：命名回退、digest/ref 混用、审计硬门槛字段未全部落回 schema。  
5. **建议进入下一轮“窄修订”而不是大改写**：当前不是架构方向错了，而是 schema 收口还差最后一轮。

**总体结论：**
- **P0：0**
- **P1：3**
- **P2：5**
- **实现阻断项：仍存在，但已从“结构性缺口”收缩为“schema 收敛与裁决绑定缺口”**
- **建议：继续一轮小范围修订后再评是否进入定稿 / RC（release candidate）**

---

## 2. 对本轮重点问题的直接回答

### 2.1 final bundle layout 是否已足够唯一

**判断：大体上是。**

证据：
- `ohbp-v0.1-draft2.md:348-360` 已明确 `raw run workspace ≠ final bundle`
- `ohbp-v0.1-draft2.md:612-651` 已冻结 canonical final bundle layout 与 canonical 命名
- `ohbp-v0.1-draft2.md:646-651` 已明确 `task-results.ndjson` / `artifact-manifest.json` 的 canonical 名称

实现意义：
- upload / replay / reproduce / server intake 都终于可以围绕同一套 bundle 内部路径工作
- wrapper 不再有理由发明第二套 bundle 文件名

剩余问题：
- `aggregate.json` 虽已列入 MUST，但仍缺少“必须可由 `task-results.ndjson` + `reports/evaluator-report.json` 复算”的规范句
- `artifacts/<task_id>/` 作为容器已冻结，但最小 artifact ref 约束还不够硬

**结论：IR-09 基本修掉了，但还差最后一层派生关系冻结。**

### 2.2 `manifest.json` 是否已成为 runtime identity 单一真源

**判断：接近成立，但还不算完全成立。**

证据：
- `ohbp-v0.1-draft2.md:653-709` 已把 benchmark / task package / execution contract / evaluator / runtime / harness / model / policy / verification refs 收到 `manifest.json`
- `ohbp-v0.1-draft2.md:1039-1052` 的 `board_slice` 维度已开始消费 `execution_contract_digest`、`trust_tier`、`budget_class` 等 canonical source

剩余问题：
- Section 7 明确要求 `tolerance_policy_digest` 可追溯且切片必须绑定（`533-576`），但 `manifest.json` 只写了 `tolerance_policy_ref`（`706`），没有冻结 `tolerance_policy_id` / `tolerance_policy_digest` 的 canonical path
- `run-group-registration` 在 Section 7 是关键对象，但 `manifest.json` 只写 `registration_ref`（`705`），没有冻结 `registration_id` / `registration_digest` 的 canonical path
- `repair-c` 想推进的“manifest 只放固定 canonical paths，不再允许 ref / prose 混搭”还没有完全落到底

**结论：`manifest.json` 已是“主真源”，但还不是“足够硬的唯一真源”。**

### 2.3 CLI / raw workspace / final bundle / platform verification 是否已闭环

**判断：闭环完成了 75% 左右，最后 25% 卡在 platform verification 的对象绑定。**

已经闭上的部分：
- CLI 生命周期：`initialized -> executed -> packed -> uploaded`（`324-346`）
- raw workspace 与 final bundle 分层（`348-380`）
- run-group registration / completeness / tolerance / repeatability objects 已引入（`445-608`）
- platform 端有 `verification_record` 作为治理对象（`864-884`）

未闭上的部分：
- `verification_record` 的最小字段没有给出它到底裁决哪个 `attempt_id` / `bundle_id` / `run_group_id` / `bundle_digest`
- 这意味着平台“给了谁一个 `trust_tier` / `publication_state`”在协议对象层仍依赖外部数据库上下文，而不是协议内可序列化对象

**结论：CLI→bundle 闭了，bundle→verification 还差一个 canonical subject binding。**

### 2.4 关键字段是否还有单一挂载点缺口

**判断：有，而且是本轮仍需修掉的主因。**

最明显的 4 个缺口：

1. `requested_trust_tier` 被 `requested_tier` 回退污染（`482`）
2. `tolerance_policy_digest` 在 ranking / verification 中是硬门槛，但在 `manifest.json` 里没有固定 canonical path
3. `tty_freeform_input_detected` 被硬规则引用（`960`），却没有进入 `interaction-summary.json` 的最小字段表（`820-833`）
4. `network_proxy_log_digest` 被 Verified 门槛引用（`934`），却没有进入 `reports/environment-report.json` 的最小字段表（`779-794`）

### 2.5 与 draft1 相比，是否已从 prose-first 接近 object-first / rule-first

**判断：是，且进步明显。**

最关键的升级点：
- 明确对象：`run-group-registration.json`、`completeness-proof.json`、`verification_record`
- 明确规则：`tolerance_policy` 唯一挂载点、task disposition 分母规则、repeatability 准入门槛
- 明确合同：final bundle canonical layout、`manifest.json` canonical field table、board slice 固定维度

所以这版已经不是“想法文档”，而是**已经能指导 schema / CLI / intake / ranking service 的协议草案**。

但它还不是 release candidate，原因不是方向错，而是：

> **最后几个 canonical object 的字段闭环还没有彻底钉死。**

---

## 3. 按 6 维 rubric 对 M2 / M3 / M5 / M6 与整体 draft2 打分

> 评分口径：每项 10 分，总分 60 分

| 审核对象 | 方法论严谨性 | 协议完整性 | 治理与反作弊 | 可实现性 | 生态兼容性 | 文档清晰度 | 总分 / 60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| **M2 — Benchmark & Execution** | 9 | 8 | 8 | 8 | 9 | 8 | **50** |
| **M3 — Run Data & Evidence** | 9 | 9 | 8 | 9 | 8 | 9 | **52** |
| **M5 — CLI / Adapter Contract** | 8 | 8 | 8 | 8 | 9 | 9 | **50** |
| **M6 — Metrics / Uncertainty / Slice Consumption** | 9 | 8 | 8 | 8 | 8 | 8 | **49** |
| **整体 draft2** | 9 | 8 | 8 | 8 | 9 | 9 | **51** |

### 3.1 分模块简评

#### M2 — Benchmark & Execution（50/60）
优点：
- `lane_governance_hint` 替代 `ranking_eligibility` 的方向是对的
- `task_package.digest`、`execution_contract.digest` 已进入最小可比条件

扣分点：
- `lane_governance_hint` 仍偏 object-name-first，尚未 fully schema-first
- M2 输出到 M4 的建议性字段，仍需更硬的 canonical field table

#### M3 — Run Data & Evidence（52/60）
优点：
- 是本轮进步最大的模块
- bundle layout、manifest field groups、task disposition、governance reports 已明显 object-first

扣分点：
- `aggregate.json` 仍缺少 derivation rule
- 一些治理报告中的 hard-gate 字段，引用了但没冻结在字段表里

#### M5 — CLI / Adapter Contract（50/60）
优点：
- CLI 生命周期与平台治理状态已成功拆开
- raw workspace / final bundle / custom adapter 分层已可实现

扣分点：
- `requested_tier` 命名回退是明显 schema regression
- CLI 提交声明字段与平台审计叶子字段之间，还有一处未完全剥离

#### M6 — Metrics / Uncertainty / Slice Consumption（49/60）
优点：
- `board_slice` 固定维度明显比 draft1 更硬
- 用 paired delta panel 替代抽象 lift，是正确收敛

扣分点：
- 仍依赖上游 object 的几个 canonical path 完整冻结
- `board_admission_policy` / tolerance / verification 之间的消费路径还可更明文化

#### 整体 draft2（51/60）
优点：
- 已具备“协议工程”骨架
- 不是散文式倡议，而是能映射到 schema / CLI / server intake / ranking service 的技术草案

扣分点：
- 还有少量字段 owner 不稳
- 平台裁决对象绑定还差最后一层

---

## 4. P0 / P1 / P2 清单

## 4.1 P0

**无。**

我没有看到“缺少关键对象、导致完全无法上传 / 无法复验”的 P0。

---

## 4.2 P1

### P1-C3-01：`requested_trust_tier` 的 canonical 命名在 registration 对象中发生回退

**证据：**
- canonical 表使用 `requested_trust_tier`：`166-176`
- `manifest.json` 使用 `requested_trust_tier`：`704-709`
- `verification_record` 也使用 `requested_trust_tier`：`870-878`
- 但 `run-group-registration.json` 最小字段写成了 `requested_tier`：`482`

**影响：**
- 这会重新引入第二套 machine field name
- intake / validator / uploader 很容易出现 schema mapping 分叉
- 也说明 Repair A 的 canonical enum 还没有被彻底吸收

**判定：P1**

**建议修复：**
- 统一改为 `requested_trust_tier`
- 若为了兼容旧样本需要保留 `requested_tier`，也必须明确为 deprecated alias，不得再出现在 normative field list 中

### P1-C3-02：`manifest.json` 还未完全冻结 registration / tolerance 的 canonical path，不能称为“完全唯一真源”

**证据：**
- Section 7 明确 `tolerance_policy_digest` 是硬比较键：`543-576`
- `board_slice` 也明确绑定 `tolerance_policy_digest`：`1039-1061`
- 但 `manifest.json` 只写：
  - `registration_ref`：`705`
  - `tolerance_policy_ref`：`706`
- 没有冻结：
  - `registration_id`
  - `registration_digest`
  - `tolerance_policy_id`
  - `tolerance_policy_digest`
  的 canonical path

**影响：**
- 平台 intake 不能仅靠 manifest 稳定索引 registration / tolerance 身份
- replay / reproduce / slice key 仍需要依赖外部上下文或约定式 ref 解析
- 这会削弱“manifest 是唯一真源”的工程可执行性

**判定：P1**

**建议修复：**
- 在 `manifest.json` 冻结：
  - `registration.id`
  - `registration.digest`
  - `verification_policy.tolerance_policy_id`
  - `verification_policy.tolerance_policy_digest`
- `*_ref` 可以保留，但只能是附加引用，不应替代 canonical identity path

### P1-C3-03：`verification_record` 缺少被裁决对象的 canonical 绑定字段，导致 bundle → platform verification 仍未闭环

**证据：**
- 协议对象总览已承认 `attempt_id` / `bundle_id` 是 Run & Evidence 层核心对象：`246-259`
- final bundle 是按 `attempt_id` 一包一对应：`259`
- 但 `verification_record` 最小字段只有：
  - `requested_trust_tier`
  - `trust_tier`
  - `publication_state`
  - `board_admission_policy_id`
  - `decision_reason_codes[]`
  - `assigned_at`
  - `assigned_by`
  （见 `864-878`）
- **没有**：
  - `attempt_id`
  - `bundle_id`
  - `bundle_digest`
  - `run_group_id`
  - `submission_id`
  之类的 subject binding

**影响：**
- 平台“给谁授予了 `verified` / `published`”没有 protocol-level 可序列化锚点
- audit trail 仍依赖平台数据库上下文，而不是协议对象本身
- 这会直接阻碍后续 dispute / invalidation / correction 的可移植实现

**判定：P1**

**建议修复：**
- 为 `verification_record` 增加 `subject_ref` 或等价对象，至少包括：
  - `run_group_id`
  - `attempt_id` 或 `bundle_id`
  - `bundle_digest` 或 `manifest_digest`
  - `registration_digest`（如适用）

---

## 4.3 P2

### P2-C3-01：`aggregate.json` 是 MUST，但未被声明为可复算派生文件

**证据：**
- `aggregate.json` 在 final bundle 中是 MUST：`620`
- 但正文未明确它必须由 `task-results.ndjson` + `reports/evaluator-report.json` 派生

**影响：**
- 容易形成第二真相源
- server / CLI / UI 可能各自产生略有不同的 aggregate

**建议：**
- 加一句强规范：`aggregate.json MUST be reproducible from task-results.ndjson and reports/evaluator-report.json`

### P2-C3-02：`interaction-summary.json` 的 hard-gate 字段未完全落入 schema 表

**证据：**
- 最小字段表：`820-833`
- `approval_only` 的硬要求引用了 `tty_freeform_input_detected = false`：`955-960`
- 但该字段没有出现在最小字段表中

**影响：**
- validator 无法依据最小 schema 判断字段是否缺失
- 审计规则与对象 schema 仍有一处断层

**建议：**
- 将 `tty_freeform_input_detected` 写入 `interaction-summary.json` 最小字段表
- 同时冻结 `classification_verdict` 的最小枚举

### P2-C3-03：Verified 门槛引用了 `network_proxy_log_digest`，但 `environment-report` 最小字段表未收录

**证据：**
- `reports/environment-report.json` 最小字段：`779-794`
- Verified 强门槛另行引用 `network_proxy_log_digest`：`928-934`

**影响：**
- 实现方不知道该字段到底属于 `environment-report`、`attestation.json`，还是独立报告
- “若允许联网”这一条件下的高信任审计无法严格验证

**建议：**
- 若该字段保留，应把它并入 `reports/environment-report.json` 的最小字段表
- 或新增 `reports/network-report.json`，不要继续悬浮在 prose 中

### P2-C3-04：`lane_governance_hint` 与 `board_admission_policy` 已被命名，但还没有最小 field table

**证据：**
- 这两个对象在总览中已被提升为正式对象：`261-273`
- `board_admission_policy_id` 已被 `verification_record` 消费：`875`
- 但 draft2 没有给出它们的最小字段表 / digest / versioning 方式

**影响：**
- 平台侧实现仍需要临时自定义 schema
- 容易把“对象名已出现”误判成“对象已冻结”

**建议：**
- 在下一轮修订中至少补一个 appendix 级最小 schema 表

### P2-C3-05：声明态与审计态的区分仍有一处轻微泄漏

**证据：**
- `autonomy_mode` 被定义为 M4 审计叶子模式：`173`、`936-971`
- 但 `run-group-registration.json` 最小字段表仍直接收了 `autonomy_mode`：`480`

**影响：**
- 容易把预注册声明值与审计裁定值混成同一字段
- 与 Repair A 想建立的“源字段 vs 派生字段”边界还差半步

**建议：**
- registration 中改为 `declared_autonomy_mode` 或 `intended_autonomy_mode`
- `autonomy_mode` 保留给 M4 审计后 canonical verdict

---

## 5. 与 draft1 相比的实现面进步

这部分必须明确给出正向评价，否则会低估 draft2 的实际进展。

### 已明显修掉的问题

1. **IR-09（bundle layout 不唯一）**：已基本修掉  
2. **IR-10（关键字段闭环不完整）**：大部分已修，只剩最后几个 ref/digest 收口问题  
3. **IR-07（M2 污染 ranking policy）**：方向已基本纠正  
4. **IR-06（抽象 lift 指标）**：已明显收敛到 paired delta panel  
5. **draft1 的 CLI / 平台状态混用**：已显著改善

### 仍未完全修完的地方

1. object 名称已出来，但个别对象还没 fully schema-first  
2. manifest 还差 registration / tolerance 的硬路径冻结  
3. 平台裁决对象 `verification_record` 还差 subject binding

---

## 6. 实现阻断项是否还存在

**存在。**

但我强调：

> 现在的阻断项已经不是“协议想不明白”，而是“协议已经基本想明白，但还差最后一轮 schema 收敛”。

也就是说，这不是推倒重来级别的阻断，而是 **release candidate 之前必须补掉的实现阻断**。

我认为当前仍阻断冻结的，就是上面 3 个 P1：

1. canonical field 命名回退
2. `manifest.json` 对 registration / tolerance 的真源不够硬
3. `verification_record` 没有裁决对象绑定

---

## 7. 是否建议进入下一轮修订或可接近定稿

**建议：进入下一轮小范围修订。**

我的具体建议是：

### 建议的修订策略

不要再开一轮“大重构”，而是只做一轮 **schema convergence patch**，目标聚焦 4 件事：

1. 统一 `requested_trust_tier`，清除 `requested_tier`
2. 补齐 `manifest.json` 中 registration / tolerance 的 canonical digest/id path
3. 给 `verification_record` 增加 `subject_ref`
4. 把所有 hard-gate 字段回填到对应 report schema 表

### 我对阶段判断

- **当前状态：可接近定稿，但不能定稿**
- **下一步目标：做成 `v0.1-rc1` 水平，而不是继续扩展新概念**

如果上述 4 件事修完，我认为：

> **draft2 的下一版很有机会进入“无 P1，只剩少量 P2”的 release-candidate 评审。**

---

## 8. 本轮 Reviewer C3 最终判断

**最终判断：**

- 这版 draft2 **明显优于 draft1**，并且已经具备“协议工程化”的骨架
- 在我负责的实现 / 协议工程视角下，**不建议回退方向**
- 但我**不建议现在宣称接近满分，也不建议直接冻结为正式 v0.1**
- 最合理的路径是：
  - **再来一轮窄修订**
  - **专门修 schema / canonical path / verification binding**
  - 然后进入 release-candidate 级复审

一句话总结：

> **draft2 已经跨过“想法草案”阶段，进入“可以落 schema 和服务接口”的阶段；但要成为可冻结规范，还差最后一轮实现收口。**
