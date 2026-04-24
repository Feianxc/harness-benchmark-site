import { createHash } from "node:crypto";
function normalizeValue(value) {
    if (value === null) {
        return null;
    }
    if (typeof value === "string" || typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : String(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizeValue(item));
    }
    if (typeof value === "object") {
        const objectValue = value;
        return Object.keys(objectValue)
            .sort()
            .reduce((accumulator, key) => {
            accumulator[key] = normalizeValue(objectValue[key]);
            return accumulator;
        }, {});
    }
    return String(value);
}
export function stableStringify(value) {
    return JSON.stringify(normalizeValue(value));
}
export function sha256Digest(value) {
    const payload = typeof value === "string" ? value : stableStringify(value);
    return `sha256:${createHash("sha256").update(payload).digest("hex")}`;
}
export function createDeterministicId(prefix, value) {
    return `${prefix}_${sha256Digest(value).replace("sha256:", "").slice(0, 12)}`;
}
export function truncateDigest(digest, visible = 8) {
    if (digest.length <= visible * 2 + 1) {
        return digest;
    }
    return `${digest.slice(0, visible + 7)}…${digest.slice(-visible)}`;
}
//# sourceMappingURL=stable.js.map