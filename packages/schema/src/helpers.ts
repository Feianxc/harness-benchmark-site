import type { JsonSchema } from "./json-schema";

import { BUNDLE_PROTOCOL_VERSION, SCHEMA_CATALOG_VERSION } from "@ohbp/types";

export const jsonSchemaDialect = "https://json-schema.org/draft/2020-12/schema" as const;

export const stringSchema = (minLength = 1): JsonSchema => ({
  type: "string",
  minLength,
});

export const numberSchema = (minimum = 0): JsonSchema => ({
  type: "number",
  minimum,
});

export const integerSchema = (minimum = 0): JsonSchema => ({
  type: "integer",
  minimum,
});

export const booleanSchema = (): JsonSchema => ({
  type: "boolean",
});

export const enumSchema = <T extends readonly string[]>(values: T): JsonSchema => ({
  type: "string",
  enum: values,
});

export const digestSchema = (): JsonSchema => ({
  type: "string",
  pattern: "^(?:sha256:)?[0-9a-f]{64}$",
});

export const dateTimeSchema = (): JsonSchema => ({
  type: "string",
  format: "date-time",
});

export const arrayOf = (items: JsonSchema, minItems = 0): JsonSchema => ({
  type: "array",
  items,
  minItems,
});

export const recordOfNumbers = (): JsonSchema => ({
  type: "object",
  additionalProperties: numberSchema(0),
});

export const registryObject = (
  objectType: string,
  properties: Record<string, JsonSchema>,
  required: string[],
  description?: string,
): JsonSchema => ({
  $schema: jsonSchemaDialect,
  $id: `https://ohbp.dev/schema/v0.1/${objectType}.schema.json`,
  title: objectType,
  description,
  type: "object",
  additionalProperties: false,
  properties: {
    schema_version: {
      type: "string",
      const: SCHEMA_CATALOG_VERSION,
    },
    object_type: {
      type: "string",
      const: objectType,
    },
    ...properties,
  },
  required: ["schema_version", "object_type", ...required],
});

export const bundleObject = (
  objectType: string,
  properties: Record<string, JsonSchema>,
  required: string[],
  description?: string,
): JsonSchema => ({
  $schema: jsonSchemaDialect,
  $id: `https://ohbp.dev/schema/v0.1/${objectType}.schema.json`,
  title: objectType,
  description,
  type: "object",
  additionalProperties: false,
  properties: {
    protocol_version: {
      type: "string",
      const: BUNDLE_PROTOCOL_VERSION,
    },
    ...properties,
  },
  required: ["protocol_version", ...required],
});
