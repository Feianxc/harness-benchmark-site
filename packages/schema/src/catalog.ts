import type { ObjectType } from "@ohbp/types";
import {
  ARTIFACT_ROLES,
  AUTONOMY_MODES,
  BUNDLE_PROTOCOL_VERSION,
  COMPLETENESS_VERDICTS,
  COMPARISON_MODES,
  EVIDENCE_CHANNEL_MODES,
  MEMORY_SCOPES,
  OBJECT_TYPES,
  PUBLICATION_STATES,
  REGISTRATION_MODES,
  RELEASE_POLICIES,
  REPEATABILITY_CLASSES,
  SCHEMA_CATALOG_VERSION,
  SPLITS,
  SUBMISSION_PROFILES,
  TASK_RESULT_STATUSES,
  TIER_ELIGIBILITY_EFFECTS,
  TRACE_HASH_CHAIN_MODES,
  TRUST_TIERS,
  VISIBILITY_CLASSES,
} from "@ohbp/types";
import {
  arrayOf,
  booleanSchema,
  bundleObject,
  dateTimeSchema,
  digestSchema,
  enumSchema,
  integerSchema,
  numberSchema,
  recordOfNumbers,
  registryObject,
  stringSchema,
} from "./helpers";
import type { JsonSchema } from "./json-schema";

const benchmarkIdentitySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: stringSchema(),
    version: stringSchema(),
    lane_id: stringSchema(),
    split: enumSchema(SPLITS),
  },
  required: ["id", "version", "lane_id", "split"],
};

const registryBenchmarkDescriptorSchema: JsonSchema = {
  ...benchmarkIdentitySchema,
  properties: {
    ...(benchmarkIdentitySchema.properties ?? {}),
    title: stringSchema(),
  },
  required: [...(benchmarkIdentitySchema.required ?? []), "title"],
};

const taskDefinitionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    task_id: stringSchema(),
    prompt_id: stringSchema(),
    title: stringSchema(),
    difficulty: enumSchema(["core", "stretch"] as const),
    tags: arrayOf(stringSchema()),
  },
  required: ["task_id", "prompt_id", "title", "difficulty", "tags"],
};

const metricRuleSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    metric_id: stringSchema(),
    level: enumSchema(["task", "run_group"] as const),
    comparison_method: enumSchema(["abs_delta", "relative_delta"] as const),
    threshold_abs: numberSchema(0),
    threshold_rel: numberSchema(0),
    directionality: enumSchema(["higher_is_better", "lower_is_better"] as const),
    hard_fail: booleanSchema(),
  },
  required: [
    "metric_id",
    "level",
    "comparison_method",
    "threshold_abs",
    "threshold_rel",
    "directionality",
    "hard_fail",
  ],
};

const tolerancePolicySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tolerance_policy_id: stringSchema(),
    tolerance_policy_version: stringSchema(),
    applies_to_tiers: arrayOf(enumSchema(TRUST_TIERS), 1),
    allowed_repeatability_classes: arrayOf(enumSchema(REPEATABILITY_CLASSES), 1),
    comparison_unit: enumSchema(["run_group"] as const),
    statistical_protocol: enumSchema(["point_estimate_with_iqr"] as const),
    metric_rules: arrayOf(metricRuleSchema, 1),
    missingness_rule: stringSchema(),
    replay_rule: stringSchema(),
    reproduce_rule: stringSchema(),
    promotion_gate: stringSchema(),
  },
  required: [
    "tolerance_policy_id",
    "tolerance_policy_version",
    "applies_to_tiers",
    "allowed_repeatability_classes",
    "comparison_unit",
    "statistical_protocol",
    "metric_rules",
    "missingness_rule",
    "replay_rule",
    "reproduce_rule",
    "promotion_gate",
  ],
};

const registryRefsSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    task_package: stringSchema(),
    execution_contract: stringSchema(),
  },
  required: ["task_package", "execution_contract"],
};

const runIdentitySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    study_id: stringSchema(),
    run_group_id: stringSchema(),
    attempt_id: stringSchema(),
    bundle_id: stringSchema(),
  },
  required: ["study_id", "run_group_id", "attempt_id", "bundle_id"],
};

const manifestEvidenceSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    evidence_channel_mode: enumSchema(EVIDENCE_CHANNEL_MODES),
    visibility_class: enumSchema(VISIBILITY_CLASSES),
    release_policy: enumSchema(RELEASE_POLICIES),
    public_bundle_digest: digestSchema(),
    sealed_audit_bundle_digest: digestSchema(),
    redaction_policy_id: stringSchema(),
  },
  required: ["evidence_channel_mode", "visibility_class", "release_policy"],
};

const manifestTraceSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    trace_root_hash: digestSchema(),
    trace_ref: stringSchema(),
    interaction_log_ref: stringSchema(),
    interaction_summary_ref: stringSchema(),
    trace_integrity_ref: stringSchema(),
    environment_report_ref: stringSchema(),
    completeness_proof_ref: stringSchema(),
    verification_record_ref: stringSchema(),
  },
  required: [
    "trace_root_hash",
    "trace_ref",
    "interaction_log_ref",
    "interaction_summary_ref",
    "trace_integrity_ref",
  ],
};

const manifestArtifactsSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    task_results_ref: stringSchema(),
    aggregate_ref: stringSchema(),
    evaluator_report_ref: stringSchema(),
    artifact_manifest_ref: stringSchema(),
    checksums_ref: stringSchema(),
  },
  required: ["task_results_ref", "aggregate_ref", "evaluator_report_ref", "checksums_ref"],
};

const artifactRecordSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    artifact_id: stringSchema(),
    path: stringSchema(),
    media_type: stringSchema(),
    sha256: digestSchema(),
    bytes: integerSchema(0),
    role: enumSchema(ARTIFACT_ROLES),
  },
  required: ["artifact_id", "path", "media_type", "sha256", "bytes", "role"],
};

const submissionWindowSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    opens_at: dateTimeSchema(),
    closes_at: dateTimeSchema(),
    max_span_minutes: integerSchema(1),
  },
  required: ["opens_at", "closes_at", "max_span_minutes"],
};

const randomnessFingerprintHintSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    provider_fingerprint: stringSchema(),
    sampler_config_hash: digestSchema(),
    endpoint_profile_hash: digestSchema(),
  },
};

const verificationSubjectRefSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject_type: {
      type: "string",
      const: "attempt_bundle",
    },
    study_id: stringSchema(),
    run_group_id: stringSchema(),
    attempt_id: stringSchema(),
    bundle_id: stringSchema(),
  },
  required: ["subject_type", "study_id", "run_group_id", "attempt_id", "bundle_id"],
};

const publicationStateEventSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    at: dateTimeSchema(),
    from_state: enumSchema(PUBLICATION_STATES),
    to_state: enumSchema(PUBLICATION_STATES),
    actor: stringSchema(),
    reason_code: stringSchema(),
    summary: stringSchema(),
  },
  required: ["at", "to_state", "actor", "reason_code", "summary"],
};

const boardAdmissionDecisionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    eligible: booleanSchema(),
    satisfied_reasons: arrayOf(stringSchema()),
    blocked_reasons: arrayOf(stringSchema()),
    next_actions: arrayOf(stringSchema()),
  },
  required: ["eligible", "satisfied_reasons", "blocked_reasons", "next_actions"],
};

export const benchmarkCardSchema = registryObject(
  "benchmark-card",
  {
    benchmark: registryBenchmarkDescriptorSchema,
    description: stringSchema(),
    comparison_mode: enumSchema(COMPARISON_MODES),
    default_submission_profile: enumSchema(SUBMISSION_PROFILES),
    registry_refs: registryRefsSchema,
  },
  ["benchmark", "description", "comparison_mode", "default_submission_profile", "registry_refs"],
);

export const taskPackageSchema = registryObject(
  "task-package",
  {
    task_package_id: stringSchema(),
    benchmark_id: stringSchema(),
    benchmark_version: stringSchema(),
    lane_id: stringSchema(),
    split: enumSchema(SPLITS),
    tasks: arrayOf(taskDefinitionSchema, 1),
  },
  ["task_package_id", "benchmark_id", "benchmark_version", "lane_id", "split", "tasks"],
);

export const executionContractSchema = registryObject(
  "execution-contract",
  {
    execution_contract_id: stringSchema(),
    benchmark_id: stringSchema(),
    benchmark_version: stringSchema(),
    runtime: {
      type: "object",
      additionalProperties: false,
      properties: {
        adapter_id: stringSchema(),
        adapter_version: stringSchema(),
        launcher: stringSchema(),
        model_ref: stringSchema(),
        container_digest: digestSchema(),
      },
      required: ["adapter_id", "adapter_version", "launcher", "model_ref", "container_digest"],
    },
    resource_limits: {
      type: "object",
      additionalProperties: false,
      properties: {
        max_steps: integerSchema(1),
        timeout_seconds: integerSchema(1),
        budget_usd: numberSchema(0),
      },
      required: ["max_steps", "timeout_seconds", "budget_usd"],
    },
    verification_policy: {
      type: "object",
      additionalProperties: false,
      properties: {
        required_bundle_members: arrayOf(stringSchema(), 1),
        tolerance_policy: tolerancePolicySchema,
      },
      required: ["required_bundle_members", "tolerance_policy"],
    },
  },
  ["execution_contract_id", "benchmark_id", "benchmark_version", "runtime", "resource_limits", "verification_policy"],
);

