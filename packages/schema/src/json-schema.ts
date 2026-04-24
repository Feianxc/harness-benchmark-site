export interface JsonSchema {
  $id?: string;
  $schema?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  const?: unknown;
  enum?: readonly unknown[];
  pattern?: string;
  format?: string;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
}

