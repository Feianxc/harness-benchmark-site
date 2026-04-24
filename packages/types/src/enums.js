export const SCHEMA_CATALOG_VERSION = "ohbp.v0.1";
export const BUNDLE_PROTOCOL_VERSION = "0.1";
export const OBJECT_TYPES = [
    "benchmark-card",
    "task-package",
    "execution-contract",
    "manifest",
    "aggregate",
    "task-result-entry",
    "artifact-manifest",
    "evaluator-report",
    "run-group-registration",
    "completeness-proof",
    "interaction-summary",
    "environment-report",
    "trace-integrity",
    "verification-record",
];
export const TRUST_TIERS = ["community", "reproduced", "verified"];
export const PUBLICATION_STATES = [
    "submitted",
    "provisional",
    "published",
    "disputed",
    "corrected",
    "invalidated",
    "rejected",
    "archived",
];
export const AUTONOMY_MODES = ["autonomous", "approval_only", "interactive"];
export const EVIDENCE_CHANNEL_MODES = ["public_only", "public_plus_sealed"];
export const VISIBILITY_CLASSES = [
    "public_full",
    "public_redacted",
    "public_summary",
    "sealed_pending_publication",
];
export const RELEASE_POLICIES = [
    "public_immediate",
    "delayed_until_date",
    "delayed_until_legacy",
    "summary_only_permanent",
];
export const REPEATABILITY_CLASSES = ["true_seeded", "pseudo_repeated"];
export const SUBMISSION_PROFILES = [
    "community_light",
    "reproducible_standard",
    "verified_full",
];
export const COMPARISON_MODES = [
    "fixed_model_compare_harness",
    "fixed_harness_compare_model",
    "system_combination",
];
export const SPLITS = ["public", "hidden", "holdout", "rotating"];
export const REGISTRATION_MODES = ["connected_mode", "offline_provisional"];
export const COMPLETENESS_VERDICTS = [
    "complete",
    "incomplete",
    "overreported",
    "duplicate_conflict",
    "tampered",
];
export const TIER_ELIGIBILITY_EFFECTS = [
    "eligible",
    "blocked",
    "eligible_for_requested_tier",
];
export const TERMINAL_STATUSES = ["success", "failure", "timeout", "crash"];
export const TASK_RESULT_STATUSES = ["success", "failure"];
export const ARTIFACT_ROLES = ["primary_output", "trace", "log", "supporting"];
export const MEMORY_SCOPES = ["none", "attempt", "run_group", "benchmark", "project", "global"];
export const TRACE_HASH_CHAIN_MODES = ["per_event_hash_chain", "attested_trace_contract"];
export const ZERO_INPUT_DIGEST = "ZERO_INPUT_V1";
//# sourceMappingURL=enums.js.map