import { promises as fs } from "node:fs";
import path from "node:path";

import {
  BUNDLE_PATHS,
  BUNDLE_PROTOCOL_VERSION,
  SCHEMA_CATALOG_VERSION,
  ZERO_INPUT_DIGEST,
  canonicalNdjson,
  canonicalStringify,
  computeBundleDigestFromChecksums,
  computeObjectDigest,
  loadValidationContext,
  manifestBindingDigest,
  renderChecksums,
  runValidation,
  sha256Digest,
  sha256Hex,
  stableCanonicalStringify,
  type BundleBenchmarkCard,
  type BundleExecutionContract,
  type BundleManifest,
  type BundleTaskPackage,
  type BundleTaskResultEntry,
  type RequestedTrustTier,
  type RunGroupRegistration,
  type ValidationReport,
} from "@ohbp/validator-core";
import { createDefaultRulePack } from "@ohbp/validator-rules";

import { runSampleAdapter } from "./sample-adapter.js";
import type {
  AggregateReport,
  DoctorResult,
  EvaluatorReport,
  InitOptions,
  InitResult,
  InspectResult,
  PackResult,
  ResearchSummary,
  RunResult,
  ScorecardSummary,
  StudyConfig,
  SubmissionProfile,
  UploadResult,
  ValidateResult,
} from "./types.js";

const SAMPLE_TASK_NAMES = [
  "task-alpha",
  "task-beta",
  "task-gamma",
  "task-delta",
  "task-epsilon",
];

const ATTEMPT_PLAN_PATH = "attempt-plan.json";
const REDACTIONS_PATH = "redactions.json";

function workspacePaths(workspaceRoot: string) {
  const hbRoot = path.join(workspaceRoot, ".hb");

  return {
    hbRoot,
    studyPath: path.join(hbRoot, "study.json"),
    registrationPath: path.join(
      hbRoot,
      "registrations",
      "run-group-registration.json",
    ),
    runsRoot: path.join(hbRoot, "runs"),
    bundlesRoot: path.join(hbRoot, "bundles"),
    validationRoot: path.join(hbRoot, "validation"),
    uploadsRoot: path.join(hbRoot, "uploads"),
  };
}

function profileToTrustTier(profile: SubmissionProfile): RequestedTrustTier {
  switch (profile) {
    case "verified_full":
      return "verified";
    case "reproducible_standard":
      return "reproduced";
    default:
      return "community";
  }
}

function defaultAttemptsForTier(tier: RequestedTrustTier): number {
  switch (tier) {
    case "verified":
      return 5;
    case "reproduced":
      return 3;
    default:
      return 1;
  }
}

function buildAttemptIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    `attempt-${String(index + 1).padStart(3, "0")}`,
  );
}

function buildTaskIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    return SAMPLE_TASK_NAMES[index] ?? `task-${String(index + 1).padStart(3, "0")}`;
  });
}

interface AttemptPlanDocument {
  protocol_version: string;
  study_id: string;
  run_group_id: string;
  attempt_ids: string[];
}

interface RedactionManifest {
  protocol_version: string;
  redaction_policy_id: string;
  evidence_channel_mode: StudyConfig["evidence_channel_mode"];
  bundle_id: string;
  replaced_paths: Array<{
    path: string;
    sealed_ref: string;
    placeholder: string;
  }>;
  notice: string;
}

