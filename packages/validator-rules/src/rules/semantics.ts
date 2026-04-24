import {
  computeObjectDigest,
  digestEquals,
  sha256Digest,
  stableCanonicalStringify,
  type ValidationFinding,
  type ValidationRule,
} from "@ohbp/validator-core";

function reasonCodesAllowDrift(reasonCodes: string[] | undefined): boolean {
  return (
    reasonCodes?.some((reasonCode) =>
      /correction|dispute|redaction/i.test(reasonCode),
    ) ?? false
  );
}

function pushMismatchFinding(
  findings: ValidationFinding[],
  ruleId: string,
  suffix: string,
  message: string,
  path: string,
  objectRef: string,
  expected: unknown,
  observed: unknown,
  effect: ValidationFinding["effect"] = "reject_bundle",
): void {
  findings.push({
    id: `${ruleId}:${suffix}`,
    rule_id: ruleId,
    layer: "semantics",
    severity: "error",
    message,
    blocking: true,
    path,
    object_ref: objectRef,
    expected,
    observed,
    effect,
  });
}

export const registrationAndSubjectBindingRule: ValidationRule = {
  id: "semantics.registration-and-subject-binding",
  layer: "semantics",
  description:
    "Checks registration digest binding, shared identity binding, and optional verification subject_ref binding.",
  async evaluate(context) {
    const findings: ValidationFinding[] = [];
    const computedDigests: Record<string, string> = {};
    const manifest = context.manifest;

    if (!manifest) {
      return findings;
    }

    if (manifest.bundle_id !== manifest.run_identity.bundle_id) {
      pushMismatchFinding(
        findings,
        "semantics.registration-and-subject-binding",
        "bundle-id",
        "manifest.bundle_id must equal manifest.run_identity.bundle_id.",
        "manifest.run_identity.bundle_id",
        "manifest.json",
        manifest.bundle_id,
        manifest.run_identity.bundle_id,
      );
    }

    const requiresRegistration =
      manifest.requested_trust_tier !== "community" ||
      Boolean(manifest.registration_ref) ||
      Boolean(manifest.registration_digest);

    if (requiresRegistration && !context.registration) {
      findings.push({
        id: "semantics.registration-and-subject-binding:registration-missing",
        rule_id: "semantics.registration-and-subject-binding",
        layer: "semantics",
        severity: "error",
        message:
          "Bundle requires run-group-registration.json but no registration object was found.",
        blocking: true,
        path: "run-group-registration.json",
        object_ref: "run-group-registration.json",
        expected: "registration object present",
        observed: undefined,
        effect: "ineligible_for_trust_upgrade",
      });
      return { findings };
    }

    if (context.registration) {
      const computedRegistrationDigest = computeObjectDigest(
        context.registration as unknown as Record<string, unknown>,
        ["registration_digest"],
      );
      computedDigests.registration_digest = computedRegistrationDigest;

      if (
        manifest.registration_digest &&
        !digestEquals(manifest.registration_digest, computedRegistrationDigest)
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "manifest-registration-digest",
          "manifest.registration_digest does not match the computed digest of run-group-registration.json.",
          "manifest.registration_digest",
          "manifest.json",
          computedRegistrationDigest,
          manifest.registration_digest,
        );
      }

      if (
        context.registration.registration_digest &&
        !digestEquals(
          context.registration.registration_digest,
          computedRegistrationDigest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "self-registration-digest",
          "run-group-registration.json carries a stale registration_digest value.",
          "run-group-registration.json.registration_digest",
          "run-group-registration.json",
          computedRegistrationDigest,
          context.registration.registration_digest,
        );
      }

      if (
        manifest.requested_trust_tier !== context.registration.requested_trust_tier
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "requested-tier",
          "manifest.requested_trust_tier does not match run-group-registration.json.requested_trust_tier.",
          "manifest.requested_trust_tier",
          "manifest.json",
          context.registration.requested_trust_tier,
          manifest.requested_trust_tier,
          "ineligible_for_trust_upgrade",
        );
      }

      const registrationChecks: Array<[string, unknown, unknown]> = [
        ["study_id", context.registration.study_id, manifest.run_identity.study_id],
        ["run_group_id", context.registration.run_group_id, manifest.run_identity.run_group_id],
        ["benchmark_id", context.registration.benchmark_id, manifest.benchmark.id],
        ["benchmark_version", context.registration.benchmark_version, manifest.benchmark.version],
        ["lane_id", context.registration.lane_id, manifest.benchmark.lane_id],
        ["split", context.registration.split, manifest.benchmark.split],
        [
          "repeatability_class",
          context.registration.repeatability_class,
          manifest.repeatability_class,
        ],
      ];

      for (const [field, expected, observed] of registrationChecks) {
        if (expected !== observed) {
          pushMismatchFinding(
            findings,
            "semantics.registration-and-subject-binding",
            `registration-${field}`,
            `run-group-registration.json.${field} does not match manifest binding.`,
            `run-group-registration.json.${field}`,
            "run-group-registration.json",
            expected,
            observed,
          );
        }
      }

      if (
        !digestEquals(
          context.registration.task_package_digest,
          manifest.task_package_digest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "task-package-digest",
          "run-group-registration.json.task_package_digest does not match manifest.task_package_digest.",
          "run-group-registration.json.task_package_digest",
          "run-group-registration.json",
          context.registration.task_package_digest,
          manifest.task_package_digest,
        );
      }

      if (
        !digestEquals(
          context.registration.execution_contract_digest,
          manifest.execution_contract_digest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "execution-contract-digest",
          "run-group-registration.json.execution_contract_digest does not match manifest.execution_contract_digest.",
          "run-group-registration.json.execution_contract_digest",
          "run-group-registration.json",
          context.registration.execution_contract_digest,
          manifest.execution_contract_digest,
        );
      }

      if (
        !digestEquals(
          context.registration.tolerance_policy_digest,
          manifest.tolerance_policy_digest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "tolerance-policy-digest",
          "run-group-registration.json.tolerance_policy_digest does not match manifest.tolerance_policy_digest.",
          "run-group-registration.json.tolerance_policy_digest",
          "run-group-registration.json",
          context.registration.tolerance_policy_digest,
          manifest.tolerance_policy_digest,
        );
      }

      if (context.attempt_plan) {
        const computedAttemptPlanHash = sha256Digest(
          stableCanonicalStringify(context.attempt_plan),
        );
        computedDigests.attempt_plan_hash = computedAttemptPlanHash;

        if (
          !digestEquals(
            context.registration.attempt_plan_hash,
            computedAttemptPlanHash,
          )
        ) {
          pushMismatchFinding(
            findings,
            "semantics.registration-and-subject-binding",
            "attempt-plan-hash",
            "run-group-registration.json.attempt_plan_hash does not match attempt-plan.json.",
            "run-group-registration.json.attempt_plan_hash",
            "run-group-registration.json",
            computedAttemptPlanHash,
            context.registration.attempt_plan_hash,
          );
        }

        if (!context.attempt_plan.includes(manifest.run_identity.attempt_id)) {
          findings.push({
            id: "semantics.registration-and-subject-binding:attempt-not-declared",
            rule_id: "semantics.registration-and-subject-binding",
            layer: "semantics",
            severity: "error",
            message:
              "manifest.run_identity.attempt_id is not listed in attempt-plan.json.",
            blocking: true,
            path: "attempt-plan.json",
            object_ref: "attempt-plan.json",
            expected: context.attempt_plan,
            observed: manifest.run_identity.attempt_id,
            effect: "reject_bundle",
          });
        }

        if (context.registration.declared_attempt_total !== context.attempt_plan.length) {
          pushMismatchFinding(
            findings,
            "semantics.registration-and-subject-binding",
            "attempt-total",
            "run-group-registration.json.declared_attempt_total does not match attempt-plan.json length.",
            "run-group-registration.json.declared_attempt_total",
            "run-group-registration.json",
            context.attempt_plan.length,
            context.registration.declared_attempt_total,
          );
        }
      }
    }

    if (context.task_package) {
      const computedTaskPackageDigest = computeObjectDigest(
        context.task_package as unknown as Record<string, unknown>,
      );
      computedDigests.task_package_digest = computedTaskPackageDigest;

      if (!digestEquals(manifest.task_package_digest, computedTaskPackageDigest)) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "manifest-task-package-digest",
          "manifest.task_package_digest does not match registry/task-package.json.",
          "manifest.task_package_digest",
          "manifest.json",
          computedTaskPackageDigest,
          manifest.task_package_digest,
        );
      }

      if (
        context.task_package.benchmark_id !== manifest.benchmark.id ||
        context.task_package.benchmark_version !== manifest.benchmark.version ||
        context.task_package.lane_id !== manifest.benchmark.lane_id ||
        context.task_package.split !== manifest.benchmark.split
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "task-package-benchmark",
          "registry/task-package.json benchmark identity does not match manifest.benchmark.",
          "registry/task-package.json",
          "registry/task-package.json",
          {
            id: manifest.benchmark.id,
            version: manifest.benchmark.version,
            lane_id: manifest.benchmark.lane_id,
            split: manifest.benchmark.split,
          },
          {
            id: context.task_package.benchmark_id,
            version: context.task_package.benchmark_version,
            lane_id: context.task_package.lane_id,
            split: context.task_package.split,
          },
        );
      }
    }

    if (context.execution_contract) {
      const computedExecutionContractDigest = computeObjectDigest(
        context.execution_contract as unknown as Record<string, unknown>,
      );
      const computedTolerancePolicyDigest = computeObjectDigest(
        context.execution_contract.verification_policy
          .tolerance_policy as unknown as Record<string, unknown>,
      );
      computedDigests.execution_contract_digest = computedExecutionContractDigest;
      computedDigests.tolerance_policy_digest = computedTolerancePolicyDigest;

      if (
        !digestEquals(
          manifest.execution_contract_digest,
          computedExecutionContractDigest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "manifest-execution-contract-digest",
          "manifest.execution_contract_digest does not match registry/execution-contract.json.",
          "manifest.execution_contract_digest",
          "manifest.json",
          computedExecutionContractDigest,
          manifest.execution_contract_digest,
        );
      }

      if (
        !digestEquals(
          manifest.tolerance_policy_digest,
          computedTolerancePolicyDigest,
        )
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "manifest-tolerance-policy-digest",
          "manifest.tolerance_policy_digest does not match execution-contract tolerance policy.",
          "manifest.tolerance_policy_digest",
          "manifest.json",
          computedTolerancePolicyDigest,
          manifest.tolerance_policy_digest,
        );
      }

      if (
        context.execution_contract.benchmark_id !== manifest.benchmark.id ||
        context.execution_contract.benchmark_version !== manifest.benchmark.version
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "execution-contract-benchmark",
          "registry/execution-contract.json benchmark identity does not match manifest.benchmark.",
          "registry/execution-contract.json",
          "registry/execution-contract.json",
          {
            id: manifest.benchmark.id,
            version: manifest.benchmark.version,
          },
          {
            id: context.execution_contract.benchmark_id,
            version: context.execution_contract.benchmark_version,
          },
        );
      }
    }

    if (context.benchmark_card) {
      if (
        context.benchmark_card.benchmark.id !== manifest.benchmark.id ||
        context.benchmark_card.benchmark.version !== manifest.benchmark.version ||
        context.benchmark_card.benchmark.lane_id !== manifest.benchmark.lane_id ||
        context.benchmark_card.benchmark.split !== manifest.benchmark.split
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "benchmark-card-benchmark",
          "registry benchmark card does not match manifest.benchmark.",
          "registry/benchmark-card.json",
          "registry/benchmark-card.json",
          manifest.benchmark,
          context.benchmark_card.benchmark,
        );
      }
    }

    if (context.aggregate && context.aggregate.attempt_id !== manifest.run_identity.attempt_id) {
      pushMismatchFinding(
        findings,
        "semantics.registration-and-subject-binding",
        "aggregate-attempt",
        "aggregate.json.attempt_id does not match manifest.run_identity.attempt_id.",
        "aggregate.json.attempt_id",
        "aggregate.json",
        manifest.run_identity.attempt_id,
        context.aggregate.attempt_id,
      );
    }

    if (
      context.evaluator_report &&
      context.evaluator_report.attempt_id !== manifest.run_identity.attempt_id
    ) {
      pushMismatchFinding(
        findings,
        "semantics.registration-and-subject-binding",
        "evaluator-attempt",
        "evaluator-report.json.attempt_id does not match manifest.run_identity.attempt_id.",
        "reports/evaluator-report.json.attempt_id",
        "reports/evaluator-report.json",
        manifest.run_identity.attempt_id,
        context.evaluator_report.attempt_id,
      );
    }

    if (
      context.environment_report &&
      context.environment_report.attempt_id !== manifest.run_identity.attempt_id
    ) {
      pushMismatchFinding(
        findings,
        "semantics.registration-and-subject-binding",
        "environment-attempt",
        "environment-report.json.attempt_id does not match manifest.run_identity.attempt_id.",
        "reports/environment-report.json.attempt_id",
        "reports/environment-report.json",
        manifest.run_identity.attempt_id,
        context.environment_report.attempt_id,
      );
    }

    if (context.verification_record) {
      const subjectRef = context.verification_record.subject_ref;

      if (subjectRef.subject_type !== "attempt_bundle") {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "subject-type",
          "verification-record subject_ref.subject_type must be attempt_bundle.",
          "reports/verification-record.json.subject_ref.subject_type",
          "reports/verification-record.json",
          "attempt_bundle",
          subjectRef.subject_type,
        );
      }

      const identityMismatches = [
        ["study_id", subjectRef.study_id, manifest.run_identity.study_id],
        ["run_group_id", subjectRef.run_group_id, manifest.run_identity.run_group_id],
        ["attempt_id", subjectRef.attempt_id, manifest.run_identity.attempt_id],
        ["bundle_id", subjectRef.bundle_id, manifest.run_identity.bundle_id],
      ] as const;

      for (const [field, observed, expected] of identityMismatches) {
        if (observed !== expected) {
          pushMismatchFinding(
            findings,
            "semantics.registration-and-subject-binding",
            `subject-ref-${field}`,
            `verification-record subject_ref.${field} does not match manifest.run_identity.${field}.`,
            `reports/verification-record.json.subject_ref.${field}`,
            "reports/verification-record.json",
            expected,
            observed,
          );
        }
      }

      if (
        context.verification_record.public_bundle_digest &&
        manifest.evidence.public_bundle_digest &&
        !digestEquals(
          context.verification_record.public_bundle_digest,
          manifest.evidence.public_bundle_digest,
        ) &&
        !reasonCodesAllowDrift(context.verification_record.decision_reason_codes)
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "public-bundle-digest-drift",
          "verification-record public_bundle_digest drifted from manifest.evidence.public_bundle_digest without an explicit correction reason code.",
          "reports/verification-record.json.public_bundle_digest",
          "reports/verification-record.json",
          manifest.evidence.public_bundle_digest,
          context.verification_record.public_bundle_digest,
        );
      }

      if (
        context.verification_record.sealed_audit_bundle_digest &&
        manifest.evidence.sealed_audit_bundle_digest &&
        !digestEquals(
          context.verification_record.sealed_audit_bundle_digest,
          manifest.evidence.sealed_audit_bundle_digest,
        ) &&
        !reasonCodesAllowDrift(context.verification_record.decision_reason_codes)
      ) {
        pushMismatchFinding(
          findings,
          "semantics.registration-and-subject-binding",
          "sealed-bundle-digest-drift",
          "verification-record sealed_audit_bundle_digest drifted from manifest.evidence.sealed_audit_bundle_digest without an explicit correction reason code.",
          "reports/verification-record.json.sealed_audit_bundle_digest",
          "reports/verification-record.json",
          manifest.evidence.sealed_audit_bundle_digest,
          context.verification_record.sealed_audit_bundle_digest,
        );
      }
    }

    return {
      findings,
      computed_digests: computedDigests,
    };
  },
};

