import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  initWorkspace,
  packWorkspace,
  runWorkspace,
  validateBundle,
} from "../../hb-cli/src/commands.js";
import {
  createCompletenessProof,
  createVerificationRecord,
  normalizeIncomingSubmission,
  type PublicationGovernanceDirective,
} from "@ohbp/verifier-core";
import { persistUpload } from "../../mock-intake/src/store.js";
import { runVerificationPipeline, seedDemoSubmissionStore } from "./pipeline.js";
import { readStoredSubmissions } from "./io.js";

type GovernanceCandidate = {
  submissionId: string;
  entryId: string;
};

type LifecycleGovernanceCase = {
  name: string;
  buildGovernance: (candidate: GovernanceCandidate) => PublicationGovernanceDirective[];
  expectedState: "corrected" | "invalidated" | "archived";
  expectedDisposition: "suspended" | "historical_only";
  expectedReasonCode: string;
  expectedFinalSummary: string;
  expectedBlockedReason: string;
  expectedStatePath: string[];
  expectedVerdictSnippet: string;
};

const lifecycleGovernanceCases: LifecycleGovernanceCase[] = [
  {
    name: "corrected",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "disputed",
        reason_code: "operator_dispute_opened",
        summary: "Operator opened a dispute after a suspicious claim review.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "corrected",
        reason_code: "operator_result_corrected",
        summary: "Operator confirmed the issue and queued a corrected rerun for republication.",
        at: "2026-04-22T12:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "corrected",
    expectedDisposition: "suspended",
    expectedReasonCode: "operator_result_corrected",
    expectedFinalSummary:
      "Operator confirmed the issue and queued a corrected rerun for republication.",
    expectedBlockedReason: "publication_state = corrected，等待修正结果重新发布",
    expectedStatePath: ["published", "disputed", "corrected"],
    expectedVerdictSnippet: "标记为 corrected",
  },
  {
    name: "invalidated",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "disputed",
        reason_code: "operator_dispute_opened",
        summary: "Operator opened a dispute after a suspicious claim review.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "invalidated",
        reason_code: "operator_result_invalidated",
        summary: "Operator invalidated the published result after the dispute was upheld.",
        at: "2026-04-22T12:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "invalidated",
    expectedDisposition: "historical_only",
    expectedReasonCode: "operator_result_invalidated",
    expectedFinalSummary:
      "Operator invalidated the published result after the dispute was upheld.",
    expectedBlockedReason: "publication_state = invalidated，结果已失效",
    expectedStatePath: ["published", "disputed", "invalidated"],
    expectedVerdictSnippet: "判定为 invalidated",
  },
  {
    name: "archived",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "archived",
        reason_code: "operator_result_archived",
        summary: "Operator archived the superseded result after rotating it off current boards.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "archived",
    expectedDisposition: "historical_only",
    expectedReasonCode: "operator_result_archived",
    expectedFinalSummary:
      "Operator archived the superseded result after rotating it off current boards.",
    expectedBlockedReason: "publication_state = archived，结果仅保留历史页",
    expectedStatePath: ["published", "archived"],
    expectedVerdictSnippet: "仅保留历史页",
  },
];

async function createValidBundleWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "ohbp-worker-workspace-"));
  await initWorkspace(root, {
    profile: "verified_full",
    attempts: 5,
    tasks: 8,
    sealed: true,
  });
  await runWorkspace(root, { attemptId: "attempt-001" });
  const packed = await packWorkspace(root, { attemptId: "attempt-001" });
  const validation = await validateBundle(root, { bundlePath: packed.bundle_root });
  expect(validation.report.overall_verdict).toBe("pass");
  return packed.bundle_root;
}

async function runGovernedPipeline(
  buildGovernance: (candidate: GovernanceCandidate) => PublicationGovernanceDirective[],
) {
  const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-governance-"));
  const intakeDir = join(tempRoot, "mock-intake-data");
  const outputDir = join(tempRoot, "worker-data");

  await seedDemoSubmissionStore(intakeDir);
  const stored = await readStoredSubmissions(intakeDir);
  const publishedCandidate = stored.find(
    (item) => item.normalized_payload.requested_trust_tier === "verified",
  );
  expect(publishedCandidate).toBeDefined();

  const candidate: GovernanceCandidate = {
    submissionId: publishedCandidate!.normalized_payload.submission_id,
    entryId: publishedCandidate!.normalized_payload.entry_id,
  };

  await writeFile(
    join(intakeDir, "publication-governance.json"),
    JSON.stringify(buildGovernance(candidate), null, 2),
    "utf8",
  );

  const result = await runVerificationPipeline({
    intakeDataDir: intakeDir,
    outputDataDir: outputDir,
  });

  return {
    result,
    candidate,
  };
}