function assertDeclaredAttempt(study: StudyConfig, attemptId: string): void {
  if (!study.attempt_ids.includes(attemptId)) {
    throw new Error(
      `Attempt ${attemptId} is not declared in study.json attempt_ids: ${study.attempt_ids.join(", ")}`,
    );
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function countDirectories(directoryPath: string): Promise<number> {
  const entries = (await fs.readdir(directoryPath, {
    withFileTypes: true,
  })) as Array<{
    isDirectory(): boolean;
  }>;

  return entries.filter((entry) => entry.isDirectory()).length;
}

async function countObservedAttempts(
  runsRoot: string,
  attemptIds: string[],
): Promise<number> {
  const flags = await Promise.all(
    attemptIds.map(async (attemptId) =>
      fileExists(path.join(runsRoot, `run_${attemptId}`)),
    ),
  );

  return flags.filter(Boolean).length;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${canonicalStringify(value)}\n`, "utf8");
}

async function writeText(filePath: string, contents: string): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, contents, "utf8");
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

function deterministicIsoFromSeed(seed: string, offsetMinutes = 0): string {
  const base = Date.parse("2026-01-01T00:00:00.000Z");
  const minuteOffset = Number.parseInt(sha256Hex(seed).slice(0, 6), 16) % 720;
  return new Date(base + (minuteOffset + offsetMinutes) * 60 * 1000).toISOString();
}

function countNonEmptyLines(text: string): number {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function createAttemptPlanDocument(study: StudyConfig): AttemptPlanDocument {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    study_id: study.study_id,
    run_group_id: study.run_group_id,
    attempt_ids: [...study.attempt_ids],
  };
}

function createTaskPackage(study: StudyConfig): BundleTaskPackage {
  return {
    schema_version: SCHEMA_CATALOG_VERSION,
    object_type: "task-package",
    task_package_id: `${study.benchmark.id}-${study.benchmark.split}`,
    benchmark_id: study.benchmark.id,
    benchmark_version: study.benchmark.version,
    lane_id: study.benchmark.lane_id,
    split: study.benchmark.split as BundleManifest["benchmark"]["split"],
    tasks: study.task_ids.map((taskId, index) => ({
      task_id: taskId,
      prompt_id: `prompt-${taskId}`,
      title: `Sample task ${index + 1}: ${taskId}`,
      difficulty: index < Math.max(1, study.task_ids.length - 1) ? "core" : "stretch",
      tags: ["sample", "hb-cli", study.benchmark.id],
    })),
  };
}

function createExecutionContract(study: StudyConfig): BundleExecutionContract {
  return {
    schema_version: SCHEMA_CATALOG_VERSION,
    object_type: "execution-contract",
    execution_contract_id: `${study.adapter.id}-${study.benchmark.id}-default`,
    benchmark_id: study.benchmark.id,
    benchmark_version: study.benchmark.version,
    runtime: {
      adapter_id: study.adapter.id,
      adapter_version: "0.1.0",
      launcher: "hb-cli",
      model_ref: `sample-model:${study.adapter.preset_id}`,
      container_digest: sha256Digest(`sample-container:${study.adapter.preset_id}`),
    },
    resource_limits: {
      max_steps: 32,
      timeout_seconds: 600,
      budget_usd: 5,
    },
    verification_policy: {
      required_bundle_members: [
        BUNDLE_PATHS.manifest,
        BUNDLE_PATHS.aggregate,
        BUNDLE_PATHS.payloads.task_results,
        BUNDLE_PATHS.reports.evaluator_report,
        BUNDLE_PATHS.reports.trace_integrity,
        BUNDLE_PATHS.checksums,
      ],
      tolerance_policy: {
        tolerance_policy_id: `${study.benchmark.id}-default-tolerance`,
        tolerance_policy_version: "0.1.0",
        applies_to_tiers: ["community", "reproduced", "verified"],
        allowed_repeatability_classes: ["true_seeded", "pseudo_repeated"],
        comparison_unit: "run_group",
        statistical_protocol: "point_estimate_with_iqr",
        metric_rules: [
          {
            metric_id: "success_rate",
            level: "run_group",
            comparison_method: "abs_delta",
            threshold_abs: 0.03,
            threshold_rel: 0.05,
            directionality: "higher_is_better",
            hard_fail: true,
          },
        ],
        missingness_rule: "fail_on_missing_required_tasks",
        replay_rule: "requires_replayable_bundle",
        reproduce_rule: "requires_registered_complete_run_group",
        promotion_gate: "all_hard_fail_rules_pass",
      },
    },
  };
}

function createBenchmarkCard(study: StudyConfig): BundleBenchmarkCard {
  return {
    schema_version: SCHEMA_CATALOG_VERSION,
    object_type: "benchmark-card",
    benchmark: {
      id: study.benchmark.id,
      version: study.benchmark.version,
      lane_id: study.benchmark.lane_id,
      split: study.benchmark.split as BundleManifest["benchmark"]["split"],
      title:
        study.evidence_channel_mode === "public_plus_sealed"
          ? "Terminal Lite v1 (Hidden)"
          : "Terminal Lite v1 (Public)",
    },
    description: "Deterministic sample benchmark registry card emitted by hb-cli.",
    comparison_mode: "fixed_model_compare_harness",
    default_submission_profile: study.submission_profile as
      BundleBenchmarkCard["default_submission_profile"],
    registry_refs: {
      task_package: "registry/task-package.json",
      execution_contract: "registry/execution-contract.json",
    },
  };
}

function normalizeTaskResultRows(
  protocolVersion: BundleTaskResultEntry["protocol_version"],
  rows: Array<Record<string, unknown>>,
): BundleTaskResultEntry[] {
  return rows.map((row) => ({
    protocol_version: protocolVersion,
    task_id: String(row.task_id ?? "unknown-task"),
    status:
      row.status === "success" || row.status === "failure"
        ? row.status
        : "failure",
    score: Number(row.score ?? 0),
    duration_ms: Number(row.duration_ms ?? 0),
    cost_usd: Number(row.cost_usd ?? 0),
    summary: String(row.summary ?? ""),
  }));
}

function createRedactedTaskResults(
  rows: BundleTaskResultEntry[],
): BundleTaskResultEntry[] {
  return rows.map((row) => ({
    protocol_version: row.protocol_version,
    task_id: row.task_id,
    status: row.status,
    score: row.score,
    duration_ms: 0,
    cost_usd: 0,
    summary: `[redacted: full task result retained in sealed companion for ${row.task_id}]`,
  }));
}

function createRedactedTraceProjection(
  study: StudyConfig,
  attemptId: string,
  rows: BundleTaskResultEntry[],
): string {
  return canonicalNdjson(
    rows.map((row, index) => ({
      event: "task_public_projection",
      study_id: study.study_id,
      run_group_id: study.run_group_id,
      attempt_id: attemptId,
      task_id: row.task_id,
      ts: deterministicIsoFromSeed(`${attemptId}:${row.task_id}:trace`, index),
      status: row.status,
      score: row.score,
      redacted: true,
      sealed_ref: `${BUNDLE_PATHS.sealed.dir}/${BUNDLE_PATHS.traces.trace}`,
    })),
  );
}

function createRedactedInteractionProjection(
  study: StudyConfig,
  attemptId: string,
  taskIds: string[],
): string {
  return canonicalNdjson(
    taskIds.map((taskId, index) => ({
      event: "interaction_redacted",
      study_id: study.study_id,
      run_group_id: study.run_group_id,
      attempt_id: attemptId,
      task_id: taskId,
      ts: deterministicIsoFromSeed(`${attemptId}:${taskId}:interaction`, index),
      redacted: true,
      placeholder: "Full interaction log retained in sealed companion bundle.",
      sealed_ref: `${BUNDLE_PATHS.sealed.dir}/${BUNDLE_PATHS.traces.interaction_log}`,
    })),
  );
}

function createRedactionManifest(
  study: StudyConfig,
  bundleId: string,
): RedactionManifest {
  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    redaction_policy_id: "sample-redaction-policy-v1",
    evidence_channel_mode: study.evidence_channel_mode,
    bundle_id: bundleId,
    replaced_paths: [
      {
        path: BUNDLE_PATHS.payloads.task_results,
        sealed_ref: `${BUNDLE_PATHS.sealed.dir}/${BUNDLE_PATHS.payloads.task_results}`,
        placeholder: "Task-level latency, cost, and summary fields redacted from public bundle.",
      },
      {
        path: BUNDLE_PATHS.traces.trace,
        sealed_ref: `${BUNDLE_PATHS.sealed.dir}/${BUNDLE_PATHS.traces.trace}`,
        placeholder: "Public trace is a projection; full event stream retained in sealed companion.",
      },
      {
        path: BUNDLE_PATHS.traces.interaction_log,
        sealed_ref: `${BUNDLE_PATHS.sealed.dir}/${BUNDLE_PATHS.traces.interaction_log}`,
        placeholder: "Public interaction log is a placeholder projection; full log retained in sealed companion.",
      },
    ],
    notice:
      "public_plus_sealed keeps benchmark-safe public projections while preserving full evidence in the sealed companion bundle.",
  };
}

function createTraceIntegrity(
  protocolVersion: string,
  traceText: string,
): {
  protocol_version: string;
  trace_file: string;
  trace_root_hash: string;
  line_count: number;
  event_chain_complete: boolean;
} {
  return {
    protocol_version: protocolVersion,
    trace_file: BUNDLE_PATHS.traces.trace,
    trace_root_hash: sha256Digest(traceText),
    line_count: countNonEmptyLines(traceText),
    event_chain_complete: true,
  };
}

async function readStudy(workspaceRoot: string): Promise<StudyConfig> {
  return readJson<StudyConfig>(workspacePaths(workspaceRoot).studyPath);
}

async function readRegistration(workspaceRoot: string): Promise<RunGroupRegistration> {
  return readJson<RunGroupRegistration>(workspacePaths(workspaceRoot).registrationPath);
}

async function readValidationReportIfExists(
  workspaceRoot: string,
  bundleId: string,
): Promise<ValidationReport | undefined> {
  const reportPath = path.join(
    workspacePaths(workspaceRoot).validationRoot,
    `${bundleId}.validation-report.json`,
  );

  if (!(await fileExists(reportPath))) {
    return undefined;
  }

  return readJson<ValidationReport>(reportPath);
}

function sanitizeWorkspaceId(workspaceRoot: string): string {
  return sha256Hex(path.resolve(workspaceRoot)).slice(0, 10);
}

function resolveBundleId(bundleRoot: string, manifest?: BundleManifest): string {
  return manifest?.bundle_id ?? path.basename(bundleRoot);
}

async function resolveBundleRoot(
  workspaceRoot: string,
  bundlePath?: string,
): Promise<string> {
  if (bundlePath) {
    return path.resolve(workspaceRoot, bundlePath);
  }

  const bundlesRoot = workspacePaths(workspaceRoot).bundlesRoot;
  const entries = (await fs.readdir(bundlesRoot, {
    withFileTypes: true,
  })) as Array<{
    name: string;
    isDirectory(): boolean;
  }>;
  const directories = entries.filter((entry) => entry.isDirectory());

  if (directories.length === 0) {
    throw new Error("No packed bundle found. Run `hb pack` first.");
  }

  const sortedDirectories = directories.sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const latestDirectory = sortedDirectories.at(-1);

  if (!latestDirectory) {
    throw new Error("No packed bundle found. Run `hb pack` first.");
  }

  return path.join(bundlesRoot, latestDirectory.name);
}

async function collectTaskResultRows(
  runRoot: string,
  taskIds: string[],
): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = [];

  for (const taskId of taskIds) {
    const taskResult = await readJson<Record<string, unknown>>(
      path.join(runRoot, "tasks", taskId, "result.json"),
    );
    rows.push(taskResult);
  }

  return rows;
}

function toAggregateReport(
  protocolVersion: string,
  attemptId: string,
  rows: BundleTaskResultEntry[],
): AggregateReport {
  const nTasks = rows.length;
  const successCount = rows.filter((row) => row.status === "success").length;
  const averageScore =
    rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / Math.max(nTasks, 1);
  const totalCost =
    rows.reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0);
  const averageDuration =
    rows.reduce((sum, row) => sum + Number(row.duration_ms ?? 0), 0) /
    Math.max(nTasks, 1);

  return {
    protocol_version: protocolVersion,
    attempt_id: attemptId,
    n_tasks: nTasks,
    success_count: successCount,
    success_rate: Number((successCount / Math.max(nTasks, 1)).toFixed(3)),
    average_score: Number(averageScore.toFixed(3)),
    total_cost_usd: Number(totalCost.toFixed(3)),
    average_duration_ms: Number(averageDuration.toFixed(3)),
  };
}

function toEvaluatorReport(
  protocolVersion: string,
  attemptId: string,
  rows: BundleTaskResultEntry[],
): EvaluatorReport {
  const passedTasks = rows.filter((row) => row.status === "success").length;

  return {
    protocol_version: protocolVersion,
    attempt_id: attemptId,
    terminal_status: "completed",
    n_tasks: rows.length,
    passed_tasks: passedTasks,
    failed_tasks: rows.length - passedTasks,
  };
}

function buildPublicManifest(
  study: StudyConfig,
  attemptId: string,
  registration: RunGroupRegistration,
  registrationDigest: string,
  publicBundleDigest: string,
  sealedBundleDigest: string | undefined,
  traceRootHash: string,
): BundleManifest {
  const bundleId = `bundle-${attemptId}`;

  return {
    protocol_version: study.protocol_version,
    bundle_id: bundleId,
    run_identity: {
      study_id: study.study_id,
      run_group_id: study.run_group_id,
      attempt_id: attemptId,
      bundle_id: bundleId,
    },
    benchmark: {
      id: study.benchmark.id,
      version: study.benchmark.version,
      lane_id: study.benchmark.lane_id,
      split: study.benchmark.split,
    },
    task_package_digest: registration.task_package_digest,
    execution_contract_digest: registration.execution_contract_digest,
    tolerance_policy_ref: "execution_contract#/verification_policy/tolerance_policy",
    tolerance_policy_digest: registration.tolerance_policy_digest,
    registration_ref: "run-group-registration.json",
    registration_digest: registrationDigest,
    requested_trust_tier: study.requested_trust_tier,
    repeatability_class: study.repeatability_class,
    evidence: {
      evidence_channel_mode: study.evidence_channel_mode,
      visibility_class: study.visibility_class,
      release_policy: study.release_policy,
      public_bundle_digest: publicBundleDigest,
      sealed_audit_bundle_digest: sealedBundleDigest,
      redaction_policy_id:
        study.evidence_channel_mode === "public_plus_sealed"
          ? "sample-redaction-policy-v1"
          : undefined,
    },
    trace: {
      trace_root_hash: traceRootHash,
      trace_ref: BUNDLE_PATHS.traces.trace,
      interaction_log_ref: BUNDLE_PATHS.traces.interaction_log,
      interaction_summary_ref: BUNDLE_PATHS.reports.interaction_summary,
      trace_integrity_ref: BUNDLE_PATHS.reports.trace_integrity,
    },
    artifacts: {
      task_results_ref: BUNDLE_PATHS.payloads.task_results,
      aggregate_ref: BUNDLE_PATHS.aggregate,
      evaluator_report_ref: BUNDLE_PATHS.reports.evaluator_report,
      checksums_ref: BUNDLE_PATHS.checksums,
    },
    submission_profile: study.submission_profile as BundleManifest["submission_profile"],
    comparison_mode: "fixed_model_compare_harness",
    created_at: study.created_at,
  };
}

export async function initWorkspace(
  workspaceRoot: string,
  options: InitOptions = {},
): Promise<InitResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const paths = workspacePaths(resolvedRoot);
  const profile = options.profile ?? "community_light";
  const requestedTrustTier =
    options.requestedTrustTier ?? profileToTrustTier(profile);
  const attempts = options.attempts ?? defaultAttemptsForTier(requestedTrustTier);
  const tasks = options.tasks ?? 3;
  const sealed = options.sealed ?? false;

  if ((await fileExists(paths.studyPath)) && !options.force) {
    throw new Error(
      "Workspace is already initialized. Re-run with --force to overwrite .hb/study.json.",
    );
  }

  await Promise.all([
    ensureDirectory(paths.hbRoot),
    ensureDirectory(path.dirname(paths.registrationPath)),
    ensureDirectory(paths.runsRoot),
    ensureDirectory(paths.bundlesRoot),
    ensureDirectory(paths.validationRoot),
    ensureDirectory(paths.uploadsRoot),
  ]);

  const workspaceId = sanitizeWorkspaceId(resolvedRoot);
  const studyId = `study-${workspaceId}`;
  const runGroupId = `run-group-${workspaceId}`;
  const attemptIds = buildAttemptIds(attempts);
  const taskIds = buildTaskIds(tasks);
  const createdAt = deterministicIsoFromSeed(`${studyId}:${runGroupId}`);

  const study: StudyConfig = {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    study_id: studyId,
    run_group_id: runGroupId,
    submission_profile: profile,
    requested_trust_tier: requestedTrustTier,
    benchmark: {
      id: "terminal-lite-v1",
      version: "2026.04",
      lane_id: "terminal-lite-v1",
      split: sealed ? "hidden" : "public",
    },
    adapter: {
      id: "sample-adapter",
      preset_id: "sample-terminal-lite",
    },
    attempt_ids: attemptIds,
    task_ids: taskIds,
    repeatability_class: options.repeatabilityClass ?? "true_seeded",
    evidence_channel_mode: sealed ? "public_plus_sealed" : "public_only",
    visibility_class: sealed ? "public_redacted" : "public_full",
    release_policy: sealed ? "delayed_until_legacy" : "public_immediate",
    created_at: createdAt,
  };

  const attemptPlan = createAttemptPlanDocument(study);
  const taskPackage = createTaskPackage(study);
  const executionContract = createExecutionContract(study);
  const taskPackageDigest = computeObjectDigest(
    taskPackage as unknown as Record<string, unknown>,
  );
  const executionContractDigest = computeObjectDigest(
    executionContract as unknown as Record<string, unknown>,
  );
  const tolerancePolicyDigest = computeObjectDigest(
    executionContract.verification_policy.tolerance_policy as unknown as Record<string, unknown>,
  );
  const attemptPlanHash = sha256Digest(
    stableCanonicalStringify(attemptPlan.attempt_ids),
  );

  const registrationBase: RunGroupRegistration = {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    registration_id: `registration-${workspaceId}`,
    study_id: studyId,
    run_group_id: runGroupId,
    registration_mode: "offline_provisional",
    benchmark_id: study.benchmark.id,
    benchmark_version: study.benchmark.version,
    lane_id: study.benchmark.lane_id,
    split: study.benchmark.split,
    task_package_digest: taskPackageDigest,
    execution_contract_digest: executionContractDigest,
    tolerance_policy_digest: tolerancePolicyDigest,
    repeatability_class: study.repeatability_class,
    declared_attempt_total: attemptIds.length,
    declared_task_total: taskIds.length,
    attempt_plan_hash: attemptPlanHash,
    seed_list_hash:
      study.repeatability_class === "true_seeded"
        ? sha256Digest(
            stableCanonicalStringify(
              attemptIds.map((attemptIdValue) => `${attemptIdValue}-seed`),
            ),
          )
        : undefined,
    budget_policy_id: "budget.sample.v1",
    tool_policy_id: "tool.sample.v1",
    timeout_policy_id: "timeout.sample.v1",
    declared_autonomy_mode: "autonomous",
    benchmark_tuned_flag: false,
    requested_trust_tier: requestedTrustTier,
    submission_window:
      study.repeatability_class === "pseudo_repeated"
        ? {
            opens_at: deterministicIsoFromSeed(`${studyId}:opens`, 0),
            closes_at: deterministicIsoFromSeed(`${studyId}:closes`, 30),
            max_span_minutes: 30,
          }
        : undefined,
    randomness_fingerprint_hint:
      study.repeatability_class === "pseudo_repeated"
        ? {
            provider_fingerprint: sha256Hex("sample-provider-fingerprint").slice(0, 16),
          }
        : undefined,
    request_template_hash:
      study.repeatability_class === "pseudo_repeated"
        ? sha256Digest("sample-request-template")
        : undefined,
    provider_snapshot_lock:
      study.repeatability_class === "pseudo_repeated"
        ? "sample-provider-snapshot-v1"
        : undefined,
  };

  const registrationDigest = computeObjectDigest(
    registrationBase as unknown as Record<string, unknown>,
    ["registration_digest"],
  );
  const registration: RunGroupRegistration = {
    ...registrationBase,
    registration_digest: registrationDigest,
  };

  await writeJson(paths.studyPath, study);
  await writeJson(paths.registrationPath, registration);

  return {
    workspace_root: resolvedRoot,
    study_path: paths.studyPath,
    registration_path: paths.registrationPath,
    study,
    registration,
  };
}

export async function runWorkspace(
  workspaceRoot: string,
  options: { attemptId?: string } = {},
): Promise<RunResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const study = await readStudy(resolvedRoot);
  const selectedAttemptIds = options.attemptId
    ? [options.attemptId]
    : study.attempt_ids;

  const attemptPaths: string[] = [];

  for (const attemptId of selectedAttemptIds) {
    assertDeclaredAttempt(study, attemptId);
    attemptPaths.push(await runSampleAdapter(resolvedRoot, study, attemptId));
  }

  return {
    workspace_root: resolvedRoot,
    attempt_paths: attemptPaths,
  };
}

export async function packWorkspace(
  workspaceRoot: string,
  options: { attemptId?: string } = {},
): Promise<PackResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const paths = workspacePaths(resolvedRoot);
  const study = await readStudy(resolvedRoot);
  const registration = await readRegistration(resolvedRoot);
  const attemptId = options.attemptId ?? study.attempt_ids[0];

  if (!attemptId) {
    throw new Error("No attempt declared in study.json.");
  }

  assertDeclaredAttempt(study, attemptId);

  const runRoot = path.join(paths.runsRoot, `run_${attemptId}`);

  if (!(await fileExists(runRoot))) {
    throw new Error(`Raw workspace missing for ${attemptId}. Run \`hb run\` first.`);
  }

  const bundleId = `bundle-${attemptId}`;
  const bundleRoot = path.join(paths.bundlesRoot, bundleId);
  const sealedRoot = path.join(bundleRoot, BUNDLE_PATHS.sealed.dir);
  await Promise.all([
    ensureDirectory(bundleRoot),
    ensureDirectory(path.join(bundleRoot, "registry")),
    ensureDirectory(path.join(bundleRoot, BUNDLE_PATHS.payloads.dir)),
    ensureDirectory(path.join(bundleRoot, BUNDLE_PATHS.traces.dir)),
    ensureDirectory(path.join(bundleRoot, BUNDLE_PATHS.reports.dir)),
  ]);

  const attemptPlan = createAttemptPlanDocument(study);
  const benchmarkCard = createBenchmarkCard(study);
  const taskPackage = createTaskPackage(study);
  const executionContract = createExecutionContract(study);
  const taskRows = normalizeTaskResultRows(
    study.protocol_version,
    await collectTaskResultRows(runRoot, study.task_ids),
  );
  const aggregate = toAggregateReport(study.protocol_version, attemptId, taskRows);
  const evaluatorReport = toEvaluatorReport(
    study.protocol_version,
    attemptId,
    taskRows,
  );
  const baseInteractionSummary = await readJson<Record<string, unknown>>(
    path.join(runRoot, "interaction-summary.json"),
  );
  const fullInteractionLogText = await readText(
    path.join(runRoot, "interaction-log.jsonl"),
  );

  const traceParts: string[] = [];

  for (const taskId of study.task_ids) {
    traceParts.push(await readText(path.join(runRoot, "tasks", taskId, "trace.jsonl")));
  }

  const fullTraceText = `${traceParts
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n")}\n`;
  const fullInteractionSummary = {
    ...baseInteractionSummary,
    protocol_version: study.protocol_version,
    interaction_log_complete: true,
    classification_verdict: registration.declared_autonomy_mode,
  };
  const publicTaskResults =
    study.evidence_channel_mode === "public_plus_sealed"
      ? createRedactedTaskResults(taskRows)
      : taskRows;
  const publicInteractionSummary =
    study.evidence_channel_mode === "public_plus_sealed"
      ? {
          ...fullInteractionSummary,
          interaction_log_complete: false,
          classification_verdict: registration.declared_autonomy_mode,
        }
      : fullInteractionSummary;
  const publicTraceText =
    study.evidence_channel_mode === "public_plus_sealed"
      ? createRedactedTraceProjection(study, attemptId, taskRows)
      : fullTraceText;
  const publicInteractionLogText =
    study.evidence_channel_mode === "public_plus_sealed"
      ? createRedactedInteractionProjection(study, attemptId, study.task_ids)
      : fullInteractionLogText;
  const publicTraceIntegrity = createTraceIntegrity(
    study.protocol_version,
    publicTraceText,
  );
  const sealedTraceIntegrity = createTraceIntegrity(
    study.protocol_version,
    fullTraceText,
  );
  const publicTaskResultsText = canonicalNdjson(publicTaskResults);
  const fullTaskResultsText = canonicalNdjson(taskRows);
  const redactions =
    study.evidence_channel_mode === "public_plus_sealed"
      ? createRedactionManifest(study, bundleId)
      : undefined;

  await writeJson(path.join(bundleRoot, "registry", "benchmark-card.json"), benchmarkCard);
  await writeJson(path.join(bundleRoot, "registry", "task-package.json"), taskPackage);
  await writeJson(
    path.join(bundleRoot, "registry", "execution-contract.json"),
    executionContract,
  );
  await writeJson(path.join(bundleRoot, ATTEMPT_PLAN_PATH), attemptPlan);
  await writeJson(
    path.join(bundleRoot, BUNDLE_PATHS.run_group_registration),
    registration,
  );
  await writeJson(path.join(bundleRoot, BUNDLE_PATHS.aggregate), aggregate);
  await writeJson(
    path.join(bundleRoot, BUNDLE_PATHS.reports.evaluator_report),
    evaluatorReport,
  );
  await writeJson(
    path.join(bundleRoot, BUNDLE_PATHS.reports.interaction_summary),
    publicInteractionSummary,
  );
  await writeText(
    path.join(bundleRoot, BUNDLE_PATHS.traces.interaction_log),
    publicInteractionLogText,
  );
  await writeJson(
    path.join(bundleRoot, BUNDLE_PATHS.reports.trace_integrity),
    publicTraceIntegrity,
  );
  await writeText(
    path.join(bundleRoot, BUNDLE_PATHS.payloads.task_results),
    publicTaskResultsText,
  );
  await writeText(path.join(bundleRoot, BUNDLE_PATHS.traces.trace), publicTraceText);

  if (redactions) {
    await writeJson(path.join(bundleRoot, REDACTIONS_PATH), redactions);
  }

  let sealedBundleDigest: string | undefined;

  if (study.evidence_channel_mode === "public_plus_sealed") {
    await Promise.all([
      ensureDirectory(sealedRoot),
      ensureDirectory(path.join(sealedRoot, BUNDLE_PATHS.payloads.dir)),
      ensureDirectory(path.join(sealedRoot, BUNDLE_PATHS.traces.dir)),
      ensureDirectory(path.join(sealedRoot, BUNDLE_PATHS.reports.dir)),
    ]);

    await writeJson(
      path.join(sealedRoot, BUNDLE_PATHS.run_group_registration),
      registration,
    );
    await writeJson(path.join(sealedRoot, BUNDLE_PATHS.aggregate), aggregate);
    await writeJson(
      path.join(sealedRoot, BUNDLE_PATHS.reports.evaluator_report),
      evaluatorReport,
    );
    await writeJson(
      path.join(sealedRoot, BUNDLE_PATHS.reports.interaction_summary),
      fullInteractionSummary,
    );
    await writeText(
      path.join(sealedRoot, BUNDLE_PATHS.traces.interaction_log),
      fullInteractionLogText,
    );
    await writeJson(
      path.join(sealedRoot, BUNDLE_PATHS.reports.trace_integrity),
      sealedTraceIntegrity,
    );
    await writeText(
      path.join(sealedRoot, BUNDLE_PATHS.payloads.task_results),
      fullTaskResultsText,
    );
    await writeText(path.join(sealedRoot, BUNDLE_PATHS.traces.trace), fullTraceText);

    const sealedPaths = [
      BUNDLE_PATHS.aggregate,
      BUNDLE_PATHS.payloads.task_results,
      BUNDLE_PATHS.reports.evaluator_report,
      BUNDLE_PATHS.reports.interaction_summary,
      BUNDLE_PATHS.reports.trace_integrity,
      BUNDLE_PATHS.run_group_registration,
      BUNDLE_PATHS.traces.interaction_log,
      BUNDLE_PATHS.traces.trace,
    ];
    const sealedEntries = await Promise.all(
      sealedPaths.map(async (relativePath) => ({
        path: relativePath,
        sha256: sha256Digest(
          await fs.readFile(path.join(sealedRoot, relativePath)),
        ),
      })),
    );
    const sealedChecksumsText = renderChecksums(sealedEntries);
    sealedBundleDigest = computeBundleDigestFromChecksums(sealedChecksumsText);
    await writeText(path.join(sealedRoot, BUNDLE_PATHS.checksums), sealedChecksumsText);
  }

  const publicPaths = [
    ATTEMPT_PLAN_PATH,
    BUNDLE_PATHS.aggregate,
    BUNDLE_PATHS.payloads.task_results,
    BUNDLE_PATHS.reports.evaluator_report,
    BUNDLE_PATHS.reports.interaction_summary,
    BUNDLE_PATHS.reports.trace_integrity,
    BUNDLE_PATHS.run_group_registration,
    BUNDLE_PATHS.traces.interaction_log,
    BUNDLE_PATHS.traces.trace,
    "registry/benchmark-card.json",
    "registry/execution-contract.json",
    "registry/task-package.json",
  ];
  if (redactions) {
    publicPaths.push(REDACTIONS_PATH);
  }
  const registrationDigest =
    registration.registration_digest ??
    computeObjectDigest(registration as unknown as Record<string, unknown>, [
      "registration_digest",
    ]);
  const provisionalManifest = buildPublicManifest(
    study,
    attemptId,
    registration,
    registrationDigest,
    `sha256:${"0".repeat(64)}`,
    sealedBundleDigest,
    publicTraceIntegrity.trace_root_hash,
  );
  const publicEntries = await Promise.all(
    publicPaths.map(async (relativePath) => ({
      path: relativePath,
      sha256: sha256Digest(await fs.readFile(path.join(bundleRoot, relativePath))),
    })),
  );
  publicEntries.push({
    path: BUNDLE_PATHS.manifest,
    sha256: manifestBindingDigest(provisionalManifest),
  });
  const checksumsText = renderChecksums(publicEntries);
  const publicBundleDigest = computeBundleDigestFromChecksums(checksumsText);

  const manifest = buildPublicManifest(
    study,
    attemptId,
    registration,
    registrationDigest,
    publicBundleDigest,
    sealedBundleDigest,
    publicTraceIntegrity.trace_root_hash,
  );

  await writeJson(path.join(bundleRoot, BUNDLE_PATHS.manifest), manifest);
  await writeText(path.join(bundleRoot, BUNDLE_PATHS.checksums), checksumsText);

  return {
    workspace_root: resolvedRoot,
    bundle_root: bundleRoot,
    manifest,
  };
}

