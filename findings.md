# Findings — OHBP / harnessbench

## 已确认的关键外部事实

1. OpenAI 在 **2024-08-13** 的 SWE-bench Verified 文章中举例说明：同一 GPT-4 在 SWE-bench Lite 上因 scaffold 不同，成绩可从 **2.7% 到 28.3%**。
   - 来源：<https://openai.com/index/introducing-swe-bench-verified/>

2. OpenAI 在 **2026-02-23** 明确表示 SWE-bench Verified 已不再适合作为前沿 coding 能力主指标，理由包括测试设计问题与 contamination。
   - 来源：<https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/>

3. WebArena-Verified 强调：
   - version-controlled dataset
   - deterministic evaluators
   - captured network traces
   - offline evaluation
   - 来源：<https://github.com/ServiceNow/webarena-verified>

4. BrowserGym leaderboard 已要求诸如：
   - `benchmark_specific`
   - `benchmark_tuned`
   - `followed_evaluation_protocol`
   - `reproducible`
   等结构化字段。
   - 来源：<https://huggingface.co/spaces/ServiceNow/browsergym-leaderboard/blame/main/README.md>

5. Agentic Benchmark Checklist 提醒 benchmark 需单独考虑：
   - task validity
   - outcome validity
   - 来源：<https://uiuc-kang-lab.github.io/agentic-benchmarks/>

6. Berkeley RDI 已展示多类 benchmark 可被 exploit，不真正解题也能取得异常高分。
   - 来源：<https://rdi.berkeley.edu/blog/trustworthy-benchmarks-cont/>

## 当前内部结论

- 这个项目的第一性资产不是网站，而是 **协议与可信执行层**
- 最佳冷启动路径：**CLI > 上传 bundle > 薄网站 > 平台复验**
- 不能把自报结果直接并入主榜
- 必须把“满分”从情绪目标改写为“rubric 全维度达标”

## 实现阶段恢复后的关键本地事实（2026-04-21）

1. 当前仓库在 `2026-04-21` 的实测结果是：
   - `npm run build` **失败**
   - 失败主因不是 web，而是 **schema/core 与 validator/cli 的 Round 2 patch 尚未收口**

2. 当前可复现的三类 build blocker：
   - `.ts` extension import 触发 `TS5097`
   - `validator-core/context.ts` 仍按旧 manifest shape 读取 bundle
   - fixtures 在 canonical materialization 后出现 `JsonLike` 类型签名不收口

3. 当前代码已经显式表明：
   - `apps/hb-cli/src/commands.ts` 产出的 manifest 是 **新 shape**
   - 但 `packages/validator-core/src/context.ts` 仍在假设旧 shape
   - 所以“shared contracts 已更新，但 consumer 仍按旧协议消费”是当前最核心的真实断点

4. `apps/hb-cli/src/commands.ts` 当前的已知协议缺口仍包括：
   - `public_plus_sealed` 时 public/sealed 内容仍高度同构，尚无真实 redaction
   - `trace_integrity.event_chain_complete` 目前仍写成 `false`
   - `run` / `pack` 对未声明 attempt 还没有硬约束
   - `upload` 仍直接 POST 自定义 payload，而非优先使用 `bundle_path | normalized_payload`

5. `apps/mock-intake` / `packages/verifier-core` 当前已经支持：
   - `MockUploadInput.bundle_path`
   - `MockUploadInput.normalized_payload`
   说明 CLI upload contract 的最小正确收口方向已经在平台侧准备好了

## 当前实现阶段新增内部事实（2026-04-21，smoke 后）

1. 当前仓库不仅 `build/test` 已恢复绿色，而且 **Node 直接执行 `apps/hb-cli/dist/cli.js` 已恢复可用**。
   - 这意味着“只在 vitest/tsx 里能跑、真实 CLI 不能跑”的状态已结束。

