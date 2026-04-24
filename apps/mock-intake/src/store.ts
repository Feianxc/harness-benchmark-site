import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadValidationContext,
  runValidation,
  type BundleManifest,
  type ValidationContext,
  type ValidationReport,
} from "@ohbp/validator-core";
import { createDefaultRulePack } from "@ohbp/validator-rules";
import type {
  MockUploadInput,
  StoredSubmissionRecord,
  UploadReceipt,
  ValidationCorrection,
  ValidationCorrectionValue,
} from "@ohbp/verifier-core";
import {
  createDeterministicId,
  createUploadReceipt,
  normalizeIncomingSubmission,
} from "@ohbp/verifier-core";

function appRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function intakeDataRoot(customRoot?: string): string {
  return customRoot ?? join(appRoot(), "data");
}

function submissionDir(customRoot?: string): string {
  return join(intakeDataRoot(customRoot), "submissions");
}

function receiptDir(customRoot?: string): string {
  return join(intakeDataRoot(customRoot), "receipts");
}

function budgetClassFor(requestedTrustTier: BundleManifest["requested_trust_tier"]) {
  if (requestedTrustTier === "verified") {
    return "premium";
  }

  if (requestedTrustTier === "reproduced") {
    return "standard";
  }

  return "budget";
}

function participantFromModelRef(modelRef: string, version?: string) {
  const [provider, maybeId] = modelRef.includes(":")
    ? modelRef.split(":", 2)
    : [undefined, modelRef];

  return {
    id: modelRef,
    label: modelRef,
    provider,
    version: version ?? maybeId,
  };
}

function toCorrectionValue(
  value: unknown,
): ValidationCorrectionValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.stringify(value);
}

function collectProvidedFields(
  value: unknown,
  prefix = "",
): Array<{ path: string; value: unknown }> {
  if (value === undefined) {
    return [];
  }

  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return prefix ? [{ path: prefix, value }] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    collectProvidedFields(nested, prefix ? `${prefix}.${key}` : key),
  );
}

function readPath(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object" || !(key in current)) {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, value);
}

function collectPayloadCorrections(
  clientPayload: MockUploadInput["normalized_payload"] | undefined,
  correctedPayload: MockUploadInput["normalized_payload"] | undefined,
): ValidationCorrection[] {
  if (!clientPayload || !correctedPayload) {
    return [];
  }

  const corrections: ValidationCorrection[] = [];

  for (const { path, value } of collectProvidedFields(clientPayload)) {
    const declared = toCorrectionValue(value);
    const corrected = toCorrectionValue(readPath(correctedPayload, path));

    if (declared === corrected) {
      continue;
    }

    corrections.push({
        field: path,
        declared,
        corrected,
        reason: "client_payload_overridden",
      });
  }

  return corrections;
}