export async function validateBundle(
  workspaceRoot: string,
  options: { bundlePath?: string } = {},
): Promise<ValidateResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const bundleRoot = await resolveBundleRoot(resolvedRoot, options.bundlePath);
  const context = await loadValidationContext({
    publicBundleRoot: bundleRoot,
    validationMode: "local_validate",
  });
  const report = await runValidation(context, createDefaultRulePack());
  const bundleId = resolveBundleId(bundleRoot, context.manifest);
  const reportPath = path.join(
    workspacePaths(resolvedRoot).validationRoot,
    `${bundleId}.validation-report.json`,
  );

  await writeJson(reportPath, report);

  return {
    workspace_root: resolvedRoot,
    bundle_root: bundleRoot,
    report_path: reportPath,
    report,
  };
}

export async function inspectBundle(
  workspaceRoot: string,
  options: { bundlePath?: string } = {},
): Promise<InspectResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const bundleRoot = await resolveBundleRoot(resolvedRoot, options.bundlePath);
  const manifest = await readJson<BundleManifest>(
    path.join(bundleRoot, BUNDLE_PATHS.manifest),
  );
  const aggregate = await readJson<AggregateReport>(
    path.join(bundleRoot, BUNDLE_PATHS.aggregate),
  );
  const validationReport = await readValidationReportIfExists(
    resolvedRoot,
    manifest.bundle_id,
  );

  const scorecard: ScorecardSummary = {
    bundle_id: manifest.bundle_id,
    requested_trust_tier: manifest.requested_trust_tier,
    evidence_channel_mode: manifest.evidence.evidence_channel_mode,
    visibility_class: manifest.evidence.visibility_class,
    public_bundle_digest: manifest.evidence.public_bundle_digest,
    success_rate: aggregate.success_rate,
    average_score: aggregate.average_score,
    total_cost_usd: aggregate.total_cost_usd,
    average_duration_ms: aggregate.average_duration_ms,
    n_tasks: aggregate.n_tasks,
  };

  const research: ResearchSummary = {
    registration_digest: manifest.registration_digest,
    trace_root_hash: manifest.trace.trace_root_hash,
    bundle_root: bundleRoot,
    task_results_ref: manifest.artifacts.task_results_ref,
    trace_ref: manifest.trace.trace_ref,
    validation_verdict: validationReport?.overall_verdict,
    findings_count: validationReport?.findings.length,
  };

  return {
    scorecard,
    research,
  };
}

