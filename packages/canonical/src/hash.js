// @ts-ignore - workspace-local typecheck may run before @types/node is installed.
import { createHash } from "node:crypto";
import { stableStringify } from "./stable-stringify.js";
function toBuffer(input) {
    return typeof input === "string" ? Buffer.from(input, "utf8") : input;
}
export function sha256Hex(input) {
    return createHash("sha256").update(toBuffer(input)).digest("hex");
}
export function sha256(input) {
    return `sha256:${sha256Hex(input)}`;
}
export function objectDigestHex(value) {
    return sha256Hex(stableStringify(value));
}
export function objectDigest(value) {
    return `sha256:${objectDigestHex(value)}`;
}
export function normalizeDigestHex(digest) {
    return digest.startsWith("sha256:") ? digest.slice("sha256:".length) : digest;
}
//# sourceMappingURL=hash.js.map