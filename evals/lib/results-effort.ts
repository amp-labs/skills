import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Effort, efforts, isEffort } from "./models.ts";

const effortFile = (resultsDir: string): string => join(resultsDir, "effort");

export function effortOfResults(resultsDir: string): Effort | null {
  const path = effortFile(resultsDir);
  if (!existsSync(path)) return null;
  const recorded = readFileSync(path, "utf-8").trim();
  if (!isEffort(recorded))
    throw new Error(`${path} must record one of ${efforts.join(", ")}, not "${recorded}"`);
  return recorded;
}

export function recordEffortOfResults(resultsDir: string, effort: Effort): void {
  writeFileSync(effortFile(resultsDir), `${effort}\n`);
}