2. 当前 CLI -> intake -> verifier -> web 的实际最小闭环已被本地证据确认：
   - CLI dry-run request 落盘成功
   - CLI 实际 upload 已进入 mock-intake
   - verifier pipeline 在 `seedDemoData: false` 下读到了真实 uploaded submission
   - web 已能读取 verifier-worker 产出的 publication bundle

3. 当前真实 uploaded submission 的平台呈现位置是：
   - **Community Lab 有 1 个 entry**
   - **Official Verified Board 为空**
   这是符合当前 policy gate 的，不是故障。

4. 当前 web MVP 对外演示时，最安全的表述应是：
   - “实现链路已经打通”
   - “平台能区分 official / reproducibility / community 三层”
   - “当前示例上传因 policy gate 未进入 official verified”
   而不是宣称“官方榜已经有 production-grade verified 排名”。

5. 当前仍值得后续继续 hardening 的点，不再是阻塞 build/test/smoke 的 P0，而是：
   - `attempt-plan.json` / `redactions.json` / `registry/*.json` 仍偏 bundle-local helper 约定
   - `external-packages.d.ts` 这类 shim 仍说明 validator-core 编译层还有工程债
   - official board gate 目前是 MVP 最小策略，不是最终完整治理系统

## 当前实现阶段新增内部事实（2026-04-21，崩溃恢复后的 source-level 复验）

1. 本轮崩溃恢复后，临时 reviewer 子代理状态不可恢复：
   - `wait_agent` 对本轮临时 agent 返回 `not_found`
   - 因此当前恢复策略继续以 **本地源码 + planning files + 实测脚本输出** 为准

2. 当前宿主机存在明显 **Node / esbuild / tsc 级内存环境问题**：
   - 全量 `vitest`
   - 并发 `tsc`
   - 以及部分 `tsx` / CLI 入口
   会出现 OOM / `spawn UNKNOWN` / `fatal error: runtime: cannot allocate memory`
   - 因此本轮最可靠的验证方式不是“再跑一遍全量测试”，而是 **source-level 一次性脚本直接执行当前源码**

3. 直接执行当前源码已确认：
   - verifier demo pipeline 产出：
     - `publications = 7`
     - Official = `3`
     - Frontier = `2`
     - Community = `1`
   - `protocol_version` 在 completeness / verification 两侧均正确为 `0.1`
   - Frontier eligible 不再混入 Community

4. 直接执行当前源码 server 已确认：
   - `GET /api/boards` 返回 `200`
   - demo fallback 使 Official / Frontier / Community 三层都有可展示面
   - `POST /api/validator` 输入 malformed JSON 会返回：
     - `400`
     - `error = "invalid_json"`
     - `status = "fail"`

5. 本轮发现了一个此前未完全收口的真实实现 bug：
   - `apps/verifier-worker/src/pipeline.ts` 会把 API 上传样本的 `observed_attempt_total`
     错误地压缩为 intake store 中该 run-group 的上传条数
   - 这会让 payload 中已正确统计出的 `5` 被覆写回 `1`
   - 直接后果是：
     - `completeness_verdict` 被错误打成 `incomplete`
     - `trust_tier` 被错误降级

6. 该 bug 的最小正确修复已经落地：
   - 对 `source === "api"` 的 publication 构造逻辑，改为：
     - `observed_attempt_total = max(payload.observed_attempt_total, distinct_uploaded_attempts_in_store)`
   - 即：
     - 保留 CLI 已正确统计的 observed attempts
     - store 聚合仅作为“下限补偿”，不再作为“强行缩窄”

7. 修复后的 source-level 端到端链路已再次确认：
   - `initWorkspace -> runWorkspace -> packWorkspace -> validateBundle -> inspectBundle -> uploadBundle(dry-run) -> persistUpload -> runVerificationPipeline`
   - 结果：
     - `validationVerdict = pass`
     - `validationFindings = 0`
     - upload 后 `study_id / run_group_id / attempt_id / bundle_id` 均保持与 manifest `run_identity` 一致
     - `observed_attempt_total = 5`
     - `declared_attempt_total = 5`
     - `completeness_verdict = complete`
     - `trust_tier = verified`

