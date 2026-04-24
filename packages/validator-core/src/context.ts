import { promises as fs } from "node:fs";
import path from "node:path";

import { BUNDLE_PATHS, BUNDLE_PROTOCOL_VERSION } from "./hash.js";
import { normalizePath } from "./hash.js";
import type {
  BundleAggregate,
  BundleArtifactManifest,
  BundleBenchmarkCard,
  BundleCompletenessProof,
  BundleConventions,
  BundleEnvironmentReport,
  BundleEvaluatorReport,
  BundleExecutionContract,
  BundleInteractionSummary,
  BundleManifest,
  BundleRegistration,
  BundleTaskPackage,
  BundleTaskResultEntry,
  BundleTraceIntegrity,
  BundleVerificationRecord,
  LoadValidationContextOptions,
  ValidationContext,
} from "./model.js";

const DEFAULT_BUNDLE_CONVENTIONS: BundleConventions = {
  publicTracePath: BUNDLE_PATHS.traces.trace,
  publicInteractionLogPath: BUNDLE_PATHS.traces.interaction_log,
  publicRedactionsPath: "redactions.json",
  attemptPlanPath: "attempt-plan.json",
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function indexBundleFiles(
  root: string,
  excludeTopLevel: string[] = [],
): Promise<{ root: string; files: Record<string, string> }> {
  const files: Record<string, string> = {};

  async function walk(currentDirectory: string): Promise<void> {
    const entries = (await fs.readdir(currentDirectory, {
      withFileTypes: true,
    })) as Array<{
      name: string;
      isDirectory(): boolean;
    }>;

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = normalizePath(path.relative(root, absolutePath));

      if (!relativePath) {
        continue;
      }

      const topLevel = relativePath.split("/")[0];
      if (topLevel && excludeTopLevel.includes(topLevel)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      files[relativePath] = absolutePath;
    }
  }

  await walk(root);

  return {
    root,
    files,
  };
}

async function readJsonIfExists<T>(filePath: string): Promise<T | undefined> {
  if (!(await fileExists(filePath))) {
    return undefined;
  }

  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readTextIfExists(filePath: string): Promise<string | undefined> {
  if (!(await fileExists(filePath))) {
    return undefined;
  }

  return fs.readFile(filePath, "utf8");
}

async function readJsonRefIfExists<T>(
  bundleRoot: string,
  refPath: string | null | undefined,
): Promise<T | undefined> {
  if (!refPath) {
    return undefined;
  }

  return readJsonIfExists<T>(path.join(bundleRoot, refPath));
}

async function readTextRefIfExists(
  bundleRoot: string,
  refPath: string | null | undefined,
): Promise<string | undefined> {
  if (!refPath) {
    return undefined;
  }

  return readTextIfExists(path.join(bundleRoot, refPath));
}

function countNonEmptyLines(text: string | undefined): number | undefined {
  if (!text) {
    return undefined;
  }

  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function parseNdjson<T>(text: string | undefined): T[] | undefined {
  if (!text) {
    return undefined;
  }

  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

async function loadBenchmarkCard(
  bundleRoot: string,
): Promise<BundleBenchmarkCard | undefined> {
  const candidates = [
    "registry/benchmark-card.json",
    "registry/sample/benchmarks/terminal-lite-v1-public.json",
    "registry/sample/benchmarks/terminal-lite-v1-hidden.json",
  ];

  for (const candidate of candidates) {
    const value = await readJsonIfExists<BundleBenchmarkCard>(
      path.join(bundleRoot, candidate),
    );
    if (value) {
      return value;
    }
  }

  return undefined;
}

async function loadRegistryObject<T>(
  bundleRoot: string,
  primaryPath: string,
  fallbackPath?: string,
): Promise<T | undefined> {
  const primary = await readJsonIfExists<T>(path.join(bundleRoot, primaryPath));
  if (primary) {
    return primary;
  }

  if (fallbackPath) {
    return readJsonIfExists<T>(path.join(bundleRoot, fallbackPath));
  }

  return undefined;
}

export async function loadValidationContext(
  options: LoadValidationContextOptions,
): Promise<ValidationContext> {
  const publicBundleRoot = path.resolve(options.publicBundleRoot);
  const inferredSealedRoot = path.join(publicBundleRoot, BUNDLE_PATHS.sealed.dir);
  const sealedBundleRoot =
    options.sealedBundleRoot ??
    ((await fileExists(inferredSealedRoot)) ? inferredSealedRoot : undefined);

  const publicBundle = await indexBundleFiles(publicBundleRoot, [BUNDLE_PATHS.sealed.dir]);
  const sealedBundle = sealedBundleRoot
    ? await indexBundleFiles(sealedBundleRoot)
    : undefined;

  const manifest = await readJsonIfExists<BundleManifest>(
    path.join(publicBundleRoot, BUNDLE_PATHS.manifest),
  );
  const benchmarkCard = await loadBenchmarkCard(publicBundleRoot);

  const taskPackage = await loadRegistryObject<BundleTaskPackage>(
    publicBundleRoot,
    "registry/task-package.json",
    benchmarkCard?.registry_refs.task_package,
  );
  const executionContract = await loadRegistryObject<BundleExecutionContract>(
    publicBundleRoot,
    "registry/execution-contract.json",
    benchmarkCard?.registry_refs.execution_contract,
  );

  const taskResultsText = await readTextRefIfExists(
    publicBundleRoot,
    manifest?.artifacts.task_results_ref,
  );
  const sealedTaskResultsText = sealedBundleRoot
    ? await readTextIfExists(
        path.join(sealedBundleRoot, BUNDLE_PATHS.payloads.task_results),
      )
    : undefined;
  const publicTraceText = await readTextRefIfExists(
    publicBundleRoot,
    manifest?.trace.trace_ref ?? DEFAULT_BUNDLE_CONVENTIONS.publicTracePath,
  );
  const publicInteractionLogText = await readTextRefIfExists(
    publicBundleRoot,
    manifest?.trace.interaction_log_ref ??
      DEFAULT_BUNDLE_CONVENTIONS.publicInteractionLogPath,
  );
  const sealedTraceText = sealedBundleRoot
    ? await readTextIfExists(
        path.join(
          sealedBundleRoot,
          manifest?.trace.trace_ref ?? DEFAULT_BUNDLE_CONVENTIONS.publicTracePath,
        ),
      )
    : undefined;
  const sealedInteractionLogText = sealedBundleRoot
    ? await readTextIfExists(
        path.join(
          sealedBundleRoot,
          manifest?.trace.interaction_log_ref ??
            DEFAULT_BUNDLE_CONVENTIONS.publicInteractionLogPath,
        ),
      )
    : undefined;
  const redactions = await readJsonIfExists<Record<string, unknown>>(
    path.join(publicBundleRoot, DEFAULT_BUNDLE_CONVENTIONS.publicRedactionsPath),
  );
  const attemptPlanDocument = await readJsonIfExists<{
    attempt_ids?: string[];
    attempts?: string[];
  }>(path.join(publicBundleRoot, DEFAULT_BUNDLE_CONVENTIONS.attemptPlanPath));

  return {
    protocol_version:
      options.protocolVersion ?? manifest?.protocol_version ?? BUNDLE_PROTOCOL_VERSION,
    validation_mode: options.validationMode ?? "local_validate",
    public_bundle_root: publicBundleRoot,
    sealed_bundle_root: sealedBundleRoot,
    public_bundle: publicBundle,
    sealed_bundle: sealedBundle,
    checksums_text: await readTextIfExists(
      path.join(publicBundleRoot, BUNDLE_PATHS.checksums),
    ),
    sealed_checksums_text: sealedBundleRoot
      ? await readTextIfExists(path.join(sealedBundleRoot, BUNDLE_PATHS.checksums))
      : undefined,
    manifest,
    registration: await readJsonRefIfExists<BundleRegistration>(
      publicBundleRoot,
      manifest?.registration_ref ?? BUNDLE_PATHS.run_group_registration,
    ),
    benchmark_card: benchmarkCard,
    task_package: taskPackage,
    execution_contract: executionContract,
    aggregate: await readJsonRefIfExists<BundleAggregate>(
      publicBundleRoot,
      manifest?.artifacts.aggregate_ref ?? BUNDLE_PATHS.aggregate,
    ),
    evaluator_report: await readJsonRefIfExists<BundleEvaluatorReport>(
      publicBundleRoot,
      manifest?.artifacts.evaluator_report_ref ?? BUNDLE_PATHS.reports.evaluator_report,
    ),
    artifact_manifest: await readJsonRefIfExists<BundleArtifactManifest>(
      publicBundleRoot,
      manifest?.artifacts.artifact_manifest_ref ?? BUNDLE_PATHS.artifact_manifest,
    ),
    interaction_summary: await readJsonRefIfExists<BundleInteractionSummary>(
      publicBundleRoot,
      manifest?.trace.interaction_summary_ref ??
        BUNDLE_PATHS.reports.interaction_summary,
    ),
    trace_integrity: await readJsonRefIfExists<BundleTraceIntegrity>(
      publicBundleRoot,
      manifest?.trace.trace_integrity_ref ?? BUNDLE_PATHS.reports.trace_integrity,
    ),
    environment_report: await readJsonRefIfExists<BundleEnvironmentReport>(
      publicBundleRoot,
      manifest?.trace.environment_report_ref,
    ),
    completeness_proof: await readJsonRefIfExists<BundleCompletenessProof>(
      publicBundleRoot,
      manifest?.trace.completeness_proof_ref,
    ),
    verification_record: await readJsonRefIfExists<BundleVerificationRecord>(
      publicBundleRoot,
      manifest?.trace.verification_record_ref ??
        BUNDLE_PATHS.reports.verification_record,
    ),
    attempt_plan:
      attemptPlanDocument?.attempt_ids ??
      attemptPlanDocument?.attempts ??
      undefined,
    task_results: parseNdjson<BundleTaskResultEntry>(taskResultsText),
    sealed_task_results: parseNdjson<BundleTaskResultEntry>(sealedTaskResultsText),
    public_trace_text: publicTraceText,
    public_trace_line_count: countNonEmptyLines(publicTraceText),
    public_interaction_log_text: publicInteractionLogText,
    public_interaction_log_line_count: countNonEmptyLines(publicInteractionLogText),
    redactions,
    sealed_trace_text: sealedTraceText,
    sealed_trace_line_count: countNonEmptyLines(sealedTraceText),
    sealed_interaction_log_text: sealedInteractionLogText,
    sealed_interaction_log_line_count: countNonEmptyLines(sealedInteractionLogText),
  };
}

export { DEFAULT_BUNDLE_CONVENTIONS, indexBundleFiles };
