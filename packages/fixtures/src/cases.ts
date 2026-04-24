import {
  BUNDLE_PATHS,
  PUBLIC_CHECKSUM_ORDER,
  SEALED_CHECKSUM_ORDER,
  canonicalJsonText,
  canonicalNdjsonText,
  checksumsToBundleDigestHex,
  materializeChecksums,
  objectDigestHex,
  sha256Hex,
} from "@ohbp/canonical";
import type {
  Aggregate,
  ArtifactManifest,
  AutonomyMode,
  BoardAdmissionDecision,
  CompletenessProof,
  EnvironmentReport,
  EvaluatorReport,
  InteractionSummary,
  Manifest,
  PublicationState,
  RunGroupRegistration,
  SampleRegistryContext,
  SubmissionProfile,
  TaskPackage,
  TaskResultEntry,
  TraceIntegrity,
  TrustTier,
  VerificationRecord,
} from "@ohbp/types";
import { BUNDLE_PROTOCOL_VERSION, ZERO_INPUT_DIGEST } from "@ohbp/types";
import { sampleRegistryContexts, sampleRegistryDigests } from "./registry";

export interface FixtureBundle {
  manifest: Manifest;
  aggregate: Aggregate;
  task_results: TaskResultEntry[];
  artifact_manifest: ArtifactManifest;
  evaluator_report: EvaluatorReport;
  run_group_registration?: RunGroupRegistration;
  completeness_proof?: CompletenessProof;
  interaction_summary?: InteractionSummary;
  environment_report?: EnvironmentReport;
  trace_integrity: TraceIntegrity;
  verification_record?: VerificationRecord;
  checksums_sha256: string;
  sealed_checksums_sha256?: string;
  public_files: Record<string, string>;
  sealed_files?: Record<string, string>;
}

export interface FixtureExpectation {
  valid: boolean;
  reason_codes: string[];
}

export interface FixtureCase {
  id: string;
  variant: "golden" | "mutant";
  description: string;
  registry_context_key: "public" | "hidden";
  registry_context: SampleRegistryContext;
  bundle: FixtureBundle;
  expected: FixtureExpectation;
  mutated_from?: string;
}

interface TaskOutcome {
  status: TaskResultEntry["status"];
  score: number;
  cost_usd: number;
  duration_ms: number;
  summary: string;
}

interface CoreFixtureOptions {
  id: string;
  registry_context_key: "public" | "hidden";
  submission_profile: SubmissionProfile;
  requested_trust_tier: TrustTier;
  repeatability_class: Manifest["repeatability_class"];
  evidence_channel_mode: Manifest["evidence"]["evidence_channel_mode"];
  visibility_class: Manifest["evidence"]["visibility_class"];
  release_policy: Manifest["evidence"]["release_policy"];
  outcomes: TaskOutcome[];
  include_registration?: boolean;
  include_completeness?: boolean;
  include_interaction?: boolean;
  include_environment?: boolean;
  include_verification?: boolean;
  autonomy_mode?: AutonomyMode;
  publication_state?: PublicationState;
  trust_tier?: TrustTier;
  redaction_policy_id?: string;
  include_sealed_bundle?: boolean;
}

function cloneFixture<T>(value: T): T {
  return structuredClone(value);
}

function withJsonFile(files: Record<string, string>, relativePath: string, value: unknown): void {
  files[relativePath] = canonicalJsonText(value);
}

function withTextFile(files: Record<string, string>, relativePath: string, value: string): void {
  files[relativePath] = value.endsWith("\n") ? value : `${value}\n`;
}

function buildTaskResults(taskPackage: TaskPackage, outcomes: TaskOutcome[]): TaskResultEntry[] {
  const fallback = outcomes[outcomes.length - 1] ?? {
    status: "failure" as const,
    score: 0,
    cost_usd: 0,
    duration_ms: 0,
    summary: "No result available.",
  };

  return taskPackage.tasks.map((task, index) => {
    const outcome = outcomes[index] ?? fallback;

    return {
      protocol_version: BUNDLE_PROTOCOL_VERSION,
      task_id: task.task_id,
      status: outcome.status,
      score: outcome.score,
      duration_ms: outcome.duration_ms,
      cost_usd: outcome.cost_usd,
      summary: outcome.summary,
    };
  });
}

