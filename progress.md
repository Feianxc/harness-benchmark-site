# Progress Log

## Session 1 — 2026-04-20

### 已完成
- 明确用户选择 **Option A：协议草案**
- 组织一轮多 AGENT 辩论
- 收集五类角色观点：支持 / 反对 / 方法论 / 治理 / 落地
- 建立长期任务 planning files

### 当前状态
- 已完成 **第一轮模块化协议设计**
- 已汇总出 `docs/ohbp-v0.1/ohbp-v0.1-draft1.md`
- 下一步进入 **第一轮独立审核**

### 下一个动作
1. 拉起新的审核 AGENT 团队
2. 对 6 个模块与整体 draft1 分别评分
3. 产出 P0 / P1 问题清单
4. 进入第一轮修订

### 重要决策
- 不先做网站
- 协议先行
- 采用多轮：设计 → 审核 → 修订 → 再审核
- 默认主榜仅限 Verified
- 默认官方主榜视角：固定模型，只换 harness
- 不做神圣总榜，优先分切片比较与不确定性披露

### 待办提醒
- 需要统一模块划分与评分 rubric 文档
- 需要决定第一轮设计 agents 的模块分工

## Session 2 — 2026-04-20（崩溃恢复）

### 已确认恢复结果
- 已重新核验本地工作区，以下关键文件均存在：
  - `docs/ohbp-v0.1/ohbp-v0.1-draft1.md`
  - `docs/ohbp-v0.1/modules/*.md`
  - `docs/ohbp-v0.1/reviews/review-methodology.md`
  - `docs/ohbp-v0.1/reviews/review-governance-redteam.md`
  - `docs/ohbp-v0.1/reviews/review-ecosystem-product.md`
  - `docs/ohbp-v0.1/reviews/review-implementation.md`
  - `docs/ohbp-v0.1/reviews/review-scoreboard.md`
- 已确认第一轮审核结果已完整落盘，可据此恢复执行
- 已建立 `docs/ohbp-v0.1/draft1-issue-register.md`

### 子 AGENT 状态恢复结论
- 现有 5 个第一轮 reviewer 子 AGENT 均返回 **completed**
- 由于发生过 App 崩溃，后续执行以**本地落盘工件为准**
- 下一轮将按用户要求，拉起**新的修订 AGENT 团队**

### 第一轮审核结论摘要
- **P0：无**
- **P1：多项，必须进入 draft2 修订**
- 关键评分：
  - Methodology：**48/60**
  - Implementation：**45/60**
  - Overall scoreboard：**50/60**
  - Governance credibility：**6.8/10**
  - Ecosystem / adoption：**8.7/10**

### 当前状态
- **Phase 1：完成**
- **Phase 2：完成**
- **Phase 3：进行中**

### 下一步动作
1. 基于 `draft1-issue-register.md` 拉起新的修订 AGENT 团队
2. 先输出各自 repair packet，避免并发改写主文档
3. 主控整合为 `ohbp-v0.1-draft2.md`
4. 再拉起全新 reviewer 团队进行第二轮审核

## Session 3 — 2026-04-20（repair packet 收敛完成）

### 已完成
- 已拉起第二轮修订 AGENT 团队 A/B/C/D/E
- 5 个 repair packet 已全部落盘：
  - `docs/ohbp-v0.1/repair-packets/repair-a-terminology-canonical-objects.md`
  - `docs/ohbp-v0.1/repair-packets/repair-b-registration-completeness.md`
  - `docs/ohbp-v0.1/repair-packets/repair-c-bundle-cli-contract.md`
  - `docs/ohbp-v0.1/repair-packets/repair-d-governance-hardening.md`
  - `docs/ohbp-v0.1/repair-packets/repair-e-adoption-launch.md`
- 已生成主控整合提纲：
  - `docs/ohbp-v0.1/draft2-integration-blueprint.md`

### 当前状态
- repair packet 阶段：**完成**
- draft2 主控整合：**开始**

### 当前冻结的高优先级决策
1. `trust_tier` 统一为 `community / reproduced / verified`
2. `requested_trust_tier` / `trust_tier` / `publication_state` 三轴分离
3. 新增 `run-group-registration.json` + `completeness-proof.json`
4. tolerance policy 统一挂在 `Execution Contract.verification_policy`
5. final bundle layout 与 `manifest.json` runtime identity 冻结
6. 高信任 tier 采用 public/sealed 双通道证据与更硬治理要求

### 下一步动作
1. 按 `draft2-integration-blueprint.md` 顺序整合 A→B→C→D→E
2. 产出 `docs/ohbp-v0.1/ohbp-v0.1-draft2.md`
3. 再拉起全新 reviewer 团队进行第二轮审核

## Session 4 — 2026-04-20（draft2 主控整合完成）