8. manifest binding 当前也已被再次本地证据确认：
   - 篡改 `manifest.json.created_at` 后重新 validate
   - 结果直接 `fail`
   - finding 命中：
     - `integrity.bundle-digest-from-checksums:checksum:manifest.json`
   - 说明 manifest 已进入真实 digest binding 面，而不是只停留在文档约定

## 当前实现阶段新增内部事实（2026-04-21，web / PRD 收口）

1. web reviewer 指出的 “demo fallback 静默注入” 已做成显式公开说明：
   - Home / Board / Entry 视图模型新增 `data_provenance`
   - 当 runtime 混入 demo seeds 时，页面会直接显示：
     - `Demo fallback active`
     - 或 `Synthetic demo entry`
   - 这将“当前页面可演示”与“当前是否真实 verifier 落盘样本”明确区分开

2. web 当前运行态与 verifier-worker 落盘快照的关系已经被产品化表达：
   - `apps/web/src/data.ts` 仍按 `publications.json + demo fallback` 构建 runtime 页面
   - 但不再默默伪装成全是真实数据
   - 因此“运行态与 `apps/verifier-worker/data/boards/*` 快照不同”不再是误导性缺陷，而是有显式 provenance 的设计选择

3. board 页面已不再是“三块完全同构表格”：
   - Official：新增 `Uncertainty & confidence strip` 与 `Compare drawer starter`
   - Frontier：新增 `Near-Verified candidates / missing evidence reasons`
   - Community：新增 `Community feed` 与升级提示
   - 仍然是 MVP 粒度，但已经从“完全同构表格”跨到“按 board 角色分化”

4. Frontier / Community 的默认展示语义已进一步收口：
   - Frontier 默认展示 **all frontier slices** 的 queue 视图
   - Community 默认展示 **all community slices** 的 feed 视图
   - 不再默认把多 slice 裁成单 slice 主视图

5. `board_slice` 当前采用的最小收口策略是：
   - 已把 `tolerance_policy_digest` 纳入 `sliceKey`
   - 当前**没有**把 `execution_contract_digest` 纳入 `sliceKey`
   - 这是一个有意识的工程判断：
     - 若把完整 `execution_contract_digest` 也纳入 key，会把 `fixed_model_compare_harness` 直接切碎成单-entry slices
     - 从而破坏“固定模型、比较不同 harness”的主榜目标
   - 换言之：当前实现优先保证
     - **不同 tolerance policy 不混 slice**
     - **同模型下的 harness 仍可比较**

6. 修复后的源码级 web smoke 已再次确认：
   - `/api/boards` 返回：
     - Official = `3 / ranked_ordinal`
     - Frontier = `2 / comparison_only`
     - Community = `3 / ranked_tiered`
   - 所有 board JSON 均带：
     - `data_provenance.mode = runtime_public_plus_demo_fallback`
   - `/boards/official-verified` 含：
     - `Demo fallback active`
     - `Compare drawer starter`
   - `/boards/reproducibility-frontier` 含：
     - `Near-Verified candidates / missing evidence reasons`
   - `/boards/community-lab` 含：
     - `Community feed`
   - `entry_a11b70cbf189` 的 research 页含：
     - `Synthetic demo entry`

## 当前实现阶段新增内部事实（2026-04-21，upload/intake 真源收口）

1. 新一轮 expert reviewer 给出的最强共识是：
   - CLI 本地 `pack -> validate` 已比较扎实
   - 但此前 **upload -> mock-intake -> verifier-worker** 仍未把 validator / digest 重算结果变成唯一事实来源

2. 本轮已补齐的关键收口：
   - `apps/hb-cli/src/commands.ts`
     - `uploadBundle()` 不再复用旧 validation report
     - 每次 upload 前都会重新 `validateBundle(...)`
     - 若 `overall_verdict = fail`，直接本地中断 upload
   - `apps/mock-intake/src/store.ts`
     - intake 在 `bundle_path` 存在时，会以 `platform_intake` 模式服务端重跑 validator
     - 若服务端验证 `fail`，直接拒收入库
     - 对通过的 bundle，会用 **服务端 manifest + 服务端 bundle digest** 回写关键字段，避免继续信任客户端自报 digest/identity
   - `apps/verifier-worker/src/pipeline.ts`
     - 显式跳过 `validation_summary.overall_verdict = fail` 的 stored submission

