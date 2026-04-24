import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  initWorkspace,
  packWorkspace,
  runWorkspace,
  validateBundle,
} from "../../hb-cli/src/commands.js";
import { persistUpload } from "./store.js";

async function createValidBundleWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "ohbp-intake-workspace-"));
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

  return {
    root,
    bundleRoot: packed.bundle_root,
  };
}

describe("mock-intake store", () => {
  it("rejects payload-only api uploads", async () => {
    const intakeRoot = await mkdtemp(join(tmpdir(), "ohbp-intake-api-"));

    await expect(
      persistUpload(
        {
          source: "api",
          received_at: "2026-04-21T11:00:00.000Z",
          normalized_payload: {
            requested_trust_tier: "verified",
            benchmark: {
              id: "terminal-lite",
              version: "v1",
              lane_id: "terminal-lite-v1",
              split: "hidden",
            },
            model: { id: "forged-model", label: "Forged Model" },
            harness: { id: "forged-harness", label: "Forged Harness" },
          },
        },
        intakeRoot,
      ),
    ).rejects.toThrow("bundle_path");
  });

  it("rebuilds intake truth from the validated bundle instead of client-forged fields", async () => {
    const intakeRoot = await mkdtemp(join(tmpdir(), "ohbp-intake-bundle-"));
    const { bundleRoot } = await createValidBundleWorkspace();

    const stored = await persistUpload(
      {
        source: "api",
        bundle_path: bundleRoot,
        received_at: "2026-04-21T11:30:00.000Z",
        normalized_payload: {
          submission_id: "forged-submission",
          entry_id: "forged-entry",
          model: { id: "forged-model", label: "Forged Model" },
          harness: { id: "forged-harness", label: "Forged Harness" },
          metrics: {
            success_rate: 0.01,
            median_cost_usd: 999,
            p95_latency_ms: 99999,
            stability_score: 0.01,
            reproducibility_score: 0.01,
          },
          telemetry: {
            human_event_count: 99,
            approval_event_count: 99,
            interactive_event_count: 99,
            tty_freeform_input_detected: true,
            manual_command_detected: true,
            manual_file_write_detected: true,
            editor_interaction_detected: true,
            approval_target_linkage_complete: false,
            interaction_log_complete: true,
            tty_input_digest: "sha256:forged",
          },
          observed_attempt_total: 5,
          submitted_at: "2000-01-01T00:00:00.000Z",
        },
      },
      intakeRoot,
    );

    expect(stored.validation_summary?.overall_verdict).toBe("pass");
    expect(stored.validation_summary?.source_of_truth_mode).toBe("validated_bundle_truth");
    expect(stored.normalized_payload.submission_id).not.toBe("forged-submission");
    expect(stored.normalized_payload.entry_id).not.toBe("forged-entry");
    expect(stored.normalized_payload.model.id).not.toBe("forged-model");
    expect(stored.normalized_payload.harness.id).not.toBe("forged-harness");
    expect(stored.normalized_payload.metrics.success_rate).not.toBe(0.01);
    expect(stored.normalized_payload.telemetry?.human_event_count).toBe(0);
    expect(stored.normalized_payload.observed_attempt_total).toBe(1);
    expect(stored.normalized_payload.submitted_at).toBe("2026-04-21T11:30:00.000Z");
    expect(stored.normalized_payload.public_bundle_digest).toBe(
      stored.validation_summary?.bundle_digest,
    );
    expect(stored.validation_summary?.corrected_fields).toContain("submission_id");
    expect(stored.validation_summary?.corrected_fields).toContain("observed_attempt_total");
    expect(stored.validation_summary?.corrected_fields).toContain("model.id");
  });
});
