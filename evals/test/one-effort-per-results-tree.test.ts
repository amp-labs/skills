import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const evalsDir = fileURLToPath(new URL("../", import.meta.url));

function resultsTree(options: { records?: string; holdsResults?: boolean }): string {
  const dir = mkdtempSync(join(tmpdir(), "results-"));
  if (options.records !== undefined) writeFileSync(join(dir, "effort"), `${options.records}\n`);
  if (options.holdsResults)
    mkdirSync(join(dir, "claude-amp-cli", "claude-opus-5-5"), { recursive: true });
  return dir;
}

const recordEffort = (resultsDir: string, effort: string): SpawnSyncReturns<string> =>
  spawnSync("node", ["scripts/one-effort-per-results-tree.ts", resultsDir], {
    cwd: evalsDir,
    encoding: "utf-8",
    env: { ...process.env, EVAL_EFFORT: effort },
  });

const recordedEffort = (resultsDir: string): string =>
  readFileSync(join(resultsDir, "effort"), "utf-8");

test("records the effort of a tree that records none", () => {
  const dir = resultsTree({});
  const run = recordEffort(dir, "high");
  expect(run.stderr).toBe("");
  expect(run.status).toBe(0);
  expect(recordedEffort(dir)).toBe("high\n");
});

test("refuses to replace results another effort produced", () => {
  const dir = resultsTree({ records: "medium", holdsResults: true });
  const run = recordEffort(dir, "low");
  expect(run.status).toBe(1);
  expect(run.stderr).toContain("holds medium-effort results");
  expect(recordedEffort(dir)).toBe("medium\n");
});

test("re-records the effort of a tree without results", () => {
  const dir = resultsTree({ records: "medium" });
  const run = recordEffort(dir, "low");
  expect(run.status).toBe(0);
  expect(recordedEffort(dir)).toBe("low\n");
});

test("rejects a recorded effort that is not an effort", () => {
  const dir = resultsTree({ records: "exhaustive", holdsResults: true });
  const run = recordEffort(dir, "medium");
  expect(run.status).toBe(1);
  expect(run.stderr).toContain('must record one of low, medium, high, not "exhaustive"');
});