export const publicPlusSealedRule: ValidationRule = {
  id: "semantics.public-plus-sealed-requirements",
  layer: "semantics",
  description:
    "Ensures public_plus_sealed evidence mode has a bound sealed companion and a real redacted public projection.",
  async evaluate(context) {
    const manifest = context.manifest;

    if (!manifest) {
      return [];
    }

    if (manifest.evidence.evidence_channel_mode !== "public_plus_sealed") {
      return [];
    }

    const findings: ValidationFinding[] = [];

    if (!manifest.evidence.sealed_audit_bundle_digest) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:sealed-digest",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "manifest.evidence.sealed_audit_bundle_digest is required when evidence_channel_mode = public_plus_sealed.",
        blocking: true,
        path: "manifest.evidence.sealed_audit_bundle_digest",
        object_ref: "manifest.json",
        expected: "sealed bundle digest",
        observed: manifest.evidence.sealed_audit_bundle_digest,
        effect: "needs_sealed_companion",
      });
    }

    if (!context.sealed_bundle_root || !context.sealed_bundle) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:sealed-bundle-root",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "A sealed companion bundle is required when evidence_channel_mode = public_plus_sealed.",
        blocking: true,
        path: "sealed/",
        object_ref: "sealed bundle",
        expected: "sealed bundle directory with checksums.sha256",
        observed: context.sealed_bundle_root,
        effect: "needs_sealed_companion",
      });
      return findings;
    }

    if (!context.sealed_checksums_text) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:sealed-checksums",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "sealed/checksums.sha256 is required when evidence_channel_mode = public_plus_sealed.",
        blocking: true,
        path: "sealed/checksums.sha256",
        object_ref: "sealed bundle",
        expected: "checksums file",
        observed: undefined,
        effect: "needs_sealed_companion",
      });
    }

    if (!manifest.evidence.redaction_policy_id) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:redaction-policy",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "public_plus_sealed bundles must declare evidence.redaction_policy_id.",
        blocking: true,
        path: "manifest.evidence.redaction_policy_id",
        object_ref: "manifest.json",
        expected: "redaction policy id",
        observed: manifest.evidence.redaction_policy_id,
        effect: "needs_sealed_companion",
      });
    }

    if (!context.redactions) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:redactions-manifest",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "public_plus_sealed bundles must include redactions.json describing the public projection.",
        blocking: true,
        path: "redactions.json",
        object_ref: "redactions.json",
        expected: "redaction manifest",
        observed: undefined,
        effect: "needs_sealed_companion",
      });
    }

    if (
      context.public_trace_text &&
      context.sealed_trace_text &&
      context.public_trace_text === context.sealed_trace_text
    ) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:trace-not-redacted",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "Public trace must be a redacted projection and cannot be byte-identical to the sealed trace.",
        blocking: true,
        path: manifest.trace.trace_ref,
        object_ref: "traces/trace.jsonl",
        expected: "redacted public projection",
        observed: "identical to sealed trace",
        effect: "reject_bundle",
      });
    }

    if (
      context.public_interaction_log_text &&
      context.sealed_interaction_log_text &&
      context.public_interaction_log_text === context.sealed_interaction_log_text
    ) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:interaction-log-not-redacted",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "Public interaction log must be a redacted projection and cannot be byte-identical to the sealed interaction log.",
        blocking: true,
        path: manifest.trace.interaction_log_ref,
        object_ref: "traces/interaction-log.jsonl",
        expected: "redacted public projection",
        observed: "identical to sealed interaction log",
        effect: "reject_bundle",
      });
    }

    if (
      context.task_results &&
      context.sealed_task_results &&
      stableCanonicalStringify(context.task_results) ===
        stableCanonicalStringify(context.sealed_task_results)
    ) {
      findings.push({
        id: "semantics.public-plus-sealed-requirements:task-results-not-redacted",
        rule_id: "semantics.public-plus-sealed-requirements",
        layer: "semantics",
        severity: "error",
        message:
          "Public task-results must be a redacted projection and cannot be identical to the sealed task-results payload.",
        blocking: true,
        path: manifest.artifacts.task_results_ref,
        object_ref: "payloads/task-results.ndjson",
        expected: "redacted public projection",
        observed: "identical to sealed task-results",
        effect: "reject_bundle",
      });
    }

    return findings;
  },
};

