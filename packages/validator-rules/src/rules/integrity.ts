import { promises as fs } from "node:fs";
import path from "node:path";

import {
  BUNDLE_PATHS,
  computeBundleDigestFromChecksums,
  digestEquals,
  manifestBindingDigest,
  parseChecksums,
  sha256Digest,
  type ChecksumEntry,
  type ValidationFinding,
  type ValidationRule,
} from "@ohbp/validator-core";

async function verifyChecksumCoverage(
  root: string,
  entries: ChecksumEntry[],
  objectRef: string,
  ruleId: string,
  manifestBinding?: {
    path: string;
    digest: string;
  },
): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.path);

    try {
      const actualDigest =
        manifestBinding && entry.path === manifestBinding.path
          ? manifestBinding.digest
          : sha256Digest(await fs.readFile(absolutePath));

      if (!digestEquals(actualDigest, entry.sha256)) {
        findings.push({
          id: `${ruleId}:checksum:${entry.path}`,
          rule_id: ruleId,
          layer: "integrity",
          severity: "error",
          message: `Checksum mismatch for ${entry.path}.`,
          blocking: true,
          path: entry.path,
          object_ref: objectRef,
          expected: entry.sha256,
          observed: actualDigest,
          effect: "reject_bundle",
        });
      }
    } catch {
      findings.push({
        id: `${ruleId}:missing:${entry.path}`,
        rule_id: ruleId,
        layer: "integrity",
        severity: "error",
        message: `checksums.sha256 references missing file ${entry.path}.`,
        blocking: true,
        path: entry.path,
        object_ref: objectRef,
        expected: "file present",
        observed: "missing",
        effect: "reject_bundle",
      });
    }
  }

  return findings;
}

export const bundleDigestFromChecksumsRule: ValidationRule = {
  id: "integrity.bundle-digest-from-checksums",
  layer: "integrity",
  description:
    "Recomputes bundle digests from checksums.sha256 and validates bound digests.",
  async evaluate(context) {
    const findings: ValidationFinding[] = [];
    const computedDigests: Record<string, string> = {};
    const manifest = context.manifest;

    if (!context.checksums_text) {
      findings.push({
        id: "integrity.bundle-digest-from-checksums:missing-public-checksums",
        rule_id: "integrity.bundle-digest-from-checksums",
        layer: "integrity",
        severity: "error",
        message: "Bundle is missing checksums.sha256.",
        blocking: true,
        path: "checksums.sha256",
        object_ref: "checksums.sha256",
        expected: "checksums.sha256",
        observed: undefined,
        effect: "reject_bundle",
      });
      return { findings };
    }

    const publicEntries = parseChecksums(context.checksums_text);

    if (!publicEntries.some((entry) => entry.path === BUNDLE_PATHS.manifest)) {
      findings.push({
        id: "integrity.bundle-digest-from-checksums:manifest-not-bound",
        rule_id: "integrity.bundle-digest-from-checksums",
        layer: "integrity",
        severity: "error",
        message:
          "checksums.sha256 must include manifest.json via canonical manifest binding digest.",
        blocking: true,
        path: BUNDLE_PATHS.manifest,
        object_ref: "checksums.sha256",
        expected: "manifest.json present in checksum set",
        observed: publicEntries.map((entry) => entry.path),
        effect: "reject_bundle",
      });
    }

    findings.push(
      ...(await verifyChecksumCoverage(
        context.public_bundle_root,
        publicEntries,
        "checksums.sha256",
        "integrity.bundle-digest-from-checksums",
        manifest
          ? {
              path: BUNDLE_PATHS.manifest,
              digest: manifestBindingDigest(manifest),
            }
          : undefined,
      )),
    );

    const publicBundleDigest = computeBundleDigestFromChecksums(
      context.checksums_text,
    );
    computedDigests.public_bundle_digest = publicBundleDigest;

    if (
      manifest?.evidence.public_bundle_digest &&
      !digestEquals(manifest.evidence.public_bundle_digest, publicBundleDigest)
    ) {
      findings.push({
        id: "integrity.bundle-digest-from-checksums:manifest-public-bundle-digest",
        rule_id: "integrity.bundle-digest-from-checksums",
        layer: "integrity",
        severity: "error",
        message:
          "manifest.evidence.public_bundle_digest does not match the digest recomputed from checksums.sha256.",
        blocking: true,
        path: "manifest.evidence.public_bundle_digest",
        object_ref: "manifest.json",
        expected: publicBundleDigest,
        observed: manifest.evidence.public_bundle_digest,
        effect: "reject_bundle",
      });
    }

    if (
      context.verification_record?.subject_bundle_digest &&
      !digestEquals(
        context.verification_record.subject_bundle_digest,
        publicBundleDigest,
      )
    ) {
      findings.push({
        id: "integrity.bundle-digest-from-checksums:verification-subject-bundle-digest",
        rule_id: "integrity.bundle-digest-from-checksums",
        layer: "integrity",
        severity: "error",
        message:
          "verification-record subject_bundle_digest does not match the bundle digest recomputed from checksums.sha256.",
        blocking: true,
        path: "reports/verification-record.json.subject_bundle_digest",
        object_ref: "reports/verification-record.json",
        expected: publicBundleDigest,
        observed: context.verification_record.subject_bundle_digest,
        effect: "reject_bundle",
      });
    }

    if (manifest?.evidence.evidence_channel_mode === "public_plus_sealed") {
      if (!context.sealed_checksums_text || !context.sealed_bundle_root) {
        findings.push({
          id: "integrity.bundle-digest-from-checksums:sealed-checksums-missing",
          rule_id: "integrity.bundle-digest-from-checksums",
          layer: "integrity",
          severity: "error",
          message:
            "Sealed evidence digest cannot be validated because sealed/checksums.sha256 is missing.",
          blocking: true,
          path: "sealed/checksums.sha256",
          object_ref: "sealed bundle",
          expected: "sealed/checksums.sha256",
          observed: undefined,
          effect: "needs_sealed_companion",
        });
      } else {
        const sealedEntries = parseChecksums(context.sealed_checksums_text);
        findings.push(
          ...(await verifyChecksumCoverage(
            context.sealed_bundle_root,
            sealedEntries,
            "sealed/checksums.sha256",
            "integrity.bundle-digest-from-checksums",
            undefined,
          )),
        );

        const sealedBundleDigest = computeBundleDigestFromChecksums(
          context.sealed_checksums_text,
        );
        computedDigests.sealed_bundle_digest = sealedBundleDigest;

        if (
          manifest.evidence.sealed_audit_bundle_digest &&
          !digestEquals(
            manifest.evidence.sealed_audit_bundle_digest,
            sealedBundleDigest,
          )
        ) {
          findings.push({
            id: "integrity.bundle-digest-from-checksums:manifest-sealed-bundle-digest",
            rule_id: "integrity.bundle-digest-from-checksums",
            layer: "integrity",
            severity: "error",
            message:
              "manifest.evidence.sealed_audit_bundle_digest does not match the sealed bundle digest recomputed from sealed/checksums.sha256.",
            blocking: true,
            path: "manifest.evidence.sealed_audit_bundle_digest",
            object_ref: "manifest.json",
            expected: sealedBundleDigest,
            observed: manifest.evidence.sealed_audit_bundle_digest,
            effect: "reject_bundle",
          });
        }
      }
    }

    return {
      findings,
      computed_digests: computedDigests,
    };
  },
};