async function buildUploadRequestPayload(
  workspaceRoot: string,
  study: StudyConfig,
  bundleRoot: string,
  manifest: BundleManifest,
  validationReport: ValidationReport | undefined,
): Promise<Record<string, unknown>> {
  const registration = await readJson<RunGroupRegistration>(
    path.join(bundleRoot, BUNDLE_PATHS.run_group_registration),
  );
  const aggregate = await readJson<AggregateReport>(
    path.join(bundleRoot, BUNDLE_PATHS.aggregate),
  );
  const interactionSummary = await readJson<Record<string, unknown>>(
    path.join(bundleRoot, BUNDLE_PATHS.reports.interaction_summary),
  );
  const executionContract = await readJson<BundleExecutionContract>(
    path.join(bundleRoot, "registry", "execution-contract.json"),
  );
  const observedAttemptTotal = await countObservedAttempts(
    workspacePaths(workspaceRoot).runsRoot,
    study.attempt_ids,
  );

  const normalizedPayload = {
    submission_id: `submission-${manifest.bundle_id}`,
    study_id: manifest.run_identity.study_id,
    run_group_id: manifest.run_identity.run_group_id,
    attempt_id: manifest.run_identity.attempt_id,
    bundle_id: manifest.run_identity.bundle_id,
    submission_profile: study.submission_profile,
    requested_trust_tier: manifest.requested_trust_tier,
    benchmark: {
      id: manifest.benchmark.id,
      version: manifest.benchmark.version,
      lane_id: manifest.benchmark.lane_id,
      split: manifest.benchmark.split,
    },
    model: {
      id: executionContract.runtime.model_ref,
      label: executionContract.runtime.model_ref,
      version: executionContract.runtime.adapter_version,
    },
    harness: {
      id: executionContract.runtime.adapter_id,
      label: executionContract.runtime.launcher,
      version: executionContract.runtime.adapter_version,
    },
    metrics: {
      success_rate: aggregate.success_rate,
      median_cost_usd:
        aggregate.n_tasks > 0
          ? Number((aggregate.total_cost_usd / aggregate.n_tasks).toFixed(3))
          : 0,
      p95_latency_ms: aggregate.average_duration_ms,
      stability_score: aggregate.average_score,
      reproducibility_score:
        manifest.repeatability_class === "true_seeded" ? 1 : 0.8,
    },
    n_runs: observedAttemptTotal,
    n_tasks: aggregate.n_tasks,
    declared_attempt_total: registration.declared_attempt_total,
    observed_attempt_total: observedAttemptTotal,
    benchmark_tuned_flag: registration.benchmark_tuned_flag,
    repeatability_class: manifest.repeatability_class,
    comparison_mode: manifest.comparison_mode ?? "fixed_model_compare_harness",
    budget_class:
      manifest.requested_trust_tier === "verified"
        ? "premium"
        : manifest.requested_trust_tier === "reproduced"
          ? "standard"
          : "budget",
    evidence_channel_mode: manifest.evidence.evidence_channel_mode,
    visibility_class: manifest.evidence.visibility_class,
    release_policy: manifest.evidence.release_policy,
    declared_autonomy_mode: registration.declared_autonomy_mode,
    telemetry: {
      human_event_count: Number(interactionSummary.human_event_count ?? 0),
      approval_event_count: Number(interactionSummary.approval_event_count ?? 0),
      interactive_event_count: Number(interactionSummary.interactive_event_count ?? 0),
      tty_freeform_input_detected: Boolean(
        interactionSummary.tty_freeform_input_detected,
      ),
      manual_command_detected: Boolean(interactionSummary.manual_command_detected),
      manual_file_write_detected: Boolean(
        interactionSummary.manual_file_write_detected,
      ),
      editor_interaction_detected: Boolean(
        interactionSummary.editor_interaction_detected,
      ),
      approval_target_linkage_complete: Boolean(
        interactionSummary.approval_target_linkage_complete,
      ),
      interaction_log_complete: Boolean(interactionSummary.interaction_log_complete),
      tty_input_digest: String(interactionSummary.tty_input_digest ?? ZERO_INPUT_DIGEST),
    },
    tolerance_policy_digest: manifest.tolerance_policy_digest,
    execution_contract_digest: manifest.execution_contract_digest,
    task_package_digest: manifest.task_package_digest,
    registration_digest: manifest.registration_digest,
    public_bundle_digest: manifest.evidence.public_bundle_digest,
    sealed_audit_bundle_digest: manifest.evidence.sealed_audit_bundle_digest,
    notes:
      validationReport?.overall_verdict === "pass"
        ? []
        : [
            `local validation verdict: ${validationReport?.overall_verdict ?? "unknown"}`,
          ],
    tags: [
      "hb-cli-mvp",
      `workspace:${path.basename(workspaceRoot)}`,
      `bundle:${manifest.bundle_id}`,
    ],
    submitted_at: new Date().toISOString(),
  };

  return {
    bundle_path: bundleRoot,
    normalized_payload: normalizedPayload,
    source: "api",
    received_at: new Date().toISOString(),
  };
}

