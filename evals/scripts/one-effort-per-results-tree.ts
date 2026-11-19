import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { effortFromEnvironment } from "../lib/models.ts";
import { effortOfResults, recordEffortOfResults } from "../lib/results-effort.ts";

const [resultsDir = fileURLToPath(new URL("../results", import.meta.url))] = process.argv.slice(2);
const effort = effortFromEnvironment();
const recorded = effortOfResults(resultsDir);
const holdsResults = readdirSync(resultsDir, { withFileTypes: true }).some((entry) =>
  entry.isDirectory(),
);

if (recorded !== null && recorded !== effort && holdsResults) {
  process.stderr.write(
    `${resultsDir} holds ${recorded}-effort results that a ${effort}-effort run would replace. ` +
      `Move them aside, or run at ${recorded} effort.\n`,
  );
  process.exit(1);
}

recordEffortOfResults(resultsDir, effort);
