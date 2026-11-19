import type { EvalFixture, EvalRunData, ExperimentConfig } from "@vercel/agent-eval";
import { installAmp } from "./amp.ts";
import { type Agent, models, skillsDir } from "./models.ts";
import { expectDeployedThenDelete, project, runIdPlaceholder, deployedByRun } from "./project.ts";
import { skillFiles } from "./skills.ts";

// Checks against the Ampersand project after a run, by scenario. They run on the host, outside the agent's sandbox.
const afterRun: Record<string, (fixture: EvalFixture, run: EvalRunData) => Promise<void>> = {
  "deploy-integration": (fixture, run) =>
    expectDeployedThenDelete(deployedByRun(fixture.path, run.transcript)),
};

// Gives each run's integrations a unique name, so parallel runs in the shared project don't collide.
const uniqueNames = `node -e '
const fs = require("fs"), path = require("path");
const id = require("crypto").randomBytes(4).toString("hex");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") walk(p);
  else if (e.name === "amp.yaml") fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll("${runIdPlaceholder}", id));
});
walk(".");'`;

// One arm of the comparison: an agent with a set of skills, run on each of that agent's models.
export function arm(agent: Agent, skills: string[]): ExperimentConfig {
  return {
    agent,
    model: models[agent],
    sandbox: "docker",
    runs: 1,
    earlyExit: false,
    copyFiles: "changed",
    timeout: 600,
    agentEnv: process.env.AMP_API_KEY ? { AMP_API_KEY: process.env.AMP_API_KEY } : undefined,
    editPrompt: (prompt) => prompt.replaceAll("{{project}}", project ?? "{{project}}"),
    setup: async (sandbox) => {
      await installAmp(sandbox);
      if (skills.length > 0) await sandbox.writeFiles(skillFiles(skills, skillsDir[agent]));
      // Fold setup's edits into agent-eval's baseline commit, so the agent starts from a clean working tree.
      const prepared = await sandbox.runCommand("bash", [
        "-c",
        `set -e\n${uniqueNames}\ngit add -A\ngit commit -q --amend --no-edit`,
      ]);
      if (prepared.exitCode !== 0)
        throw new Error(`preparing the workspace failed: ${prepared.stderr}`);
    },
    onRunComplete: async ({ fixture, runData }) => {
      await afterRun[fixture.name]?.(fixture, runData);
    },
  };
}
