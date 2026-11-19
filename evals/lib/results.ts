import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ScenarioResult = {
  arm: string;
  modelDir: string;
  scenario: string;
  passedRuns: number;
  totalRuns: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const directories = (path: string): string[] =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

function runCounts(summaryPath: string): Pick<ScenarioResult, "passedRuns" | "totalRuns"> | null {
  if (!existsSync(summaryPath)) return null;
  const summary: unknown = JSON.parse(readFileSync(summaryPath, "utf-8"));
  if (
    !isRecord(summary) ||
    typeof summary.passedRuns !== "number" ||
    typeof summary.totalRuns !== "number"
  )
    return null;
  return { passedRuns: summary.passedRuns, totalRuns: summary.totalRuns };
}

export function latestResults(resultsDir: string, arm: string): ScenarioResult[] {
  return directories(join(resultsDir, arm)).flatMap((modelDir) => {
    const latest = directories(join(resultsDir, arm, modelDir)).at(-1);
    if (!latest) return [];
    const runDir = join(resultsDir, arm, modelDir, latest);
    return directories(runDir).flatMap((scenario) => {
      const counts = runCounts(join(runDir, scenario, "summary.json"));
      return counts ? [{ arm, modelDir, scenario, ...counts }] : [];
    });
  });
}