3. 本轮新增的服务端真源证据：
   - 合格 bundle：
     - 入库记录现在带 `validation_summary`
     - 其中包含：
       - `overall_verdict`
       - `finding_count`
       - `bundle_digest`
       - `validated_at`
   - 篡改 manifest 后：
     - CLI upload 会报：
       - `Upload aborted: local validation failed ...`
     - mock-intake 也会报：
       - `bundle rejected at platform_intake ...`

4. 这意味着当前最关键的 P1 已从：
   - “校出来以后还没成为 upload/intake/verifier 的唯一事实来源”
   收口为：
   - “本地与服务端 intake 都会对 fail bundle 形成闸门，且 verifier 不再消费明确 fail 的 stored submission”

## 第一轮模块化设计产出

已形成 6 个模块草案：

1. `docs/ohbp-v0.1/modules/foundations.md`
2. `docs/ohbp-v0.1/modules/benchmark-execution.md`
3. `docs/ohbp-v0.1/modules/run-data-evidence.md`
4. `docs/ohbp-v0.1/modules/trust-governance-ranking.md`
5. `docs/ohbp-v0.1/modules/cli-adapter.md`
6. `docs/ohbp-v0.1/modules/metrics-uncertainty.md`

并已汇总为：

- `docs/ohbp-v0.1/ohbp-v0.1-draft1.md`

### draft1 的关键共识

- OHBP 是协议，不是单一榜单
- CLI 是 canonical execution layer
- SKILL / plugin 只是 wrapper
- 证据包是一等公民
- 排名单位应是 run-group，而不是 best single run
- 主榜默认只看 Verified
- benchmark health 必须版本化并独立展示

## 第一轮独立审核结论（已落盘）

当前已存在 5 份审核文件：

1. `docs/ohbp-v0.1/reviews/review-methodology.md`
2. `docs/ohbp-v0.1/reviews/review-governance-redteam.md`
3. `docs/ohbp-v0.1/reviews/review-ecosystem-product.md`
4. `docs/ohbp-v0.1/reviews/review-implementation.md`
5. `docs/ohbp-v0.1/reviews/review-scoreboard.md`

### 汇总结论

- **P0：无**
- **P1：存在且跨模块集中**
- `draft1` **不满足** stop condition，必须进入 draft2 修订

### 关键分数

- 方法论总评：**48/60**
- 实现总评：**45/60**
- 总评分板：**50/60**
- 治理可信度：**6.8/10**
- adoption：**8.7/10**

### 聚合后的关键缺口

1. **canonical enum / canonical object 仍不足**
   - trust tier 命名未完全统一
   - 字段归属与状态机边界尚未冻结

2. **run-group 完整性证明尚未落成**
   - 缺少 preregistration / completeness proof 对象
   - 无法强证明“全量 attempts 已披露”

3. **verification / reproduced 判定尚未形成唯一规则对象**
   - tolerance policy 缺少统一挂载点
   - `true seeded` vs `pseudo repeated` 的 Verified 准入未钉死

4. **统计口径仍有关键缺口**
   - task disposition / denominator 未统一
   - board slice 最低发布门槛未定义
   - `harness_lift` / `model_lift` 仍依赖抽象 `score(...)`

5. **bundle / CLI / manifest 收敛还差一步**
   - M3 与 M5 文件命名未统一
   - 关键 runtime identity fields 未完全闭环

6. **高信任治理门槛仍偏软**
   - hidden split 缺 sealed/public 双通道证据模型
   - 环境完整性与 trace 防篡改要求需强化
   - human interaction telemetry 缺规范
   - memory / cache / external KB 缺隔离与证明机制

