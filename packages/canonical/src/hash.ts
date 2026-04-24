// @ts-ignore - workspace-local typecheck may run before @types/node is installed.
import { createHash } from "node:crypto";

import type { DigestString, Sha256Hex } from "@ohbp/types";
import { stableStringify } from "./stable-stringify.js";

declare const Buffer: {
  from(input: string, encoding?: string): Uint8Array;
};

function toBuffer(input: string | Uint8Array): Uint8Array {
  return typeof input === "string" ? Buffer.from(input, "utf8") : input;
}

export function sha256Hex(input: string | Uint8Array): Sha256Hex {
  return createHash("sha256").update(toBuffer(input)).digest("hex");
}

export function sha256(input: string | Uint8Array): DigestString {
  return `sha256:${sha256Hex(input)}`;
}

export function objectDigestHex<T>(value: T): Sha256Hex {
  return sha256Hex(stableStringify(value));
}

export function objectDigest<T>(value: T): DigestString {
  return `sha256:${objectDigestHex(value)}`;
}

export function normalizeDigestHex(digest: DigestString | Sha256Hex): Sha256Hex {
  return digest.startsWith("sha256:") ? digest.slice("sha256:".length) : digest;
}
