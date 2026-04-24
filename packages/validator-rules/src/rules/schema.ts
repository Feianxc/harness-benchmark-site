import type {
  ValidationFinding,
  ValidationRule,
} from "@ohbp/validator-core";

function missingFieldFinding(
  ruleId: string,
  fieldPath: string,
  observed: unknown,
): ValidationFinding {
  return {
    id: `${ruleId}:${fieldPath}`,
    rule_id: ruleId,
    layer: "schema",
    severity: "error",
    message: `Missing required manifest field: ${fieldPath}`,
    blocking: true,
    path: `manifest.${fieldPath}`,
    object_ref: "manifest.json",
    observed,
    expected: "non-empty value",
    effect: "reject_bundle",
  };
}

export const manifestRequiredFieldsRule: ValidationRule = {
  id: "schema.manifest.required-fields",
  layer: "schema",
  description: "Ensures the canonical manifest has its MVP required fields.",
  async evaluate(context) {
    const findings: ValidationFinding[] = [];
    const manifest = context.manifest;

    if (!manifest) {
      findings.push({
        id: "schema.manifest.required-fields:manifest",
        rule_id: "schema.manifest.required-fields",
        layer: "schema",
        severity: "error",
        message: "Bundle is missing manifest.json.",
        blocking: true,
        path: "manifest.json",
        object_ref: "manifest.json",
        observed: undefined,
        expected: "manifest.json",
        effect: "reject_bundle",
      });
      return findings;
    }

    const requiredFields: Array<[string, unknown]> = [
      ["protocol_version", manifest.protocol_version],
      ["bundle_id", manifest.bundle_id],
      ["run_identity.study_id", manifest.run_identity?.study_id],
      ["run_identity.run_group_id", manifest.run_identity?.run_group_id],
      ["run_identity.attempt_id", manifest.run_identity?.attempt_id],
      ["run_identity.bundle_id", manifest.run_identity?.bundle_id],
      ["benchmark.id", manifest.benchmark?.id],
      ["benchmark.version", manifest.benchmark?.version],
      ["benchmark.lane_id", manifest.benchmark?.lane_id],
      ["benchmark.split", manifest.benchmark?.split],
      ["task_package_digest", manifest.task_package_digest],
      ["execution_contract_digest", manifest.execution_contract_digest],
      ["tolerance_policy_ref", manifest.tolerance_policy_ref],
      ["tolerance_policy_digest", manifest.tolerance_policy_digest],
      ["requested_trust_tier", manifest.requested_trust_tier],
      ["repeatability_class", manifest.repeatability_class],
      ["evidence.evidence_channel_mode", manifest.evidence?.evidence_channel_mode],
      ["evidence.visibility_class", manifest.evidence?.visibility_class],
      ["evidence.release_policy", manifest.evidence?.release_policy],
      ["evidence.public_bundle_digest", manifest.evidence?.public_bundle_digest],
      ["trace.trace_root_hash", manifest.trace?.trace_root_hash],
      ["trace.trace_ref", manifest.trace?.trace_ref],
      ["trace.interaction_log_ref", manifest.trace?.interaction_log_ref],
      ["trace.interaction_summary_ref", manifest.trace?.interaction_summary_ref],
      ["trace.trace_integrity_ref", manifest.trace?.trace_integrity_ref],
      ["artifacts.task_results_ref", manifest.artifacts?.task_results_ref],
      ["artifacts.aggregate_ref", manifest.artifacts?.aggregate_ref],
      ["artifacts.evaluator_report_ref", manifest.artifacts?.evaluator_report_ref],
      ["artifacts.checksums_ref", manifest.artifacts?.checksums_ref],
    ];

    for (const [fieldPath, value] of requiredFields) {
      if (value === undefined || value === null || value === "") {
        findings.push(
          missingFieldFinding(
            "schema.manifest.required-fields",
            fieldPath,
            value,
          ),
        );
      }
    }

    if (
      manifest.evidence?.evidence_channel_mode === "public_plus_sealed" &&
      !manifest.evidence.redaction_policy_id
    ) {
      findings.push(
        missingFieldFinding(
          "schema.manifest.required-fields",
          "evidence.redaction_policy_id",
          manifest.evidence.redaction_policy_id,
        ),
      );
    }

    if (
      manifest.requested_trust_tier !== "community" &&
      !manifest.registration_ref
    ) {
      findings.push(
        missingFieldFinding(
          "schema.manifest.required-fields",
          "registration_ref",
          manifest.registration_ref,
        ),
      );
    }

    return findings;
  },
};