export async function uploadBundle(
  workspaceRoot: string,
  options: { bundlePath?: string; dryRun?: boolean; endpoint?: string } = {},
): Promise<UploadResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const study = await readStudy(resolvedRoot);
  const bundleRoot = await resolveBundleRoot(resolvedRoot, options.bundlePath);
  const manifest = await readJson<BundleManifest>(
    path.join(bundleRoot, BUNDLE_PATHS.manifest),
  );
  const validationReport = (
    await validateBundle(resolvedRoot, { bundlePath: bundleRoot })
  ).report;
  const payload = await buildUploadRequestPayload(
    resolvedRoot,
    study,
    bundleRoot,
    manifest,
    validationReport,
  );

  const requestPath = path.join(
    workspacePaths(resolvedRoot).uploadsRoot,
    `${manifest.bundle_id}.upload-request.json`,
  );
  await writeJson(requestPath, payload);

  if (options.dryRun) {
    return {
      request_path: requestPath,
      payload,
    };
  }

  if (validationReport?.overall_verdict === "fail") {
    throw new Error(
      `Upload aborted: local validation failed with ${validationReport.findings.length} findings.`,
    );
  }

  let receipt: Record<string, unknown>;
  const endpoint = options.endpoint ?? "mock";

  if (/^https?:\/\//u.test(endpoint)) {
    const uploadUrl = endpoint.endsWith("/api/uploads")
      ? endpoint
      : new URL("/api/uploads", endpoint).toString();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const responsePayload = (await response.json()) as Record<string, unknown>;
    receipt =
      (responsePayload.upload_receipt as Record<string, unknown> | undefined) ??
      responsePayload;
  } else {
    const warnings: string[] = [];

    if (validationReport?.overall_verdict === "warn") {
      warnings.push("local validation completed with warnings");
    }

    if (
      manifest.evidence.evidence_channel_mode === "public_plus_sealed" &&
      !manifest.evidence.sealed_audit_bundle_digest
    ) {
      warnings.push("sealed digest missing for public_plus_sealed bundle");
    }

    receipt = {
      receipt_id: `receipt_${manifest.bundle_id}`,
      submission_id: `submission-${manifest.bundle_id}`,
      received_at: new Date().toISOString(),
      requested_trust_tier: manifest.requested_trust_tier,
      submission_profile: study.submission_profile,
      intake_status: warnings.length > 0 ? "accepted_with_warnings" : "accepted",
      storage_refs: {
        submission_store_key: `submission-${manifest.bundle_id}`,
        public_bundle_digest: manifest.evidence.public_bundle_digest,
      },
      warnings,
      next_actions:
        warnings.length > 0
          ? ["Review local validation / evidence warnings before submitting upstream."]
          : ["Ready for mock-intake or verifier-worker ingestion."],
    };
  }

  const receiptPath = path.join(
    workspacePaths(resolvedRoot).uploadsRoot,
    `${manifest.bundle_id}.upload-receipt.json`,
  );
  await writeJson(receiptPath, receipt);

  return {
    request_path: requestPath,
    receipt_path: receiptPath,
    payload,
    receipt,
  };
}

