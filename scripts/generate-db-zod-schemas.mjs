/* eslint-disable no-undef */
/**
 * Generate `packages/db/src/database-generated.schemas.ts` from Supabase types.
 *
 * Extracts public table Row/Insert/Update shapes and enum unions into a flat temp
 * file, runs `ts-to-zod`, then normalises the header. Direct generation from
 * `database-generated.types.ts` fails on generic/mapped helper types.
 *
 * CLI: `pnpm db schemas` (normal flow: `pnpm db types` / `pnpm db validate`).
 * Column types come from `information_schema` via `supabase db query` (see fetch-schema-column-types.mjs).
 */

import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildColumnTypeMapFromJson } from './lib/fetch-schema-column-types.mjs';
import {
  annotateColumnFormats,
  FLAT_FORMAT_TYPE_DECLARATIONS,
} from './lib/parse-schema-column-types.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const columnTypesPath = process.env.DB_COLUMN_TYPES_PATH;
const dbTypesPath = join(rootDir, 'packages/db/src/database-generated.types.ts');
const outputPath = join(rootDir, 'packages/db/src/database-generated.schemas.ts');
const tempDirPrefix = join(rootDir, '.tmp-db-schemas-');

const ENUM_REF = /Database\["public"\]\["Enums"\]\["([a-z_][a-z0-9_]*)"\]/g;

/**
 * @param {string} snake
 * @returns {string}
 */
function snakeToPascal(snake) {
  return snake
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * @param {string} snake
 * @returns {string}
 */
function snakeToCamel(snake) {
  return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Rewrites Row/Insert/Update property keys from snake_case to camelCase for API-aligned Zod output.
 *
 * @param {string} typeBody
 * @returns {string}
 */
function camelCaseObjectTypeBody(typeBody) {
  return typeBody
    .split('\n')
    .map((line) => {
      const propMatch = line.match(/^(\s+)([a-z_][a-z0-9_]*)(\?)?:(.*)$/);
      if (!propMatch) {
        return line;
      }

      const [, indent, key, optionalMarker, rest] = propMatch;
      return `${indent}${snakeToCamel(key)}${optionalMarker ?? ''}:${rest}`;
    })
    .join('\n');
}

/**
 * @param {string} source
 * @param {number} openBraceIndex Index of `{` opening the block.
 * @returns {string} Block including outer braces.
 */
function extractBalancedBlock(source, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex, i + 1);
      }
    }
  }
  throw new Error('Unbalanced braces while parsing database-generated.types.ts');
}

/**
 * @param {string} blockWithBraces `{ ... }`
 * @returns {string} Inner content without outer braces.
 */
function stripOuterBraces(blockWithBraces) {
  return blockWithBraces.slice(1, -1);
}

/**
 * @param {string} objectBody Inner object body (no outer braces).
 * @returns {Array<{ key: string, value: string }>}
 */
