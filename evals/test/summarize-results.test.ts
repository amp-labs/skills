import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const evalsDir = fileURLToPath(new URL("../", import.meta.url));

const cases: Record<string, string[]> = {
  "latest-run-per-model": ["test/fixtures/results", "claude-amp-cli", "codex-amp-cli"],
  "arm-without-results": ["test/fixtures/results", "claude-amp-cli", "codex-no-skills"],
  "model-without-results": ["test/fixtures/results", "claude-no-skills"],
};

test.each(Object.keys(cases))("%s", async (name) => {
  const args = cases[name] ?? [];
  const run = spawnSync("node", ["scripts/summarize-results.ts", ...args], {
    cwd: evalsDir,
    encoding: "utf-8",
  });
  const recording = [
    `$ node scripts/summarize-results.ts ${args.join(" ")}`,
    `exit code: ${run.status}`,
    "stdout:",
    run.stdout,
    "stderr:",
    run.stderr,
  ].join("\n");
  await expect(recording).toMatchFileSnapshot(`recordings/summarize-results/${name}.txt`);
});
