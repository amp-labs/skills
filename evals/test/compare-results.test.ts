import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

const evalsDir = fileURLToPath(new URL("../", import.meta.url));
const results = ["test/fixtures/results", "test/fixtures/main-results"];

const cases: Record<string, string[]> = {
  "lower-but-not-significant": [...results, "claude-amp-cli"],
  "significant-drop": [...results, "claude-amp-cli", "codex-amp-cli"],
  "arm-missing-on-one-side": [...results, "claude-no-skills", "codex-no-skills"],
};

test.each(Object.keys(cases))("%s", async (name) => {
  const args = cases[name] ?? [];
  const run = spawnSync("node", ["scripts/compare-results.ts", ...args], {
    cwd: evalsDir,
    encoding: "utf-8",
  });
  const recording = [
    `$ node scripts/compare-results.ts ${args.join(" ")}`,
    `exit code: ${run.status}`,
    "stdout:",
    run.stdout,
    "stderr:",
    run.stderr,
  ].join("\n");
  await expect(recording).toMatchFileSnapshot(`recordings/compare-results/${name}.txt`);
});