function parseTopLevelObjectEntries(objectBody) {
  const entries = [];
  let index = 0;

  while (index < objectBody.length) {
    const rest = objectBody.slice(index);
    const keyMatch = rest.match(/^\s*([a-z_][a-z0-9_]*):\s*\{/);
    if (!keyMatch) {
      break;
    }

    const key = keyMatch[1];
    const braceIndex = index + keyMatch[0].length - 1;
    const valueBlock = extractBalancedBlock(objectBody, braceIndex);
    entries.push({ key, value: stripOuterBraces(valueBlock) });
    index = braceIndex + valueBlock.length;
  }

  return entries;
}

/**
 * @param {string} tableBody Inner table definition (Row/Insert/Update/Relationships).
 * @param {"Row" | "Insert" | "Update"} section
 * @returns {string | null}
 */
function extractTableSection(tableBody, section) {
  const marker = `${section}: {`;
  const markerIndex = tableBody.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const braceIndex = markerIndex + section.length + 2;
  const block = extractBalancedBlock(tableBody, braceIndex);
  return stripOuterBraces(block).trimEnd();
}

/**
 * @param {string} enumsBody Inner `Enums: { ... }` block.
 * @returns {Map<string, string>}
 */
function parseEnumDefinitions(enumsBody) {
  /** @type {Map<string, string>} */
  const enums = new Map();
  let currentName = null;
  /** @type {string[]} */
  let currentParts = [];

  const flush = () => {
    if (!currentName) {
      return;
    }
    enums.set(currentName, currentParts.join(' ').replace(/\s+/g, ' ').trim());
    currentName = null;
    currentParts = [];
  };

  for (const line of enumsBody.split('\n')) {
    const entryMatch = line.match(/^\s+([a-z_][a-z0-9_]*):\s*(.*)$/);
    if (entryMatch) {
      flush();
      currentName = entryMatch[1];
      const remainder = entryMatch[2].trim();
      currentParts = remainder ? [remainder] : [];
      continue;
    }

    const continuationMatch = line.match(/^\s+\|(.*)$/);
    if (continuationMatch && currentName) {
      currentParts.push(`| ${continuationMatch[1].trim()}`);
    }
  }

  flush();
  return enums;
}

/**
 * @param {string} source
 * @returns {{ jsonType: string, tables: Array<{ name: string, row: string, insert: string, update: string }>, enums: Map<string, string> }}
 */
function parseDatabaseTypes(source) {
  const jsonMatch = source.match(/export type Json =\s*([\s\S]*?)\n\nexport type Database/);
  if (!jsonMatch) {
    throw new Error('Could not find export type Json in database-generated.types.ts');
  }
  const jsonType = jsonMatch[1].trim();

  const tablesMarker = source.indexOf('Tables: {');
  if (tablesMarker === -1) {
    throw new Error('Could not find Tables block in database-generated.types.ts');
  }

  const tablesBraceIndex = tablesMarker + 'Tables: '.length;
  const tablesBlock = extractBalancedBlock(source, tablesBraceIndex);
  const tableEntries = parseTopLevelObjectEntries(stripOuterBraces(tablesBlock));

  const enumsMarker = source.indexOf('Enums: {', tablesMarker);
  if (enumsMarker === -1) {
    throw new Error('Could not find Enums block in database-generated.types.ts');
  }

  const enumsBraceIndex = enumsMarker + 'Enums: '.length;
  const enumsBlock = extractBalancedBlock(source, enumsBraceIndex);
  const enums = parseEnumDefinitions(stripOuterBraces(enumsBlock));

  const tables = tableEntries.map(({ key, value }) => {
    const row = extractTableSection(value, 'Row');
    const insert = extractTableSection(value, 'Insert');
    const update = extractTableSection(value, 'Update');

    if (!row || !insert || !update) {
      throw new Error(`Table "${key}" is missing Row, Insert, or Update section`);
    }

    return { name: key, row, insert, update };
  });

  return { jsonType, tables, enums };
}

/**
 * ts-to-zod schema export name for a DB enum (e.g. invitation_status → invitationStatusEnumSchema).
 *
 * @param {string} enumName
 * @returns {string}
 */
function enumSchemaName(enumName) {
  const pascal = snakeToPascal(enumName);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}EnumSchema`;
}

/**
 * Reference enum by exported alias so ts-to-zod reuses one schema per enum.
 *
 * @param {string} typeBody
 * @param {Map<string, string>} enums
 * @returns {string}
 */
function inlineEnumReferences(typeBody, enums) {
  return typeBody.replace(ENUM_REF, (_, enumName) => {
    if (!enums.has(enumName)) {
      throw new Error(`Unknown enum reference: ${enumName}`);
    }
    return `${snakeToPascal(enumName)}Enum`;
  });
}

/**
 * @param {string} typeBody
 * @param {string} tableName snake_case
 * @param {Map<string, string>} columnTypeMap
 * @param {Map<string, string>} enums
 * @returns {string}
 */
function prepareTableTypeBody(typeBody, tableName, columnTypeMap, enums) {
  const withEnums = inlineEnumReferences(typeBody, enums);
  const withFormats = annotateColumnFormats(tableName, withEnums, columnTypeMap);
  return camelCaseObjectTypeBody(withFormats);
}

/**
 * @param {{ jsonType: string, tables: Array<{ name: string, row: string, insert: string, update: string }>, enums: Map<string, string> }} parsed
 * @param {Map<string, string>} columnTypeMap
 * @returns {string}
 */
function buildFlatTypesSource(parsed, columnTypeMap) {
  const lines = [
    '// Ephemeral input for ts-to-zod; not committed.',
    FLAT_FORMAT_TYPE_DECLARATIONS,
    'export type Json =',
    parsed.jsonType,
    '',
  ];

  for (const [enumName, definition] of parsed.enums) {
    const pascal = snakeToPascal(enumName);
    lines.push(`export type ${pascal}Enum = ${definition};`, '');
  }

  for (const table of parsed.tables) {
    const pascal = snakeToPascal(table.name);
    const row = prepareTableTypeBody(table.row, table.name, columnTypeMap, parsed.enums);
    const insert = prepareTableTypeBody(table.insert, table.name, columnTypeMap, parsed.enums);
    const update = prepareTableTypeBody(table.update, table.name, columnTypeMap, parsed.enums);

    lines.push(`export type ${pascal}Row = {`, row, '};', '');
    lines.push(`export type ${pascal}Insert = {`, insert, '};', '');
    lines.push(`export type ${pascal}Update = {`, update, '};', '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/** Canonical JSONB validator; replaces ts-to-zod output for predictable runtime behaviour. */
const CANONICAL_JSON_SCHEMA = `export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ])
);
`;

/** Matches z.union([z.literal("a"), z.literal("b"), ...]) from ts-to-zod. */
const LITERAL_UNION_PATTERN = /z\.union\(\[((?:z\.literal\([^)]+\),?\s*)+)\]\)/g;

/**
 * @param {string} content
 * @returns {string}
 */
function convertLiteralUnionsToZodEnum(content) {
  return content.replace(LITERAL_UNION_PATTERN, (_, literalsPart) => {
    const values = [...literalsPart.matchAll(/z\.literal\(([^)]+)\)/g)].map((match) => match[1]);
    return `z.enum([${values.join(', ')}])`;
  });
}

/**
 * ts-to-zod may preserve some snake_case object keys; normalise all z.object field keys to camelCase.
 *
 * @param {string} content
 * @returns {string}
 */
function camelCaseZodObjectPropertyKeys(content) {
  return content.replace(/^(\s{4})([a-z][a-z0-9_]*): (z\.)/gm, (_, indent, key, zStart) => {
    if (!key.includes('_')) {
      return `${indent}${key}: ${zStart}`;
    }

    return `${indent}${snakeToCamel(key)}: ${zStart}`;
  });
}

/**
 * @param {string} schemaName
 * @returns {string}
 */
function inferredTypeName(schemaName) {
  const baseName = schemaName.replace(/Schema$/, '');
  return `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`;
}

/**
 * Adds `z.infer` type exports next to each generated schema export.
 *
 * @param {string} content
 * @returns {string}
 */
function addInferredTypeExports(content) {
  return content.replace(
    /export const ([a-z][A-Za-z0-9]*Schema) = ([\s\S]*?);\n/g,
    (block, schemaName) => {
      if (
        schemaName === 'jsonSchema' ||
        schemaName === 'dbUuidSchema' ||
        schemaName === 'dbDateTimeOffsetSchema' ||
        schemaName === 'dbDateTimeLocalSchema'
      ) {
        return block;
      }

      return `${block}export type ${inferredTypeName(schemaName)} = z.infer<typeof ${schemaName}>;\n`;
    },
  );
}

/**
 * Removes ephemeral format helper schemas from ts-to-zod and inlines the final Zod validators.
 *
 * @param {string} body
 * @returns {string}
 */
function stripEphemeralFormatSchemas(body) {
  return body
    .replace(/^export const dbUuidSchema = z\.uuid\(\);\n\n/m, '')
    .replace(/^export const dbDateTimeOffsetSchema = z\.iso\.datetime\(\);\n\n/m, '')
    .replace(/^export const dbDateTimeLocalSchema = z\.iso\.datetime\(\);\n\n/m, '')
    .replace(/\bdbUuidSchema\b/g, 'z.uuid()')
    .replace(/\bdbDateTimeOffsetSchema\b/g, 'z.iso.datetime({ offset: true })')
    .replace(/\bdbDateTimeLocalSchema\b/g, 'z.iso.datetime({ local: true })');
}

/**
 * Emit enum schemas first, then table schemas (enum exports moved out of ts-to-zod tail).
 *
 * @param {string} body
 * @param {Map<string, string>} enums
 * @returns {string}
 */
function reorderEnumSchemasFirst(body, enums) {
  const enumBlocks = [];
  let rest = stripEphemeralFormatSchemas(body);

  for (const enumName of enums.keys()) {
    const schemaName = enumSchemaName(enumName);
    const enumPattern = new RegExp(`export const ${schemaName} = z\\.enum\\(\\[[^\\]]+\\]\\);\\n`);
    const enumMatch = rest.match(enumPattern);
    const literalPattern = new RegExp(`export const ${schemaName} = z\\.literal\\(([^)]+)\\);\\n`);
    const literalMatch = rest.match(literalPattern);
    const match = enumMatch ?? literalMatch;

    if (!match) {
      throw new Error(`Missing generated enum schema: ${schemaName}`);
    }

    if (literalMatch) {
      enumBlocks.push(`export const ${schemaName} = z.enum([${literalMatch[1]}]);\n`);
    } else {
      enumBlocks.push(match[0]);
    }

    rest = rest.replace(match[0], '');
  }

  const afterJson = rest.replace(/export const jsonSchema[\s\S]*?;\n+/, '').trimStart();
  return `${CANONICAL_JSON_SCHEMA}\n\n${enumBlocks.join('\n')}\n\n${afterJson}`;
}

/**
 * @param {string} content
 * @param {Map<string, string>} enums
 * @returns {string}
 */
function normaliseGeneratedSchemas(content, enums) {
  const body = camelCaseZodObjectPropertyKeys(
    convertLiteralUnionsToZodEnum(
      content
        .replace(/^\/\/ Generated by ts-to-zod\n\n?/m, '')
        .replace(/^import \{ z \} from "zod";\n\n?/m, '')
        .replace(/^import \{ type Json \} from "\.\/flat";\n\n?/m, '')
        .trimEnd(),
    ),
  );

  const ordered = addInferredTypeExports(reorderEnumSchemasFirst(body, enums));

  return `// Generated by pnpm db schemas. Do not edit by hand.
