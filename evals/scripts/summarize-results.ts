import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Row = { arm: string; model: string; scenario: string; passed: number; total: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const directories = (path: string): string[] =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

function runCounts(summaryPath: string): { passed: number; total: number } | null {
  const summary: unknown = JSON.parse(readFileSync(summaryPath, "utf-8"));
  if (
    !isRecord(summary) ||
    typeof summary.passedRuns !== "number" ||
    typeof summary.totalRuns !== "number"
  )
    return null;
  return { passed: summary.passedRuns, total: summary.totalRuns };
}

function latestRows(resultsDir: string, arm: string): Row[] {
  return directories(join(resultsDir, arm)).flatMap((modelDir) => {
    const latest = directories(join(resultsDir, arm, modelDir)).at(-1);
    if (!latest) return [];
    const runDir = join(resultsDir, arm, modelDir, latest);
    const model = modelDir.split("?")[0] ?? modelDir;
    return directories(runDir).flatMap((scenario) => {
      const summaryPath = join(runDir, scenario, "summary.json");
      const counts = existsSync(summaryPath) ? runCounts(summaryPath) : null;
      return counts ? [{ arm, model, scenario, ...counts }] : [];
    });
  });
}

const [resultsDir = "results", ...arms] = process.argv.slice(2);
const rows = arms.flatMap((arm) => latestRows(resultsDir, arm));
const armsWithoutResults = arms.filter((arm) => !rows.some((row) => row.arm === arm));

const table = [
  "| Scenario | Arm | Model | Passed |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    (row) => `| ${row.scenario} | ${row.arm} | ${row.model} | ${row.passed}/${row.total} |`,
  ),
  ...armsWithoutResults.map((arm) => `| | ${arm} | | no results |`),
];
process.stdout.write(`${table.join("\n")}\n`);
if (armsWithoutResults.length > 0) process.exitCode = 1;
