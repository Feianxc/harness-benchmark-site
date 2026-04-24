import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { canonicalStringify, type BundleManifest } from "@ohbp/validator-core";
import { describe, expect, test } from "vitest";

import {
  initWorkspace,
  packWorkspace,
  runWorkspace,
  uploadBundle,
  validateBundle,
} from "./index.js";

async function createTempWorkspace(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("hb-cli workflow", () => {
  test("init -> run -> pack -> validate yields a passing deterministic bundle", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-pass-");

    await initWorkspace(workspaceRoot, {
      profile: "reproducible_standard",
      attempts: 3,
      tasks: 3,
    });
    await runWorkspace(workspaceRoot);
    const firstPack = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const secondPack = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const taskResultsText = await fs.readFile(
      path.join(firstPack.bundle_root, "payloads", "task-results.ndjson"),
      "utf8",
    );
    const validation = await validateBundle(workspaceRoot, {
      bundlePath: firstPack.bundle_root,
    });

    expect(firstPack.manifest.evidence.public_bundle_digest).toBe(
      secondPack.manifest.evidence.public_bundle_digest,
    );
    expect("files" in (firstPack.manifest as unknown as Record<string, unknown>)).toBe(false);
    expect(
      "task_package_ref" in (firstPack.manifest as unknown as Record<string, unknown>),
    ).toBe(false);
    expect(
      "execution_contract_ref" in (firstPack.manifest as unknown as Record<string, unknown>),
    ).toBe(false);
    expect(
      taskResultsText
        .trim()
        .split(/\r?\n/u)
        .every((line) => JSON.parse(line).protocol_version === "0.1"),
    ).toBe(true);
    expect(validation.report.overall_verdict).toBe("pass");
    expect(validation.report.findings).toHaveLength(0);
  });

  test("public_plus_sealed writes real public redaction and still validates", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-sealed-pass-");

    await initWorkspace(workspaceRoot, {
      profile: "verified_full",
      attempts: 5,
      tasks: 2,
      sealed: true,
    });
    await runWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const packed = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });

    const publicTaskResults = await fs.readFile(
      path.join(packed.bundle_root, "payloads", "task-results.ndjson"),
      "utf8",
    );
    const sealedTaskResults = await fs.readFile(
      path.join(
        packed.bundle_root,
        "sealed",
        "payloads",
        "task-results.ndjson",
      ),
      "utf8",
    );
    const publicTrace = await fs.readFile(
      path.join(packed.bundle_root, "traces", "trace.jsonl"),
      "utf8",
    );
    const sealedTrace = await fs.readFile(
      path.join(packed.bundle_root, "sealed", "traces", "trace.jsonl"),
      "utf8",
    );
    const publicInteraction = await fs.readFile(
      path.join(packed.bundle_root, "traces", "interaction-log.jsonl"),
      "utf8",
    );
    const sealedInteraction = await fs.readFile(
      path.join(
        packed.bundle_root,
        "sealed",
        "traces",
        "interaction-log.jsonl",
      ),
      "utf8",
    );
    const validation = await validateBundle(workspaceRoot, {
      bundlePath: packed.bundle_root,
    });

    expect(publicTaskResults).not.toBe(sealedTaskResults);
    expect(publicTrace).not.toBe(sealedTrace);
    expect(publicInteraction).not.toBe(sealedInteraction);
    expect(await fs.readFile(path.join(packed.bundle_root, "redactions.json"), "utf8")).toContain(
      "sample-redaction-policy-v1",
    );
    expect(validation.report.overall_verdict).toBe("pass");
  });

  test("run rejects attempts outside the declared plan", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-attempt-");

    await initWorkspace(workspaceRoot, {
      profile: "community_light",
      attempts: 1,
      tasks: 2,
    });

    await expect(
      runWorkspace(workspaceRoot, {
        attemptId: "attempt-999",
      }),
    ).rejects.toThrow(/not declared/i);
  });

  test("validator rejects tampered manifest binding for task package digest", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-bind-");

    await initWorkspace(workspaceRoot, {
      profile: "reproducible_standard",
      attempts: 3,
      tasks: 3,
    });
    await runWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const packed = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const manifestPath = path.join(packed.bundle_root, "manifest.json");
    const manifest = JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as BundleManifest;

    manifest.task_package_digest = "sha256:deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    await fs.writeFile(manifestPath, `${canonicalStringify(manifest)}\n`, "utf8");

    const validation = await validateBundle(workspaceRoot, {
      bundlePath: packed.bundle_root,
    });

    expect(validation.report.overall_verdict).toBe("fail");
    expect(
      validation.report.findings.some(
        (finding) =>
          finding.rule_id === "semantics.registration-and-subject-binding" &&
          /task_package_digest/i.test(finding.path ?? ""),
      ),
    ).toBe(true);
  });

  test("validator rejects tampered manifest fields covered by manifest binding digest", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-manifest-bind-");

    await initWorkspace(workspaceRoot, {
      profile: "reproducible_standard",
      attempts: 3,
      tasks: 2,
    });
    await runWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const packed = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const manifestPath = path.join(packed.bundle_root, "manifest.json");
    const manifest = JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as BundleManifest;

    manifest.created_at = "2026-12-31T00:00:00.000Z";
    await fs.writeFile(manifestPath, `${canonicalStringify(manifest)}\n`, "utf8");

    const validation = await validateBundle(workspaceRoot, {
      bundlePath: packed.bundle_root,
    });

    expect(validation.report.overall_verdict).toBe("fail");
    expect(
      validation.report.findings.some(
        (finding) =>
          finding.rule_id === "integrity.bundle-digest-from-checksums" &&
          finding.path === "manifest.json",
      ),
    ).toBe(true);
  });

  test("upload dry-run writes mock-intake compatible body", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-upload-");

    await initWorkspace(workspaceRoot, {
      profile: "reproducible_standard",
      attempts: 3,
      tasks: 2,
    });
    await runWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const packed = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });

    const upload = await uploadBundle(workspaceRoot, {
      bundlePath: packed.bundle_root,
      dryRun: true,
    });
    const manifest = JSON.parse(
      await fs.readFile(path.join(packed.bundle_root, "manifest.json"), "utf8"),
    ) as BundleManifest;

    expect(upload.payload.bundle_path).toBe(packed.bundle_root);
    expect(upload.payload.normalized_payload).toBeTruthy();
    expect(upload.payload.normalized_payload.study_id).toBe(manifest.run_identity.study_id);
    expect(upload.payload.normalized_payload.run_group_id).toBe(
      manifest.run_identity.run_group_id,
    );
    expect(upload.payload.normalized_payload.attempt_id).toBe(
      manifest.run_identity.attempt_id,
    );
    expect(upload.payload.normalized_payload.bundle_id).toBe(
      manifest.run_identity.bundle_id,
    );
    expect(upload.payload.normalized_payload.observed_attempt_total).toBe(1);
    expect(upload.receipt_path).toBeUndefined();
  });

  test("upload rejects non-dry-run when local validation already failed", async () => {
    const workspaceRoot = await createTempWorkspace("hb-cli-upload-reject-");

    await initWorkspace(workspaceRoot, {
      profile: "reproducible_standard",
      attempts: 3,
      tasks: 2,
    });
    await runWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const packed = await packWorkspace(workspaceRoot, {
      attemptId: "attempt-001",
    });
    const manifestPath = path.join(packed.bundle_root, "manifest.json");
    const manifest = JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as BundleManifest;

    manifest.created_at = "2027-01-01T00:00:00.000Z";
    await fs.writeFile(manifestPath, `${canonicalStringify(manifest)}\n`, "utf8");

    await expect(
      uploadBundle(workspaceRoot, {
        bundlePath: packed.bundle_root,
      }),
    ).rejects.toThrow(/upload aborted: local validation failed/i);
  });
});