export const manifestSchema = bundleObject(
  "manifest",
  {
    bundle_id: stringSchema(),
    run_identity: runIdentitySchema,
    benchmark: benchmarkIdentitySchema,
    task_package_digest: digestSchema(),
    execution_contract_digest: digestSchema(),
    tolerance_policy_ref: stringSchema(),
    tolerance_policy_digest: digestSchema(),
    registration_ref: stringSchema(),
    registration_digest: digestSchema(),
    requested_trust_tier: enumSchema(TRUST_TIERS),
    repeatability_class: enumSchema(REPEATABILITY_CLASSES),
    evidence: manifestEvidenceSchema,
    trace: manifestTraceSchema,
    artifacts: manifestArtifactsSchema,
    submission_profile: enumSchema(SUBMISSION_PROFILES),
    comparison_mode: enumSchema(COMPARISON_MODES),
    created_at: dateTimeSchema(),
  },
  [
    "bundle_id",
    "run_identity",
    "benchmark",
    "task_package_digest",
    "execution_contract_digest",
    "tolerance_policy_ref",
    "tolerance_policy_digest",
    "requested_trust_tier",
    "repeatability_class",
    "evidence",
    "trace",
    "artifacts",
  ],
);

export const aggregateSchema = bundleObject(
  "aggregate",
  {
    attempt_id: stringSchema(),
    n_tasks: integerSchema(1),
    success_count: integerSchema(0),
    success_rate: numberSchema(0),
    average_score: numberSchema(0),
    total_cost_usd: numberSchema(0),
    average_duration_ms: numberSchema(0),
  },
  ["attempt_id", "n_tasks", "success_count", "success_rate", "average_score", "total_cost_usd", "average_duration_ms"],
);

export const taskResultEntrySchema = bundleObject(
  "task-result-entry",
  {
    task_id: stringSchema(),
    status: enumSchema(TASK_RESULT_STATUSES),
    score: numberSchema(0),
    duration_ms: numberSchema(0),
    cost_usd: numberSchema(0),
    summary: stringSchema(),
  },
  ["task_id", "status", "score", "duration_ms", "cost_usd", "summary"],
);

export const artifactManifestSchema = bundleObject(
  "artifact-manifest",
  {
    bundle_id: stringSchema(),
    artifacts: arrayOf(artifactRecordSchema, 1),
  },
  ["bundle_id", "artifacts"],
);

export const evaluatorReportSchema = bundleObject(
  "evaluator-report",
  {
    attempt_id: stringSchema(),
    terminal_status: {
      type: "string",
      const: "completed",
    },
    n_tasks: integerSchema(1),
    passed_tasks: integerSchema(0),
    failed_tasks: integerSchema(0),
  },
  ["attempt_id", "terminal_status", "n_tasks", "passed_tasks", "failed_tasks"],
);

export const runGroupRegistrationSchema = bundleObject(
  "run-group-registration",
  {
    registration_id: stringSchema(),
    registration_digest: digestSchema(),
    study_id: stringSchema(),
    run_group_id: stringSchema(),
    registration_mode: enumSchema(REGISTRATION_MODES),
    benchmark_id: stringSchema(),
    benchmark_version: stringSchema(),
    lane_id: stringSchema(),
    split: enumSchema(SPLITS),
    task_package_digest: digestSchema(),
    execution_contract_digest: digestSchema(),
    tolerance_policy_digest: digestSchema(),
    repeatability_class: enumSchema(REPEATABILITY_CLASSES),
    declared_attempt_total: integerSchema(1),
    declared_task_total: integerSchema(1),
    attempt_plan_hash: digestSchema(),
    seed_list_hash: digestSchema(),
    budget_policy_id: stringSchema(),
    tool_policy_id: stringSchema(),
    timeout_policy_id: stringSchema(),
    declared_autonomy_mode: enumSchema(AUTONOMY_MODES),
    benchmark_tuned_flag: booleanSchema(),
    requested_trust_tier: enumSchema(TRUST_TIERS),
    submission_window: submissionWindowSchema,
    randomness_fingerprint_hint: randomnessFingerprintHintSchema,
    request_template_hash: digestSchema(),
    provider_snapshot_lock: stringSchema(),
    provider_release_window: {
      type: "object",
      additionalProperties: false,
      properties: {
        not_before: dateTimeSchema(),
        not_after: dateTimeSchema(),
      },
      required: ["not_before", "not_after"],
    },
  },
  [
    "registration_id",
    "study_id",
    "run_group_id",
    "registration_mode",
    "benchmark_id",
    "benchmark_version",
    "lane_id",
    "split",
    "task_package_digest",
    "execution_contract_digest",
    "tolerance_policy_digest",
    "repeatability_class",
    "declared_attempt_total",
    "declared_task_total",
    "attempt_plan_hash",
    "budget_policy_id",
    "tool_policy_id",
    "timeout_policy_id",
    "declared_autonomy_mode",
    "benchmark_tuned_flag",
    "requested_trust_tier",
  ],
);

