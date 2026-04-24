import {
  createPublicationRecord,
  createUploadReceipt,
  normalizeIncomingSubmission,
  type MockSubmissionPayload,
  type PublicationRecord,
} from "@ohbp/verifier-core";
import { describe, expect, it } from "vitest";
import { buildBoardPageView } from "./boards.js";

async function makeVerifiedPublication(options: {
  entryId: string;
  harnessId: string;
  harnessLabel: string;
  successRate: number;
  nTasks: number;
  medianCostUsd?: number;
  p95LatencyMs?: number;
  taskPackageDigest?: string;
}): Promise<PublicationRecord> {
  const payload: MockSubmissionPayload = {
    submission_id: `submission-${options.entryId}`,
    entry_id: options.entryId,
    requested_trust_tier: "verified",
    submission_profile: "verified_full",
    benchmark: {
      id: "terminal-lite",
      version: "v1",
      lane_id: "terminal-lite-v1",
      split: "hidden",
    },
    model: {
      id: "fixed-model",
      label: "Fixed Model",
    },
    harness: {
      id: options.harnessId,
      label: options.harnessLabel,
    },
    metrics: {
      success_rate: options.successRate,
      median_cost_usd: options.medianCostUsd ?? 1,
      p95_latency_ms: options.p95LatencyMs ?? 1_000,
      stability_score: 0.9,
      reproducibility_score: 0.9,
    },
    n_runs: 5,
    n_tasks: options.nTasks,
    declared_attempt_total: 5,
    observed_attempt_total: 5,
    comparison_mode: "fixed_model_compare_harness",
    repeatability_class: "true_seeded",
    budget_class: "standard",
    execution_contract_digest: "sha256:shared-execution-contract",
    task_package_digest: options.taskPackageDigest ?? "sha256:shared-task-package",
    tolerance_policy_digest: "sha256:shared-tolerance-policy",
    sealed_audit_bundle_digest: `sha256:sealed-${options.entryId}`,
    submitted_at: "2026-04-21T00:00:00.000Z",
  };
  const { normalized } = await normalizeIncomingSubmission({ normalized_payload: payload });
  const receipt = createUploadReceipt(normalized);
  return createPublicationRecord(normalized, receipt);
}