### 已完成
- 已基于以下输入整合出第二轮主稿：
  - `docs/ohbp-v0.1/draft2-integration-blueprint.md`
  - `docs/ohbp-v0.1/repair-packets/repair-a-terminology-canonical-objects.md`
  - `docs/ohbp-v0.1/repair-packets/repair-b-registration-completeness.md`
  - `docs/ohbp-v0.1/repair-packets/repair-c-bundle-cli-contract.md`
  - `docs/ohbp-v0.1/repair-packets/repair-d-governance-hardening.md`
  - `docs/ohbp-v0.1/repair-packets/repair-e-adoption-launch.md`
- 已生成：
  - `docs/ohbp-v0.1/ohbp-v0.1-draft2.md`

### 当前状态
- `draft2`：**已落盘，待审核**
- Phase 3：**完成**
- 下一阶段：**第二轮独立审核**

### draft2 的主控整合结果摘要
1. `trust_tier` / `requested_trust_tier` / `publication_state` 已显式分离
2. `run-group-registration.json` + `completeness-proof.json` 已进入协议主文
3. `tolerance_policy` 已固定挂到 `Execution Contract.verification_policy`
4. final bundle canonical layout 与 `manifest.json` single source of truth 已进入主文
5. public bundle / sealed audit bundle、interaction telemetry、state isolation 已进入主文
6. `submission profile`、三角色飞轮、`scorecard_view` / `research_view` 已进入主文

### 下一步动作
1. 拉起一组**全新 reviewer 团队**
2. 对 `docs/ohbp-v0.1/ohbp-v0.1-draft2.md` 做第二轮评分
3. 生成新的 review files 与 scoreboard

## Session 5 — 2026-04-20（第二轮审核完成）

### 已完成
- 第二轮 reviewer 团队已全部完成并落盘：
  - `docs/ohbp-v0.1/reviews-round2/review-draft2-methodology.md`
  - `docs/ohbp-v0.1/reviews-round2/review-draft2-governance-redteam.md`
  - `docs/ohbp-v0.1/reviews-round2/review-draft2-ecosystem-product.md`
  - `docs/ohbp-v0.1/reviews-round2/review-draft2-implementation.md`
  - `docs/ohbp-v0.1/reviews-round2/review-draft2-scoreboard.md`
- 已生成第二轮问题台账：
  - `docs/ohbp-v0.1/draft2-round2-issue-register.md`
- 已生成 focused patch 蓝图：
  - `docs/ohbp-v0.1/draft3-focus-blueprint.md`

### 第二轮审核共识
- **P0：无**
- **stop condition：未达到**
- **总评：接近定稿，但不能直接冻结为正式 v0.1**

### 聚合后的残余 P1
1. public / sealed 双通道证据模型未完全 canonical object 化
2. autonomy schema 尚未完全闭口
3. `pseudo_repeated` 缺 registration-level audit 字段闭环
4. `requested_trust_tier` 在 registration 对象中命名回退
5. `manifest.json` 对 registration / tolerance 尚未完全成为唯一真源
6. `verification_record` 缺少被裁决对象的 canonical binding

### 当前状态
- draft2：**接近定稿**
- round2 review：**完成**
- 下一阶段：**draft3 focused convergence patch**

### 下一步动作
1. 按 `draft3-focus-blueprint.md` 只修 F1 / F2 两组问题
2. 生成 `ohbp-v0.1-draft3.md`
3. 再做一轮极小 reviewer 团队的 stop-condition-oriented review


## Session 6 — 2026-04-20（draft3 focused convergence patch 完成）

### 已完成
- 已拉起 focused patch worker F1 / F2，并分别落盘：
  - `docs/ohbp-v0.1/focus-packets/f1-evidence-autonomy-closure.md`
  - `docs/ohbp-v0.1/focus-packets/f2-registration-manifest-verification-closure.md`
- 已主控整合生成：
  - `docs/ohbp-v0.1/ohbp-v0.1-draft3.md`

### draft3 的关键收口
1. `public / sealed` 已收口为 `evidence_channel` object 与 artifact matrix
2. `autonomy_mode` 已改为 interaction telemetry 驱动的机审判定，并冻结 `ZERO_INPUT_V1` / 自动降级规则
3. `pseudo_repeated` 已补齐 registration-level 审计字段
4. `manifest.json` 已补齐 registration / tolerance / evidence 的 canonical join surface
5. `verification_record` 已补齐 `subject_ref` + `subject_bundle_digest`
6. `attempted_or_terminal_tasks`、`network_proxy_log_digest`、`tty_freeform_input_detected` 等 round2 的边角 P2 也已顺手补齐一部分

### 当前状态
- `draft3`：**已落盘，待最终小范围 review**
- residual P1：**文档层面已尝试全部关闭，待 reviewer 验证**

### 下一步动作
1. 拉起极小 reviewer 团队（方法论 / 治理 / 实现 / 总评）
2. 判断 residual P1 是否清零
3. 若仍有 P1，继续小步 patch；若无 P1，再评估是否还存在阻断冻结的 P2


