import type {
  ArtifactRole,
  AutonomyMode,
  ComparisonMode,
  CompletenessVerdict,
  DigestString,
  EvidenceChannelMode,
  MemoryScope,
  ObjectType,
  PublicationState,
  RegistrationMode,
  ReleasePolicy,
  RepeatabilityClass,
  Split,
  SubmissionProfile,
  TaskResultStatus,
  TierEligibilityEffect,
  TraceHashChainMode,
  TrustTier,
  VisibilityClass,
  ZeroInputDigest,
} from "./enums.js";
import { BUNDLE_PROTOCOL_VERSION, SCHEMA_CATALOG_VERSION } from "./enums.js";

export interface RegistryObject<TObjectType extends ObjectType> {
  schema_version: typeof SCHEMA_CATALOG_VERSION;
  object_type: TObjectType;
}

export interface BundleObject {
  protocol_version: typeof BUNDLE_PROTOCOL_VERSION;
}

export interface BenchmarkIdentity {
  id: string;
  version: string;
  lane_id: string;
  split: Split;
}

export interface RegistryBenchmarkDescriptor extends BenchmarkIdentity {
  title: string;
}

export interface RegistryRefs {
  task_package: string;
  execution_contract: string;
}

export interface BenchmarkCard extends RegistryObject<"benchmark-card"> {
  benchmark: RegistryBenchmarkDescriptor;
  description: string;
  comparison_mode: ComparisonMode;
  default_submission_profile: SubmissionProfile;
  registry_refs: RegistryRefs;
}

export interface TaskDefinition {
  task_id: string;
  prompt_id: string;
  title: string;
  difficulty: "core" | "stretch";
  tags: string[];
}

export interface TaskPackage extends RegistryObject<"task-package"> {
  task_package_id: string;
  benchmark_id: string;
  benchmark_version: string;
  lane_id: string;
  split: Split;
  tasks: TaskDefinition[];
}

export interface RuntimeContract {
  adapter_id: string;
  adapter_version: string;
  launcher: string;
  model_ref: string;
  container_digest: DigestString;
}

export interface ResourceLimits {
  max_steps: number;
  timeout_seconds: number;
  budget_usd: number;
}

export interface MetricRule {
  metric_id: string;
  level: "task" | "run_group";
  comparison_method: "abs_delta" | "relative_delta";
  threshold_abs: number;
  threshold_rel: number;
  directionality: "higher_is_better" | "lower_is_better";
  hard_fail: boolean;
}

export interface TolerancePolicy {
  tolerance_policy_id: string;
  tolerance_policy_version: string;
  applies_to_tiers: TrustTier[];
  allowed_repeatability_classes: RepeatabilityClass[];
  comparison_unit: "run_group";
  statistical_protocol: "point_estimate_with_iqr";
  metric_rules: MetricRule[];
  missingness_rule: string;
  replay_rule: string;
  reproduce_rule: string;
  promotion_gate: string;
}

export interface VerificationPolicy {
  required_bundle_members: string[];
  tolerance_policy: TolerancePolicy;
}

export interface ExecutionContract extends RegistryObject<"execution-contract"> {
  execution_contract_id: string;
  benchmark_id: string;
  benchmark_version: string;
  runtime: RuntimeContract;
  resource_limits: ResourceLimits;
  verification_policy: VerificationPolicy;
}

export interface RunIdentity {
  study_id: string;
  run_group_id: string;
  attempt_id: string;
  bundle_id: string;
}

export interface ManifestEvidence {
  evidence_channel_mode: EvidenceChannelMode;
  visibility_class: VisibilityClass;
  release_policy: ReleasePolicy;
  public_bundle_digest?: DigestString | null;
  sealed_audit_bundle_digest?: DigestString | null;
  redaction_policy_id?: string | null;
}

