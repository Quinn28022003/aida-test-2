/**
 * Zod format injection for generated DB flat types (`DbUuid`, `DbDateTimeOffset`, `DbDateTimeLocal`).
 * Column Postgres types come from `information_schema` via fetch-schema-column-types.mjs.
 */

/** @typedef {'uuid' | 'date-time-offset' | 'date-time-local'} ZodFormatTag */

/** Postgres column types that map to ts-to-zod `@format` tags. */
export const ZOD_FORMAT_BY_PG_TYPE = Object.freeze({
  uuid: 'uuid',
  timestamptz: 'date-time-offset',
  timestamp: 'date-time-local',
});

/**
 * @param {string | undefined} pgType
 * @returns {ZodFormatTag | undefined}
 */
export function zodFormatForPgType(pgType) {
  if (!pgType) {
    return undefined;
  }

  const format = ZOD_FORMAT_BY_PG_TYPE[/** @type {keyof typeof ZOD_FORMAT_BY_PG_TYPE} */ (pgType)];
  return format;
}

/**
 * @param {string} tableName snake_case table name
 * @param {string} columnName snake_case column name
 * @param {Map<string, string>} columnTypeMap
 * @returns {ZodFormatTag | undefined}
 */
export function zodFormatForColumn(tableName, columnName, columnTypeMap) {
  return zodFormatForPgType(columnTypeMap.get(`${tableName}.${columnName}`));
}

/** Matches `col: string` and `col?: string` (and unions with null on the same line). */
const PROPERTY_LINE_RE = /^(\s*)([a-z_][a-z0-9_]*)(\?)?:\s*string\b/;

/** ts-to-zod applies `@format` reliably when the property type is an alias, including `| null` unions. */
const FORMAT_TYPE_NAME = Object.freeze({
  uuid: 'DbUuid',
  'date-time-offset': 'DbDateTimeOffset',
  'date-time-local': 'DbDateTimeLocal',
});

/**
 * Replaces `string` with format aliases for columns whose Postgres type maps to a Zod format.
 *
 * @param {string} tableName snake_case
 * @param {string} typeBody inner object body (snake_case keys)
 * @param {Map<string, string>} columnTypeMap
 * @returns {string}
 */
export function annotateColumnFormats(tableName, typeBody, columnTypeMap) {
  const lines = typeBody.split('\n');
  /** @type {string[]} */
  const output = [];

  for (const line of lines) {
    const propMatch = line.match(PROPERTY_LINE_RE);
    if (!propMatch) {
      output.push(line);
      continue;
    }

    const [, , columnName] = propMatch;
    const format = zodFormatForColumn(tableName, columnName, columnTypeMap);
    if (!format) {
      output.push(line);
      continue;
    }

    const alias = FORMAT_TYPE_NAME[format];
    output.push(line.replace(/:\s*(\??\s*)string\b/, `: $1${alias}`));
  }

  return output.join('\n');
}

/** Ephemeral flat-type aliases wired to ts-to-zod `@format` tags. */
export const FLAT_FORMAT_TYPE_DECLARATIONS = `/** @format uuid */
export type DbUuid = string;
/** @format date-time */
export type DbDateTimeOffset = string;
/** @format date-time */
export type DbDateTimeLocal = string;
`;