function buildAggregate(attemptId: string, taskResults: TaskResultEntry[]): Aggregate {
  const successCount = taskResults.filter((entry) => entry.status === "success").length;
  const totalScore = taskResults.reduce((sum, entry) => sum + entry.score, 0);
  const totalCost = taskResults.reduce((sum, entry) => sum + entry.cost_usd, 0);
  const totalDuration = taskResults.reduce((sum, entry) => sum + entry.duration_ms, 0);

  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    attempt_id: attemptId,
    n_tasks: taskResults.length,
    success_count: successCount,
    success_rate: Number((successCount / Math.max(taskResults.length, 1)).toFixed(3)),
    average_score: Number((totalScore / Math.max(taskResults.length, 1)).toFixed(3)),
    total_cost_usd: Number(totalCost.toFixed(3)),
    average_duration_ms: Number((totalDuration / Math.max(taskResults.length, 1)).toFixed(3)),
  };
}

function buildArtifactManifest(bundleId: string, taskResults: TaskResultEntry[]): ArtifactManifest {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    bundle_id: bundleId,
    artifacts: taskResults.map((entry) => ({
      artifact_id: `artifact-${bundleId}-${entry.task_id}`,
      path: `${BUNDLE_PATHS.payloads.root}/${entry.task_id}.txt`,
      media_type: "text/plain",
      sha256: sha256Hex(`artifact:${bundleId}:${entry.task_id}`),
      bytes: 64,
      role: "primary_output",
    })),
  };
}

function buildEvaluatorReport(attemptId: string, taskResults: TaskResultEntry[]): EvaluatorReport {
  const passedTasks = taskResults.filter((entry) => entry.status === "success").length;

  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    attempt_id: attemptId,
    terminal_status: "completed",
    n_tasks: taskResults.length,
    passed_tasks: passedTasks,
    failed_tasks: taskResults.length - passedTasks,
  };
}

function buildInteractionSummary(autonomyMode: AutonomyMode): InteractionSummary {
  if (autonomyMode === "approval_only") {
    return {
      protocol_version: BUNDLE_PROTOCOL_VERSION,
      human_event_count: 1,
      approval_event_count: 1,
      interactive_event_count: 0,
      tty_freeform_input_detected: false,
      manual_command_detected: false,
      manual_file_write_detected: false,
      editor_interaction_detected: false,
      tty_input_digest: ZERO_INPUT_DIGEST,
      approval_target_linkage_complete: true,
      interaction_log_complete: true,
      classification_verdict: "approval_only",
    };
  }

  if (autonomyMode === "interactive") {
    return {
      protocol_version: BUNDLE_PROTOCOL_VERSION,
      human_event_count: 1,
      approval_event_count: 0,
      interactive_event_count: 1,
      tty_freeform_input_detected: true,
      manual_command_detected: true,
      manual_file_write_detected: false,
      editor_interaction_detected: false,
      tty_input_digest: sha256Hex("fixture:tty:interactive"),
      approval_target_linkage_complete: false,
      interaction_log_complete: true,
      classification_verdict: "interactive",
    };
  }

  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    human_event_count: 0,
    approval_event_count: 0,
    interactive_event_count: 0,
    tty_freeform_input_detected: false,
    manual_command_detected: false,
    manual_file_write_detected: false,
    editor_interaction_detected: false,
    tty_input_digest: ZERO_INPUT_DIGEST,
    approval_target_linkage_complete: true,
    interaction_log_complete: true,
    classification_verdict: "autonomous",
  };
}

function buildEnvironmentReport(caseId: string, attemptId: string, includeAttestation = false): EnvironmentReport {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    attempt_id: attemptId,
    container_digest: sha256Hex(`container:${caseId}`),
    network_policy_digest: sha256Hex(`network:${caseId}`),
    official_runner_attested: includeAttestation,
    mount_manifest_hash: includeAttestation ? sha256Hex(`mount:${caseId}`) : undefined,
    env_allowlist_hash: includeAttestation ? sha256Hex(`allowlist:${caseId}`) : undefined,
    workspace_snapshot_hash_before: sha256Hex(`workspace-before:${caseId}`),
    workspace_snapshot_hash_after: sha256Hex(`workspace-after:${caseId}`),
    network_proxy_log_digest: includeAttestation ? sha256Hex(`proxy:${caseId}`) : undefined,
    memory_scope: "attempt",
    cache_namespace: `fixture/${caseId}`,
    state_reset_policy: "ephemeral_workspace_reset",
    state_reset_proof: "clean_snapshot_diff",
    external_kb_enabled: false,
    external_kb_digest_list: [],
  };
}

