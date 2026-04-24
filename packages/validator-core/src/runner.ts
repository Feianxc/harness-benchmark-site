import type {
  DerivedEffect,
  DerivedEffectCode,
  ValidationContext,
  ValidationFinding,
  ValidationReport,
  ValidationRule,
  ValidationRuleResult,
} from "./model.js";

function normalizeRuleResult(
  result: ValidationRuleResult | ValidationFinding[] | void,
): ValidationRuleResult {
  if (!result) {
    return {};
  }

  if (Array.isArray(result)) {
    return {
      findings: result,
    };
  }

  return result;
}

function overallVerdictFromFindings(
  findings: ValidationFinding[],
): ValidationReport["overall_verdict"] {
  if (findings.some((finding) => finding.severity === "error")) {
    return "fail";
  }

  if (findings.some((finding) => finding.severity === "warning")) {
    return "warn";
  }

  return "pass";
}

function deriveEffects(
  findings: ValidationFinding[],
  overallVerdict: ValidationReport["overall_verdict"],
): DerivedEffect[] {
  const effects = new Map<DerivedEffectCode, string>();

  for (const finding of findings) {
    if (finding.effect) {
      effects.set(finding.effect, finding.message);
    }
  }

  if (overallVerdict === "fail") {
    effects.set("reject_bundle", "Validation reported at least one blocking error.");
  } else if (overallVerdict === "warn") {
    effects.set(
      "requires_review",
      "Validation completed with warnings that should be reviewed before upload.",
    );
  } else {
    effects.set("bundle_ready", "Validation completed without blocking findings.");
  }

  return [...effects.entries()].map(([code, reason]) => ({
    code,
    reason,
  }));
}

export async function runValidation(
  context: ValidationContext,
  rules: ValidationRule[],
): Promise<ValidationReport> {
  const startedAt = new Date().toISOString();
  const findings: ValidationFinding[] = [];
  const computedDigests: ValidationReport["computed_digests"] = {};

  for (const rule of rules) {
    const normalizedResult = normalizeRuleResult(await rule.evaluate(context));

    if (normalizedResult.findings) {
      findings.push(...normalizedResult.findings);
    }

    if (normalizedResult.computed_digests) {
      Object.assign(computedDigests, normalizedResult.computed_digests);
    }
  }

  const overallVerdict = overallVerdictFromFindings(findings);

  return {
    protocol_version: context.protocol_version,
    validation_mode: context.validation_mode,
    bundle_root: context.public_bundle_root,
    bundle_digest:
      computedDigests.public_bundle_digest ??
      context.manifest?.evidence.public_bundle_digest ??
      undefined,
    overall_verdict: overallVerdict,
    findings,
    derived_effects: deriveEffects(findings, overallVerdict),
    computed_digests: computedDigests,
    object_inventory: Object.keys(context.public_bundle.files).sort(),
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  };
}
