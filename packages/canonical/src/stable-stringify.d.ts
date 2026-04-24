export type JsonLike = null | boolean | number | string | JsonLike[] | {
    [key: string]: JsonLike | undefined;
};
export declare function normalizeJsonLike(value: unknown): JsonLike;
export declare function stableStringify(value: unknown): string;
export declare function canonicalJsonText(value: unknown): string;
export declare function canonicalNdjsonText(rows: unknown[]): string;
//# sourceMappingURL=stable-stringify.d.ts.map