function buildTraceLines(taskResults: TaskResultEntry[], runIdentity: Manifest["run_identity"]): string {
  return canonicalNdjsonText(
    taskResults.flatMap((result, index) => [
      {
        event: "task_started",
        study_id: runIdentity.study_id,
        run_group_id: runIdentity.run_group_id,
        attempt_id: runIdentity.attempt_id,
        task_id: result.task_id,
        ts: `2026-04-21T00:${String(index).padStart(2, "0")}:00.000Z`,
      },
      {
        event: "task_completed",
        study_id: runIdentity.study_id,
        run_group_id: runIdentity.run_group_id,
        attempt_id: runIdentity.attempt_id,
        task_id: result.task_id,
        ts: `2026-04-21T00:${String(index).padStart(2, "0")}:30.000Z`,
        status: result.status,
        score: result.score,
      },
    ]),
  );
}

function buildInteractionLog(taskResults: TaskResultEntry[], runIdentity: Manifest["run_identity"]): string {
  return canonicalNdjsonText(
    taskResults.map((result, index) => ({
      event: "system_task_dispatch",
      study_id: runIdentity.study_id,
      run_group_id: runIdentity.run_group_id,
      attempt_id: runIdentity.attempt_id,
      task_id: result.task_id,
      ts: `2026-04-21T00:${String(index).padStart(2, "0")}:00.000Z`,
      target_ref: `tasks/${result.task_id}`,
    })),
  );
}

function buildTraceIntegrity(traceText: string): TraceIntegrity {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    trace_file: BUNDLE_PATHS.traces.trace,
    trace_root_hash: sha256Hex(traceText),
    line_count: traceText.trim().split(/\r?\n/u).filter(Boolean).length,
    event_chain_complete: true,
  };
}

function buildRegistration(
  caseId: string,
  registryContext: SampleRegistryContext,
  manifest: Pick<Manifest, "run_identity" | "requested_trust_tier" | "repeatability_class">,
  autonomyMode: AutonomyMode,
): RunGroupRegistration {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    registration_id: `registration-${caseId}`,
    study_id: manifest.run_identity.study_id,
    run_group_id: manifest.run_identity.run_group_id,
    registration_mode: "connected_mode",
    benchmark_id: registryContext.benchmarkCard.benchmark.id,
    benchmark_version: registryContext.benchmarkCard.benchmark.version,
    lane_id: registryContext.benchmarkCard.benchmark.lane_id,
    split: registryContext.benchmarkCard.benchmark.split,
    task_package_digest:
      registryContext.benchmarkCard.benchmark.split === "hidden"
        ? sampleRegistryDigests.task_package_hidden
        : sampleRegistryDigests.task_package_public,
    execution_contract_digest: sampleRegistryDigests.execution_contract,
    tolerance_policy_digest: sampleRegistryDigests.tolerance_policy,
    repeatability_class: manifest.repeatability_class,
    declared_attempt_total: manifest.repeatability_class === "pseudo_repeated" ? 3 : 5,
    declared_task_total: registryContext.taskPackage.tasks.length,
    attempt_plan_hash: sha256Hex(`plan:${caseId}`),
    seed_list_hash: manifest.repeatability_class === "true_seeded" ? sha256Hex(`seeds:${caseId}`) : undefined,
    budget_policy_id: "budget-default-v1",
    tool_policy_id: "tool-default-v1",
    timeout_policy_id: "timeout-default-v1",
    declared_autonomy_mode: autonomyMode,
    benchmark_tuned_flag: false,
    requested_trust_tier: manifest.requested_trust_tier,
    submission_window:
      manifest.repeatability_class === "pseudo_repeated"
        ? {
            opens_at: "2026-04-21T00:00:00.000Z",
            closes_at: "2026-04-21T00:20:00.000Z",
            max_span_minutes: 20,
          }
        : undefined,
    randomness_fingerprint_hint:
      manifest.repeatability_class === "pseudo_repeated"
        ? {
            provider_fingerprint: "mock-provider-snapshot",
            sampler_config_hash: sha256Hex(`sampler:${caseId}`),
          }
        : undefined,
    request_template_hash:
      manifest.repeatability_class === "pseudo_repeated" ? sha256Hex(`template:${caseId}`) : undefined,
    provider_snapshot_lock:
      manifest.repeatability_class === "pseudo_repeated" ? "mock-provider-snapshot-v1" : undefined,
    provider_release_window: undefined,
  };
}

