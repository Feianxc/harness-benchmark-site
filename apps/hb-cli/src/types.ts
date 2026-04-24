import type {
  BundleManifest,
  EvidenceChannelMode,
  ReleasePolicy,
  RepeatabilityClass,
  RequestedTrustTier,
  RunGroupRegistration,
  VisibilityClass,
} from "@ohbp/validator-core";

export type SubmissionProfile =
  | "community_light"
  | "reproducible_standard"
  | "verified_full";

export interface StudyConfig {
  protocol_version: BundleManifest["protocol_version"];
  study_id: string;
  run_group_id: string;
  submission_profile: SubmissionProfile;
  requested_trust_tier: RequestedTrustTier;
  benchmark: {
    id: string;
    version: string;
    lane_id: string;
    split: BundleManifest["benchmark"]["split"];
  };
  adapter: {
    id: "sample-adapter";
    preset_id: string;
  };
  attempt_ids: string[];
  task_ids: string[];
  repeatability_class: RepeatabilityClass;
  evidence_channel_mode: EvidenceChannelMode;
  visibility_class: VisibilityClass;
  release_policy: ReleasePolicy;
  created_at: string;
}

export interface RawTaskResult {
  protocol_version: BundleManifest["protocol_version"];
  task_id: string;
  status: "success" | "failure";
  score: number;
  duration_ms: number;
  cost_usd: number;
  summary: string;
}

export interface RunMetadata {
  protocol_version: string;
  study_id: string;
  run_group_id: string;
  attempt_id: string;
  adapter_id: string;
  seed: string;
  task_ids: string[];
  started_at: string;
  completed_at: string;
}

export interface AggregateReport {
  protocol_version: string;
  attempt_id: string;
  n_tasks: number;
  success_count: number;
  success_rate: number;
  average_score: number;
  total_cost_usd: number;
  average_duration_ms: number;
}

export interface EvaluatorReport {
  protocol_version: string;
  attempt_id: string;
  terminal_status: "completed";
  n_tasks: number;
  passed_tasks: number;
  failed_tasks: number;
}

export interface ScorecardSummary {
  bundle_id: string;
  requested_trust_tier: RequestedTrustTier;
  evidence_channel_mode: EvidenceChannelMode;
  visibility_class: VisibilityClass;
  public_bundle_digest?: string | null;
  success_rate: number;
  average_score: number;
  total_cost_usd: number;
  average_duration_ms: number;
  n_tasks: number;
}

export interface ResearchSummary {
  registration_digest?: string | null;
  trace_root_hash: string;
  bundle_root: string;
  task_results_ref: string;
  trace_ref: string;
  validation_verdict?: "pass" | "warn" | "fail";
  findings_count?: number;
}

export interface InitOptions {
  profile?: SubmissionProfile;
  attempts?: number;
  tasks?: number;
  requestedTrustTier?: RequestedTrustTier;
  repeatabilityClass?: RepeatabilityClass;
  sealed?: boolean;
  force?: boolean;
}

export interface InitResult {
  workspace_root: string;
  study_path: string;
  registration_path: string;
  study: StudyConfig;
  registration: RunGroupRegistration;
}

export interface RunResult {
  workspace_root: string;
  attempt_paths: string[];
}

export interface PackResult {
  workspace_root: string;
  bundle_root: string;
  manifest: BundleManifest;
}

export interface ValidateResult {
  workspace_root: string;
  bundle_root: string;
  report_path: string;
  report: import("@ohbp/validator-core").ValidationReport;
}

export interface InspectResult {
  scorecard: ScorecardSummary;
  research: ResearchSummary;
}

export interface UploadResult {
  request_path: string;
  receipt_path?: string;
  payload: Record<string, unknown>;
  receipt?: Record<string, unknown>;
}

export interface DoctorResult {
  workspace_root: string;
  checks: Array<{
    name: string;
    status: "ok" | "warn" | "fail";
    detail: string;
  }>;
}
