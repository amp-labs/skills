import type { EvalFixture, EvalRunData, ExperimentConfig } from "@vercel/agent-eval";
import { installAmp } from "./amp.ts";
import { type Agent, modelsByAgent, projectSkillsDirByAgent } from "./models.ts";
import {
  evalProject,
  expectDeployedThenDelete,
  integrationsConfirmedDeployedIn,
  runIdPlaceholder,
} from "./project.ts";
import { skillFiles } from "./skills.ts";

const projectChecksByScenario: Record<
  string,
  (fixture: EvalFixture, run: EvalRunData) => Promise<void>
> = {
  "deploy-integration": (fixture, run) =>
    expectDeployedThenDelete(integrationsConfirmedDeployedIn(fixture.path, run.transcript)),
};

const giveIntegrationsRunUniqueNames = `node -e '
const fs = require("fs"), path = require("path");
const id = require("crypto").randomBytes(4).toString("hex");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") walk(p);
  else if (e.name === "amp.yaml") fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll("${runIdPlaceholder}", id));
});
walk(".");'`;

const foldSetupIntoBaselineCommit = "git add -A\ngit commit -q --amend --no-edit";

export function arm(agent: Agent, skills: string[]): ExperimentConfig {
  return {
    agent,
    model: modelsByAgent[agent],
    sandbox: "docker",
    runs: 1,
    earlyExit: false,
    copyFiles: "changed",
    timeout: 600,
    agentEnv: process.env.AMP_API_KEY ? { AMP_API_KEY: process.env.AMP_API_KEY } : undefined,
    editPrompt: (prompt) => prompt.replaceAll("{{project}}", evalProject ?? "{{project}}"),
    setup: async (sandbox) => {
      await installAmp(sandbox);
      if (skills.length > 0)
        await sandbox.writeFiles(skillFiles(skills, projectSkillsDirByAgent[agent]));
      const prepared = await sandbox.runCommand("bash", [
        "-c",
        ["set -e", giveIntegrationsRunUniqueNames, foldSetupIntoBaselineCommit].join("\n"),
      ]);
      if (prepared.exitCode !== 0)
        throw new Error(`preparing the workspace failed: ${prepared.stderr}`);
    },
    onRunComplete: async ({ fixture, runData }) => {
      await projectChecksByScenario[fixture.name]?.(fixture, runData);
    },
  };
}