function applyBundleTruth(
  input: MockUploadInput,
  context: ValidationContext,
  validationReport: ValidationReport,
): {
  normalizedInput: MockUploadInput;
  truthMetadata: {
    source_of_truth_mode: "validated_bundle_truth";
    manifest_declared_public_bundle_digest?: string;
    validated_public_bundle_digest?: string;
    manifest_declared_sealed_audit_bundle_digest?: string;
    validated_sealed_audit_bundle_digest?: string;
    client_claimed_observed_attempt_total?: number;
  };
} {
  const manifest = context.manifest;
  const existingPayload = input.normalized_payload ?? {};
  const registration = context.registration;
  const aggregate = context.aggregate;
  const executionContract = context.execution_contract;
  const interactionSummary = context.interaction_summary;
  const serverReceivedAt = input.received_at ?? new Date().toISOString();
  const validatedBundleDigest =
    validationReport.computed_digests.public_bundle_digest ??
    validationReport.bundle_digest ??
    manifest?.evidence.public_bundle_digest ??
    existingPayload.public_bundle_digest;
  const validatedSealedDigest =
    validationReport.computed_digests.sealed_bundle_digest ??
    manifest?.evidence.sealed_audit_bundle_digest ??
    existingPayload.sealed_audit_bundle_digest;

  if (!manifest) {
    throw new Error("bundle rejected at platform_intake: manifest.json missing");
  }

  const modelRef = executionContract?.runtime.model_ref ?? existingPayload.model?.id ?? "unknown-model";
  const harnessId =
    executionContract?.runtime.adapter_id ??
    existingPayload.harness?.id ??
    "unknown-harness";
  const observedAttemptTotal = 1;

  return {
    normalizedInput: {
      ...input,
      normalized_payload: {
        submission_id: createDeterministicId("submission", {
          public_bundle_digest: validatedBundleDigest,
          bundle_id: manifest.bundle_id,
        }),
        study_id: manifest.run_identity.study_id,
        run_group_id: manifest.run_identity.run_group_id,
        attempt_id: manifest.run_identity.attempt_id,
        bundle_id: manifest.run_identity.bundle_id,
        entry_id: createDeterministicId("entry", {
          benchmark_id: manifest.benchmark.id,
          lane_id: manifest.benchmark.lane_id,
          model_id: modelRef,
          harness_id: harnessId,
          execution_contract_digest: manifest.execution_contract_digest,
          tolerance_policy_digest: manifest.tolerance_policy_digest,
        }),
        submission_profile: manifest.submission_profile,
        requested_trust_tier: manifest.requested_trust_tier,
        benchmark: {
          id: manifest.benchmark.id,
          version: manifest.benchmark.version,
          lane_id: manifest.benchmark.lane_id,
          split: manifest.benchmark.split,
          health: existingPayload.benchmark?.health,
        },
        model: participantFromModelRef(
          modelRef,
          executionContract?.runtime.adapter_version ?? existingPayload.model?.version,
        ),
        harness: {
          id: harnessId,
          label:
            executionContract?.runtime.launcher ??
            existingPayload.harness?.label ??
            harnessId,
          version:
            executionContract?.runtime.adapter_version ??
            existingPayload.harness?.version,
        },
        metrics: aggregate
          ? {
              success_rate: aggregate.success_rate,
              median_cost_usd:
                aggregate.n_tasks > 0
                  ? Number((aggregate.total_cost_usd / aggregate.n_tasks).toFixed(3))
                  : 0,
              p95_latency_ms: aggregate.average_duration_ms,
              stability_score: aggregate.average_score,
              reproducibility_score:
                manifest.repeatability_class === "true_seeded" ? 1 : 0.8,
            }
          : existingPayload.metrics,
        n_runs: observedAttemptTotal,
        n_tasks:
          aggregate?.n_tasks ??
          registration?.declared_task_total ??
          existingPayload.n_tasks,
        declared_attempt_total:
          registration?.declared_attempt_total ??
          existingPayload.declared_attempt_total,
        observed_attempt_total: observedAttemptTotal,
        benchmark_tuned_flag:
          registration?.benchmark_tuned_flag ??
          existingPayload.benchmark_tuned_flag ??
          false,
        repeatability_class: manifest.repeatability_class,
        comparison_mode: manifest.comparison_mode,
        budget_class: budgetClassFor(manifest.requested_trust_tier),
        evidence_channel_mode: manifest.evidence.evidence_channel_mode,
        visibility_class: manifest.evidence.visibility_class,
        release_policy: manifest.evidence.release_policy,
        declared_autonomy_mode:
          registration?.declared_autonomy_mode ??
          existingPayload.declared_autonomy_mode ??
          "autonomous",
        telemetry: interactionSummary
          ? {
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
              interaction_log_complete: Boolean(
                interactionSummary.interaction_log_complete,
              ),
              tty_input_digest: String(interactionSummary.tty_input_digest ?? "ZERO_INPUT_V1"),
            }
          : existingPayload.telemetry,
        task_package_digest: manifest.task_package_digest,
        execution_contract_digest: manifest.execution_contract_digest,
        tolerance_policy_digest: manifest.tolerance_policy_digest,
        registration_digest: manifest.registration_digest ?? undefined,
        public_bundle_digest: validatedBundleDigest ?? undefined,
        sealed_audit_bundle_digest: validatedSealedDigest ?? undefined,
        provider_release_window:
          registration?.provider_release_window ?? existingPayload.provider_release_window,
        support_count: observedAttemptTotal,
        notes:
          validationReport.overall_verdict === "warn"
            ? [
                ...(existingPayload.notes ?? []),
                "server validation completed with warnings during platform_intake",
              ]
            : existingPayload.notes,
        tags: [
          ...(existingPayload.tags ?? []),
          "validated_by:mock-intake",
        ],
        submitted_at: serverReceivedAt,
      },
    },
    truthMetadata: {
      source_of_truth_mode: "validated_bundle_truth",
      manifest_declared_public_bundle_digest:
        manifest.evidence.public_bundle_digest ?? undefined,
      validated_public_bundle_digest: validatedBundleDigest,
      manifest_declared_sealed_audit_bundle_digest:
        manifest.evidence.sealed_audit_bundle_digest ?? undefined,
      validated_sealed_audit_bundle_digest: validatedSealedDigest,
      client_claimed_observed_attempt_total:
        existingPayload.observed_attempt_total,
    },
  };
}