// Table object keys are camelCase for API/runtime validation; database-generated.types.ts stays snake_case.
// uuid uses z.uuid(); timestamptz uses z.iso.datetime({ offset: true }); timestamp uses z.iso.datetime({ local: true }).
// Column validators come from information_schema via ts-to-zod @format tags.

import { z } from "zod";

import type { Json } from "./database-generated.types";

${ordered}\n`;
}

if (!columnTypesPath) {
  console.error(
    'Missing DB_COLUMN_TYPES_PATH. Run via `pnpm db schemas` or `pnpm db types` (fetches information_schema first).',
  );
  process.exit(1);
}

const columnTypesJson = await readFile(columnTypesPath, 'utf8');
const columnTypeMap = buildColumnTypeMapFromJson(columnTypesJson);
console.log(`Column types from information_schema: ${columnTypesPath}`);

const source = await readFile(dbTypesPath, 'utf8');
const parsed = parseDatabaseTypes(source);

const flatSource = buildFlatTypesSource(parsed, columnTypeMap);

const tempDir = await mkdtemp(tempDirPrefix);
const relDir = tempDir.slice(rootDir.length + 1);
const flatRelativePath = join(relDir, 'flat.ts');
const outputRelativePath = join(relDir, 'schemas.ts');

try {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(join(tempDir, 'flat.ts'), flatSource);

  console.log(`$ pnpm exec ts-to-zod ${flatRelativePath} ${outputRelativePath} --skipValidation`);
  execFileSync('pnpm', ['exec', 'ts-to-zod', flatRelativePath, outputRelativePath, '--skipValidation'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  const generated = await readFile(join(tempDir, 'schemas.ts'), 'utf8');
  await writeFile(outputPath, normaliseGeneratedSchemas(generated, parsed.enums));
  console.log(`Wrote ${outputPath}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