export async function doctorWorkspace(workspaceRoot: string): Promise<DoctorResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const paths = workspacePaths(resolvedRoot);
  const checks: DoctorResult["checks"] = [];
  const nodeMajorVersion = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);

  checks.push({
    name: "node_version",
    status: nodeMajorVersion >= 20 ? "ok" : "warn",
    detail: `Detected Node ${process.versions.node}.`,
  });
  checks.push({
    name: "workspace_initialized",
    status: (await fileExists(paths.studyPath)) ? "ok" : "warn",
    detail: (await fileExists(paths.studyPath))
      ? "study.json found."
      : "study.json missing. Run `hb init` first.",
  });
  checks.push({
    name: "registration",
    status: (await fileExists(paths.registrationPath)) ? "ok" : "warn",
    detail: (await fileExists(paths.registrationPath))
      ? "run-group-registration.json found."
      : "run-group-registration.json missing.",
  });

  const runCount = (await fileExists(paths.runsRoot))
    ? await countDirectories(paths.runsRoot)
    : 0;
  const bundleCount = (await fileExists(paths.bundlesRoot))
    ? await countDirectories(paths.bundlesRoot)
    : 0;

  checks.push({
    name: "raw_runs",
    status: runCount > 0 ? "ok" : "warn",
    detail: `Detected ${runCount} raw run workspace(s).`,
  });
  checks.push({
    name: "bundles",
    status: bundleCount > 0 ? "ok" : "warn",
    detail: `Detected ${bundleCount} packed bundle(s).`,
  });

  return {
    workspace_root: resolvedRoot,
    checks,
  };
}