## Session 7 — 2026-04-20（draft4 冻结成功）

### 已完成
- 已基于 round3 residual P2 做 3 处 micro-hardening，生成：
  - `docs/ohbp-v0.1/ohbp-v0.1-draft4.md`
- 已新增 round4 复核文件：
  - `docs/ohbp-v0.1/reviews-round4/review-draft4-governance-redteam.md`
  - `docs/ohbp-v0.1/reviews-round4/review-draft4-scoreboard.md`
- 已冻结正式协议文件：
  - `docs/ohbp-v0.1/ohbp-v0.1.md`

### round4 结果
- 总评：`60 / 60`
- `P0 / P1 / P2 / P3 = 0 / 0 / 0 / 0`
- `task_plan.md` 定义的 stop condition：**已达成**
- 状态：**可冻结为正式 v0.1**

### draft4 相比 draft3 的最后收口
1. `reports/trace-integrity.json` 增加 `per_event_hash_chain / attested_trace_contract_ref` 二选一强约束
2. `sealed_audit_bundle_digest` 的重算算法写成与 public bundle 对称的显式规则
3. `verification_record.*` 与 `manifest.evidence.*` 的一致性规则被明文化

## Session 8 — 2026-04-21（实现阶段崩溃恢复与 Round 2 接管）

### 已确认
- 已重新读取：
  - `task_plan.md`
  - `findings.md`
  - `progress.md`
  - `docs/implementation/build-blueprint.md`
- 已恢复上一轮 3 个实现 agent 的状态：
  - I1（schema/core）：shared contracts / canonical paths / fixtures real checksum 方向已落盘
  - I2（validator/cli）：只完成了 partial patch，尚未收口
  - I3（platform/web）：Round 2 patch 已落盘
- 已再次实测当前仓库：`npm run build` **失败**

### 当前 build 失败面
1. `packages/canonical` / `packages/types` 残留 `.ts` extension import，触发 `TS5097`
2. `packages/validator-core/src/context.ts` 仍按旧 manifest 字段读取：
   - `files`
   - `schema_version`
   - `task_package_ref`
   - `execution_contract_ref`
3. `packages/fixtures/src/cases.ts` 存在 `TaskResultEntry[]` / `Manifest` → `JsonLike` 类型不收口

### 已启动的新一轮执行
- 已向 I1 继续派发：
  - 修复 canonical/types/fixtures compile blockers
- 已向 I2 继续派发：
  - 修复 validator-core/context 与 shared manifest 对齐
  - 收口 CLI/validator Round 2 P0/P1
- 已新增 1 个只读 explorer（Lovelace）做 integration audit：
  - 对齐 CLI pack shape / shared contracts / validator assumptions

### 当前状态
- Phase 5：**继续进行中**
- 当前关键目标：**先恢复 build/test 绿色，再做 smoke 和 reviewer round**

## Session 9 — 2026-04-21（build/test 恢复 + 端到端 smoke 跑通）

### 已完成
- 已修复：
  - `validator-core` 读取旧 manifest 字段导致的 shared contract 漂移
  - `task-results.ndjson` 非法 NDJSON 与缺 `protocol_version`
  - `@ohbp/canonical` / `@ohbp/types` 的 Node ESM runtime 解析问题
  - CLI runtime 对 workspace package source export 的直接执行失败
- 已验证通过：
  - `npm run build`
  - `npm run test`

### CLI smoke（真实 node 运行）
工作目录：
- `E:/工作区/10_Projects_项目/harness测评网站/.workspace/smoke/cli_runtime`

已成功执行：
1. `node apps/hb-cli/dist/cli.js doctor`
2. `node apps/hb-cli/dist/cli.js init --profile verified_full --attempts 5 --tasks 8 --sealed`
3. `node apps/hb-cli/dist/cli.js run --attempt attempt-001`
4. `node apps/hb-cli/dist/cli.js pack --attempt attempt-001`
5. `node apps/hb-cli/dist/cli.js validate`
6. `node apps/hb-cli/dist/cli.js inspect`
7. `node apps/hb-cli/dist/cli.js upload --dry-run`

关键结果：
- `validate` = `PASS`
- findings = `0`
- `public_bundle_digest` 已稳定生成
- dry-run upload request 已成功落盘

### 实际 upload / verifier pipeline
- 已启动 mock-intake（4010）
- 已执行：
  - `node apps/hb-cli/dist/cli.js upload --endpoint http://127.0.0.1:4010`
- 已生成真实 receipt：
  - `E:/工作区/10_Projects_项目/harness测评网站/.workspace/smoke/cli_runtime/.hb/uploads/bundle-attempt-001.upload-receipt.json`
- 已运行 verifier pipeline（不注入 demo seed）：
  - 结果：`publications=1 boards=3 entries=1`
  - `hasUploadedSubmission = true`