export const traceCompletenessRule: ValidationRule = {
  id: "semantics.trace-completeness",
  layer: "semantics",
  description:
    "Checks manifest trace refs, line-count completeness, and public/sealed consistency for the MVP trace chain.",
  async evaluate(context) {
    const findings: ValidationFinding[] = [];
    const manifest = context.manifest;

    if (!manifest) {
      return findings;
    }

    if (!context.public_trace_text) {
      findings.push({
        id: "semantics.trace-completeness:trace-missing",
        rule_id: "semantics.trace-completeness",
        layer: "semantics",
        severity: "error",
        message: "manifest.trace.trace_ref points to a missing public trace file.",
        blocking: true,
        path: manifest.trace.trace_ref,
        object_ref: "traces/trace.jsonl",
        expected: "trace file present",
        observed: "missing",
        effect: "reject_bundle",
      });
    }

    if (!context.public_interaction_log_text) {
      findings.push({
        id: "semantics.trace-completeness:interaction-log-missing",
        rule_id: "semantics.trace-completeness",
        layer: "semantics",
        severity: "error",
        message:
          "manifest.trace.interaction_log_ref points to a missing public interaction log file.",
        blocking: true,
        path: manifest.trace.interaction_log_ref,
        object_ref: "traces/interaction-log.jsonl",
        expected: "interaction log file present",
        observed: "missing",
        effect: "reject_bundle",
      });
    }

    if (!context.interaction_summary) {
      findings.push({
        id: "semantics.trace-completeness:interaction-summary-missing",
        rule_id: "semantics.trace-completeness",
        layer: "semantics",
        severity: "error",
        message:
          "manifest.trace.interaction_summary_ref points to a missing interaction summary file.",
        blocking: true,
        path: manifest.trace.interaction_summary_ref,
        object_ref: "reports/interaction-summary.json",
        expected: "interaction summary file present",
        observed: "missing",
        effect: "reject_bundle",
      });
    }

    if (!context.trace_integrity) {
      findings.push({
        id: "semantics.trace-completeness:trace-integrity-missing",
        rule_id: "semantics.trace-completeness",
        layer: "semantics",
        severity: "error",
        message:
          "manifest.trace.trace_integrity_ref points to a missing trace-integrity file.",
        blocking: true,
        path: manifest.trace.trace_integrity_ref,
        object_ref: "reports/trace-integrity.json",
        expected: "trace-integrity file present",
        observed: "missing",
        effect: "reject_bundle",
      });
      return findings;
    }

    if (
      context.public_trace_line_count !== undefined &&
      context.trace_integrity.line_count !== context.public_trace_line_count
    ) {
      pushMismatchFinding(
        findings,
        "semantics.trace-completeness",
        "trace-line-count",
        "trace-integrity.json.line_count does not match the public trace line count.",
        "reports/trace-integrity.json.line_count",
        "reports/trace-integrity.json",
        context.public_trace_line_count,
        context.trace_integrity.line_count,
      );
    }

    if (
      context.task_results &&
      context.aggregate &&
      context.task_results.length !== context.aggregate.n_tasks
    ) {
      pushMismatchFinding(
        findings,
        "semantics.trace-completeness",
        "task-count",
        "aggregate.json.n_tasks does not match the number of task-results entries.",
        "aggregate.json.n_tasks",
        "aggregate.json",
        context.task_results.length,
        context.aggregate.n_tasks,
      );
    }

    if (context.interaction_summary) {
      if (
        context.public_interaction_log_line_count !== undefined &&
        context.interaction_summary.interaction_log_complete === true &&
        context.public_interaction_log_line_count === 0
      ) {
        findings.push({
          id: "semantics.trace-completeness:interaction-log-empty",
          rule_id: "semantics.trace-completeness",
          layer: "semantics",
          severity: "error",
          message:
            "interaction-summary declares a complete interaction log, but the referenced public interaction log is empty.",
          blocking: true,
          path: "reports/interaction-summary.json.interaction_log_complete",
          object_ref: "reports/interaction-summary.json",
          expected: "non-empty interaction log",
          observed: context.public_interaction_log_line_count,
          effect: "reject_bundle",
        });
      }

      if (
        manifest.evidence.evidence_channel_mode === "public_plus_sealed" &&
        context.interaction_summary.interaction_log_complete === true &&
        context.sealed_bundle_root
      ) {
        findings.push({
          id: "semantics.trace-completeness:redacted-log-marked-complete",
          rule_id: "semantics.trace-completeness",
          layer: "semantics",
          severity: "warning",
          message:
            "public_plus_sealed bundle marks the public interaction log as complete; prefer interaction_log_complete=false when the public surface is redacted.",
          blocking: false,
          path: "reports/interaction-summary.json.interaction_log_complete",
          object_ref: "reports/interaction-summary.json",
          expected: false,
          observed: true,
          effect: "requires_review",
        });
      }
    }

    return findings;
  },
};