export interface ManifestTraceRefs {
  trace_root_hash: DigestString;
  trace_ref: string;
  interaction_log_ref: string;
  interaction_summary_ref: string;
  trace_integrity_ref: string;
  environment_report_ref?: string;
  completeness_proof_ref?: string;
  verification_record_ref?: string;
}

export interface ManifestArtifactRefs {
  task_results_ref: string;
  aggregate_ref: string;
  evaluator_report_ref: string;
  artifact_manifest_ref?: string;
  checksums_ref: string;
}

export interface Manifest extends BundleObject {
  bundle_id: string;
  run_identity: RunIdentity;
  benchmark: BenchmarkIdentity;
  task_package_digest: DigestString;
  execution_contract_digest: DigestString;
  tolerance_policy_ref: string;
  tolerance_policy_digest: DigestString;
  registration_ref?: string | null;
  registration_digest?: DigestString | null;
  requested_trust_tier: TrustTier;
  repeatability_class: RepeatabilityClass;
  evidence: ManifestEvidence;
  trace: ManifestTraceRefs;
  artifacts: ManifestArtifactRefs;
  submission_profile?: SubmissionProfile;
  comparison_mode?: ComparisonMode;
  created_at?: string;
}

export interface Aggregate extends BundleObject {
  attempt_id: string;
  n_tasks: number;
  success_count: number;
  success_rate: number;
  average_score: number;
  total_cost_usd: number;
  average_duration_ms: number;
}

export interface TaskResultEntry extends BundleObject {
  task_id: string;
  status: TaskResultStatus;
  score: number;
  duration_ms: number;
  cost_usd: number;
  summary: string;
}

export interface ArtifactRecord {
  artifact_id: string;
  path: string;
  media_type: string;
  sha256: DigestString;
  bytes: number;
  role: ArtifactRole;
}

export interface ArtifactManifest extends BundleObject {
  bundle_id: string;
  artifacts: ArtifactRecord[];
}

export interface EvaluatorReport extends BundleObject {
  attempt_id: string;
  terminal_status: "completed";
  n_tasks: number;
  passed_tasks: number;
  failed_tasks: number;
}

export interface SubmissionWindow {
  opens_at: string;
  closes_at: string;
  max_span_minutes: number;
}

export interface RandomnessFingerprintHint {
  provider_fingerprint?: string;
  sampler_config_hash?: DigestString;
  endpoint_profile_hash?: DigestString;
}

export interface ProviderReleaseWindow {
  not_before: string;
  not_after: string;
}

export interface RunGroupRegistration extends BundleObject {
  registration_id: string;
  registration_digest?: DigestString;
  study_id: string;
  run_group_id: string;
  registration_mode: RegistrationMode;
  benchmark_id: string;
  benchmark_version: string;
  lane_id: string;
  split: Split;
  task_package_digest: DigestString;
  execution_contract_digest: DigestString;
  tolerance_policy_digest: DigestString;
  repeatability_class: RepeatabilityClass;
  declared_attempt_total: number;
  declared_task_total: number;
  attempt_plan_hash: DigestString;
  seed_list_hash?: DigestString;
  budget_policy_id: string;
  tool_policy_id: string;
  timeout_policy_id: string;
  declared_autonomy_mode: AutonomyMode;
  benchmark_tuned_flag: boolean;
  requested_trust_tier: TrustTier;
  submission_window?: SubmissionWindow;
  randomness_fingerprint_hint?: RandomnessFingerprintHint;
  request_template_hash?: DigestString;
  provider_snapshot_lock?: string;
  provider_release_window?: ProviderReleaseWindow;
}

export interface CompletenessTaskCoverageSummary {
  declared_task_denominator: number;
  scorable_task_denominator: number;
  coverage_rate: number;
}

export interface CompletenessProof extends BundleObject {
  proof_id: string;
  run_group_id: string;
  registration_digest: DigestString;
  expected_attempt_total: number;
  observed_attempt_total: number;
  slot_coverage_rate: number;
  missing_slots: string[];
  unexpected_attempts: string[];
  duplicate_attempts: string[];
  replacement_attempts: string[];
  task_coverage_summary: CompletenessTaskCoverageSummary;
  attempt_terminal_status_histogram: Record<string, number>;
  completeness_verdict: CompletenessVerdict;
  tier_eligibility_effect: TierEligibilityEffect;
}

