import { describe, expect, it } from "vitest";

import { BUNDLE_PATHS, checksumsToBundleDigestHex, parseChecksums, sha256Hex } from "@ohbp/canonical";
import { allFixtures, goldenFixtures, mutantFixtures } from "../cases";

describe("@ohbp/fixtures", () => {
  it("提供 4 个 goldens 与 4 个 mutants", () => {
    expect(goldenFixtures).toHaveLength(4);
    expect(mutantFixtures).toHaveLength(4);
    expect(allFixtures).toHaveLength(8);
  });

  it("golden fixtures 的 checksums 与文件内容、manifest bundle digest 一致", () => {
    for (const fixture of goldenFixtures) {
      const entries = parseChecksums(fixture.bundle.checksums_sha256);

      for (const entry of entries) {
        expect(fixture.bundle.public_files[entry.path]).toBeDefined();
        expect(sha256Hex(fixture.bundle.public_files[entry.path] ?? "")).toBe(entry.sha256);
      }

      expect(fixture.bundle.public_files[BUNDLE_PATHS.manifest]).toBeDefined();
      expect(fixture.bundle.public_files[BUNDLE_PATHS.checksums]).toBe(fixture.bundle.checksums_sha256);
      expect(fixture.bundle.manifest.evidence.public_bundle_digest).toBe(
        checksumsToBundleDigestHex(fixture.bundle.checksums_sha256),
      );
    }
  });

  it("golden fixtures 的 sealed companion digest 真实一致", () => {
    const sealedFixture = goldenFixtures.find((fixture) => fixture.id === "verified-hidden-public-plus-sealed");
    expect(sealedFixture?.bundle.sealed_files).toBeDefined();
    expect(sealedFixture?.bundle.sealed_checksums_sha256).toBeDefined();
    expect(sealedFixture?.bundle.manifest.evidence.sealed_audit_bundle_digest).toBe(
      checksumsToBundleDigestHex(sealedFixture?.bundle.sealed_checksums_sha256 ?? ""),
    );
  });

  it("mutants 保留目标缺陷", () => {
    const registrationMismatch = mutantFixtures.find((fixture) => fixture.id === "registration-digest-mismatch");
    expect(registrationMismatch?.bundle.manifest.registration_digest).not.toBe(
      registrationMismatch?.bundle.run_group_registration?.registration_digest,
    );

    const sealedMissing = mutantFixtures.find((fixture) => fixture.id === "sealed-required-but-missing");
    expect(sealedMissing?.bundle.manifest.evidence.evidence_channel_mode).toBe("public_plus_sealed");
    expect(sealedMissing?.bundle.sealed_files).toBeUndefined();

    const subjectMismatch = mutantFixtures.find((fixture) => fixture.id === "subject-ref-mismatch");
    expect(subjectMismatch?.bundle.verification_record?.subject_ref.attempt_id).not.toBe(
      subjectMismatch?.bundle.manifest.run_identity.attempt_id,
    );
  });
});