7. **产品化与冷启动机制仍需补强**
   - 上传者 / 复现者飞轮不足
   - 提交 profile 分层与主榜空心期过渡策略需明确

### 当前内部判断

项目已从“想法验证”进入“协议修订工程”阶段，下一步最重要的是：

> 把 reviewer 指出的 P1 从文字建议，收敛成可编码的 canonical schema / object / rule。

## 第二轮修订输入（repair packets）已完成

当前已新增 5 份主修订包：

1. `docs/ohbp-v0.1/repair-packets/repair-a-terminology-canonical-objects.md`
2. `docs/ohbp-v0.1/repair-packets/repair-b-registration-completeness.md`
3. `docs/ohbp-v0.1/repair-packets/repair-c-bundle-cli-contract.md`
4. `docs/ohbp-v0.1/repair-packets/repair-d-governance-hardening.md`
5. `docs/ohbp-v0.1/repair-packets/repair-e-adoption-launch.md`

并已基于其生成：

- `docs/ohbp-v0.1/draft2-integration-blueprint.md`

### 当前已经基本冻结的 draft2 方向

1. **状态轴分离**
   - `requested_trust_tier`
   - `trust_tier`
   - `publication_state`

2. **run-group 完整性闭环**
   - `run-group-registration.json`
   - `completeness-proof.json`

3. **容差规则唯一挂载点**
   - `Execution Contract.verification_policy.tolerance_policy`

4. **bundle / manifest / CLI 收敛**
   - final bundle layout 冻结
   - `manifest.json` 成为 runtime identity 单一真源

5. **高信任治理强化**
   - public bundle / sealed audit bundle
   - trace integrity
   - environment integrity
   - human interaction telemetry
   - memory / cache / external KB 证明机制

6. **最小生态飞轮补足**
   - uploader / framework author / reproducer 三角色
   - `community-light` / `reproducible-standard` / `verified-full`
   - `scorecard view` / `research view`
   - 主榜空心期过渡策略

## `draft2` 已生成

当前已新增主稿：

- `docs/ohbp-v0.1/ohbp-v0.1-draft2.md`

### draft2 的核心整合结果

1. **canonical state separation 已进入主文**
   - `requested_trust_tier`
   - `trust_tier`
   - `publication_state`

2. **可比较性闭环已进入主文**
   - `run-group-registration.json`
   - `completeness-proof.json`
   - `tolerance_policy`
   - `repeatability_class`

3. **bundle / manifest / CLI 合同已进入主文**
   - final bundle canonical layout
   - raw workspace ≠ final bundle
   - `manifest.json` 成为 runtime identity 单一真源

4. **高信任治理对象已进入主文**
   - `verification_record`
   - public bundle / sealed audit bundle
   - `interaction-log.jsonl`
   - `interaction-summary.json`
   - `environment-report.json`
   - `trace-integrity.json`
   - `state-reset-report.json`
   - `cache-report.json`

5. **产品层最小闭环已进入主文**
   - `submission_profile`
   - Uploader / Framework Author / Reproducer
   - `scorecard_view` / `research_view`
   - `Official Verified Board` / `Reproducibility Frontier` / `Community Lab`

### 当前判断

现在最合理的下一步已经不再是继续主控修文，而是：

> 对 `ohbp-v0.1-draft2.md` 拉起一轮全新的 reviewer 团队，检查它是否真正从 prose-first 迈入了 object-first / rule-first。

## 第二轮审核已完成

当前已新增 5 份第二轮 review 文件：

1. `docs/ohbp-v0.1/reviews-round2/review-draft2-methodology.md`
2. `docs/ohbp-v0.1/reviews-round2/review-draft2-governance-redteam.md`
3. `docs/ohbp-v0.1/reviews-round2/review-draft2-ecosystem-product.md`
4. `docs/ohbp-v0.1/reviews-round2/review-draft2-implementation.md`
5. `docs/ohbp-v0.1/reviews-round2/review-draft2-scoreboard.md`