### Web smoke
- 已启动 web（3000）
- 已确认：
  - `/api/boards`
  - `/api/boards/official-verified/slices`
  - `/api/protocol/index`
  - `/api/validator`
  可正常返回
- 当前真实 uploaded submission 已进入：
  - `Community Lab`
- `Official Verified Board` 仍为空，符合当前 policy gate

### 当前状态
- build：**green**
- test：**green**
- CLI 主链：**green**
- mock-intake：**green**
- verifier pipeline：**green**
- web MVP：**可演示**
- 下一步：**fresh reviewer team 复核剩余 P0/P1**

## Session 9 — 2026-04-21（reviewer 复核后进入 P1 修复）

### Reviewer 结论摘要
- Franklin（protocol/schema integration）结论：**无 P0，有 P1**
  - `packages/verifier-core/src/types.ts` 维护了 shared contract 第二真源
  - `VerificationRecord` / `CompletenessProof` 与 `@ohbp/types` 漂移
  - `packages/validator-core/tsconfig.json` 仍通过 `src/external-packages.d.ts` 走影子 contract
- Ramanujan（CLI/validator/intake）结论：**无 P0，有 P1**
  - manifest 没进入真正可验证绑定面
  - upload/intake 会重生成 `study_id/run_group_id/attempt_id/bundle_id`
  - 多-attempt run-group 被错误固化为 `observed_attempt_total = 1`
- Nietzsche（web/product/security）结论：**无 P0，有 P1**
  - Frontier / Community 分层串层
  - `/api/validator` 对 malformed JSON 不鲁棒
  - 当前 direct-run 数据面容易变成 official/frontier 空榜，影响产品演示

### 当前主控判断
- handoff 里“主链已跑通”的判断仍成立，但**还不能 freeze**
- 当前阶段目标已经从“补功能”切换为：
  1. 修 contract 真源 / identity / manifest binding
  2. 修 board layering / web validator robustness / demo surface
  3. 再做 build + 定向 test + smoke 回归

### 新一轮执行团队
- Worker A（verifier/web P1 修复）：`019dac0f-3920-7f33-bae3-ffb6ef5d17de`
- Worker B（CLI/validator/intake P1 修复）：`019dac0f-39f8-7293-8a5e-13e11de8e14a`

### 运行环境补充
- 本机存在**大量残留 Node 进程**（`Get-Process node` 显示约 240 个），说明后续 `vitest` 复验需谨慎
- 当前先避免高风险全量清理动作，优先：
  - 限定测试范围
  - 限制 worker 数
  - 在必要时再做最小范围进程处置

### 当前状态
- 协议收敛阶段：**完成**
- 当前正式冻结基线：`docs/ohbp-v0.1/ohbp-v0.1.md`
- 下一阶段：**schema / CLI / validator / verifier / 平台 PRD**

## Session 8 — 2026-04-21（实现阶段 kickoff）

### 已完成
- 已核验当前工作区仅有文档与 planning files，代码仓尚未初始化
- 已确认并回读以下 implementation 设计文档：
  - `docs/implementation/schema-validator-architecture.md`
  - `docs/implementation/cli-validator-architecture.md`
  - `docs/implementation/web-prd-mvp.md`
  - `docs/implementation/architecture-review.md`
- 已新增统一实施蓝图：
  - `docs/implementation/build-blueprint.md`
- 已初始化 monorepo 根骨架：
  - `package.json`
  - `tsconfig.base.json`
  - `.gitignore`
  - `README.md`
  - `apps/*`
  - `packages/*`
  - `registry/sample/*`
  - `tooling/scripts`

### 子 AGENT 状态
- 旧设计/评审 AGENT 已全部关闭，避免线程占满与上下文污染
- 新一轮实现 worker 已拉起：
  - Worker I1（schema/core）：`019dabac-46d4-7923-bb60-4a870628faff`
  - Worker I2（validator/cli）：`019dabac-483d-7e42-ba26-ccf9e6dc5cd2`
  - Worker I3（platform/web）：`019dabac-aa82-7001-88c9-affd8374b4f9`

### 当前冻结的实现级决策
1. monorepo 包名统一为：
   - `@ohbp/schema`
   - `@ohbp/canonical`
   - `@ohbp/types`
   - `@ohbp/validator-core`
   - `@ohbp/validator-rules`
   - `@ohbp/verifier-core`
   - `@ohbp/fixtures`
   - `@ohbp/view-models`
2. `manifest.json` 继续是 bundle 侧唯一 join surface
3. `verification_record` 继续是平台裁决真源
4. `pack` 是 raw workspace → final bundle 的唯一 canonicalization 边界
5. 实施顺序固定为：
   - schema/canonical/fixtures
   - validator
   - CLI core
   - mock intake/verifier
   - web MVP

### 下一步动作
1. 等待 I1 / I2 / I3 第一轮实现返回
2. 主控做 cross-package integration
3. 拉起第一轮 review team
4. 修正后跑全链路 smoke

