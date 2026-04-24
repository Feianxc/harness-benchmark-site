function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function normalizeJsonLike(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeJsonLike(entry));
    }
    if (isRecord(value)) {
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
            const entry = value[key];
            if (entry !== undefined) {
                accumulator[key] = normalizeJsonLike(entry);
            }
            return accumulator;
        }, {});
    }
    return value;
}
export function stableStringify(value) {
    return JSON.stringify(normalizeJsonLike(value)) ?? "null";
}
export function canonicalJsonText(value) {
    return `${JSON.stringify(normalizeJsonLike(value), null, 2) ?? "null"}\n`;
}
export function canonicalNdjsonText(rows) {
    return rows.map((row) => stableStringify(row)).join("\n").concat("\n");
}
//# sourceMappingURL=stable-stringify.js.map