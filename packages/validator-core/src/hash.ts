import path from "node:path";

import {
  BUNDLE_PATHS,
  PUBLIC_CHECKSUM_ORDER,
  SEALED_CHECKSUM_ORDER,
  canonicalJsonText,
  canonicalNdjsonText,
  checksumsToBundleDigest,
  manifestBindingDigest,
  materializeChecksums,
  objectDigest,
  sha256,
  stableStringify,
} from "@ohbp/canonical";
import {
  BUNDLE_PROTOCOL_VERSION,
  SCHEMA_CATALOG_VERSION,
  ZERO_INPUT_DIGEST,
  type DigestString,
} from "@ohbp/types";

import type { ChecksumEntry } from "./model.js";

function omitTopLevelKeys<T extends Record<string, unknown>>(
  value: T,
  omitKeys: string[],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !omitKeys.includes(key)),
  );
}

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function normalizeDigest(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.replace(/^sha256:/u, "").toLowerCase();
}

export function digestEquals(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const normalizedLeft = normalizeDigest(left);
  const normalizedRight = normalizeDigest(right);

  if (!normalizedLeft || !normalizedRight) {
    return left === right;
  }

  return normalizedLeft === normalizedRight;
}

export function canonicalStringify(value: unknown): string {
  return canonicalJsonText(value).trimEnd();
}

export function canonicalJson(value: unknown): string {
  return canonicalJsonText(value);
}

export function canonicalNdjson(rows: unknown[]): string {
  return canonicalNdjsonText(rows);
}

export function stableCanonicalStringify(value: unknown): string {
  return stableStringify(value as Parameters<typeof stableStringify>[0]);
}

export function sha256Digest(input: string | Uint8Array): DigestString {
  return sha256(input);
}

export function sha256Hex(input: string | Uint8Array): string {
  return normalizeDigest(sha256(input)) ?? "";
}

export function computeObjectDigest<T extends Record<string, unknown>>(
  value: T,
  omitKeys: string[] = [],
): DigestString {
  const projected = omitKeys.length > 0 ? omitTopLevelKeys(value, omitKeys) : value;
  return objectDigest(projected);
}

export function renderChecksums(entries: ChecksumEntry[]): string {
  return materializeChecksums(entries);
}

export function parseChecksums(text: string): ChecksumEntry[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/u);
      if (!match) {
        throw new Error(`Invalid checksum line: ${line}`);
      }

      const [, sha256HexValue, entryPath] = match;

      if (!sha256HexValue || !entryPath) {
        throw new Error(`Invalid checksum line: ${line}`);
      }

      return {
        sha256: `sha256:${sha256HexValue}` as DigestString,
        path: entryPath,
      };
    });
}

export function computeBundleDigestFromChecksums(text: string): DigestString {
  return checksumsToBundleDigest(text);
}

export {
  BUNDLE_PATHS,
  BUNDLE_PROTOCOL_VERSION,
  PUBLIC_CHECKSUM_ORDER,
  SCHEMA_CATALOG_VERSION,
  SEALED_CHECKSUM_ORDER,
  ZERO_INPUT_DIGEST,
  manifestBindingDigest,
};
