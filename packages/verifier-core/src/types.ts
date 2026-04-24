import type {
  AutonomyMode,
  BoardDisposition as SharedBoardDisposition,
  BoardAdmissionDecision as SharedBoardAdmissionDecision,
  ComparisonMode,
  CompletenessProof as SharedCompletenessProof,
  DigestString,
  EvidenceChannelMode,
  InteractionSummary as SharedInteractionSummary,
  PublicationStateEvent as SharedPublicationStateEvent,
  PublicationState,
  ReleasePolicy,
  RepeatabilityClass,
  SubmissionProfile,
  TrustTier,
  VerificationRecord as SharedVerificationRecord,
  VisibilityClass,
} from "@ohbp/types";

export type {
  AutonomyMode,
  SharedBoardDisposition as BoardDisposition,
  ComparisonMode,
  DigestString,
  EvidenceChannelMode,
  PublicationState,
  SharedPublicationStateEvent as PublicationStateEvent,
  ReleasePolicy,
  RepeatabilityClass,
  SubmissionProfile,
  TrustTier,
  VisibilityClass,
};

export type BudgetClass = "budget" | "standard" | "premium";
export type BoardId =
  | "official-verified"
  | "reproducibility-frontier"
  | "community-lab";

export interface BenchmarkHealthSnapshot {
  freshness_tier: "fresh" | "active" | "aging" | "legacy";
  contamination_tier: "low" | "medium" | "high";
  reporting_completeness: "high" | "medium" | "low";
  last_audit_at: string;
  health_snapshot_version: string;
}

export interface BenchmarkDescriptor {
  id: string;
  version: string;
  lane_id: string;
  split: "public" | "hidden" | "holdout" | "rotating";
  health: BenchmarkHealthSnapshot;
}

export interface ParticipantDescriptor {
  id: string;
  label: string;
  provider?: string;
  version?: string;
}

export interface MetricsBundle {
  success_rate: number;
  median_cost_usd: number;
  p95_latency_ms: number;
  stability_score: number;
  reproducibility_score: number;
}

export type InteractionTelemetry = Omit<
  SharedInteractionSummary,
  "protocol_version" | "classification_verdict"
> & {
  interaction_log_complete: boolean;
};

export interface ProviderReleaseWindow {
  not_before: string;
  not_after: string;
}

export interface MockSubmissionPayload {
  submission_id?: string;
  study_id?: string;
  run_group_id?: string;
  attempt_id?: string;
  bundle_id?: string;
  entry_id?: string;
  submission_profile?: SubmissionProfile;
  requested_trust_tier?: TrustTier;
  benchmark?: Partial<BenchmarkDescriptor>;
  model?: Partial<ParticipantDescriptor>;
  harness?: Partial<ParticipantDescriptor>;
  metrics?: Partial<MetricsBundle>;
  n_runs?: number;
  n_tasks?: number;
  declared_attempt_total?: number;
  observed_attempt_total?: number;
  benchmark_tuned_flag?: boolean;
  repeatability_class?: RepeatabilityClass;
  comparison_mode?: ComparisonMode;
  budget_class?: BudgetClass;
  evidence_channel_mode?: EvidenceChannelMode;
  visibility_class?: VisibilityClass;
  release_policy?: ReleasePolicy;
  declared_autonomy_mode?: AutonomyMode;
  telemetry?: Partial<InteractionTelemetry>;
  tolerance_policy_digest?: DigestString;
  execution_contract_digest?: DigestString;
  task_package_digest?: DigestString;
  registration_digest?: DigestString;
  public_bundle_digest?: DigestString;
  sealed_audit_bundle_digest?: DigestString;
  provider_release_window?: ProviderReleaseWindow;
  support_count?: number;
  notes?: string[];
  tags?: string[];
  submitted_at?: string;
}

export interface MockUploadInput {
  bundle_path?: string;
  normalized_payload?: MockSubmissionPayload;
  source?: "api" | "seed";
  received_at?: string;
}

