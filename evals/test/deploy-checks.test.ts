import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const evalFile = fileURLToPath(new URL("../evals/deploy-integration/EVAL.ts", import.meta.url));
const fixturesDir = fileURLToPath(new URL("fixtures/deploy-checks/", import.meta.url));
const scenarioVitest = fileURLToPath(new URL("../node_modules/.bin/vitest", import.meta.url));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function commandsIn(results: unknown): string[] {
  if (!isRecord(results) || !isRecord(results.o11y) || !Array.isArray(results.o11y.shellCommands))
    return [];
  return results.o11y.shellCommands.flatMap((entry: unknown) =>
    isRecord(entry) && typeof entry.command === "string" ? [entry.command] : [],
  );
}

function verdictsIn(report: unknown): string[] {
  if (!isRecord(report) || !Array.isArray(report.testResults)) return [];
  return report.testResults.flatMap((file: unknown) =>
    isRecord(file) && Array.isArray(file.assertionResults)
      ? file.assertionResults.flatMap((assertion: unknown) =>
          isRecord(assertion) &&
          typeof assertion.title === "string" &&
          typeof assertion.status === "string"
            ? [`${assertion.title}: ${assertion.status}`]
            : [],
        )
      : [],
  );
}

function runScenarioChecks(resultsJson: string): string[] {
  const workspace = mkdtempSync(join(tmpdir(), "deploy-checks-"));
  mkdirSync(join(workspace, "__agent_eval__"));
  writeFileSync(join(workspace, "__agent_eval__", "results.json"), resultsJson);
  copyFileSync(evalFile, join(workspace, "EVAL.ts"));
  writeFileSync(
    join(workspace, "vitest.config.mjs"),
    "export default { test: { include: ['EVAL.ts'] } };\n",
  );
  spawnSync(scenarioVitest, ["run", "--reporter=json", "--outputFile=report.json"], {
    cwd: workspace,
  });
  const report: unknown = JSON.parse(readFileSync(join(workspace, "report.json"), "utf-8"));
  return verdictsIn(report);
}

const fixtures = readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""));

test.each(fixtures)(
  "%s",
  async (fixture) => {
    const resultsJson = readFileSync(join(fixturesDir, `${fixture}.json`), "utf-8");
    const results: unknown = JSON.parse(resultsJson);
    const commands = commandsIn(results).map((command) => `$ ${command.replaceAll("\n", "\n  ")}`);
    const recording = [...commands, "", ...runScenarioChecks(resultsJson), ""].join("\n");
    await expect(recording).toMatchFileSnapshot(`recordings/deploy-checks/${fixture}.txt`);
  },
  60_000,
);