function buildCompletenessProof(
  runGroupId: string,
  registrationDigest: string,
  taskResults: TaskResultEntry[],
  attemptTotal: number,
): CompletenessProof {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    proof_id: `proof-${runGroupId}`,
    run_group_id: runGroupId,
    registration_digest: registrationDigest,
    expected_attempt_total: attemptTotal,
    observed_attempt_total: attemptTotal,
    slot_coverage_rate: 1,
    missing_slots: [],
    unexpected_attempts: [],
    duplicate_attempts: [],
    replacement_attempts: [],
    task_coverage_summary: {
      declared_task_denominator: taskResults.length,
      scorable_task_denominator: taskResults.length,
      coverage_rate: 1,
    },
    attempt_terminal_status_histogram: {
      succeeded: attemptTotal,
    },
    completeness_verdict: "complete",
    tier_eligibility_effect: "eligible_for_requested_tier",
  };
}

function buildBoardDecision(eligible: boolean, satisfied: string[], blocked: string[] = []): BoardAdmissionDecision {
  return {
    eligible,
    satisfied_reasons: satisfied,
    blocked_reasons: blocked,
    next_actions: blocked.length > 0 ? blocked : [],
  };
}

function buildVerificationRecord(
  manifest: Manifest,
  autonomyMode: AutonomyMode,
  trustTier: TrustTier,
  publicationState: PublicationState,
  comparisonMode: Manifest["comparison_mode"],
  interactionSummaryDigest?: string,
): VerificationRecord {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    verification_record_id: `verification-${manifest.bundle_id}`,
    subject_ref: {
      subject_type: "attempt_bundle",
      study_id: manifest.run_identity.study_id,
      run_group_id: manifest.run_identity.run_group_id,
      attempt_id: manifest.run_identity.attempt_id,
      bundle_id: manifest.run_identity.bundle_id,
    },
    subject_bundle_digest: manifest.evidence.public_bundle_digest ?? "",
    requested_trust_tier: manifest.requested_trust_tier,
    trust_tier: trustTier,
    publication_state: publicationState,
    autonomy_mode: autonomyMode,
    evidence_channel_mode: manifest.evidence.evidence_channel_mode,
    visibility_class: manifest.evidence.visibility_class,
    release_policy: manifest.evidence.release_policy,
    comparison_mode: comparisonMode ?? "fixed_model_compare_harness",
    public_bundle_digest: manifest.evidence.public_bundle_digest ?? "",
    sealed_audit_bundle_digest: manifest.evidence.sealed_audit_bundle_digest ?? undefined,
    completeness_verdict: trustTier === "community" ? "incomplete" : "complete",
    interaction_summary_digest: interactionSummaryDigest,
    last_audited_at: "2026-04-21T01:00:00.000Z",
    decision_reason_codes: ["fixture_generated"],
    board_admission: {
      official_verified: buildBoardDecision(trustTier === "verified", ["fixture board gate"]),
      reproducibility_frontier: buildBoardDecision(trustTier !== "community", ["fixture board gate"]),
      community_lab: buildBoardDecision(true, ["fixture board gate"]),
    },
  };
}

function computeChecksumsText(files: Record<string, string>, orderedPaths: readonly string[]): string {
  const entries = orderedPaths
    .filter((path) => files[path] !== undefined)
    .map((path) => ({
      path,
      sha256: sha256Hex(files[path] ?? ""),
    }));

  return materializeChecksums(entries);
}