describe("verifier worker demo pipeline", () => {
  it("builds publications, boards, and entries from demo submissions", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");

    await seedDemoSubmissionStore(intakeDir);
    const result = await runVerificationPipeline({
      intakeDataDir: intakeDir,
      outputDataDir: outputDir,
    });

    const officialBoard = result.boardViews.find((view) => view.board_id === "official-verified");
    const frontierBoard = result.boardViews.find((view) => view.board_id === "reproducibility-frontier");
    const communityBoard = result.boardViews.find((view) => view.board_id === "community-lab");
    const entry = result.entryViews.find((view) => view.summary.trust_tier === "verified");

    expect(result.publications).toHaveLength(7);
    expect(officialBoard?.entries).toHaveLength(1);
    expect(officialBoard?.board_state).toBe("insufficient_evidence");
    expect(frontierBoard?.board_state).toBe("insufficient_evidence");
    expect(officialBoard?.ranking_policy?.method).toBe("wilson_lower_bound_success_rate_v0_3");
    expect(officialBoard?.ranking_policy?.confidence_level).toBe(0.95);
    expect(officialBoard?.entries[0]?.rank_uncertainty?.method).toBe("wilson_score_95");
    expect(officialBoard?.entries[0]?.rank_uncertainty?.confidence_level).toBe(0.95);
    expect(officialBoard?.entries[0]?.rank_uncertainty?.rank_band.length).toBeGreaterThan(0);
    expect(officialBoard?.available_slices).toHaveLength(3);
    expect((frontierBoard?.available_slices.length ?? 0) >= 2).toBe(true);
    expect(
      frontierBoard?.available_slices.every(
        (slice) =>
          typeof slice.state_reason === "string" &&
          slice.status_breakdown.active_eligible_entries >= 0,
      ),
    ).toBe(true);
    expect((communityBoard?.available_slices.length ?? 0) > 0).toBe(true);
    expect(entry?.research.digests.public_bundle_digest.startsWith("sha256:")).toBe(true);
    expect(JSON.stringify(entry)).not.toContain("sealed raw");
    expect(
      result.publications.every(
        (publication) =>
          publication.completeness_proof.protocol_version === "0.1" &&
          publication.verification_record.protocol_version === "0.1",
      ),
    ).toBe(true);
    expect(
      result.publications.some(
        (publication) =>
          publication.verification_record.board_admission.reproducibility_frontier.eligible &&
          !publication.verification_record.board_admission.community_lab.eligible,
      ),
    ).toBe(true);
  });

  it("writes bilingual board and entry snapshots for web consumption", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-snapshots-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");

    await seedDemoSubmissionStore(intakeDir);
    const result = await runVerificationPipeline({
      intakeDataDir: intakeDir,
      outputDataDir: outputDir,
    });

    await access(join(outputDir, "boards", "official-verified.en.json"));
    await access(join(outputDir, "boards", "official-verified.zh-CN.json"));
    await access(join(outputDir, "boards", "official-verified.json"));

    const sampleEntryId = result.entryViews[0]?.entry_id;
    expect(sampleEntryId).toBeDefined();

    await access(join(outputDir, "entries", `${sampleEntryId}.en.json`));
    await access(join(outputDir, "entries", `${sampleEntryId}.zh-CN.json`));
    await access(join(outputDir, "entries", `${sampleEntryId}.json`));

    const englishBoard = JSON.parse(
      await readFile(join(outputDir, "boards", "official-verified.en.json"), "utf8"),
    ) as {
      lang: string;
      title: string;
    };
    const englishEntry = JSON.parse(
      await readFile(join(outputDir, "entries", `${sampleEntryId}.en.json`), "utf8"),
    ) as {
      lang: string;
      scorecard: {
        verdict: string;
      };
    };
    const chineseEntry = JSON.parse(
      await readFile(join(outputDir, "entries", `${sampleEntryId}.zh-CN.json`), "utf8"),
    ) as {
      lang: string;
      scorecard: {
        verdict: string;
      };
    };

    expect(englishBoard.lang).toBe("en");
    expect(englishBoard.title).toContain("Official Verified");
    expect(englishEntry.lang).toBe("en");
    expect(englishEntry.scorecard.verdict).not.toMatch(/[\u4e00-\u9fff]/);
    expect(chineseEntry.lang).toBe("zh-CN");
    expect(chineseEntry.scorecard.verdict).toMatch(/[\u4e00-\u9fff]/);
  });

  it("localizes English entry admission reasons and raw verification board-admission strings", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-entry-i18n-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");

    await seedDemoSubmissionStore(intakeDir);
    const result = await runVerificationPipeline({
      intakeDataDir: intakeDir,
      outputDataDir: outputDir,
    });

    const communityEntryId = result.publications.find(
      (publication) => publication.verification_record.trust_tier === "community",
    )?.entry_id;
    expect(communityEntryId).toBeDefined();

    const englishEntry = JSON.parse(
      await readFile(join(outputDir, "entries", `${communityEntryId}.en.json`), "utf8"),
    ) as {
      scorecard: {
        why_it_is_eligible: string[];
      };
      research: {
        admission: Array<{
          board_id: string;
          satisfied_reasons: string[];
        }>;
        raw: {
          verification: {
            board_admission: {
              official_verified: {
                satisfied_reasons: string[];
                blocked_reasons: string[];
              };
              community_lab: {
                satisfied_reasons: string[];
                next_actions: string[];
              };
            };
          };
        };
      };
    };

    expect(englishEntry.scorecard.why_it_is_eligible.join(" | ")).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      englishEntry.research.admission
        .flatMap((item) => item.satisfied_reasons)
        .join(" | "),
    ).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      englishEntry.research.raw.verification.board_admission.official_verified.satisfied_reasons.join(
        " | ",
      ),
    ).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      englishEntry.research.raw.verification.board_admission.official_verified.blocked_reasons.join(
        " | ",
      ),
    ).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      englishEntry.research.raw.verification.board_admission.community_lab.satisfied_reasons.join(
        " | ",
      ),
    ).not.toMatch(/[\u4e00-\u9fff]/);
    expect(
      englishEntry.research.raw.verification.board_admission.community_lab.next_actions.join(
        " | ",
      ),
    ).not.toMatch(/[\u4e00-\u9fff]/);
  });

  it("does not auto-forge sealed evidence and conservatively downgrades missing telemetry", async () => {
    const { normalized } = await normalizeIncomingSubmission({
      normalized_payload: {
        requested_trust_tier: "verified",
        benchmark: {
          id: "terminal-lite",
          version: "v1",
          lane_id: "terminal-lite-v1",
          split: "hidden",
          health: {
            freshness_tier: "active",
            contamination_tier: "low",
            reporting_completeness: "high",
            last_audit_at: "2026-04-20T00:00:00.000Z",
            health_snapshot_version: "terminal-health-v1",
          },
        },
        model: { id: "gpt-5.1", label: "GPT-5.1" },
        harness: { id: "unsafe-agent", label: "Unsafe Agent" },
        n_runs: 5,
        n_tasks: 42,
        evidence_channel_mode: "public_plus_sealed",
        visibility_class: "public_summary",
        release_policy: "summary_only_permanent",
        declared_autonomy_mode: "autonomous",
      },
      source: "seed",
      received_at: "2026-04-21T11:00:00.000Z",
    });

    const proof = createCompletenessProof(normalized);
    const verification = createVerificationRecord(normalized, proof);

    expect(normalized.sealed_audit_bundle_digest).toBeUndefined();
    expect(verification.trust_tier).not.toBe("verified");
    expect(verification.autonomy_mode).toBe("interactive");
    expect(verification.board_admission.official_verified.eligible).toBe(false);
  });

  it("reconciles observed_attempt_total from stored run-group attempts instead of trusting payload claims", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-api-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");
    const bundleRoot = await createValidBundleWorkspace();

    await persistUpload(
      {
        bundle_path: bundleRoot,
        normalized_payload: {
          observed_attempt_total: 5,
        },
        source: "api",
        received_at: "2026-04-21T12:00:00.000Z",
      },
      intakeDir,
    );

    const result = await runVerificationPipeline({
      intakeDataDir: intakeDir,
      outputDataDir: outputDir,
    });
    const publication = result.publications[0];
    expect(publication).toBeDefined();

    expect(publication!.completeness_proof.observed_attempt_total).toBe(1);
    expect(publication!.completeness_proof.expected_attempt_total).toBe(5);
    expect(publication!.completeness_proof.completeness_verdict).toBe("incomplete");
    expect(
      publication!.history.some((item) => item.label === "platform_intake_correction"),
    ).toBe(true);
  });

  it("applies publication governance directives and suspends disputed entries from active boards", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-worker-governance-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");

    await seedDemoSubmissionStore(intakeDir);
    const stored = await readStoredSubmissions(intakeDir);
    const publishedCandidate = stored.find(
      (item) => item.normalized_payload.requested_trust_tier === "verified",
    );
    expect(publishedCandidate).toBeDefined();

    const governance: PublicationGovernanceDirective[] = [
      {
        submission_id: publishedCandidate!.normalized_payload.submission_id,
        entry_id: publishedCandidate!.normalized_payload.entry_id,
        publication_state: "disputed",
        reason_code: "operator_dispute_opened",
        summary: "Operator opened a dispute after a suspicious claim review.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ];

    await writeFile(
      join(intakeDir, "publication-governance.json"),
      JSON.stringify(governance, null, 2),
      "utf8",
    );

    const result = await runVerificationPipeline({
      intakeDataDir: intakeDir,
      outputDataDir: outputDir,
    });
    const disputedPublication = result.publications.find(
      (publication) => publication.entry_id === publishedCandidate!.normalized_payload.entry_id,
    );
    const officialBoard = result.boardViews.find((view) => view.board_id === "official-verified");
    const disputedEntry = result.entryViews.find(
      (view) => view.entry_id === publishedCandidate!.normalized_payload.entry_id,
    );

    expect(disputedPublication?.verification_record.publication_state).toBe("disputed");
    expect(disputedPublication?.verification_record.board_disposition).toBe("suspended");
    expect(
      disputedPublication?.verification_record.state_history?.some(
        (event) => event.reason_code === "operator_dispute_opened" && event.to_state === "disputed",
      ),
    ).toBe(true);
    expect(
      disputedPublication?.history.some((item) => item.label === "publication_state:disputed"),
    ).toBe(true);
    expect(
      officialBoard?.entries.some((entry) => entry.entry_id === disputedPublication?.entry_id),
    ).toBe(false);
    expect(disputedEntry?.summary.publication_state).toBe("disputed");
    expect(disputedEntry?.summary.board_disposition).toBe("suspended");
    expect(disputedEntry?.research.state_history.at(-1)?.reason_code).toBe("operator_dispute_opened");
  });

  for (const scenario of lifecycleGovernanceCases) {
    it(`projects ${scenario.name} lifecycle governance into board exclusion and entry detail views`, async () => {
      const { result, candidate } = await runGovernedPipeline(scenario.buildGovernance);
      const publication = result.publications.find(
        (item) => item.entry_id === candidate.entryId,
      );
      const entry = result.entryViews.find((item) => item.entry_id === candidate.entryId);

      expect(publication).toBeDefined();
      expect(entry).toBeDefined();

      const publicationStateHistory = publication?.verification_record.state_history ?? [];
      const entryStateHistory = entry?.research.state_history ?? [];

      expect(publication?.verification_record.publication_state).toBe(scenario.expectedState);
      expect(publication?.verification_record.board_disposition).toBe(scenario.expectedDisposition);
      expect(publication?.verification_record.state_summary).toBe(scenario.expectedFinalSummary);
      expect(publication?.verification_record.board_admission.official_verified.eligible).toBe(false);
      expect(
        publication?.verification_record.board_admission.official_verified.blocked_reasons,
      ).toContain(scenario.expectedBlockedReason);
      expect(
        publication?.verification_record.board_admission.reproducibility_frontier.eligible,
      ).toBe(false);
      expect(publication?.verification_record.board_admission.community_lab.eligible).toBe(false);
      expect(publicationStateHistory.map((event) => event.to_state)).toEqual(
        scenario.expectedStatePath,
      );
      expect(publicationStateHistory.at(-1)?.reason_code).toBe(scenario.expectedReasonCode);
      expect(
        publication?.history.some(
          (item) => item.label === `publication_state:${scenario.expectedState}`,
        ),
      ).toBe(true);

      expect(
        result.boardViews.every((view) =>
          view.entries.every((boardEntry) => boardEntry.entry_id !== candidate.entryId),
        ),
      ).toBe(true);
      expect(entry?.summary.publication_state).toBe(scenario.expectedState);
      expect(entry?.summary.board_disposition).toBe(scenario.expectedDisposition);
      expect(entry?.summary.state_summary).toBe(scenario.expectedFinalSummary);
      expect(entry?.scorecard.verdict).toContain(scenario.expectedVerdictSnippet);
      expect(entry?.research.admission.every((admission) => admission.eligible === false)).toBe(
        true,
      );
      expect(entryStateHistory.map((event) => event.to_state)).toEqual(
        scenario.expectedStatePath,
      );
      expect(entryStateHistory.at(-1)?.reason_code).toBe(scenario.expectedReasonCode);
    });
  }
});
