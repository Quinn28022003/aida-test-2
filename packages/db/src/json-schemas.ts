type JsonObjectSchema = {
  type: "object";
  additionalProperties: true;
};

type JsonArraySchema = {
  type: "array";
  items: true;
};

export const jsonbSchemas = {
  profileMetadata: {
    description: "Free-form metadata stored as JSONB for user profiles.",
    oneOf: [{ type: "null" }, { type: "string" }, { type: "number" }, { type: "boolean" }, { type: "object", additionalProperties: true }, { type: "array", items: true }],
  },
} as const;

export type JsonbSchemaName = keyof typeof jsonbSchemas;
export type JsonbSchemaShape = JsonObjectSchema | JsonArraySchema | (typeof jsonbSchemas)[JsonbSchemaName];

