import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { directories, latestResults } from "../lib/results.ts";

type Row = { arm: string; modelDir: string; scenario: string; result: string };

const evalsDir = fileURLToPath(new URL("../", import.meta.url));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const latestRows = (resultsDir: string, arm: string): Row[] =>
  latestResults(resultsDir, arm).map(({ modelDir, scenario, passedRuns, totalRuns }) => ({
    arm,
    modelDir,
    scenario,
    result: `${passedRuns}/${totalRuns}`,
  }));

async function expectedModels(arm: string): Promise<string[]> {
  const path = join(evalsDir, "experiments", `${arm}.ts`);
  if (!existsSync(path)) return [];
  const experiment: unknown = await import(pathToFileURL(path).href);
  const config = isRecord(experiment) && isRecord(experiment.default) ? experiment.default : {};
  const model = Array.isArray(config.model) ? config.model : [config.model];
  return model.filter((name): name is string => typeof name === "string");
}

const scenarios = directories(join(evalsDir, "evals"));

async function armRows(resultsDir: string, arm: string): Promise<Row[]> {
  const rows = latestRows(resultsDir, arm);
  if (rows.length === 0) return [{ arm, modelDir: "", scenario: "", result: "no results" }];
  const missing = (await expectedModels(arm)).flatMap((modelDir) =>
    scenarios
      .filter(
        (scenario) => !rows.some((row) => row.modelDir === modelDir && row.scenario === scenario),
      )
      .map((scenario) => ({ arm, modelDir, scenario, result: "missing" })),
  );
  return [...rows, ...missing];
}

const [resultsDir = "results", ...arms] = process.argv.slice(2);
if (arms.length === 0) {
  process.stderr.write("Name at least one arm to summarize.\n");
  process.exit(1);
}
const rows = (await Promise.all(arms.map((arm) => armRows(resultsDir, arm)))).flat();
const incomplete = rows.some((row) => row.result === "no results" || row.result === "missing");

const table = [
  "| Scenario | Arm | Model | Passed |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    (row) => `| ${row.scenario} | ${row.arm} | ${row.modelDir.split("?")[0]} | ${row.result} |`,
  ),
];
process.stdout.write(`${table.join("\n")}\n`);
if (incomplete) process.exitCode = 1;