async function validateBundleAtIntake(
  input: MockUploadInput,
): Promise<{
  normalizedInput: MockUploadInput;
  validationReport?: ValidationReport;
  truthMetadata?: {
    source_of_truth_mode: "validated_bundle_truth";
    manifest_declared_public_bundle_digest?: string;
    validated_public_bundle_digest?: string;
    manifest_declared_sealed_audit_bundle_digest?: string;
    validated_sealed_audit_bundle_digest?: string;
    client_claimed_observed_attempt_total?: number;
  };
}> {
  if (!input.bundle_path) {
    if ((input.source ?? "api") === "api") {
      throw new Error("api uploads must include bundle_path for platform_intake validation");
    }

    return {
      normalizedInput: input,
    };
  }

  const context = await loadValidationContext({
    publicBundleRoot: input.bundle_path,
    validationMode: "platform_intake",
  });
  const validationReport = await runValidation(context, createDefaultRulePack());

  if (validationReport.overall_verdict === "fail") {
    throw new Error(
      `bundle rejected at platform_intake: ${validationReport.findings.length} validation findings`,
    );
  }

  const truth = applyBundleTruth(input, context, validationReport);
  return {
    normalizedInput: truth.normalizedInput,
    validationReport,
    truthMetadata: truth.truthMetadata,
  };
}

async function ensureStore(customRoot?: string): Promise<void> {
  await mkdir(submissionDir(customRoot), { recursive: true });
  await mkdir(receiptDir(customRoot), { recursive: true });
}

