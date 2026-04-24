import { t, type UiLanguage } from "./i18n.js";

const EXACT_REASON_TRANSLATIONS: Record<string, [string, string]> = {
  "published 公开结果不能使用 visibility_class = sealed_pending_publication": [
    "published 公开结果不能使用 visibility_class = sealed_pending_publication",
    "Published public results cannot use visibility_class = sealed_pending_publication.",
  ],
  "sealed digest 已显式提供": [
    "sealed digest 已显式提供",
    "sealed digest is explicitly provided",
  ],
  "声明 public_plus_sealed 或 hidden split，但缺 sealed_audit_bundle_digest": [
    "声明 public_plus_sealed 或 hidden split，但缺 sealed_audit_bundle_digest",
    "public_plus_sealed or a hidden split was declared, but sealed_audit_bundle_digest is missing.",
  ],
  "hidden/holdout/rotating split 使用 public_plus_sealed": [
    "hidden/holdout/rotating split 使用 public_plus_sealed",
    "hidden/holdout/rotating split uses public_plus_sealed",
  ],
  "fresh/active hidden split 必须使用 evidence_channel_mode = public_plus_sealed": [
    "fresh/active hidden split 必须使用 evidence_channel_mode = public_plus_sealed",
    "fresh/active hidden splits must use evidence_channel_mode = public_plus_sealed.",
  ],
  "visibility_class 与 hidden split 健康策略兼容": [
    "visibility_class 与 hidden split 健康策略兼容",
    "visibility_class is compatible with hidden-split health policy",
  ],
  "fresh/active hidden split 只允许 public_redacted 或 public_summary": [
    "fresh/active hidden split 只允许 public_redacted 或 public_summary",
    "fresh/active hidden splits only allow public_redacted or public_summary.",
  ],
  "release_policy 与 hidden split 健康策略兼容": [
    "release_policy 与 hidden split 健康策略兼容",
    "release_policy is compatible with hidden-split health policy",
  ],
  "fresh/active hidden split 不允许 public_immediate；需 delayed 或 summary-only": [
    "fresh/active hidden split 不允许 public_immediate；需 delayed 或 summary-only",
    "fresh/active hidden splits cannot use public_immediate; they need delayed or summary-only release.",
  ],
  "public split 的 visibility_class 兼容官方 public surface": [
    "public split 的 visibility_class 兼容官方 public surface",
    "The visibility_class is compatible with the official public surface for a public split.",
  ],
  "fresh/active public split 只允许 public_full 或 public_redacted": [
    "fresh/active public split 只允许 public_full 或 public_redacted",
    "fresh/active public splits only allow public_full or public_redacted.",
  ],
  "completeness-proof 未 complete": [
    "completeness-proof 未 complete",
    "completeness-proof is not complete",
  ],
  "trust_tier 未达到 verified": [
    "trust_tier 未达到 verified",
    "trust_tier has not reached verified",
  ],
  "publication_state 未进入 published": [
    "publication_state 未进入 published",
    "publication_state has not reached published",
  ],
  "publication_state = disputed，活跃榜单已暂停": [
    "publication_state = disputed，活跃榜单已暂停",
    "publication_state = disputed; active boards are suspended.",
  ],
  "publication_state = corrected，等待修正结果重新发布": [
    "publication_state = corrected，等待修正结果重新发布",
    "publication_state = corrected; waiting for the corrected result to be republished.",
  ],
  "publication_state = invalidated，结果已失效": [
    "publication_state = invalidated，结果已失效",
    "publication_state = invalidated; the result is no longer valid.",
  ],
  "publication_state = archived，结果仅保留历史页": [
    "publication_state = archived，结果仅保留历史页",
    "publication_state = archived; the result is now historical-only.",
  ],
  "publication_state = rejected，结果未进入公开发布": [
    "publication_state = rejected，结果未进入公开发布",
    "publication_state = rejected; the result never entered public release.",
  ],
  "run-group 完整披露": [
    "run-group 完整披露",
    "run-group is fully disclosed",
  ],
  "run-group 尚未完整披露": [
    "run-group 尚未完整披露",
    "run-group is not yet fully disclosed",
  ],
  "trust_tier 仍停留在 community": [
    "trust_tier 仍停留在 community",
    "trust_tier is still stuck at community",
  ],
  "尚缺平台官方复跑或 Verified 最低 run 门槛": [
    "尚缺平台官方复跑或 Verified 最低 run 门槛",
    "Platform reruns or the minimum Verified run threshold are still missing.",
  ],
  "缺 sealed digest，无法继续推进 high-trust 审计队列": [
    "缺 sealed digest，无法继续推进 high-trust 审计队列",
    "A sealed digest is missing, so the high-trust audit queue cannot continue.",
  ],
  "autonomy_mode 已降级为 interactive": [
    "autonomy_mode 已降级为 interactive",
    "autonomy_mode has been downgraded to interactive",
  ],
  "允许公开显示 digest / metadata": [
    "允许公开显示 digest / metadata",
    "Digest / metadata may be shown publicly",
  ],
  "不暴露 sealed 原始内容": [
    "不暴露 sealed 原始内容",
    "Sealed raw content stays withheld",
  ],
  "当前为 community 层": [
    "当前为 community 层",
    "This entry is currently in the community tier",
  ],
  "等待平台队列推进": [
    "等待平台队列推进",
    "Waiting for platform queue progression",
  ],
  "补 registration/completeness 后可升级到 reproducible_standard": [
    "补 registration/completeness 后可升级到 reproducible_standard",
    "Add registration/completeness evidence to upgrade toward reproducible_standard",
  ],
};

export function localizeAdmissionReason(
  reason: string,
  lang: UiLanguage,
): string {
  const exact = EXACT_REASON_TRANSLATIONS[reason];
  if (exact) {
    return t(lang, exact[0], exact[1]);
  }

  if (reason.startsWith("当前 trust_tier = ")) {
    return t(
      lang,
      reason,
      reason.replace("当前 trust_tier = ", "current trust_tier = "),
    );
  }

  if (reason.startsWith("autonomy_mode = ")) {
    return t(lang, reason, reason);
  }

  const freshnessGateMatch = reason.match(
    /^benchmark freshness = ([^,，]+)[,，]\s*不触发最严格的 public surface gate$/,
  );
  if (freshnessGateMatch) {
    const freshnessTier = freshnessGateMatch[1];
    return t(
      lang,
      reason,
      `benchmark freshness = ${freshnessTier}; the strictest public-surface gate is not triggered`,
    );
  }

  return reason;
}

export function localizeAdmissionReasons(
  reasons: string[],
  lang: UiLanguage,
): string[] {
  return reasons.map((reason) => localizeAdmissionReason(reason, lang));
}
