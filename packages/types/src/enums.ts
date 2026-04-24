export const SCHEMA_CATALOG_VERSION = "ohbp.v0.1" as const;
export const BUNDLE_PROTOCOL_VERSION = "0.1" as const;

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
] as const;

export type ObjectType = (typeof OBJECT_TYPES)[number];

export const TRUST_TIERS = ["community", "reproduced", "verified"] as const;
export type TrustTier = (typeof TRUST_TIERS)[number];

export const PUBLICATION_STATES = [
  "submitted",
  "provisional",
  "published",
  "disputed",
  "corrected",
  "invalidated",
  "rejected",
  "archived",
] as const;
export type PublicationState = (typeof PUBLICATION_STATES)[number];

export const AUTONOMY_MODES = ["autonomous", "approval_only", "interactive"] as const;
export type AutonomyMode = (typeof AUTONOMY_MODES)[number];

export const EVIDENCE_CHANNEL_MODES = ["public_only", "public_plus_sealed"] as const;
export type EvidenceChannelMode = (typeof EVIDENCE_CHANNEL_MODES)[number];

export const VISIBILITY_CLASSES = [
  "public_full",
  "public_redacted",
  "public_summary",
  "sealed_pending_publication",
] as const;
export type VisibilityClass = (typeof VISIBILITY_CLASSES)[number];

export const RELEASE_POLICIES = [
  "public_immediate",
  "delayed_until_date",
  "delayed_until_legacy",
  "summary_only_permanent",
] as const;
export type ReleasePolicy = (typeof RELEASE_POLICIES)[number];

export const REPEATABILITY_CLASSES = ["true_seeded", "pseudo_repeated"] as const;
export type RepeatabilityClass = (typeof REPEATABILITY_CLASSES)[number];

export const SUBMISSION_PROFILES = [
  "community_light",
  "reproducible_standard",
  "verified_full",
] as const;
export type SubmissionProfile = (typeof SUBMISSION_PROFILES)[number];

export const COMPARISON_MODES = [
  "fixed_model_compare_harness",
  "fixed_harness_compare_model",
  "system_combination",
] as const;
export type ComparisonMode = (typeof COMPARISON_MODES)[number];

export const SPLITS = ["public", "hidden", "holdout", "rotating"] as const;
export type Split = (typeof SPLITS)[number];

export const REGISTRATION_MODES = ["connected_mode", "offline_provisional"] as const;
export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

export const COMPLETENESS_VERDICTS = [
  "complete",
  "incomplete",
  "overreported",
  "duplicate_conflict",
  "tampered",
] as const;
export type CompletenessVerdict = (typeof COMPLETENESS_VERDICTS)[number];

export const TIER_ELIGIBILITY_EFFECTS = [
  "eligible",
  "blocked",
  "eligible_for_requested_tier",
] as const;
export type TierEligibilityEffect = (typeof TIER_ELIGIBILITY_EFFECTS)[number];

export const TERMINAL_STATUSES = ["success", "failure", "timeout", "crash"] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export const TASK_RESULT_STATUSES = ["success", "failure"] as const;
export type TaskResultStatus = (typeof TASK_RESULT_STATUSES)[number];

export const ARTIFACT_ROLES = ["primary_output", "trace", "log", "supporting"] as const;
export type ArtifactRole = (typeof ARTIFACT_ROLES)[number];

export const MEMORY_SCOPES = ["none", "attempt", "run_group", "benchmark", "project", "global"] as const;
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const TRACE_HASH_CHAIN_MODES = ["per_event_hash_chain", "attested_trace_contract"] as const;
export type TraceHashChainMode = (typeof TRACE_HASH_CHAIN_MODES)[number];

export const ZERO_INPUT_DIGEST = "ZERO_INPUT_V1" as const;
export type ZeroInputDigest = typeof ZERO_INPUT_DIGEST;

export type DigestString = string;
export type Sha256Hex = string;