## Session 10 — 2026-04-21（再次崩溃恢复 + source-level 回归）

### 已确认
- 本地 planning files 仍完整，`progress.md` / `findings.md` / `task_plan.md` 可作为恢复基线
- 这次崩溃前临时拉起的 3 个 reviewer 子代理在恢复后 `wait_agent` 均返回 **`not_found`**
  - 说明这轮恢复应继续坚持 **“以本地落盘工件与源码实测为准，不依赖临时 agent 记忆”**
- 已重新拉起新一轮只读 reviewer：
  - Einstein（verifier / boards）
  - Confucius（CLI / validator / intake）
  - Euler（web / PRD）
  - 当前仍在等待其摘要返回，主控先继续本地验证与修复

### 本轮新增本地验证（绕开易崩的 vitest / 全量 tsc）
- 由于当前宿主环境存在严重 Node / esbuild / tsc OOM 问题，本轮不把全量 `vitest` / `tsc` 作为首要证据
- 改用 **`node --import tsx -` 的 source-level 一次性脚本** 直接执行当前源码，已得到以下有效证据：

#### 1. verifier demo pipeline 当前源码行为正常
- 直接调用：
  - `seedDemoSubmissionStore(...)`
  - `runVerificationPipeline(...)`
- 实测结果：
  - `publications = 7`
  - Official Board `entries = 3`
  - Frontier `entries = 2`
  - Community `entries = 1`
  - `protocol_version` 在 completeness / verification 两侧均为 `0.1`
  - Frontier eligible 样本不会再混入 Community

#### 2. web 当前源码行为正常
- 直接启动 `apps/web/src/server.ts` 的源码 server 后实测：
  - `GET /api/boards` 返回 200
  - 通过 fallback 可得到：
    - Official `3`
    - Frontier `2`
    - Community `1`
  - `POST /api/validator` 输入 malformed JSON 时返回：
    - `400`
    - `error = "invalid_json"`
    - `status = "fail"`

### 本轮发现并修复的剩余真实问题
- 在 source-level smoke 中发现：
  - `apps/verifier-worker/src/pipeline.ts` 会把 API 上传样本的 `observed_attempt_total`
    **错误压缩为 intake store 中该 run-group 的上传条数**
  - 这会把 payload 中已正确统计出的 `5` 覆写成 `1`，从而把本应 `complete` 的 run-group 错误降为 `incomplete`

### 已完成修复
- 已修改：
  - `apps/verifier-worker/src/pipeline.ts`
- 修复策略：
  - 对 `source === "api"`，不再用 store 计数强行覆盖 payload
  - 改为：
    - `observed_attempt_total = max(payload.observed_attempt_total, distinct_uploaded_attempts_in_store)`
  - 这样既能保留 CLI 已正确统计的 observed attempts，也能在 payload 偏小/历史样本不足时利用 store 做下限补偿

### 已补回归测试
- 已新增测试：
  - `apps/verifier-worker/src/pipeline.test.ts`
- 新增断言：
  - API submission 的 `observed_attempt_total` 不得低于上传 payload 中的值
  - 在 `declared_attempt_total = observed_attempt_total = 5` 时：
    - `completeness_verdict = "complete"`

### 修复后的 source-level 端到端验证
- 直接调用当前源码函数链：
  - `initWorkspace(...)`
  - `runWorkspace(...)`
  - `packWorkspace(...)`
  - `validateBundle(...)`
  - `inspectBundle(...)`
  - `uploadBundle(..., dryRun: true)`
  - `persistUpload(...)`
  - `runVerificationPipeline(...)`
- 关键结果：
  - `validationVerdict = pass`
  - `validationFindings = 0`
  - upload 后身份保持一致：
    - `study_id`
    - `run_group_id`
    - `attempt_id`
    - `bundle_id`
    均与 manifest `run_identity` 对齐
  - `observed_attempt_total = 5`
  - `declared_attempt_total = 5`
  - `completeness_verdict = complete`
  - `trust_tier = verified`
  - completeness / verification `protocol_version` 均正确

#### manifest binding 额外复验
- 直接对打包后的 `manifest.json.created_at` 做篡改后再次 `validateBundle(...)`
- 实测结果：
  - `overall_verdict = fail`
  - 命中 finding：
    - `integrity.bundle-digest-from-checksums:checksum:manifest.json`
  - 说明 manifest binding 已进入真实可验证绑定面

### 当前状态
- **源码级 CLI / validator / intake / verifier / web 主链均已再次跑通**
- 当前已知剩余风险主要来自：
  - 宿主机 Node / esbuild / tsc 内存环境不稳定
  - 新一轮 reviewer agents 尚未全部返回

### 下一步动作
1. 等 Einstein / Confucius / Euler 返回只读复审结论
2. 若无新增 P1，则更新 findings / plan 并准备汇总“v0.1 实现成功 + 当前证据链”
3. 若 reviewer 仍指出 P1，则继续按最小 patch + source-level smoke 的方式收口