export const completenessProofSchema = bundleObject(
  "completeness-proof",
  {
    proof_id: stringSchema(),
    run_group_id: stringSchema(),
    registration_digest: digestSchema(),
    expected_attempt_total: integerSchema(1),
    observed_attempt_total: integerSchema(0),
    slot_coverage_rate: numberSchema(0),
    missing_slots: arrayOf(stringSchema()),
    unexpected_attempts: arrayOf(stringSchema()),
    duplicate_attempts: arrayOf(stringSchema()),
    replacement_attempts: arrayOf(stringSchema()),
    task_coverage_summary: {
      type: "object",
      additionalProperties: false,
      properties: {
        declared_task_denominator: integerSchema(1),
        scorable_task_denominator: integerSchema(0),
        coverage_rate: numberSchema(0),
      },
      required: ["declared_task_denominator", "scorable_task_denominator", "coverage_rate"],
    },
    attempt_terminal_status_histogram: recordOfNumbers(),
    completeness_verdict: enumSchema(COMPLETENESS_VERDICTS),
    tier_eligibility_effect: enumSchema(TIER_ELIGIBILITY_EFFECTS),
  },
  [
    "proof_id",
    "run_group_id",
    "registration_digest",
    "expected_attempt_total",
    "observed_attempt_total",
    "slot_coverage_rate",
    "missing_slots",
    "unexpected_attempts",
    "duplicate_attempts",
    "replacement_attempts",
    "task_coverage_summary",
    "attempt_terminal_status_histogram",
    "completeness_verdict",
    "tier_eligibility_effect",
  ],
);

export const interactionSummarySchema = bundleObject(
  "interaction-summary",
  {
    human_event_count: integerSchema(0),
    approval_event_count: integerSchema(0),
    interactive_event_count: integerSchema(0),
    tty_freeform_input_detected: booleanSchema(),
    manual_command_detected: booleanSchema(),
    manual_file_write_detected: booleanSchema(),
    editor_interaction_detected: booleanSchema(),
    tty_input_digest: {
      anyOf: [
        digestSchema(),
        {
          type: "string",
          const: "ZERO_INPUT_V1",
        },
      ],
    },
    approval_target_linkage_complete: booleanSchema(),
    interaction_log_complete: booleanSchema(),
    classification_verdict: enumSchema(AUTONOMY_MODES),
  },
  [
    "human_event_count",
    "approval_event_count",
    "interactive_event_count",
    "tty_freeform_input_detected",
    "manual_command_detected",
    "manual_file_write_detected",
    "editor_interaction_detected",
    "tty_input_digest",
    "approval_target_linkage_complete",
  ],
);

export const environmentReportSchema = bundleObject(
  "environment-report",
  {
    attempt_id: stringSchema(),
    container_digest: digestSchema(),
    network_policy_digest: digestSchema(),
    official_runner_attested: booleanSchema(),
    mount_manifest_hash: digestSchema(),
    env_allowlist_hash: digestSchema(),
    workspace_snapshot_hash_before: digestSchema(),
    workspace_snapshot_hash_after: digestSchema(),
    network_proxy_log_digest: digestSchema(),
    memory_scope: enumSchema(MEMORY_SCOPES),
    cache_namespace: stringSchema(),
    state_reset_policy: stringSchema(),
    state_reset_proof: stringSchema(),
    external_kb_enabled: booleanSchema(),
    external_kb_digest_list: arrayOf(digestSchema()),
  },
  [
    "attempt_id",
    "container_digest",
    "network_policy_digest",
    "workspace_snapshot_hash_before",
    "workspace_snapshot_hash_after",
    "memory_scope",
    "cache_namespace",
    "state_reset_policy",
    "state_reset_proof",
    "external_kb_enabled",
    "external_kb_digest_list",
  ],
);