function createCoreFixture(options: CoreFixtureOptions): FixtureCase {
  const registryContext = sampleRegistryContexts[options.registry_context_key];
  const comparisonMode = registryContext.benchmarkCard.comparison_mode;
  const runIdentity = {
    study_id: `study-${options.id}`,
    run_group_id: `run-group-${options.id}`,
    attempt_id: `attempt-${options.id}-01`,
    bundle_id: `bundle-${options.id}`,
  };

  const taskResults = buildTaskResults(registryContext.taskPackage, options.outcomes);
  const aggregate = buildAggregate(runIdentity.attempt_id, taskResults);
  const artifactManifest = buildArtifactManifest(runIdentity.bundle_id, taskResults);
  const evaluatorReport = buildEvaluatorReport(runIdentity.attempt_id, taskResults);
  const interactionSummary = options.include_interaction
    ? buildInteractionSummary(options.autonomy_mode ?? "autonomous")
    : undefined;
  const interactionSummaryDigest = interactionSummary ? objectDigestHex(interactionSummary) : undefined;
  const environmentReport = options.include_environment
    ? buildEnvironmentReport(options.id, runIdentity.attempt_id, options.requested_trust_tier === "verified")
    : undefined;

  const traceText = buildTraceLines(taskResults, runIdentity);
  const interactionLogText = buildInteractionLog(taskResults, runIdentity);
  const traceIntegrity = buildTraceIntegrity(traceText);

  const baseManifest: Manifest = {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    bundle_id: runIdentity.bundle_id,
    run_identity: runIdentity,
    benchmark: {
      id: registryContext.benchmarkCard.benchmark.id,
      version: registryContext.benchmarkCard.benchmark.version,
      lane_id: registryContext.benchmarkCard.benchmark.lane_id,
      split: registryContext.benchmarkCard.benchmark.split,
    },
    task_package_digest:
      options.registry_context_key === "hidden"
        ? sampleRegistryDigests.task_package_hidden
        : sampleRegistryDigests.task_package_public,
    execution_contract_digest: sampleRegistryDigests.execution_contract,
    tolerance_policy_ref: "execution_contract#/verification_policy/tolerance_policy",
    tolerance_policy_digest: sampleRegistryDigests.tolerance_policy,
    registration_ref: options.include_registration ? BUNDLE_PATHS.run_group_registration : undefined,
    registration_digest: undefined,
    requested_trust_tier: options.requested_trust_tier,
    repeatability_class: options.repeatability_class,
    evidence: {
      evidence_channel_mode: options.evidence_channel_mode,
      visibility_class: options.visibility_class,
      release_policy: options.release_policy,
      public_bundle_digest: undefined,
      sealed_audit_bundle_digest: undefined,
      redaction_policy_id: options.redaction_policy_id,
    },
    trace: {
      trace_root_hash: traceIntegrity.trace_root_hash,
      trace_ref: BUNDLE_PATHS.traces.trace,
      interaction_log_ref: BUNDLE_PATHS.traces.interaction_log,
      interaction_summary_ref: BUNDLE_PATHS.reports.interaction_summary,
      trace_integrity_ref: BUNDLE_PATHS.reports.trace_integrity,
      environment_report_ref: options.include_environment ? BUNDLE_PATHS.reports.environment_report : undefined,
      completeness_proof_ref: options.include_completeness ? BUNDLE_PATHS.reports.completeness_proof : undefined,
      verification_record_ref: options.include_verification ? BUNDLE_PATHS.reports.verification_record : undefined,
    },
    artifacts: {
      task_results_ref: BUNDLE_PATHS.payloads.task_results,
      aggregate_ref: BUNDLE_PATHS.aggregate,
      evaluator_report_ref: BUNDLE_PATHS.reports.evaluator_report,
      artifact_manifest_ref: BUNDLE_PATHS.artifact_manifest,
      checksums_ref: BUNDLE_PATHS.checksums,
    },
    submission_profile: options.submission_profile,
    comparison_mode: comparisonMode,
    created_at: "2026-04-21T00:00:00.000Z",
  };

  const registration = options.include_registration
    ? buildRegistration(options.id, registryContext, baseManifest, options.autonomy_mode ?? "autonomous")
    : undefined;
  const registrationDigest = registration ? objectDigestHex(registration) : undefined;
  if (registration && registrationDigest) {
    registration.registration_digest = registrationDigest;
    baseManifest.registration_digest = registrationDigest;
  }

  const completenessProof =
    options.include_completeness && registrationDigest
      ? buildCompletenessProof(
          runIdentity.run_group_id,
          registrationDigest,
          taskResults,
          registration?.declared_attempt_total ?? 1,
        )
      : undefined;

  const publicFilesForChecksums: Record<string, string> = {};
  withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.aggregate, aggregate);
  withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.artifact_manifest, artifactManifest);
  withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.reports.evaluator_report, evaluatorReport);
  withTextFile(publicFilesForChecksums, BUNDLE_PATHS.payloads.task_results, canonicalNdjsonText(taskResults));
  withTextFile(publicFilesForChecksums, BUNDLE_PATHS.traces.trace, traceText);
  withTextFile(publicFilesForChecksums, BUNDLE_PATHS.traces.interaction_log, interactionLogText);
  withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.reports.trace_integrity, traceIntegrity);

  if (registration) {
    withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.run_group_registration, registration);
  }
  if (interactionSummary) {
    withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.reports.interaction_summary, interactionSummary);
  }
  if (environmentReport) {
    withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.reports.environment_report, environmentReport);
  }
  if (completenessProof) {
    withJsonFile(publicFilesForChecksums, BUNDLE_PATHS.reports.completeness_proof, completenessProof);
  }

  const checksumsSha256 = computeChecksumsText(publicFilesForChecksums, PUBLIC_CHECKSUM_ORDER);
  const publicBundleDigest = checksumsToBundleDigestHex(checksumsSha256);

  let sealedFilesForChecksums: Record<string, string> | undefined;
  let sealedChecksumsSha256: string | undefined;
  let sealedBundleDigest: string | undefined;

  if (options.include_sealed_bundle) {
    sealedFilesForChecksums = {};
    withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.aggregate, aggregate);
    withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.artifact_manifest, artifactManifest);
    withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.reports.evaluator_report, evaluatorReport);
    withTextFile(
      sealedFilesForChecksums,
      BUNDLE_PATHS.sealed.payloads.task_results,
      canonicalNdjsonText(taskResults),
    );
    withTextFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.traces.trace, traceText);
    withTextFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.traces.interaction_log, interactionLogText);
    withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.reports.trace_integrity, traceIntegrity);

    if (registration) {
      withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.run_group_registration, registration);
    }
    if (interactionSummary) {
      withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.reports.interaction_summary, interactionSummary);
    }
    if (environmentReport) {
      withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.reports.environment_report, environmentReport);
    }
    if (completenessProof) {
      withJsonFile(sealedFilesForChecksums, BUNDLE_PATHS.sealed.reports.completeness_proof, completenessProof);
    }

    sealedChecksumsSha256 = computeChecksumsText(sealedFilesForChecksums, SEALED_CHECKSUM_ORDER);
    sealedBundleDigest = checksumsToBundleDigestHex(sealedChecksumsSha256);
  }

  baseManifest.evidence.public_bundle_digest = publicBundleDigest;
  baseManifest.evidence.sealed_audit_bundle_digest = sealedBundleDigest;

  const verificationRecord = options.include_verification
    ? buildVerificationRecord(
        baseManifest,
        options.autonomy_mode ?? "autonomous",
        options.trust_tier ?? options.requested_trust_tier,
        options.publication_state ?? "published",
        comparisonMode,
        interactionSummaryDigest,
      )
    : undefined;

  const publicFiles: Record<string, string> = {
    ...publicFilesForChecksums,
    [BUNDLE_PATHS.manifest]: canonicalJsonText(baseManifest),
    [BUNDLE_PATHS.checksums]: checksumsSha256,
  };

  if (verificationRecord) {
    withJsonFile(publicFiles, BUNDLE_PATHS.reports.verification_record, verificationRecord);
  }

  const sealedFiles = sealedFilesForChecksums
    ? {
        ...sealedFilesForChecksums,
        [BUNDLE_PATHS.sealed.checksums]: sealedChecksumsSha256 ?? "",
      }
    : undefined;

  return {
    id: options.id,
    variant: "golden",
    description: `${registryContext.benchmarkCard.benchmark.title} synthetic fixture`,
    registry_context_key: options.registry_context_key,
    registry_context: registryContext,
    bundle: {
      manifest: baseManifest,
      aggregate,
      task_results: taskResults,
      artifact_manifest: artifactManifest,
      evaluator_report: evaluatorReport,
      run_group_registration: registration,
      completeness_proof: completenessProof,
      interaction_summary: interactionSummary,
      environment_report: environmentReport,
      trace_integrity: traceIntegrity,
      verification_record: verificationRecord,
      checksums_sha256: checksumsSha256,
      sealed_checksums_sha256: sealedChecksumsSha256,
      public_files: publicFiles,
      sealed_files: sealedFiles,
    },
    expected: {
      valid: true,
      reason_codes: ["fixture_expected_valid"],
    },
  };
}