function renderInspectResult(result: InspectResult): string {
  return [
    `Bundle: ${result.scorecard.bundle_id}`,
    "Scorecard",
    `  requested_trust_tier: ${result.scorecard.requested_trust_tier}`,
    `  evidence_channel_mode: ${result.scorecard.evidence_channel_mode}`,
    `  visibility_class: ${result.scorecard.visibility_class}`,
    `  public_bundle_digest: ${result.scorecard.public_bundle_digest ?? "n/a"}`,
    `  success_rate: ${result.scorecard.success_rate}`,
    `  average_score: ${result.scorecard.average_score}`,
    `  total_cost_usd: ${result.scorecard.total_cost_usd}`,
    `  average_duration_ms: ${result.scorecard.average_duration_ms}`,
    `  n_tasks: ${result.scorecard.n_tasks}`,
    "Research",
    `  registration_digest: ${result.research.registration_digest ?? "n/a"}`,
    `  trace_root_hash: ${result.research.trace_root_hash}`,
    `  task_results_ref: ${result.research.task_results_ref}`,
    `  trace_ref: ${result.research.trace_ref}`,
    `  validation_verdict: ${result.research.validation_verdict ?? "not-run"}`,
    `  findings_count: ${result.research.findings_count ?? 0}`,
  ].join("\n");
}

