import {
  createPublicationRecord,
  normalizeIncomingSubmission,
  type NormalizedSubmission,
  type PublicationRecord,
  type StoredSubmissionRecord,
} from "@ohbp/verifier-core";
import {
  buildAllBoardViews,
  buildEntryDetailView,
  type UiLanguage,
  type BoardPageView,
  type EntryDetailView,
} from "@ohbp/view-models";
import { persistUpload } from "../../mock-intake/src/store.js";
import { demoSubmissionSeeds } from "./demo-seeds.js";
import {
  clearWorkerOutputs,
  defaultIntakeDataDir,
  defaultWorkerDataDir,
  readPublicationGovernanceDirectives,
  readStoredSubmissions,
  writePublicationBundle,
} from "./io.js";

export interface PipelineResult {
  publications: PublicationRecord[];
  boardViews: BoardPageView[];
  entryViews: EntryDetailView[];
}

function runGroupAggregationKey(submission: Pick<
  NormalizedSubmission,
  | "study_id"
  | "run_group_id"
  | "registration_digest"
  | "execution_contract_digest"
  | "task_package_digest"
  | "tolerance_policy_digest"
>): string {
  return [
    submission.study_id,
    submission.run_group_id,
    submission.registration_digest,
    submission.execution_contract_digest,
    submission.task_package_digest,
    submission.tolerance_policy_digest,
  ].join("::");
}

function publicationHistoryFor(
  item: StoredSubmissionRecord,
  observedAttemptTotal: number,
): PublicationRecord["history"] {
  const history: PublicationRecord["history"] = [];
  const validation = item.validation_summary;

  if (validation) {
    history.push({
      at: validation.validated_at,
      label: "platform_intake_validation",
      detail: `${validation.overall_verdict} / ${validation.source_of_truth_mode} / ${validation.finding_count} findings`,
    });

    if (validation.corrected_fields.length > 0) {
      history.push({
        at: validation.validated_at,
        label: "platform_intake_correction",
        detail: `${validation.corrected_fields.length} corrected field(s): ${validation.corrected_fields.join(", ")}`,
      });
    }
  }

  if (observedAttemptTotal !== item.normalized_payload.observed_attempt_total) {
    history.push({
      at: item.uploaded_at,
      label: "run_group_truth_reconciled",
      detail: `observed_attempt_total reconciled from ${item.normalized_payload.observed_attempt_total} to ${observedAttemptTotal} distinct stored attempts for this run-group boundary`,
    });
  }

  return history;
}

function localizedBoardViews(
  publications: PublicationRecord[],
  lang: UiLanguage,
): BoardPageView[] {
  return buildAllBoardViews(publications, lang);
}

function localizedEntryViews(
  publications: PublicationRecord[],
  lang: UiLanguage,
): EntryDetailView[] {
  return publications
    .map((publication) => buildEntryDetailView(publication.entry_id, publications, lang))
    .filter((value): value is EntryDetailView => Boolean(value));
}

export async function seedDemoSubmissionStore(
  intakeDir = defaultIntakeDataDir(),
): Promise<StoredSubmissionRecord[]> {
  const stored: StoredSubmissionRecord[] = [];

  for (const payload of demoSubmissionSeeds) {
    const record = await persistUpload(
      {
        normalized_payload: payload,
        source: "seed",
        received_at: payload.submitted_at,
      },
      intakeDir,
    );

    stored.push(record);
  }

  return stored;
}

export async function buildPublicationRecords(
  intakeDir = defaultIntakeDataDir(),
): Promise<PublicationRecord[]> {
  const storedSubmissions = (await readStoredSubmissions(intakeDir)).filter(
    (item) => item.validation_summary?.overall_verdict !== "fail",
  );
  const governanceDirectives = await readPublicationGovernanceDirectives(intakeDir);
  const observedAttemptsByRunGroup = new Map<string, Set<string>>();

  for (const item of storedSubmissions) {
    const aggregationKey = runGroupAggregationKey(item.normalized_payload);
    const bucket = observedAttemptsByRunGroup.get(aggregationKey) ?? new Set<string>();
    bucket.add(
      [
        item.normalized_payload.attempt_id,
        item.normalized_payload.public_bundle_digest,
      ].join("::"),
    );
    observedAttemptsByRunGroup.set(aggregationKey, bucket);
  }

  return storedSubmissions.map((item) => {
    const usesValidatedBundleTruth =
      item.validation_summary?.source_of_truth_mode === "validated_bundle_truth";
    const observedAttemptTotal =
      usesValidatedBundleTruth
        ? observedAttemptsByRunGroup.get(runGroupAggregationKey(item.normalized_payload))?.size ?? 0
        : item.normalized_payload.observed_attempt_total;

    return createPublicationRecord(
      {
        ...item.normalized_payload,
        observed_attempt_total: observedAttemptTotal,
        n_runs: usesValidatedBundleTruth ? observedAttemptTotal : item.normalized_payload.n_runs,
        support_count:
          usesValidatedBundleTruth ? observedAttemptTotal : item.normalized_payload.support_count,
      },
      item.upload_receipt,
      {
        intakeValidation: item.validation_summary,
        history: publicationHistoryFor(item, observedAttemptTotal),
        governanceDirectives: governanceDirectives.filter((directive) => {
          if (directive.submission_id && directive.submission_id === item.normalized_payload.submission_id) {
            return true;
          }

          if (directive.entry_id && directive.entry_id === item.normalized_payload.entry_id) {
            return true;
          }

          if (
            directive.public_bundle_digest &&
            directive.public_bundle_digest === item.normalized_payload.public_bundle_digest
          ) {
            return true;
          }

          return false;
        }),
      },
    );
  });
}

export async function runVerificationPipeline(options?: {
  intakeDataDir?: string;
  outputDataDir?: string;
  seedDemoData?: boolean;
}): Promise<PipelineResult> {
  const intakeDataDir = options?.intakeDataDir ?? defaultIntakeDataDir();
  const outputDataDir = options?.outputDataDir ?? defaultWorkerDataDir();

  if (options?.seedDemoData) {
    await seedDemoSubmissionStore(intakeDataDir);
  }

  const publications = await buildPublicationRecords(intakeDataDir);
  const boardViews = localizedBoardViews(publications, "zh-CN");
  const entryViews = localizedEntryViews(publications, "zh-CN");

  await clearWorkerOutputs(outputDataDir);
  await writePublicationBundle(
    publications,
    {
      "zh-CN": {
        boardViews,
        entryViews,
      },
      en: {
        boardViews: localizedBoardViews(publications, "en"),
        entryViews: localizedEntryViews(publications, "en"),
      },
    },
    outputDataDir,
  );

  return {
    publications,
    boardViews,
    entryViews,
  };
}