### 第二轮审核总结

- **P0：无**
- **stop condition：未达到**
- **总体结论：接近定稿，但不建议本轮直接冻结为正式 v0.1**

### 当前最关键的残余 P1

1. **public / sealed 双通道证据模型未完全 canonical object 化**
2. **autonomy schema 尚未完全闭口**
3. **`pseudo_repeated` 的 registration-level 审计字段未冻结**
4. **`requested_trust_tier` 命名回退**
5. **`manifest.json` 对 registration / tolerance 尚未完全成为唯一真源**
6. **`verification_record` 缺少 subject binding**

这些问题已汇总到：

- `docs/ohbp-v0.1/draft2-round2-issue-register.md`

并已进一步整理为：

- `docs/ohbp-v0.1/draft3-focus-blueprint.md`

### 当前内部判断

项目已经不再需要“继续发明新结构”，而需要：

> 只做最后一轮 focused convergence patch，把 residual P1 收口成 machine-checkable protocol objects。


## `draft3` 已生成

当前已新增：

- `docs/ohbp-v0.1/ohbp-v0.1-draft3.md`
- `docs/ohbp-v0.1/focus-packets/f1-evidence-autonomy-closure.md`
- `docs/ohbp-v0.1/focus-packets/f2-registration-manifest-verification-closure.md`

### draft3 的 focused convergence 结果

1. **双通道证据模型已 object-first 化**
   - `evidence_channel_mode`
   - `public_bundle_digest`
   - `sealed_audit_bundle_digest`
   - `visibility_class`
   - `release_policy`
   - `redaction_policy_id`

2. **autonomy schema 已闭口到 interaction telemetry**
   - `tty_freeform_input_detected`
   - `approval_target_linkage_complete`
   - `ZERO_INPUT_V1` sentinel
   - `approval_only -> interactive` 自动降级规则

3. **registration / manifest / verification binding 已补齐**
   - `submission_window`
   - `randomness_fingerprint_hint`
   - `request_template_hash`
   - `provider_snapshot_lock` / `provider_release_window`
   - `manifest.registration_digest`
   - `manifest.tolerance_policy_digest`
   - `verification_record.subject_ref`
   - `verification_record.subject_bundle_digest`

4. **若 reviewer 接受以上 canonical object / MUST 规则，则 round2 的 6 个 residual P1 预期可全部关闭**

### 当前内部判断

draft3 已不再是“补叙事”，而是把 residual P1 直接落为 machine-checkable field / ref / digest / gate。下一步最合理动作是：

> 对 `ohbp-v0.1-draft3.md` 发起一轮极小 reviewer 团队复核，重点验证 P1 是否真正清零。


## `draft4` 与正式 `v0.1` 已冻结

当前新增：

- `docs/ohbp-v0.1/ohbp-v0.1-draft4.md`
- `docs/ohbp-v0.1/ohbp-v0.1.md`
- `docs/ohbp-v0.1/reviews-round4/review-draft4-governance-redteam.md`
- `docs/ohbp-v0.1/reviews-round4/review-draft4-scoreboard.md`

### 冻结证据

1. Round4 总评文件明确给出：
   - `P0 / P1 / P2 / P3 = 0 / 0 / 0 / 0`
   - `总分 = 60 / 60`
   - `6 个维度全部 10 / 10`
   - `stop condition = 达成`

2. Round4 治理复核文件明确给出：
   - `P0 / P1 / P2 = 0 / 0 / 0`
   - 治理维度 `60 / 60`
   - 建议冻结

3. 因此，当前可将：
   - `docs/ohbp-v0.1/ohbp-v0.1.md`
   视为本项目协议收敛阶段的正式冻结基线。

### 当前内部结论

OHBP / harnessbench 已完成从“想法 → 草案 → 多轮审查 → focused convergence → freeze”全过程。下一步不再是继续打磨协议，而是进入：

> schema、CLI、bundle validator、verifier pipeline、薄网站 / 平台 PRD 的实现阶段。