### 本轮 reviewer 返回后的继续修复
- 已收到：
  - Confucius：CLI / validator / intake 线 **无新增 P0/P1**
  - Euler：web 线指出剩余问题：
    1. demo fallback 静默注入
    2. board 页面未按 PRD 分化
    3. 运行态与 verifier-worker 落盘快照存在认知分叉
  - Einstein：view-model / slice 层指出：
    1. slice 至少应绑定 `tolerance_policy_digest`
    2. Community 不应默认裁成单 slice

### 已完成的 web / view-model 收口
- 已修改：
  - `packages/view-models/src/types.ts`
  - `packages/view-models/src/boards.ts`
  - `apps/web/src/data.ts`
  - `apps/web/src/render.ts`

#### 1. demo fallback 不再静默
- 新增 `data_provenance` 视图字段
- Home / Board / Entry 页面现在都会显式显示：
  - `Demo fallback active`
  - 或 `Synthetic demo entry`
- 说明当前运行态是否混入 synthetic demo entries

#### 2. board 页面已按 PRD 方向分化
- Official：
  - 增加 `Uncertainty & confidence strip`
  - 增加 `Compare drawer starter`
- Frontier：
  - 增加 `Near-Verified candidates / missing evidence reasons`
  - 默认展示 all frontier slices 的 queue 视图
- Community：
  - 增加 `Community feed`
  - 默认展示 all community slices，不再默认裁成单 slice

#### 3. slice contract 做了最小且不破坏比较目标的收口
- `sliceKey` 已纳入：
  - `tolerance_policy_digest`
- 最终**没有**把 `execution_contract_digest` 纳入 `sliceKey`
  - 原因：会把 `fixed_model_compare_harness` 切成每条 harness 各自单-entry slice，破坏比较目标
- 当前实现取的是：
  - 先避免不同 tolerance policy 混 slice
  - 同时保留同一固定模型下的 harness 可比较性

### 修复后的 web source-level 复验
- 直接启动当前源码 server 后实测：
  - `/api/boards` 返回：
    - Official `3 / ranked_ordinal`
    - Frontier `2 / comparison_only`
    - Community `3 / ranked_tiered`
  - 所有 board JSON 都带：
    - `data_provenance.mode = runtime_public_plus_demo_fallback`
  - `/boards/official-verified` 页面包含：
    - `Demo fallback active`
    - `Compare drawer starter`
  - `/boards/reproducibility-frontier` 页面包含：
    - `Near-Verified candidates / missing evidence reasons`
  - `/boards/community-lab` 页面包含：
    - `Community feed`
  - `/entries/entry_a11b70cbf189?view=research` 页面包含：
    - `Synthetic demo entry`
  - `/api/validator` 非法 JSON 仍返回：
    - `400`
    - `error = invalid_json`

### 最终 reviewer 收尾状态
- 额外补拉的 final reviewer：
  - Archimedes
  - Rawls
- 在时限内未返回摘要，随后已主动 shutdown，避免继续占用线程
- 当前最终结论以：
  - 已返回 reviewer 结论
  - 本地 source-level smoke
  - planning files 落盘记录
  为准

### 最终 consolidated source-level smoke（当前源码）
- 已再次串起：
  - `initWorkspace -> runWorkspace -> packWorkspace -> validateBundle -> uploadBundle(dry-run) -> persistUpload -> runVerificationPipeline`
  - `createWebServer -> /api/boards -> /api/validator -> board pages`
- 最终结果：
  - CLI / validator / intake / verifier：
    - `validationVerdict = pass`
    - `validationFindings = 0`
    - upload identity 四元组全部保持一致
    - `observed_attempt_total = 5`
    - `declared_attempt_total = 5`
    - `completeness_verdict = complete`
    - `trust_tier = verified`
  - web：
    - Official `3 / ranked_ordinal`
    - Frontier `2 / comparison_only`
    - Community `3 / ranked_tiered`
    - 三层均显式带 `runtime_public_plus_demo_fallback`
    - validator 非法 JSON 仍正确返回 `400 / invalid_json`

## Session 11 — 2026-04-21（expert team 复审 + upload/intake 真源收口）

### expert reviewer 团队返回摘要
- Franklin（protocol / ranking）：
  - 指出 evidence 真源、slice 语义、rank state 仍有 P1
- Chandrasekhar（CLI / validator / integrity）：
  - 指出当前最大短板在 `upload -> intake -> verifier`
  - 本地 validator 有效，但此前还没有变成唯一真源
- Laplace（web / UX / PRD）：
  - 指出 web 已能演示协议叙事，但 demo fallback / protocol browser / validator playground 仍有增强空间
- Jason（runtime / release）：
  - 指出更大的风险是宿主环境脏状态，而不是最小演示代码本身