export interface NormalizedSubmission {
  submission_id: string;
  study_id: string;
  run_group_id: string;
  attempt_id: string;
  bundle_id: string;
  entry_id: string;
  submission_profile: SubmissionProfile;
  requested_trust_tier: TrustTier;
  benchmark: BenchmarkDescriptor;
  model: ParticipantDescriptor;
  harness: ParticipantDescriptor;
  metrics: MetricsBundle;
  n_runs: number;
  n_tasks: number;
  declared_attempt_total: number;
  observed_attempt_total: number;
  benchmark_tuned_flag: boolean;
  repeatability_class: RepeatabilityClass;
  comparison_mode: ComparisonMode;
  budget_class: BudgetClass;
  evidence_channel_mode: EvidenceChannelMode;
  visibility_class: VisibilityClass;
  release_policy: ReleasePolicy;
  declared_autonomy_mode: AutonomyMode;
  telemetry?: InteractionTelemetry;
  tolerance_policy_digest: DigestString;
  execution_contract_digest: DigestString;
  task_package_digest: DigestString;
  registration_digest: DigestString;
  public_bundle_digest: DigestString;
  sealed_audit_bundle_digest?: DigestString;
  provider_release_window?: ProviderReleaseWindow;
  support_count: number;
  notes: string[];
  tags: string[];
  submitted_at: string;
}

export interface UploadReceipt {
  receipt_id: string;
  submission_id: string;
  received_at: string;
  requested_trust_tier: TrustTier;
  submission_profile: SubmissionProfile;
  intake_status: "accepted" | "accepted_with_warnings";
  storage_refs: {
    submission_store_key: string;
    public_bundle_digest: DigestString;
  };
  warnings: string[];
  next_actions: string[];
}

export type ValidationCorrectionValue = string | number | boolean | null;

export interface ValidationCorrection {
  field: string;
  declared?: ValidationCorrectionValue;
  corrected?: ValidationCorrectionValue;
  reason: string;
}

export interface PublicationGovernanceDirective {
  submission_id?: string;
  entry_id?: string;
  public_bundle_digest?: DigestString;
  publication_state: PublicationState;
  reason_code: string;
  summary: string;
  at: string;
  actor?: string;
}

export type CompletenessProof = SharedCompletenessProof;
export type BoardAdmissionDecision = SharedBoardAdmissionDecision;

export interface VerificationRecord
  extends Omit<SharedVerificationRecord, "board_admission"> {
  board_admission: {
    official_verified: BoardAdmissionDecision;
    reproducibility_frontier: BoardAdmissionDecision;
    community_lab: BoardAdmissionDecision;
  };
}

export interface PublicationRecord {
  entry_id: string;
  submission: NormalizedSubmission;
  upload_receipt: UploadReceipt;
  intake_validation?: StoredSubmissionRecord["validation_summary"];
  completeness_proof: CompletenessProof;
  verification_record: VerificationRecord;
  history: Array<{
    at: string;
    label: string;
    detail: string;
  }>;
}

export interface StoredSubmissionRecord {
  bundle_path?: string;
  source: "api" | "seed";
  uploaded_at: string;
  validation_summary?: {
    overall_verdict: "pass" | "warn" | "fail";
    finding_count: number;
    bundle_digest?: DigestString;
    validated_at: string;
    source_of_truth_mode: "validated_bundle_truth";
    manifest_declared_public_bundle_digest?: DigestString;
    validated_public_bundle_digest?: DigestString;
    manifest_declared_sealed_audit_bundle_digest?: DigestString;
    validated_sealed_audit_bundle_digest?: DigestString;
    client_claimed_observed_attempt_total?: number;
    corrected_fields: string[];
    corrections: ValidationCorrection[];
  };
  normalized_payload: NormalizedSubmission;
  upload_receipt: UploadReceipt;
  governance_directives?: PublicationGovernanceDirective[];
}
