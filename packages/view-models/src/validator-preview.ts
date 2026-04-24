import { previewNormalizedPayload, type MockSubmissionPayload } from "@ohbp/verifier-core";
import { DEFAULT_UI_LANGUAGE, t, type UiLanguage } from "./i18n.js";
import type { ValidatorIssueView, ValidatorMode, ValidatorRunView } from "./types.js";

function issue(
  code: string,
  severity: ValidatorIssueView["severity"],
  path: string,
  message: string,
  suggestion: string,
): ValidatorIssueView {
  return { code, severity, path, message, suggestion };
}

function pushIfMissing(
  issues: ValidatorIssueView[],
  value: unknown,
  path: string,
  lang: UiLanguage,
  code = "missing_required_field",
): void {
  if (value === undefined || value === null || value === "") {
    issues.push(
      issue(
        code,
        "error",
        path,
        t(
          lang,
          `${path} 缺失，当前 payload 无法形成稳定 public projection。`,
          `${path} is missing, so the current payload cannot form a stable public projection.`,
        ),
        t(
          lang,
          `补齐 ${path} 后再提交 validator / mock intake。`,
          `Fill ${path} before submitting to validator / mock intake.`,
        ),
      ),
    );
  }
}

export function buildValidatorRunView(
  payloadText: string,
  lang: UiLanguage = DEFAULT_UI_LANGUAGE,
): ValidatorRunView {
  return buildValidatorRunViewWithMode(payloadText, "admission_readiness", lang);
}

function issueCategory(code: string): string {
  if (code === "schema_error" || code === "missing_required_field") {
    return "schema";
  }

  if (
    code === "invalid_digest_binding" ||
    code === "registration_manifest_mismatch"
  ) {
    return "integrity";
  }

  return "admission";
}

function summarizeMode(
  mode: ValidatorMode,
  status: ValidatorRunView["status"],
  lang: UiLanguage,
): string {
  if (mode === "schema_only") {
    return status === "pass"
      ? t(
          lang,
          "Schema-only 检查通过；字段形状已可进入更深入的 bundle / admission 校验。",
          "Schema-only checks passed; the payload shape is ready for deeper bundle / admission validation.",
        )
      : t(
          lang,
          "Schema-only 检查未通过；先修正 JSON 与必填字段。",
          "Schema-only checks failed; fix the JSON and required fields first.",
        );
  }

  if (mode === "bundle_integrity") {
    return status === "pass"
      ? t(
          lang,
          "Bundle integrity 预检查通过；digest / binding 面未发现明显缺口。",
          "Bundle-integrity precheck passed; no obvious digest / binding gaps were found.",
        )
      : t(
          lang,
          "Bundle integrity 预检查发现 binding / digest 风险。",
          "Bundle-integrity precheck found binding / digest risk.",
        );
  }

  return status === "pass"
    ? t(
        lang,
        "Admission readiness 通过；下一步可以进入 mock intake / verifier-worker。",
        "Admission readiness passed; the next step can be mock intake / verifier-worker.",
      )
    : status === "warn"
      ? t(
          lang,
          "结构可解析，但仍有 admission 风险或升级缺口。",
          "The structure is parseable, but admission risk or promotion gaps remain.",
        )
      : t(
          lang,
          "当前 payload 还不能形成稳定 public projection。",
          "The current payload cannot yet form a stable public projection.",
        );
}

function nextStepsForMode(
  mode: ValidatorMode,
  status: ValidatorRunView["status"],
  lang: UiLanguage,
): string[] {
  if (mode === "schema_only") {
    return status === "pass"
      ? [
          t(
            lang,
            "切到 Bundle integrity 模式检查 digest / manifest binding。",
            "Switch to Bundle integrity mode to check digest / manifest binding.",
          ),
          t(
            lang,
            "再切到 Admission readiness 查看升级缺口。",
            "Then switch to Admission readiness to inspect promotion gaps.",
          ),
        ]
      : [
          t(lang, "先修正 JSON 语法与缺失字段。", "Fix JSON syntax and missing fields first."),
          t(
            lang,
            "通过后再进入 bundle / admission 检查。",
            "Once it passes, continue to bundle / admission checks.",
          ),
        ];
  }

  if (mode === "bundle_integrity") {
    return status === "pass"
      ? [
          t(
            lang,
            "切到 Admission readiness 模式确认 tier / release / visibility 是否可上榜。",
            "Switch to Admission readiness mode to confirm whether tier / release / visibility can qualify for boards.",
          ),
          t(
            lang,
            "如需正式提交，再走 CLI validate + upload。",
            "If you want a formal submission, proceed with CLI validate + upload next.",
          ),
        ]
      : [
          t(
            lang,
            "优先修正 registration / digest / manifest binding。",
            "Prioritize fixing registration / digest / manifest binding.",
          ),
          t(
            lang,
            "确认 public_bundle_digest 与 registration_digest 已稳定生成。",
            "Confirm that public_bundle_digest and registration_digest are generated deterministically.",
          ),
        ];
  }

  return status === "pass"
    ? [
        t(lang, "POST /api/uploads 到 mock intake", "POST /api/uploads to mock intake"),
        t(
          lang,
          "运行 verifier-worker 生成 board / entry 数据",
          "Run verifier-worker to generate board / entry data",
        ),
      ]
    : [
        t(lang, "先修正 error", "Resolve the errors first"),
        t(
          lang,
          "再看 warning 对应的 promotion / publication gap",
          "Then inspect the promotion / publication gaps behind the warnings",
        ),
      ];
}