## 实现阶段 kickoff 新发现（2026-04-21）

1. 工作区当前尚未初始化代码仓，只有：
   - 协议正式稿
   - implementation 设计文档
   - planning files
   说明当前节点确实是“实现前设计完成、代码尚未开工”的干净起点。

2. 交接摘要里提到的 `architecture-review.md` 起初在本地不存在；随后旧 reviewer 完成并落盘，现已存在：
   - `docs/implementation/architecture-review.md`

3. implementation 三份设计文档与 architecture review 已形成稳定共识：
   - D1：schema / canonical / validator-rules 三件套
   - D2：`init -> run -> pack -> validate -> inspect -> upload(mock)` 主线
   - D3：薄网站 + BFF + view models
   - R1：必须先冻结 package 边界、共享对象清单、阶段 gate

4. 主控已根据上述文档新增：
   - `docs/implementation/build-blueprint.md`
   其作用是把“设计文档集合”收敛成单一执行蓝图，避免后续 worker 和 reviewer 因命名、owner、shared contract 漂移而返工。

5. 当前实现阶段的关键内部判断：

> 这轮不应该先追求真实 benchmark 执行器或复杂后端，而应优先打通：
>
> `sample registry / fixture -> raw workspace -> pack -> validate -> upload(mock) -> verification outputs -> website pages`

6. 当前已冻结的最重要工程边界：
   - `manifest.json` 是 bundle 侧唯一 join surface
   - `verification_record` 是平台裁决真源
   - `pack` 是唯一 raw -> final bundle canonicalization 边界
   - 前端只消费 `view-models` / BFF，不重造 ranking / trust / evidence 语义

## 实现阶段 reviewer 新发现（2026-04-21，Round after handoff）

### F1. verifier-core / validator-core 的 shared contract 已出现第二真源漂移

- `packages/verifier-core/src/types.ts` 本地重写了多组 shared protocol 类型
- 漂移点包括：
  - `VerificationRecord` 缺 `protocol_version`
  - `VerificationRecord` 缺 `interaction_summary_digest`
  - `CompletenessProof.tier_eligibility_effect` 被放宽成任意字符串
  - 真实产物曾写出 schema 未定义值 `blocked_until_completeness_complete`
- `packages/validator-core/tsconfig.json` 仍把 `@ohbp/types` / `@ohbp/canonical` 指到 `src/external-packages.d.ts`
- 该影子声明也已经漂移，不再适合作为 contract 防线

### F2. manifest binding 仍未真正闭口

- `hb-cli pack` 当前用 `checksums.sha256 -> public_bundle_digest`
- 但 `checksums.sha256` 列表没有覆盖 `manifest.json`
- 导致 manifest 里仍有一部分协议关键信息没有进入真正的 digest 绑定链
- 当前最合理修复方向不是直接把 manifest 纳入 checksums 自引用循环，而是：
  - 通过 `artifact-manifest.json` 或等价绑定链让 manifest bytes 被 checksummed object 覆盖
  - 同时补 validator rule 做机器验证

### F3. upload / intake identity 在边界处断裂

- CLI upload 请求体虽然携带 public bundle digest 等字段，但 mock-intake 归一化时会重生成：
  - `study_id`
  - `run_group_id`
  - `attempt_id`
  - `bundle_id`
- 这会让 intake store 中的对象身份与原 bundle manifest 的 `run_identity` 脱锚
- 对一个以 “verification_record 绑定 subject_ref / subject_bundle_digest” 为核心的平台来说，这是 P1

### F4. observed attempt 语义当前是错误收缩的

- CLI upload 里把 `observed_attempt_total` 固定写成 `1`
- 这会让 verifier 把多-attempt run-group 误判成 incomplete
- 正确实现应允许 verifier 基于 intake store / run-group 聚合恢复真实 observed attempt 数，而不是依赖 CLI 硬编码单次 bundle 视角

### F5. Web 产品面还存在 3 个必须收口的 P1