describe("board uncertainty-aware ranking v0.3", () => {
  it("uses the Wilson lower bound before raw success rate", async () => {
    const smallLucky = await makeVerifiedPublication({
      entryId: "entry-small-lucky",
      harnessId: "small-lucky",
      harnessLabel: "Small Lucky Harness",
      successRate: 0.8,
      nTasks: 10,
    });
    const largeStable = await makeVerifiedPublication({
      entryId: "entry-large-stable",
      harnessId: "large-stable",
      harnessLabel: "Large Stable Harness",
      successRate: 0.75,
      nTasks: 100,
    });

    const view = buildBoardPageView(
      "official-verified",
      [smallLucky, largeStable],
      undefined,
      "en",
    );

    expect(view.board_state).toBe("comparison_only");
    expect(view.entries.map((entry) => entry.entry_id)).toEqual([
      "entry-large-stable",
      "entry-small-lucky",
    ]);
    expect(view.entries[0]?.rank_uncertainty?.ci_low_pct).toBeGreaterThan(
      view.entries[1]?.rank_uncertainty?.ci_low_pct ?? 0,
    );
    expect(view.entries[0]?.rank_uncertainty?.effective_n).toBe(100);
    expect(view.entries[1]?.rank_uncertainty?.observed_successes).toBe(8);
    expect(view.ranking_policy?.ordinal_rank_allowed).toBe(false);
  });

  it("allows ordinal ranks only when adjacent Wilson intervals are separated", async () => {
    const high = await makeVerifiedPublication({
      entryId: "entry-high",
      harnessId: "high",
      harnessLabel: "High Harness",
      successRate: 1,
      nTasks: 30,
    });
    const middle = await makeVerifiedPublication({
      entryId: "entry-middle",
      harnessId: "middle",
      harnessLabel: "Middle Harness",
      successRate: 20 / 30,
      nTasks: 30,
    });
    const low = await makeVerifiedPublication({
      entryId: "entry-low",
      harnessId: "low",
      harnessLabel: "Low Harness",
      successRate: 0.2,
      nTasks: 30,
    });

    const view = buildBoardPageView(
      "official-verified",
      [middle, low, high],
      undefined,
      "en",
    );

    expect(view.board_state).toBe("ranked_ordinal");
    expect(view.ranking_policy?.ordinal_rank_allowed).toBe(true);
    expect(view.entries.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(view.entries.map((entry) => entry.rank_uncertainty?.rank_band)).toEqual([
      "Confidence band A",
      "Confidence band B",
      "Confidence band C",
    ]);
  });

  it("keeps adjacent-overlap chains in the same rank band", async () => {
    const perfect = await makeVerifiedPublication({
      entryId: "entry-perfect-chain",
      harnessId: "perfect-chain",
      harnessLabel: "Perfect Chain Harness",
      successRate: 1,
      nTasks: 30,
    });
    const nearPerfect = await makeVerifiedPublication({
      entryId: "entry-near-perfect-chain",
      harnessId: "near-perfect-chain",
      harnessLabel: "Near Perfect Chain Harness",
      successRate: 29 / 30,
      nTasks: 30,
    });
    const bridgeOverlap = await makeVerifiedPublication({
      entryId: "entry-bridge-overlap",
      harnessId: "bridge-overlap",
      harnessLabel: "Bridge Overlap Harness",
      successRate: 23 / 30,
      nTasks: 30,
    });

    const view = buildBoardPageView(
      "official-verified",
      [bridgeOverlap, perfect, nearPerfect],
      undefined,
      "en",
    );

    expect(view.board_state).toBe("ranked_tiered");
    expect(view.ranking_policy?.ordinal_rank_allowed).toBe(false);
    expect(view.entries.map((entry) => entry.entry_id)).toEqual([
      "entry-perfect-chain",
      "entry-near-perfect-chain",
      "entry-bridge-overlap",
    ]);
    expect(view.entries.map((entry) => entry.rank_uncertainty?.rank_band)).toEqual([
      "Confidence band A",
      "Confidence band A",
      "Confidence band A",
    ]);
  });

  it("does not mix records with different task packages into one slice", async () => {
    const taskPackageA = "sha256:task-package-a";
    const taskPackageB = "sha256:task-package-b";
    const firstTaskPackage = await makeVerifiedPublication({
      entryId: "entry-task-package-a",
      harnessId: "task-package-a",
      harnessLabel: "Task Package A Harness",
      successRate: 0.9,
      nTasks: 50,
      taskPackageDigest: taskPackageA,
    });
    const secondTaskPackage = await makeVerifiedPublication({
      entryId: "entry-task-package-b",
      harnessId: "task-package-b",
      harnessLabel: "Task Package B Harness",
      successRate: 0.8,
      nTasks: 50,
      taskPackageDigest: taskPackageB,
    });

    const view = buildBoardPageView(
      "official-verified",
      [firstTaskPackage, secondTaskPackage],
      undefined,
      "en",
    );
    const secondSlice = view.available_slices.find(
      (slice) => slice.filters.task_package_digest === taskPackageB,
    );

    expect(view.available_slices).toHaveLength(2);
    expect(view.entries).toHaveLength(1);
    expect(view.slice.task_package_digest).toBe(taskPackageA);
    expect(view.available_slices.map((slice) => slice.filters.task_package_digest)).toEqual([
      taskPackageA,
      taskPackageB,
    ]);
    expect(secondSlice).toBeDefined();

    const requested = buildBoardPageView(
      "official-verified",
      [firstTaskPackage, secondTaskPackage],
      secondSlice?.slice_id,
      "en",
    );

    expect(requested.entries.map((entry) => entry.entry_id)).toEqual([
      "entry-task-package-b",
    ]);
    expect(requested.slice.task_package_digest).toBe(taskPackageB);
  });
});