function rewriteJsonFile<T>(files: Record<string, string>, relativePath: string, value: T): void {
  files[relativePath] = canonicalJsonText(value);
}

function mutateFixture(
  caseId: string,
  fixture: FixtureCase,
  mutate: (draft: FixtureCase) => void,
  reasonCodes: string[],
): FixtureCase {
  const draft = cloneFixture(fixture);
  draft.id = caseId;
  draft.variant = "mutant";
  draft.mutated_from = fixture.id;
  draft.expected = {
    valid: false,
    reason_codes: reasonCodes,
  };
  draft.bundle.manifest.bundle_id = `bundle-${caseId}`;
  draft.bundle.manifest.run_identity.bundle_id = `bundle-${caseId}`;
  rewriteJsonFile(draft.bundle.public_files, BUNDLE_PATHS.manifest, draft.bundle.manifest);

  mutate(draft);

  return draft;
}

const communityMinimalPublicOnly = createCoreFixture({
  id: "community-minimal-public-only",
  registry_context_key: "public",
  submission_profile: "community_light",
  requested_trust_tier: "community",
  repeatability_class: "true_seeded",
  evidence_channel_mode: "public_only",
  visibility_class: "public_full",
  release_policy: "public_immediate",
  outcomes: [
    { status: "success", score: 1, cost_usd: 0.21, duration_ms: 1200, summary: "Solved cleanly." },
    { status: "failure", score: 0.25, cost_usd: 0.28, duration_ms: 1800, summary: "Timed out while packaging." },
    { status: "success", score: 0.9, cost_usd: 0.19, duration_ms: 1100, summary: "Recovered via fallback." },
  ],
});