function renderDoctorResult(result: DoctorResult): string {
  return result.checks
    .map((check) => `[${check.status.toUpperCase()}] ${check.name}: ${check.detail}`)
    .join("\n");
}

function renderValidationResult(result: ValidateResult): string {
  return [
    `Validation verdict: ${result.report.overall_verdict.toUpperCase()}`,
    `Bundle root: ${result.bundle_root}`,
    `Report path: ${result.report_path}`,
    `Findings: ${result.report.findings.length}`,
  ].join("\n");
}

function renderUploadResult(result: UploadResult): string {
  return [
    `Request saved: ${result.request_path}`,
    `Receipt saved: ${result.receipt_path ?? "dry-run (no receipt)"}`,
  ].join("\n");
}

function renderGenericResult(value: unknown): string {
  return `${canonicalStringify(value)}\n`;
}

function parseArgs(argv: string[]): {
  positionals: string[];
  flags: Record<string, string | boolean>;
} {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token) {
      continue;
    }

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const normalizedToken = token.slice(2);
    const [rawKey, inlineValue] = normalizedToken.split("=", 2);

    if (!rawKey) {
      continue;
    }

    if (inlineValue !== undefined) {
      flags[rawKey] = inlineValue;
      continue;
    }

    const nextToken = argv[index + 1];

    if (nextToken && !nextToken.startsWith("--")) {
      flags[rawKey] = nextToken;
      index += 1;
      continue;
    }

    flags[rawKey] = true;
  }

  return { positionals, flags };
}

function getStringFlag(
  flags: Record<string, string | boolean>,
  key: string,
): string | undefined {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

function getBooleanFlag(
  flags: Record<string, string | boolean>,
  key: string,
): boolean {
  return flags[key] === true || flags[key] === "true";
}

function getNumberFlag(
  flags: Record<string, string | boolean>,
  key: string,
): number | undefined {
  const value = getStringFlag(flags, key);
  return value ? Number.parseInt(value, 10) : undefined;
}

function usage(): string {
  return [
    "Usage: hb <command> [options]",
    "",
    "Commands:",
    "  doctor",
    "  init [--profile community_light|reproducible_standard|verified_full] [--attempts N] [--tasks N] [--sealed]",
    "  run [--attempt attempt-001]",
    "  pack [--attempt attempt-001]",
    "  validate [bundlePath]",
    "  inspect [bundlePath]",
    "  upload [bundlePath] [--dry-run] [--endpoint mock|http://...]",
  ].join("\n");
}

export async function main(argv: string[]): Promise<number> {
  const { positionals, flags } = parseArgs(argv);
  const command = positionals[0] ?? "help";
  const workspaceRoot = path.resolve(getStringFlag(flags, "cwd") ?? process.cwd());
  const wantsJson = getBooleanFlag(flags, "json");

  try {
    switch (command) {
      case "doctor": {
        const result = await doctorWorkspace(workspaceRoot);
        console.log(wantsJson ? renderGenericResult(result) : renderDoctorResult(result));
        return result.checks.some((check) => check.status === "fail") ? 1 : 0;
      }
      case "init": {
        const result = await initWorkspace(workspaceRoot, {
          profile: getStringFlag(flags, "profile") as SubmissionProfile | undefined,
          attempts: getNumberFlag(flags, "attempts"),
          tasks: getNumberFlag(flags, "tasks"),
          requestedTrustTier: getStringFlag(
            flags,
            "trust-tier",
          ) as RequestedTrustTier | undefined,
          repeatabilityClass: getStringFlag(
            flags,
            "repeatability",
          ) as StudyConfig["repeatability_class"] | undefined,
          sealed: getBooleanFlag(flags, "sealed"),
          force: getBooleanFlag(flags, "force"),
        });
        console.log(wantsJson ? renderGenericResult(result) : renderGenericResult({
          study_path: result.study_path,
          registration_path: result.registration_path,
          study_id: result.study.study_id,
          run_group_id: result.study.run_group_id,
        }));
        return 0;
      }
      case "run": {
        const result = await runWorkspace(workspaceRoot, {
          attemptId: getStringFlag(flags, "attempt"),
        });
        console.log(wantsJson ? renderGenericResult(result) : renderGenericResult(result));
        return 0;
      }
      case "pack": {
        const result = await packWorkspace(workspaceRoot, {
          attemptId: getStringFlag(flags, "attempt"),
        });
        console.log(wantsJson ? renderGenericResult(result) : renderGenericResult({
          bundle_root: result.bundle_root,
          bundle_id: result.manifest.bundle_id,
          public_bundle_digest: result.manifest.evidence.public_bundle_digest,
        }));
        return 0;
      }
      case "validate": {
        const result = await validateBundle(workspaceRoot, {
          bundlePath: positionals[1],
        });
        console.log(
          wantsJson ? renderGenericResult(result.report) : renderValidationResult(result),
        );
        return result.report.overall_verdict === "fail" ? 1 : 0;
      }
      case "inspect": {
        const result = await inspectBundle(workspaceRoot, {
          bundlePath: positionals[1],
        });
        console.log(wantsJson ? renderGenericResult(result) : renderInspectResult(result));
        return 0;
      }
      case "upload": {
        const result = await uploadBundle(workspaceRoot, {
          bundlePath: positionals[1],
          dryRun: getBooleanFlag(flags, "dry-run"),
          endpoint: getStringFlag(flags, "endpoint"),
        });
        console.log(wantsJson ? renderGenericResult(result) : renderUploadResult(result));
        return 0;
      }
      case "help":
      default:
        console.log(usage());
        return command === "help" ? 0 : 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
}