export function buildValidatorRunViewWithMode(
  payloadText: string,
  mode: ValidatorMode,
  lang: UiLanguage = DEFAULT_UI_LANGUAGE,
): ValidatorRunView {
  let parsed: MockSubmissionPayload;

  try {
    parsed = JSON.parse(payloadText) as MockSubmissionPayload;
  } catch {
    return {
      lang,
      mode,
      status: "fail",
      summary: t(
        lang,
        "JSON 解析失败；当前还没进入 schema / admission 检查。",
        "JSON parsing failed; the payload never reached schema / admission checks.",
      ),
      issues: [
        issue(
          "schema_error",
          "error",
          "$",
          t(lang, "输入不是合法 JSON。", "The input is not valid JSON."),
          t(lang, "先修正 JSON 语法，再重新运行校验。", "Fix the JSON syntax and run validation again."),
        ),
      ],
      category_breakdown: [{ category: "schema", count: 1 }],
      next_steps: [
        t(
          lang,
          "使用 /playground/validator 的示例 payload 作为起点。",
          "Start from one of the sample payloads in /playground/validator.",
        ),
      ],
    };
  }

  const issues: ValidatorIssueView[] = [];
  pushIfMissing(issues, parsed.requested_trust_tier, "requested_trust_tier", lang);
  pushIfMissing(issues, parsed.benchmark?.id, "benchmark.id", lang);
  pushIfMissing(issues, parsed.benchmark?.version, "benchmark.version", lang);
  pushIfMissing(issues, parsed.benchmark?.lane_id, "benchmark.lane_id", lang);
  pushIfMissing(issues, parsed.model?.id, "model.id", lang);
  pushIfMissing(issues, parsed.harness?.id, "harness.id", lang);

  const split = parsed.benchmark?.split;
  const freshness = parsed.benchmark?.health?.freshness_tier;
  const hiddenLikeSplit =
    split === "hidden" || split === "holdout" || split === "rotating";
  const requiresSealed =
    hiddenLikeSplit || parsed.evidence_channel_mode === "public_plus_sealed";

  if (
    mode !== "schema_only" &&
    parsed.requested_trust_tier &&
    parsed.requested_trust_tier !== "community" &&
    !parsed.registration_digest
  ) {
    issues.push(
      issue(
        "registration_manifest_mismatch",
        "warning",
        "registration_digest",
        t(
          lang,
          "高信任候选缺 registration_digest；MVP 会降级到较低 tier。",
          "A high-trust candidate is missing registration_digest; the MVP will downgrade it to a lower tier.",
        ),
        t(
          lang,
          "补齐 registration_digest，确保 run-group 边界与 manifest 一致。",
          "Add registration_digest so the run-group boundary matches the manifest.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    parsed.requested_trust_tier === "verified" &&
    requiresSealed &&
    !parsed.sealed_audit_bundle_digest
  ) {
    issues.push(
      issue(
        "evidence_channel_ineligible",
        "error",
        "sealed_audit_bundle_digest",
        t(
          lang,
          "需要 sealed evidence，但 sealed_audit_bundle_digest 缺失，无法进入 Verified / Official 流程。",
          "Sealed evidence is required, but sealed_audit_bundle_digest is missing, so this cannot enter the Verified / Official flow.",
        ),
        t(
          lang,
          "补齐 sealed_audit_bundle_digest，或将当前结果降级为非 high-trust 展示。",
          "Add sealed_audit_bundle_digest or explicitly downgrade the result to a non-high-trust presentation.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    parsed.requested_trust_tier === "verified" &&
    (parsed.n_runs ?? 0) > 0 &&
    (parsed.n_runs ?? 0) < 5 &&
    parsed.repeatability_class !== "pseudo_repeated"
  ) {
    issues.push(
      issue(
        "publication_gate_not_met",
        "warning",
        "n_runs",
        t(
          lang,
          "true_seeded Verified 默认至少需要 5 runs；当前只会停在 frontier。",
          "true_seeded Verified defaults to at least 5 runs; the current result would stop at the frontier layer.",
        ),
        t(
          lang,
          "把 n_runs 提升到 5，或改为 reproducible_standard 提交流程。",
          "Raise n_runs to 5 or submit through the reproducible_standard flow instead.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    parsed.declared_autonomy_mode &&
    parsed.declared_autonomy_mode !== "interactive" &&
    !parsed.telemetry
  ) {
    issues.push(
      issue(
        "autonomy_telemetry_incomplete",
        "warning",
        "telemetry",
        t(
          lang,
          "声明了 autonomous/approval_only，但缺 telemetry；平台会保守降级为 interactive。",
          "autonomous/approval_only was declared without telemetry; the platform will conservatively downgrade it to interactive.",
        ),
        t(
          lang,
          "补 interaction-summary / interaction-log 对应的 telemetry 摘要字段。",
          "Add the telemetry summary fields that correspond to interaction-summary / interaction-log.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    freshness &&
    (freshness === "fresh" || freshness === "active") &&
    hiddenLikeSplit &&
    parsed.visibility_class &&
    !["public_redacted", "public_summary"].includes(parsed.visibility_class)
  ) {
    issues.push(
      issue(
        "visibility_policy_incompatible",
        "error",
        "visibility_class",
        t(
          lang,
          "fresh/active hidden split 只允许 public_redacted 或 public_summary。",
          "fresh/active hidden splits only allow public_redacted or public_summary.",
        ),
        t(
          lang,
          "调整 visibility_class 以符合 benchmark health 约束。",
          "Adjust visibility_class to satisfy benchmark-health policy.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    freshness &&
    (freshness === "fresh" || freshness === "active") &&
    hiddenLikeSplit &&
    parsed.release_policy &&
    !["delayed_until_date", "delayed_until_legacy", "summary_only_permanent"].includes(parsed.release_policy)
  ) {
    issues.push(
      issue(
        "release_policy_incompatible",
        "error",
        "release_policy",
        t(
          lang,
          "fresh/active hidden split 不允许 public_immediate。",
          "fresh/active hidden splits do not allow public_immediate.",
        ),
        t(
          lang,
          "改为 delayed_until_date / delayed_until_legacy / summary_only_permanent。",
          "Switch to delayed_until_date / delayed_until_legacy / summary_only_permanent.",
        ),
      ),
    );
  }

  if (
    mode === "admission_readiness" &&
    hiddenLikeSplit &&
    parsed.evidence_channel_mode &&
    parsed.evidence_channel_mode !== "public_plus_sealed"
  ) {
    issues.push(
      issue(
        "evidence_channel_policy_incompatible",
        "error",
        "evidence_channel_mode",
        t(
          lang,
          "hidden/holdout/rotating split 的 high-trust 结果必须使用 public_plus_sealed。",
          "High-trust results on hidden/holdout/rotating splits must use public_plus_sealed.",
        ),
        t(
          lang,
          "改为 public_plus_sealed，并补齐 sealed_audit_bundle_digest。",
          "Switch to public_plus_sealed and add sealed_audit_bundle_digest.",
        ),
      ),
    );
  }

  if (parsed.public_bundle_digest && parsed.public_bundle_digest.startsWith("sha256:") === false) {
    issues.push(
      issue(
        "invalid_digest_binding",
        "warning",
        "public_bundle_digest",
        t(
          lang,
          "digest 建议统一使用 sha256: 前缀，方便后续与 manifest / verification_record 对齐。",
          "Digests should consistently use the sha256: prefix so they align with manifest / verification_record later on.",
        ),
        t(
          lang,
          "将 public_bundle_digest 规范化为 sha256:<hex> 形式。",
          "Normalize public_bundle_digest to the form sha256:<hex>.",
        ),
      ),
    );
  }

  const status =
    issues.some((entry) => entry.severity === "error")
      ? "fail"
      : issues.some((entry) => entry.severity === "warning")
        ? "warn"
        : "pass";

  const categoryBreakdown = [...issues.reduce((map, entry) => {
    const category = issueCategory(entry.code);
    map.set(category, (map.get(category) ?? 0) + 1);
    return map;
  }, new Map<string, number>()).entries()].map(([category, count]) => ({
    category,
    count,
  }));

  return {
    lang,
    mode,
    status,
    summary: summarizeMode(mode, status, lang),
    issues,
    category_breakdown: categoryBreakdown,
    next_steps: nextStepsForMode(mode, status, lang),
    normalized_preview:
      status === "fail" ? undefined : previewNormalizedPayload(parsed),
  };
}
