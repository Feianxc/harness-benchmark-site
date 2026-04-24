import type { Manifest } from "@ohbp/types";
import { describe, expect, it } from "vitest";

import {
  checksumsToBundleDigest,
  manifestBindingDigest,
  materializeChecksums,
  objectDigest,
  sha256,
  stableStringify,
} from "../index";

describe("@ohbp/canonical", () => {
  it("stableStringify 应按 key 排序并忽略 undefined", () => {
    const actual = stableStringify({
      zebra: 2,
      alpha: 1,
      nested: {
        beta: true,
        alpha: "x",
        omitted: undefined,
      },
    });

    expect(actual).toBe('{"alpha":1,"nested":{"alpha":"x","beta":true},"zebra":2}');
  });

  it("checksumsToBundleDigest 应稳定绑定 checksums 内容", () => {
    const checksums = materializeChecksums({
      "aggregate.json": objectDigest({ score: 1 }),
      "manifest.json": objectDigest({ bundle_id: "bundle_demo" }),
      "task-results.ndjson": sha256('{"task_id":"t1"}\n'),
    });

    expect(checksums).toContain("aggregate.json");
    expect(checksumsToBundleDigest(checksums)).toBe(
      "sha256:a2f29362bfbde247e6c39a56fe1c0fd69e735b78d6648bc46a1abaf765391feb",
    );
  });

  it("manifestBindingDigest 应忽略 public_bundle_digest 但绑定其余 manifest 字段", () => {
    const baseManifest: Manifest = {
      protocol_version: "0.1",
      bundle_id: "bundle-attempt-001",
      run_identity: {
        study_id: "study-demo",
        run_group_id: "run-group-demo",
        attempt_id: "attempt-001",
        bundle_id: "bundle-attempt-001",
      },
      benchmark: {
        id: "terminal-lite-v1",
        version: "2026.04",
        lane_id: "terminal-lite-v1",
        split: "public",
      },
      task_package_digest: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
      execution_contract_digest:
        "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      tolerance_policy_ref: "execution_contract#/verification_policy/tolerance_policy",
      tolerance_policy_digest:
        "sha256:3333333333333333333333333333333333333333333333333333333333333333",
      requested_trust_tier: "reproduced",
      repeatability_class: "true_seeded",
      evidence: {
        evidence_channel_mode: "public_only",
        visibility_class: "public_full",
        release_policy: "public_immediate",
        public_bundle_digest:
          "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      trace: {
        trace_root_hash:
          "sha256:4444444444444444444444444444444444444444444444444444444444444444",
        trace_ref: "traces/trace.jsonl",
        interaction_log_ref: "traces/interaction-log.jsonl",
        interaction_summary_ref: "reports/interaction-summary.json",
        trace_integrity_ref: "reports/trace-integrity.json",
      },
      artifacts: {
        task_results_ref: "payloads/task-results.ndjson",
        aggregate_ref: "aggregate.json",
        evaluator_report_ref: "reports/evaluator-report.json",
        checksums_ref: "checksums.sha256",
      },
      created_at: "2026-04-21T00:00:00.000Z",
    };

    const digestA = manifestBindingDigest(baseManifest);
    const digestB = manifestBindingDigest({
      ...baseManifest,
      evidence: {
        ...baseManifest.evidence,
        public_bundle_digest:
          "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    });
    const digestC = manifestBindingDigest({
      ...baseManifest,
      created_at: "2026-04-22T00:00:00.000Z",
    });

    expect(digestA).toBe(digestB);
    expect(digestC).not.toBe(digestA);
  });
});