- Frontier eligible 会串到 Community Lab
- `/api/validator` 对 malformed JSON 没有结构化防护
- 当前 direct-run 的数据面可能出现 Official / Frontier 空榜，影响产品演示

### F6. 当前最优先修复顺序已明确

1. 先修 shared contract 真源（verifier-core / validator-core）
2. 再修 manifest binding 与 upload/intake identity
3. 再修 board layering / validator API / demo data fallback
4. 最后做 build + 定向 tests + smoke 回归

## 实现阶段新增发现（2026-04-21，Round after expert re-review）

### F7. payload-only API upload 曾是 P0，现已关闭

- 之前 `mock-intake` 在 `source = api` 且无 `bundle_path` 时仍会继续 `normalizeIncomingSubmission()`，导致 payload-only 样本可进入 publication 流程
- 现已改为：
  - `source = api` 且缺 `bundle_path` → 直接拒绝
- 本地证据：
  - `POST http://127.0.0.1:4110/api/uploads` payload-only 返回 `400`

### F8. intake 仍不能算“全链路最终真源”，但关键 bundle-side truth 已明显收紧

- 现阶段已由服务端 bundle context 重建/覆盖：
  - 身份四元组
  - `submission_id / entry_id`
  - `model / harness / metrics / telemetry`
  - digest / evidence / release / visibility
  - 服务端 `submitted_at`
- 仍未完全 machine-proof 的残余点：
  - `observed_attempt_total` 仍需依赖 payload claim + store 聚合作为折中
  - `benchmark.health` 仍主要来自现有 payload/default，而非 bundle 内对象

### F9. protocol-grade slice 语义已改成 fail-closed，代价是演示榜单更“冷”

- `execution_contract_digest` 已进入 slice identity
- 官方 / Frontier / Community 默认页都不再用 all-slices 聚合冒充单一 canonical slice
- 在 separation evidence 未显式建模前，Official 不再直接给 `ranked_ordinal`
- 结果：
  - 默认页现在多为 `insufficient_evidence`
  - 但这是 **协议一致性优先** 的正确行为

### F10. 当前最合理的后续增强顺序

1. **把 `observed_attempt_total` 从“payload + 聚合补偿”升级为真正的 run-group truth**
2. **补 `board_admission_policy` / separation evidence 的正式对象链路**
3. **让 Web 优先消费 verifier-worker 落盘的 board/entry snapshot，而不是 runtime 重算**
4. **继续补研究视图 / protocol browser / validator playground 的产品化细节**

## Public beta 上线检查新增发现（2026-04-24）

### F11. 项目已经具备 public beta 骨架，但还不是正式生产站

当前 Web / CLI / mock intake / verifier / view-models 均可 build/test，通过本地 smoke。新增 `/healthz`、robots/sitemap、安全头后，部署外壳已从“本地演示”推进到“可被平台探活和搜索引擎理解”的状态。

仍需注意：这不等于真实生产发布完成。缺口集中在部署平台、HTTPS、CI/CD、Terms/Privacy、真实 verified 数据集与生产域名 Lighthouse 复测。

### F12. Consumer 层真实性边界必须继续保持

本轮前端文案与样式优化没有把 `curated_host_fit_demo` 接到 v0.3 Wilson/rank band 算法，也没有把静态策展分包装成 verified truth。这个边界必须保留：Consumer 是 selection guide，Evidence Board 才承载可验证结果。

### F13. 本地 Lighthouse 的剩余失败不是应用主逻辑阻塞

本地 Lighthouse mobile 结果：Accessibility 100、SEO 100、Best Practices 77。剩余失败来自：

- `http://127.0.0.1` 非 HTTPS；
- 本机 AdGuard 注入导致 Chrome Issues 记录。

因此不能把 BP 77 当成生产结论；上线到 HTTPS 域名后需重测。

### F14. 当前仓库目录没有 `.git` 元数据

本轮无法使用 `git diff` / `git status` 给出版本级证据，只能以文件路径、命令输出、smoke 结果和截图作为证据。正式上线前建议放入 Git 仓库并配置 CI。
