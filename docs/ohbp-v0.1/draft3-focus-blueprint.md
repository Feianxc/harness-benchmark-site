# OHBP / harnessbench v0.1-draft3 Focused Convergence Patch 蓝图

> 状态：基于 round2 review 聚合，面向最后一轮 focused patch  
> 日期：2026-04-20

---

## 1. 结论先说

`draft3` 不应再是“大修版”，而应是一次 **focused convergence patch**。

本轮 patch 只做两类事：

1. **把剩余治理 P1 收口成 canonical object / field / MUST 表**
2. **把 remaining schema closure 收口到 registration / manifest / verification_record**

不再扩 scope，不再新增新愿景。

---

## 2. Patch 范围边界

### 允许修改

- `ohbp-v0.1-draft2.md` 的对象表、字段表、MUST 约束、refs
- 与残余 P1 直接相关的 canonical naming
- 与 public / sealed、autonomy、registration、manifest、verification_record 相关的 schema closure

### 不建议修改

- 大的产品叙事
- 三角色飞轮
- lane 选择
- 核心指标体系
- benchmark health 主结构

---

## 3. Focus Patch Stream F1

### 名称

**Evidence Channel + Autonomy Closure**

### 要解决的问题

1. public / sealed 双通道 canonical object 化不足
2. autonomy schema closure 不完整

### 预期产出

应在主稿中明确新增或冻结：

- `evidence_channel_mode`
- `public_bundle_digest`
- `sealed_audit_bundle_digest`
- `visibility_class`
- `release_policy`
- `redaction_policy_id`
- public / sealed artifact matrix
- `tty_freeform_input_detected`
- 零输入 sentinel 规则
- `approval_only` → `interactive` 自动降级条件

### 首选落点

- `§8 Run Data & Evidence`
- `§9 Verification Tiers 与治理`
- `§10 Ranking Policy`
- `§12 Benchmark Health`

---

## 4. Focus Patch Stream F2

### 名称

**Registration / Manifest / Verification Binding Closure**

### 要解决的问题

1. `pseudo_repeated` registration-level audit 字段未冻结
2. `requested_trust_tier` 命名回退
3. `manifest.json` 对 registration / tolerance 未完全成为唯一真源
4. `verification_record` 缺少 subject binding

### 预期产出

应在主稿中明确新增或冻结：

- `submission_window`
- `randomness_fingerprint_hint`
- `request_template_hash`
- `provider_snapshot_lock` / `provider_release_window`
- registration 对象统一使用 `requested_trust_tier`
- `manifest.registration_ref`
- `manifest.tolerance_policy_ref`
- `verification_record.subject_ref`
- `verification_record.subject_bundle_digest`

### 首选落点

- `§7 Registration / Completeness / Tolerance`
- `§8 Run Data & Evidence`
- `§9 Verification Record`

---

## 5. Draft3 的完成条件

若 `draft3` 至少满足以下条件，即可进入最终小 review：

1. round2 的 6 个 P1 在文档层面全部可对照关闭
2. `public / sealed` 不再依赖 prose 理解
3. `pseudo_repeated` 的 audit gate 可字段化检查
4. `manifest.json` 与 `verification_record` 的关键绑定关系补齐
5. 命名回退（`requested_tier`）被统一消除

---

## 6. 推荐执行顺序

1. 先 patch F2，再 patch F1
   - 因为 naming / refs / binding 是底座
2. 再整体回看 `draft2` 是否形成新冲突
3. 输出 `ohbp-v0.1-draft3.md`
4. 用极小 reviewer 团队做 stop-condition-oriented review

---

## 7. 当前主控判断

如果 draft2 是“接近定稿”，那么 draft3 的任务只有一句话：

> **把最后几个 residual P1 收口成 machine-checkable protocol objects。**
