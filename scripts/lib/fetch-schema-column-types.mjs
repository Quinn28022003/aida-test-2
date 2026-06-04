/**
 * Build `table.column` → Postgres type map from `information_schema.columns` rows
 * (fetched via `supabase db query` in tools/commands/db.ts).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const COLUMN_TYPES_SQL = readFileSync(
  join(__dirname, 'column-types-query.sql'),
  'utf8',
);

/**
 * @typedef {object} InformationSchemaColumnRow
 * @property {string} table_name
 * @property {string} column_name
 * @property {string} udt_name
 * @property {string} data_type
 * @property {string} [is_nullable]
 */

/**
 * @param {string} rawType e.g. timestamptz, text, _uuid
 * @returns {string} base type without array prefix
 */
export function normalizePgType(rawType) {
  return rawType.replace(/^_/, '').replace(/\[\]$/, '').toLowerCase();
}

/**
 * @param {InformationSchemaColumnRow} row
 * @returns {string}
 */
export function pgTypeFromInformationSchemaRow(row) {
  if (row.data_type === 'ARRAY') {
    return normalizePgType(row.udt_name);
  }

  return normalizePgType(row.udt_name);
}

/**
 * @param {InformationSchemaColumnRow[]} rows
 * @returns {Map<string, string>} keys `table.column`, values normalized Postgres types
 */
export function buildColumnTypeMapFromRows(rows) {
  /** @type {Map<string, string>} */
  const map = new Map();

  for (const row of rows) {
    if (!row.table_name || !row.column_name || !row.udt_name) {
      continue;
    }

    map.set(`${row.table_name}.${row.column_name}`, pgTypeFromInformationSchemaRow(row));
  }

  return map;
}

/**
 * @param {unknown} parsed
 * @returns {InformationSchemaColumnRow[]}
 */
function extractRows(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object') {
    const record = /** @type {Record<string, unknown>} */ (parsed);
    if (Array.isArray(record.data)) {
      return record.data;
    }
    if (Array.isArray(record.rows)) {
      return record.rows;
    }
  }

  throw new Error(
    'Expected supabase db query JSON to be an array of rows or { data: rows }',
  );
}

/**
 * @param {string} stdout raw stdout from `supabase db query -o json`
 * @returns {InformationSchemaColumnRow[]}
 */
export function parseColumnTypesJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('supabase db query returned empty stdout');
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error('Failed to parse supabase db query JSON output', { cause: error });
  }

  return extractRows(parsed);
}

/**
 * @param {string} jsonText file contents (same shape as query stdout)
 * @returns {Map<string, string>}
 */
export function buildColumnTypeMapFromJson(jsonText) {
  const rows = parseColumnTypesJson(jsonText);
  return buildColumnTypeMapFromRows(rows);
}
