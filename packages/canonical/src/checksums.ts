import type { DigestString, Manifest, Sha256Hex } from "@ohbp/types";
import { normalizeDigestHex, objectDigest, sha256, sha256Hex } from "./hash.js";

export interface ChecksumEntry {
  path: string;
  sha256: DigestString | Sha256Hex;
}

export function projectManifestForBinding(manifest: Manifest): Manifest {
  return {
    ...manifest,
    evidence: {
      ...manifest.evidence,
      public_bundle_digest: null,
    },
  };
}

export function manifestBindingDigest(manifest: Manifest): DigestString {
  return objectDigest(projectManifestForBinding(manifest));
}

export function materializeChecksums(
  entries: ChecksumEntry[] | Record<string, DigestString | Sha256Hex>,
): string {
  const normalizedEntries = Array.isArray(entries)
    ? [...entries]
    : Object.entries(entries).map(([path, sha256Value]) => ({ path, sha256: sha256Value }));

  return normalizedEntries
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(({ path, sha256: sha256Value }) => `${normalizeDigestHex(sha256Value)}  ${path}`)
    .join("\n")
    .concat("\n");
}

export function checksumsToBundleDigestHex(
  checksums: string | ChecksumEntry[] | Record<string, DigestString | Sha256Hex>,
): Sha256Hex {
  const materialized = typeof checksums === "string" ? checksums : materializeChecksums(checksums);
  return sha256Hex(materialized);
}

export function checksumsToBundleDigest(
  checksums: string | ChecksumEntry[] | Record<string, DigestString | Sha256Hex>,
): DigestString {
  const materialized = typeof checksums === "string" ? checksums : materializeChecksums(checksums);
  return sha256(materialized);
}

export function parseChecksums(text: string): ChecksumEntry[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/u);

      if (!match?.[1] || !match[2]) {
        throw new Error(`Invalid checksum line: ${line}`);
      }

      return {
        sha256: match[1],
        path: match[2],
      };
    });
}
