#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Merge coverage reports from all packages into a single report at the root.
 * This is needed for the vitest-coverage-report-action to work in a monorepo.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const coverageDir = join(rootDir, 'coverage');

// Find all coverage-summary.json files in packages and apps
function findCoverageFiles(dir, filename) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and root coverage directory
        if (entry.name === 'node_modules' || fullPath === coverageDir) continue;
        walk(fullPath);
      } else if (entry.name === filename) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

const summaryFiles = findCoverageFiles(rootDir, 'coverage-summary.json');
const finalFiles = findCoverageFiles(rootDir, 'coverage-final.json');

if (summaryFiles.length === 0) {
  console.error('No coverage-summary.json files found in packages/apps');
  process.exit(1);
}

console.log(`Found ${summaryFiles.length} coverage summary files:`);
summaryFiles.forEach(f => console.log(`  - ${f.replace(rootDir, '')}`));

// Merge coverage summaries
function mergeSummaries(files) {
  const merged = {
    total: {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branchesTrue: { total: 0, covered: 0, skipped: 0, pct: 0 }
    }
  };

  for (const file of files) {
    const content = JSON.parse(readFileSync(file, 'utf-8'));

    // Merge totals
    for (const key of ['lines', 'statements', 'functions', 'branches', 'branchesTrue']) {
      if (content.total?.[key]) {
        merged.total[key].total += content.total[key].total || 0;
        merged.total[key].covered += content.total[key].covered || 0;
        merged.total[key].skipped += content.total[key].skipped || 0;
      }
    }

    // Merge individual file entries (with package prefix)
    const packageName = file.replace(rootDir, '').replace('/coverage/coverage-summary.json', '').replace(/^\//, '');
    for (const [filePath, data] of Object.entries(content)) {
      if (filePath === 'total') continue;
      const prefixedPath = `${packageName}/${filePath}`;
      merged[prefixedPath] = data;
    }
  }

  // Recalculate percentages for totals
  for (const key of ['lines', 'statements', 'functions', 'branches', 'branchesTrue']) {
    const total = merged.total[key].total;
    const covered = merged.total[key].covered;
    merged.total[key].pct = total > 0 ? Math.round((covered / total) * 10000) / 100 : 0;
  }

  return merged;
}

// Merge coverage final (detailed coverage data)
function mergeFinal(files) {
  const merged = {};

  for (const file of files) {
    const content = JSON.parse(readFileSync(file, 'utf-8'));
    const packageName = file.replace(rootDir, '').replace('/coverage/coverage-final.json', '').replace(/^\//, '');

    for (const [filePath, data] of Object.entries(content)) {
      const prefixedPath = `${packageName}/${filePath}`;
      merged[prefixedPath] = data;
    }
  }

  return merged;
}

// Create coverage directory if it doesn't exist
if (!existsSync(coverageDir)) {
  mkdirSync(coverageDir, { recursive: true });
}

// Write merged summaries
const mergedSummary = mergeSummaries(summaryFiles);
writeFileSync(join(coverageDir, 'coverage-summary.json'), JSON.stringify(mergedSummary, null, 2));
console.log(`\nMerged coverage summary written to: coverage/coverage-summary.json`);
console.log(`Total coverage: ${mergedSummary.total.lines.pct}% lines, ${mergedSummary.total.statements.pct}% statements`);

// Write merged final coverage
const mergedFinal = mergeFinal(finalFiles);
writeFileSync(join(coverageDir, 'coverage-final.json'), JSON.stringify(mergedFinal, null, 2));
console.log(`Merged coverage final written to: coverage/coverage-final.json`);
