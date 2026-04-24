import type {
  Aggregate as SharedAggregate,
  ArtifactManifest as SharedArtifactManifest,
  BenchmarkCard as SharedBenchmarkCard,
  CompletenessProof as SharedCompletenessProof,
  ComparisonMode as SharedComparisonMode,
  DigestString,
  EnvironmentReport as SharedEnvironmentReport,
  EvaluatorReport as SharedEvaluatorReport,
  EvidenceChannelMode as SharedEvidenceChannelMode,
  ExecutionContract as SharedExecutionContract,
  InteractionSummary as SharedInteractionSummary,
  Manifest as SharedManifest,
  ReleasePolicy as SharedReleasePolicy,
  RepeatabilityClass as SharedRepeatabilityClass,
  RunGroupRegistration as SharedRunGroupRegistration,
  SubmissionProfile as SharedSubmissionProfile,
  TaskPackage as SharedTaskPackage,
  TaskResultEntry as SharedTaskResultEntry,
  TraceIntegrity as SharedTraceIntegrity,
  TrustTier as SharedTrustTier,
  VerificationRecord as SharedVerificationRecord,
  VisibilityClass as SharedVisibilityClass,
} from "@ohbp/types";

export type ValidationLayer = "schema" | "semantics" | "integrity";
export type ValidationSeverity = "info" | "warning" | "error";
export type ValidationMode =
  | "local_pack"
  | "local_validate"
  | "platform_intake"
  | "reproduced_audit"
  | "verified_audit";

export type DerivedEffectCode =
  | "bundle_ready"
  | "requires_review"
  | "reject_bundle"
  | "needs_sealed_companion"
  | "ineligible_for_trust_upgrade";

export type RequestedTrustTier = SharedTrustTier;
export type EvidenceChannelMode = SharedEvidenceChannelMode;
export type VisibilityClass = SharedVisibilityClass;
export type ReleasePolicy = SharedReleasePolicy;
export type RepeatabilityClass = SharedRepeatabilityClass;
export type SubmissionProfile = SharedSubmissionProfile;
export type ComparisonMode = SharedComparisonMode;
export type RunGroupRegistration = SharedRunGroupRegistration;

export type BundleManifest = SharedManifest;
export type BundleRegistration = SharedRunGroupRegistration;
export type BundleVerificationRecord = SharedVerificationRecord;
export type BundleTraceIntegrity = SharedTraceIntegrity;
export type BundleInteractionSummary = SharedInteractionSummary;
export type BundleEnvironmentReport = SharedEnvironmentReport;
export type BundleCompletenessProof = SharedCompletenessProof;
export type BundleBenchmarkCard = SharedBenchmarkCard;
export type BundleTaskPackage = SharedTaskPackage;
export type BundleExecutionContract = SharedExecutionContract;
export type BundleAggregate = SharedAggregate;
export type BundleEvaluatorReport = SharedEvaluatorReport;
export type BundleArtifactManifest = SharedArtifactManifest;
export type BundleTaskResultEntry = SharedTaskResultEntry;

export interface ValidationFinding {
  id: string;
  rule_id: string;
  layer: ValidationLayer;
  severity: ValidationSeverity;
  message: string;
  blocking: boolean;
  path?: string;
  object_ref?: string;
  expected?: unknown;
  observed?: unknown;
  effect?: DerivedEffectCode;
}

export interface DerivedEffect {
  code: DerivedEffectCode;
  reason: string;
}

export interface ValidationReport {
  protocol_version: string;
  validation_mode: ValidationMode;
  bundle_root: string;
  bundle_digest?: DigestString;
  overall_verdict: "pass" | "warn" | "fail";
  findings: ValidationFinding[];
  derived_effects: DerivedEffect[];
  computed_digests: Record<string, DigestString>;
  object_inventory: string[];
  started_at: string;
  completed_at: string;
}

export interface ValidationRuleResult {
  findings?: ValidationFinding[];
  computed_digests?: Record<string, DigestString>;
}

export interface ValidationRule {
  id: string;
  layer: ValidationLayer;
  description?: string;
  evaluate: (
    context: ValidationContext,
  ) => Promise<ValidationRuleResult | ValidationFinding[] | void>;
}

export interface BundleFileIndex {
  root: string;
  files: Record<string, string>;
}

export interface ValidationContext {
  protocol_version: string;
  validation_mode: ValidationMode;
  public_bundle_root: string;
  sealed_bundle_root?: string;
  public_bundle: BundleFileIndex;
  sealed_bundle?: BundleFileIndex;
  checksums_text?: string;
  sealed_checksums_text?: string;
  manifest?: BundleManifest;
  registration?: BundleRegistration;
  benchmark_card?: BundleBenchmarkCard;
  task_package?: BundleTaskPackage;
  execution_contract?: BundleExecutionContract;
  aggregate?: BundleAggregate;
  evaluator_report?: BundleEvaluatorReport;
  artifact_manifest?: BundleArtifactManifest;
  interaction_summary?: BundleInteractionSummary;
  trace_integrity?: BundleTraceIntegrity;
  environment_report?: BundleEnvironmentReport;
  completeness_proof?: BundleCompletenessProof;
  verification_record?: BundleVerificationRecord;
  attempt_plan?: string[];
  task_results?: BundleTaskResultEntry[];
  sealed_task_results?: BundleTaskResultEntry[];
  public_trace_text?: string;
  public_trace_line_count?: number;
  public_interaction_log_text?: string;
  public_interaction_log_line_count?: number;
  redactions?: Record<string, unknown>;
  sealed_trace_text?: string;
  sealed_trace_line_count?: number;
  sealed_interaction_log_text?: string;
  sealed_interaction_log_line_count?: number;
}

export interface LoadValidationContextOptions {
  publicBundleRoot: string;
  sealedBundleRoot?: string;
  validationMode?: ValidationMode;
  protocolVersion?: string;
}

export interface ChecksumEntry {
  path: string;
  sha256: DigestString;
}

export interface BundleConventions {
  publicTracePath: string;
  publicInteractionLogPath: string;
  publicRedactionsPath: string;
  attemptPlanPath: string;
}