export async function persistUpload(
  input: MockUploadInput,
  customRoot?: string,
): Promise<StoredSubmissionRecord> {
  await ensureStore(customRoot);
  const { normalizedInput, validationReport, truthMetadata } =
    await validateBundleAtIntake(input);
  const { normalized, bundlePath } = await normalizeIncomingSubmission(normalizedInput);
  const receipt = createUploadReceipt(normalized, bundlePath);
  const payloadCorrections = collectPayloadCorrections(
    input.normalized_payload,
    normalizedInput.normalized_payload,
  );
  const digestCorrections: ValidationCorrection[] = [];

  if (
    truthMetadata?.manifest_declared_public_bundle_digest &&
    truthMetadata.validated_public_bundle_digest &&
    truthMetadata.manifest_declared_public_bundle_digest !==
      truthMetadata.validated_public_bundle_digest
  ) {
    digestCorrections.push({
      field: "manifest.evidence.public_bundle_digest",
      declared: truthMetadata.manifest_declared_public_bundle_digest,
      corrected: truthMetadata.validated_public_bundle_digest,
      reason: "manifest_digest_reconciled",
    });
  }

  if (
    truthMetadata?.manifest_declared_sealed_audit_bundle_digest &&
    truthMetadata.validated_sealed_audit_bundle_digest &&
    truthMetadata.manifest_declared_sealed_audit_bundle_digest !==
      truthMetadata.validated_sealed_audit_bundle_digest
  ) {
    digestCorrections.push({
      field: "manifest.evidence.sealed_audit_bundle_digest",
      declared: truthMetadata.manifest_declared_sealed_audit_bundle_digest,
      corrected: truthMetadata.validated_sealed_audit_bundle_digest,
      reason: "manifest_digest_reconciled",
    });
  }

  const corrections = [...payloadCorrections, ...digestCorrections];
  const correctedFields = [...new Set(corrections.map((item) => item.field))];

  if (validationReport?.overall_verdict === "warn") {
    receipt.intake_status = "accepted_with_warnings";
    receipt.warnings.push(
      `server validation completed with warnings (${validationReport.findings.length} findings)`,
    );
  }

  if (correctedFields.length > 0) {
    receipt.intake_status = "accepted_with_warnings";
    receipt.warnings.push(
      `platform intake corrected ${correctedFields.length} field(s) to validated bundle truth`,
    );
  }

  const record: StoredSubmissionRecord = {
    bundle_path: bundlePath,
    source: input.source ?? "api",
    uploaded_at: receipt.received_at,
    validation_summary: validationReport
      ? {
          overall_verdict: validationReport.overall_verdict,
          finding_count: validationReport.findings.length,
          bundle_digest: validationReport.bundle_digest,
          validated_at: validationReport.completed_at,
          source_of_truth_mode:
            truthMetadata?.source_of_truth_mode ?? "validated_bundle_truth",
          manifest_declared_public_bundle_digest:
            truthMetadata?.manifest_declared_public_bundle_digest,
          validated_public_bundle_digest:
            truthMetadata?.validated_public_bundle_digest ??
            normalized.public_bundle_digest,
          manifest_declared_sealed_audit_bundle_digest:
            truthMetadata?.manifest_declared_sealed_audit_bundle_digest,
          validated_sealed_audit_bundle_digest:
            truthMetadata?.validated_sealed_audit_bundle_digest ??
            normalized.sealed_audit_bundle_digest,
          client_claimed_observed_attempt_total:
            truthMetadata?.client_claimed_observed_attempt_total,
          corrected_fields: correctedFields,
          corrections,
        }
      : undefined,
    normalized_payload: normalized,
    upload_receipt: receipt,
  };

  await writeFile(
    join(submissionDir(customRoot), `${normalized.submission_id}.json`),
    JSON.stringify(record, null, 2),
    "utf8",
  );
  await writeFile(
    join(receiptDir(customRoot), `${receipt.receipt_id}.json`),
    JSON.stringify(receipt, null, 2),
    "utf8",
  );

  return record;
}

export async function listStoredSubmissions(customRoot?: string): Promise<StoredSubmissionRecord[]> {
  await ensureStore(customRoot);
  const files = await readdir(submissionDir(customRoot));
  const records = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const content = await readFile(join(submissionDir(customRoot), file), "utf8");
        return JSON.parse(content) as StoredSubmissionRecord;
      }),
  );

  return records.sort((left, right) => right.uploaded_at.localeCompare(left.uploaded_at));
}

export async function readUploadReceipt(
  receiptId: string,
  customRoot?: string,
): Promise<UploadReceipt | undefined> {
  try {
    const content = await readFile(join(receiptDir(customRoot), `${receiptId}.json`), "utf8");
    return JSON.parse(content) as UploadReceipt;
  } catch {
    return undefined;
  }
}