export interface InteractionSummary extends BundleObject {
  human_event_count: number;
  approval_event_count: number;
  interactive_event_count: number;
  tty_freeform_input_detected: boolean;
  manual_command_detected: boolean;
  manual_file_write_detected: boolean;
  editor_interaction_detected: boolean;
  tty_input_digest: DigestString | ZeroInputDigest;
  approval_target_linkage_complete: boolean;
  interaction_log_complete?: boolean;
  classification_verdict?: AutonomyMode;
}

export interface EnvironmentReport extends BundleObject {
  attempt_id: string;
  container_digest: DigestString;
  network_policy_digest: DigestString;
  official_runner_attested?: boolean;
  mount_manifest_hash?: DigestString;
  env_allowlist_hash?: DigestString;
  workspace_snapshot_hash_before: DigestString;
  workspace_snapshot_hash_after: DigestString;
  network_proxy_log_digest?: DigestString;
  memory_scope: MemoryScope;
  cache_namespace: string;
  state_reset_policy: string;
  state_reset_proof: string;
  external_kb_enabled: boolean;
  external_kb_digest_list: DigestString[];
}

export interface TraceIntegrity extends BundleObject {
  trace_file: string;
  trace_root_hash: DigestString;
  line_count: number;
  event_chain_complete: boolean;
  event_hash_chain_mode?: TraceHashChainMode;
  trace_file_count?: number;
  event_count?: number;
}

export interface VerificationSubjectRef {
  subject_type: "attempt_bundle";
  study_id: string;
  run_group_id: string;
  attempt_id: string;
  bundle_id: string;
}

export interface BoardAdmissionDecision {
  eligible: boolean;
  satisfied_reasons: string[];
  blocked_reasons: string[];
  next_actions: string[];
}

export type BoardDisposition =
  | "active"
  | "suspended"
  | "historical_only"
  | "hidden";

export interface PublicationStateEvent {
  at: string;
  from_state?: PublicationState;
  to_state: PublicationState;
  actor: string;
  reason_code: string;
  summary: string;
}

export interface VerificationRecord extends BundleObject {
  verification_record_id: string;
  subject_ref: VerificationSubjectRef;
  subject_bundle_digest: DigestString;
  requested_trust_tier: TrustTier;
  trust_tier: TrustTier;
  publication_state: PublicationState;
  board_disposition?: BoardDisposition;
  state_summary?: string;
  state_history?: PublicationStateEvent[];
  autonomy_mode: AutonomyMode;
  evidence_channel_mode: EvidenceChannelMode;
  visibility_class: VisibilityClass;
  release_policy: ReleasePolicy;
  comparison_mode: ComparisonMode;
  public_bundle_digest: DigestString;
  sealed_audit_bundle_digest?: DigestString;
  completeness_verdict: CompletenessVerdict;
  interaction_summary_digest?: DigestString;
  last_audited_at: string;
  decision_reason_codes: string[];
  board_admission?: {
    official_verified: BoardAdmissionDecision;
    reproducibility_frontier: BoardAdmissionDecision;
    community_lab: BoardAdmissionDecision;
  };
}

export interface SampleRegistryContext {
  benchmarkCard: BenchmarkCard;
  taskPackage: TaskPackage;
  executionContract: ExecutionContract;
  benchmarkHealth?: {
    benchmark_id: string;
    benchmark_version: string;
    lane_id: string;
    split: Split;
    freshness_tier: "fresh" | "active" | "aging" | "legacy";
    contamination_tier: "low" | "medium" | "high";
    reporting_completeness: "complete" | "partial" | "high" | "medium" | "low";
    last_audit_at: string;
    health_snapshot_version?: string;
  };
}
