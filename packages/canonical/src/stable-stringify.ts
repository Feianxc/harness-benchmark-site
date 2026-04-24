export type JsonLike =
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike | undefined };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeJsonLike(value: unknown): JsonLike {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonLike(entry));
  }

  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, JsonLike>>((accumulator, key) => {
        const entry = value[key];

        if (entry !== undefined) {
          accumulator[key] = normalizeJsonLike(entry);
        }

        return accumulator;
      }, {});
  }

  return value as JsonLike;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJsonLike(value)) ?? "null";
}

export function canonicalJsonText(value: unknown): string {
  return `${JSON.stringify(normalizeJsonLike(value), null, 2) ?? "null"}\n`;
}

export function canonicalNdjsonText(rows: unknown[]): string {
  return rows.map((row) => stableStringify(row)).join("\n").concat("\n");
}