const reproducedTrueSeededComplete = createCoreFixture({
  id: "reproduced-true-seeded-complete",
  registry_context_key: "public",
  submission_profile: "reproducible_standard",
  requested_trust_tier: "reproduced",
  repeatability_class: "true_seeded",
  evidence_channel_mode: "public_only",
  visibility_class: "public_full",
  release_policy: "public_immediate",
  outcomes: [
    { status: "success", score: 1, cost_usd: 0.22, duration_ms: 900, summary: "Solved with zero retries." },
    { status: "success", score: 0.95, cost_usd: 0.24, duration_ms: 950, summary: "Solved after one tool call." },
    { status: "success", score: 0.98, cost_usd: 0.23, duration_ms: 980, summary: "Solved with compact output." },
  ],
  include_registration: true,
  include_completeness: true,
  include_interaction: true,
  include_environment: true,
  include_verification: true,
  autonomy_mode: "autonomous",
  publication_state: "published",
  trust_tier: "reproduced",
});

const reproducedPseudoRepeatedComplete = createCoreFixture({
  id: "reproduced-pseudo-repeated-complete",
  registry_context_key: "public",
  submission_profile: "reproducible_standard",
  requested_trust_tier: "reproduced",
  repeatability_class: "pseudo_repeated",
  evidence_channel_mode: "public_only",
  visibility_class: "public_full",
  release_policy: "public_immediate",
  outcomes: [
    { status: "success", score: 1, cost_usd: 0.31, duration_ms: 1300, summary: "Pseudo repeated success 1." },
    { status: "success", score: 0.91, cost_usd: 0.33, duration_ms: 1360, summary: "Pseudo repeated success 2." },
    { status: "success", score: 0.93, cost_usd: 0.29, duration_ms: 1280, summary: "Pseudo repeated success 3." },
  ],
  include_registration: true,
  include_completeness: true,
  include_interaction: true,
  include_environment: true,
  include_verification: true,
  autonomy_mode: "approval_only",
  publication_state: "published",
  trust_tier: "reproduced",
});

