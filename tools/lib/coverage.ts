import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { repoRoot } from './paths.js';

type CoverageMetric = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

type CoverageSummaryEntry = {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  branchesTrue?: CoverageMetric;
};

type CoverageSummary = Record<string, CoverageSummaryEntry>;
type CoverageFinal = Record<string, unknown>;

type WorkspaceCoverageReport = {
  workspaceDir: string;
  summaryPath: string;
  finalPath: string;
};

const COVERAGE_DIR_NAME = 'coverage';
const COVERAGE_SUMMARY_FILE = 'coverage-summary.json';
const COVERAGE_FINAL_FILE = 'coverage-final.json';
const WORKSPACE_ROOTS = ['apps', 'packages'] as const;
const SUMMARY_METRICS = [
  'lines',
  'statements',
  'functions',
  'branches',
  'branchesTrue',
] as const;

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function findWorkspaceCoverageReports(): Promise<WorkspaceCoverageReport[]> {
  const reports: WorkspaceCoverageReport[] = [];

  for (const workspaceRoot of WORKSPACE_ROOTS) {
    const workspaceRootPath = path.join(repoRoot, workspaceRoot);
    const entries = await readdir(workspaceRootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const workspaceDir = path.join(workspaceRootPath, entry.name);
      const coverageDir = path.join(workspaceDir, COVERAGE_DIR_NAME);
      const summaryPath = path.join(coverageDir, COVERAGE_SUMMARY_FILE);
      const finalPath = path.join(coverageDir, COVERAGE_FINAL_FILE);
      const hasSummary = await pathExists(summaryPath);
      const hasFinal = await pathExists(finalPath);

      if (hasSummary !== hasFinal) {
        throw new Error(`Incomplete coverage report in ${workspaceDir}`);
      }

      if (hasSummary) {
        reports.push({ workspaceDir, summaryPath, finalPath });
      }
    }
  }

  return reports;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

function emptyMetric(): CoverageMetric {
  return {
    total: 0,
    covered: 0,
    skipped: 0,
    pct: 100,
  };
}

function calculatePct(metric: CoverageMetric): number {
  if (metric.total === 0) {
    return 100;
  }

  return Math.floor((metric.covered / metric.total) * 10000) / 100;
}

function mergeMetric(total: CoverageMetric, metric: CoverageMetric): void {
  total.total += metric.total;
  total.covered += metric.covered;
  total.skipped += metric.skipped;
  total.pct = calculatePct(total);
}

function createEmptySummaryTotal(): CoverageSummaryEntry {
  return {
    lines: emptyMetric(),
    statements: emptyMetric(),
    functions: emptyMetric(),
    branches: emptyMetric(),
    branchesTrue: emptyMetric(),
  };
}

function mergeSummaryTotal(total: CoverageSummaryEntry, entry: CoverageSummaryEntry): void {
  for (const metricName of SUMMARY_METRICS) {
    const metric = entry[metricName];
    const totalMetric = total[metricName];

    if (!metric || !totalMetric) {
      continue;
    }

    mergeMetric(totalMetric, metric);
  }
}

function addSummaryEntry(
  mergedSummary: CoverageSummary,
  sourcePath: string,
  entry: CoverageSummaryEntry,
  workspaceDir: string,
): void {
  if (mergedSummary[sourcePath]) {
    throw new Error(`Duplicate coverage summary entry for ${sourcePath} in ${workspaceDir}`);
  }

  mergedSummary[sourcePath] = entry;
}

function addFinalEntry(
  mergedFinal: CoverageFinal,
  sourcePath: string,
  entry: unknown,
  workspaceDir: string,
): void {
  if (mergedFinal[sourcePath]) {
    throw new Error(`Duplicate coverage final entry for ${sourcePath} in ${workspaceDir}`);
  }

  mergedFinal[sourcePath] = entry;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function mergeWorkspaceCoverageReports(): Promise<void> {
  const reports = await findWorkspaceCoverageReports();

  if (reports.length === 0) {
    throw new Error('No workspace coverage reports found.');
  }

  const mergedTotal = createEmptySummaryTotal();
  const mergedSummary: CoverageSummary = {
    total: mergedTotal,
  };
  const mergedFinal: CoverageFinal = {};

  for (const report of reports) {
    const summary = await readJsonFile<CoverageSummary>(report.summaryPath);
    const final = await readJsonFile<CoverageFinal>(report.finalPath);

    if (summary.total) {
      mergeSummaryTotal(mergedTotal, summary.total);
    }

    for (const [sourcePath, entry] of Object.entries(summary)) {
      if (sourcePath === 'total') {
        continue;
      }

      addSummaryEntry(mergedSummary, sourcePath, entry, report.workspaceDir);
    }

    for (const [sourcePath, entry] of Object.entries(final)) {
      addFinalEntry(mergedFinal, sourcePath, entry, report.workspaceDir);
    }
  }

  const rootCoverageDir = path.join(repoRoot, COVERAGE_DIR_NAME);
  await mkdir(rootCoverageDir, { recursive: true });
  await writeJsonFile(path.join(rootCoverageDir, COVERAGE_SUMMARY_FILE), mergedSummary);
  await writeJsonFile(path.join(rootCoverageDir, COVERAGE_FINAL_FILE), mergedFinal);

  console.log(`Merged ${reports.length} workspace coverage reports into ${COVERAGE_DIR_NAME}/`);
}