export const traceRootHashRule: ValidationRule = {
  id: "integrity.trace-root-hash-basic-consistency",
  layer: "integrity",
  description:
    "Recomputes the trace root hash from the trace file and compares it with manifest and trace-integrity.json.",
  async evaluate(context) {
    const manifest = context.manifest;
    const findings: ValidationFinding[] = [];
    const computedDigests: Record<string, string> = {};

    if (!manifest?.trace.trace_ref) {
      return findings;
    }

    const traceAbsolutePath =
      context.public_bundle.files[manifest.trace.trace_ref] ??
      path.join(context.public_bundle_root, manifest.trace.trace_ref);

    let traceContents: string;

    try {
      traceContents = await fs.readFile(traceAbsolutePath, "utf8");
    } catch {
      findings.push({
        id: "integrity.trace-root-hash-basic-consistency:missing-trace",
        rule_id: "integrity.trace-root-hash-basic-consistency",
        layer: "integrity",
        severity: "error",
        message: "Manifest trace reference points to a missing trace file.",
        blocking: true,
        path: manifest.trace.trace_ref,
        object_ref: "traces/trace.jsonl",
        expected: "trace file present",
        observed: "missing",
        effect: "reject_bundle",
      });
      return { findings };
    }

    const computedTraceRootHash = sha256Digest(traceContents);
    computedDigests.trace_root_hash = computedTraceRootHash;

    if (!digestEquals(manifest.trace.trace_root_hash, computedTraceRootHash)) {
      findings.push({
        id: "integrity.trace-root-hash-basic-consistency:manifest-trace-root-hash",
        rule_id: "integrity.trace-root-hash-basic-consistency",
        layer: "integrity",
        severity: "error",
        message:
          "manifest.trace.trace_root_hash does not match the trace hash recomputed from traces/trace.jsonl.",
        blocking: true,
        path: "manifest.trace.trace_root_hash",
        object_ref: "manifest.json",
        expected: computedTraceRootHash,
        observed: manifest.trace.trace_root_hash,
        effect: "reject_bundle",
      });
    }

    if (
      context.trace_integrity &&
      !digestEquals(
        context.trace_integrity.trace_root_hash,
        computedTraceRootHash,
      )
    ) {
      findings.push({
        id: "integrity.trace-root-hash-basic-consistency:trace-integrity-trace-root-hash",
        rule_id: "integrity.trace-root-hash-basic-consistency",
        layer: "integrity",
        severity: "error",
        message:
          "trace-integrity.json trace_root_hash does not match the trace hash recomputed from traces/trace.jsonl.",
        blocking: true,
        path: "reports/trace-integrity.json.trace_root_hash",
        object_ref: "reports/trace-integrity.json",
        expected: computedTraceRootHash,
        observed: context.trace_integrity.trace_root_hash,
        effect: "reject_bundle",
      });
    }

    return {
      findings,
      computed_digests: computedDigests,
    };
  },
};