### 本轮新增修复
- 已修改：
  - `packages/verifier-core/src/types.ts`
  - `apps/mock-intake/package.json`
  - `apps/mock-intake/src/store.ts`
  - `apps/verifier-worker/src/pipeline.ts`
  - `apps/hb-cli/src/commands.ts`
  - `apps/hb-cli/src/workflow.test.ts`

### 关键收口
1. **CLI upload 变成闸门而非提示**
   - `uploadBundle()` 每次 upload 前都会重新跑 `validateBundle()`
   - 不再复用旧 validation report
   - 若 `overall_verdict = fail`，直接本地拒绝 upload

2. **mock-intake 变成服务端 intake gate**
   - 若存在 `bundle_path`，服务端会：
     - `loadValidationContext(..., validationMode = platform_intake)`
     - `runValidation(createDefaultRulePack())`
   - fail bundle 直接拒收
   - pass/warn bundle 才会继续入库

3. **关键事实改由服务端 bundle truth 回写**
   - 服务端会用 bundle manifest / recomputed digest 覆盖以下关键字段：
     - `study_id`
     - `run_group_id`
     - `attempt_id`
     - `bundle_id`
     - `public_bundle_digest`
     - `task_package_digest`
     - `execution_contract_digest`
     - `tolerance_policy_digest`
     - `registration_digest`

4. **stored submission 新增 validation_summary**
   - 用于记录：
     - `overall_verdict`
     - `finding_count`
     - `bundle_digest`
     - `validated_at`

5. **verifier-worker 不再消费显式 fail 记录**
   - `buildPublicationRecords()` 会过滤：
     - `validation_summary.overall_verdict = fail`

### 本轮 source-level 回归结果
- 合格 bundle：
  - 入库成功
  - record 带 `validation_summary.overall_verdict = pass`
  - `public_bundle_digest` 与服务端验证结果一致
- 篡改 manifest 后：
  - CLI upload：
    - 正确报错并中断
  - mock-intake persist：
    - 正确拒收

### 当前状态
- 当前主链已经从：
  - `本地可验证`
  收口到：
  - `本地可验证 + upload/intake 服务端可拒收 fail bundle`

## Session 12 — 2026-04-21（intake 真源再加固 + slice 语义 fail-closed + 运行演示）

### 本轮 expert reviewer 追加发现
- Hume（CLI / intake / integrity）指出：
  - `source=api` 无 bundle 仍可 payload-only 入库，是 P0
  - 带 bundle 时，`model / harness / metrics / telemetry / submission_id / entry_id / submitted_at` 仍可被客户端 payload 污染
  - `run_group_id` 聚合键过弱，存在串组风险
- Schrodinger（protocol / ranking）指出：
  - `execution_contract_digest` 未进入 slice identity，导致 mixed-slice 排名
  - Frontier / Community 默认 all-slices 聚合会污染 canonical `board_state`
  - Official `ranked_ordinal` 仍未 fail-closed 到 separation evidence

### 本轮新增修复
- 已修改：
  - `apps/mock-intake/src/store.ts`
  - `apps/mock-intake/package.json`
  - `apps/mock-intake/src/store.test.ts`
  - `apps/verifier-worker/src/pipeline.ts`
  - `apps/verifier-worker/src/pipeline.test.ts`
  - `packages/view-models/src/types.ts`
  - `packages/view-models/src/boards.ts`
  - `apps/web/src/render.ts`
  - `apps/web/src/data.ts`
  - `packages/view-models/src/entries.ts`
  - `packages/view-models/src/protocol.ts`
  - `packages/view-models/src/validator-preview.ts`
  - `apps/web/src/fixtures.ts`
  - `apps/web/src/server.ts`

### 关键收口
1. **payload-only API upload 被正式拒绝**
   - `mock-intake` 现在要求：
     - `source = api` 时必须提供 `bundle_path`
   - 实测：
     - `POST /api/uploads` payload-only 返回 `400`

2. **服务端 intake 改为尽量从 bundle 全量重建 truth**
   - 现在会用 bundle context 重建/覆盖：
     - `submission_id`
     - `entry_id`
     - `study_id / run_group_id / attempt_id / bundle_id`
     - `submission_profile`
     - `model / harness`
     - `metrics`
     - `telemetry`
     - `benchmark_tuned_flag`
     - `declared_attempt_total`
     - `evidence/release/visibility`
     - `submitted_at`（服务端接收时间）

3. **verifier-worker run-group 聚合键已加强**
   - 不再只按 `run_group_id`
   - 现在至少同时看：
     - `study_id`
     - `run_group_id`
     - `registration_digest`
     - `execution_contract_digest`
     - `task_package_digest`
     - `tolerance_policy_digest`

4. **slice identity 收紧为 protocol-first**
   - `execution_contract_digest` 已进入 `sliceKey`
   - slice summary / page metadata 已显式展示：
     - `execution_contract_digest`
     - `tolerance_policy_digest`
   - slice label 追加短 digest 后缀，避免“看起来一样、实际上不同”