export const traceIntegritySchema = bundleObject(
  "trace-integrity",
  {
    trace_file: stringSchema(),
    trace_root_hash: digestSchema(),
    line_count: integerSchema(0),
    event_chain_complete: booleanSchema(),
    event_hash_chain_mode: enumSchema(TRACE_HASH_CHAIN_MODES),
    trace_file_count: integerSchema(0),
    event_count: integerSchema(0),
  },
  ["trace_file", "trace_root_hash", "line_count", "event_chain_complete"],
);

export const verificationRecordSchema = bundleObject(
  "verification-record",
  {
    verification_record_id: stringSchema(),
    subject_ref: verificationSubjectRefSchema,
    subject_bundle_digest: digestSchema(),
    requested_trust_tier: enumSchema(TRUST_TIERS),
    trust_tier: enumSchema(TRUST_TIERS),
    publication_state: enumSchema(PUBLICATION_STATES),
    board_disposition: enumSchema([
      "active",
      "suspended",
      "historical_only",
      "hidden",
    ] as const),
    state_summary: stringSchema(),
    state_history: arrayOf(publicationStateEventSchema),
    autonomy_mode: enumSchema(AUTONOMY_MODES),
    evidence_channel_mode: enumSchema(EVIDENCE_CHANNEL_MODES),
    visibility_class: enumSchema(VISIBILITY_CLASSES),
    release_policy: enumSchema(RELEASE_POLICIES),
    comparison_mode: enumSchema(COMPARISON_MODES),
    public_bundle_digest: digestSchema(),
    sealed_audit_bundle_digest: digestSchema(),
    completeness_verdict: enumSchema(COMPLETENESS_VERDICTS),
    interaction_summary_digest: digestSchema(),
    last_audited_at: dateTimeSchema(),
    decision_reason_codes: arrayOf(stringSchema()),
    board_admission: {
      type: "object",
      additionalProperties: false,
      properties: {
        official_verified: boardAdmissionDecisionSchema,
        reproducibility_frontier: boardAdmissionDecisionSchema,
        community_lab: boardAdmissionDecisionSchema,
      },
      required: ["official_verified", "reproducibility_frontier", "community_lab"],
    },
  },
  [
    "verification_record_id",
    "subject_ref",
    "subject_bundle_digest",
    "requested_trust_tier",
    "trust_tier",
    "publication_state",
    "autonomy_mode",
    "evidence_channel_mode",
    "visibility_class",
    "release_policy",
    "comparison_mode",
    "public_bundle_digest",
    "completeness_verdict",
    "last_audited_at",
    "decision_reason_codes",
  ],
);

export const schemaByObjectType: Record<ObjectType, JsonSchema> = {
  "benchmark-card": benchmarkCardSchema,
  "task-package": taskPackageSchema,
  "execution-contract": executionContractSchema,
  manifest: manifestSchema,
  aggregate: aggregateSchema,
  "task-result-entry": taskResultEntrySchema,
  "artifact-manifest": artifactManifestSchema,
  "evaluator-report": evaluatorReportSchema,
  "run-group-registration": runGroupRegistrationSchema,
  "completeness-proof": completenessProofSchema,
  "interaction-summary": interactionSummarySchema,
  "environment-report": environmentReportSchema,
  "trace-integrity": traceIntegritySchema,
  "verification-record": verificationRecordSchema,
};

export interface SchemaCatalogEntry {
  object_type: ObjectType;
  schema_id: string;
  title: string;
}

export const schemaCatalog: {
  schema_catalog_version: typeof SCHEMA_CATALOG_VERSION;
  bundle_protocol_version: typeof BUNDLE_PROTOCOL_VERSION;
  object_types: typeof OBJECT_TYPES;
  entries: SchemaCatalogEntry[];
} = {
  schema_catalog_version: SCHEMA_CATALOG_VERSION,
  bundle_protocol_version: BUNDLE_PROTOCOL_VERSION,
  object_types: OBJECT_TYPES,
  entries: OBJECT_TYPES.map((objectType) => {
    const schema = schemaByObjectType[objectType];

    return {
      object_type: objectType,
      schema_id: schema.$id ?? objectType,
      title: schema.title ?? objectType,
    };
  }),
};