const verifiedHiddenPublicPlusSealed = createCoreFixture({
  id: "verified-hidden-public-plus-sealed",
  registry_context_key: "hidden",
  submission_profile: "verified_full",
  requested_trust_tier: "verified",
  repeatability_class: "true_seeded",
  evidence_channel_mode: "public_plus_sealed",
  visibility_class: "public_redacted",
  release_policy: "delayed_until_legacy",
  outcomes: [
    { status: "success", score: 1, cost_usd: 0.4, duration_ms: 1500, summary: "Hidden split success 1." },
    { status: "success", score: 0.97, cost_usd: 0.42, duration_ms: 1600, summary: "Hidden split success 2." },
    { status: "success", score: 0.99, cost_usd: 0.39, duration_ms: 1550, summary: "Hidden split success 3." },
  ],
  include_registration: true,
  include_completeness: true,
  include_interaction: true,
  include_environment: true,
  include_verification: true,
  autonomy_mode: "autonomous",
  publication_state: "published",
  trust_tier: "verified",
  redaction_policy_id: "hidden-lane-default-v1",
  include_sealed_bundle: true,
});

const registrationDigestMismatch = mutateFixture(
  "registration-digest-mismatch",
  reproducedTrueSeededComplete,
  (draft) => {
    draft.bundle.manifest.registration_digest = sha256Hex("mutant:registration-digest-mismatch");
    rewriteJsonFile(draft.bundle.public_files, BUNDLE_PATHS.manifest, draft.bundle.manifest);
  },
  ["registration_digest_mismatch"],
);

const sealedRequiredButMissing = mutateFixture(
  "sealed-required-but-missing",
  verifiedHiddenPublicPlusSealed,
  (draft) => {
    delete draft.bundle.manifest.evidence.sealed_audit_bundle_digest;
    if (draft.bundle.verification_record) {
      delete draft.bundle.verification_record.sealed_audit_bundle_digest;
      rewriteJsonFile(draft.bundle.public_files, BUNDLE_PATHS.reports.verification_record, draft.bundle.verification_record);
    }
    delete draft.bundle.sealed_checksums_sha256;
    delete draft.bundle.sealed_files;
    rewriteJsonFile(draft.bundle.public_files, BUNDLE_PATHS.manifest, draft.bundle.manifest);
  },
  ["sealed_bundle_required_missing"],
);

const subjectRefMismatch = mutateFixture(
  "subject-ref-mismatch",
  verifiedHiddenPublicPlusSealed,
  (draft) => {
    if (draft.bundle.verification_record) {
      draft.bundle.verification_record.subject_ref.attempt_id = "attempt-other-01";
      rewriteJsonFile(
        draft.bundle.public_files,
        BUNDLE_PATHS.reports.verification_record,
        draft.bundle.verification_record,
      );
    }
  },
  ["verification_subject_ref_mismatch"],
);

const traceRootHashBroken = mutateFixture(
  "trace-root-hash-broken",
  reproducedTrueSeededComplete,
  (draft) => {
    draft.bundle.trace_integrity.trace_root_hash = sha256Hex("mutant:trace-root-hash-broken");
    rewriteJsonFile(draft.bundle.public_files, BUNDLE_PATHS.reports.trace_integrity, draft.bundle.trace_integrity);
  },
  ["trace_root_hash_broken"],
);

export const goldenFixtures: FixtureCase[] = [
  communityMinimalPublicOnly,
  reproducedTrueSeededComplete,
  reproducedPseudoRepeatedComplete,
  verifiedHiddenPublicPlusSealed,
];

export const mutantFixtures: FixtureCase[] = [
  registrationDigestMismatch,
  sealedRequiredButMissing,
  subjectRefMismatch,
  traceRootHashBroken,
];

export const allFixtures: FixtureCase[] = [...goldenFixtures, ...mutantFixtures];