5. **board state 改为 fail-closed**
   - 在显式 separation evidence 未落地前：
     - Official 不再直接给 `ranked_ordinal`
   - Frontier / Community 不再默认以 all-slices 聚合态冒充 canonical slice state

### 本轮新增测试与验证
- `npm run build`：**通过**
- `npm run test`：**通过**
  - `@ohbp/hb-cli`：7/7
  - `@ohbp/mock-intake`：2/2（新增 intake 真源测试）
  - `@ohbp/verifier-worker`：3/3
- HTTP smoke：
  - `GET http://127.0.0.1:3100/api/boards`
  - `GET http://127.0.0.1:3100/api/protocol?q=trust_tier`
  - `GET http://127.0.0.1:3100/api/entries/entry_a11b70cbf189`
  - `POST http://127.0.0.1:4110/api/uploads` payload-only → `400`
  - `POST http://127.0.0.1:3100/api/validator` invalid JSON → `400 / invalid_json`
- 截图已更新：
  - `E:/codex_media/ohbp-home-v3.png`
  - `E:/codex_media/ohbp-official-v3.png`
  - `E:/codex_media/ohbp-protocol-v3.png`
  - `E:/codex_media/ohbp-validator-v3.png`
  - `E:/codex_media/ohbp-entry-research-v3.png`

### 当前运行态
- Web：`http://127.0.0.1:3100`
- mock-intake：`http://127.0.0.1:4110`
- 当前 worker demo 数据：
  - `publications = 8`
  - board 默认页因严格 slice 化，当前三层均为 `insufficient_evidence`
  - 这是 fail-closed 结果，不再把 mixed-slice 聚合伪装成权威排名

## Session 13 — 2026-04-24（public beta 上线计划 + launch shell + 前端去 AI 味第一轮）

### 本轮目标
- 全面检查项目距离上线的缺口。
- 产出可执行上线计划表。
- 直接执行低风险上线准备项。
- 前端继续去 AI 味，重点收紧文字和移动端排版。

### 新增/修改文件
- `.impeccable.md`
- `docs/上线计划/01-上线差距与执行计划.md`
- `docs/上线计划/02-public-beta-单人运营检查清单.md`
- `apps/web/src/server.ts`
- `apps/web/src/render.ts`
- `apps/web/src/server.test.ts`
- `packages/view-models/src/consumer-leaderboards.ts`

### 关键实现
1. **Web launch shell**
   - 新增 `/healthz`。
   - 新增 `/robots.txt`。
   - 新增 `/sitemap.xml`。
   - HTML / JSON / text 响应统一带基础安全头。
   - JSON 响应 `cache-control: no-store`。
   - robots sitemap 改为绝对 URL，并支持 `PUBLIC_SITE_URL`。

2. **安全响应头**
   - `content-security-policy`：`default-src 'self'`、`script-src 'self'`、`style-src 'self' 'unsafe-inline'`、`img-src 'self' data:`、`object-src 'none'`、`form-action 'self'`、`frame-ancestors 'none'`、`base-uri 'none'`。
   - `x-content-type-options: nosniff`。
   - `referrer-policy: strict-origin-when-cross-origin`。
   - `permissions-policy` 禁用 camera / microphone / geolocation / payment。

3. **前端去 AI 味第一轮**
   - 改为 light-first、editorial benchmark 方向。
   - 减少渐变、重阴影和卡片装饰条。
   - 移动端顶栏从三段大块压缩成更紧凑的两行布局。
   - hero tile 降低彩色填充与圆角，减少泛 SaaS 卡片味。
   - Consumer/Validator 文案更短，强调 selection guide / evidence boundary。

4. **单人运营上线资料**
   - 新增 public beta 检查清单，覆盖上线前 30 分钟检查、环境变量、数据发布规则、低成本复核策略、人工判断和回滚办法。

### 验证结果
- `npm run build --workspace @ohbp/web`：通过。
- `npm run test --workspace @ohbp/web`：通过，19 tests passed。
- `npm run build`：通过。
- `npm run test`：通过，51 tests passed。
- `npm run lint`：通过；当前为 workspaces `--if-present` 空壳。
- Web smoke：关键页面/API 均返回 200。
- Lighthouse mobile：Accessibility 100 / SEO 100 / Best Practices 77；BP 剩余项来自本地 HTTP 与 AdGuard 注入，需生产 HTTPS 复测。
- 移动端截图：`E:/codex_media/harness_launch_home_zh_mobile_after_3003.png`。

### 当前未完成
- 生产部署平台未确定，尚未补 Dockerfile / 平台部署指南。
- Git/CI 未配置；当前目录没有 `.git` 元数据。
- Terms / Privacy / submission terms 仍未补。
- 真实 verified 初始数据集仍需运营准备。
- 生产 HTTPS 域名下 Lighthouse 与最终 smoke 待执行。
