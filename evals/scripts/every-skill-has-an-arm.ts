import { readdirSync, readFileSync } from "node:fs";

const skillsDir = new URL("../../skills/", import.meta.url);
const armsDir = new URL("../experiments/", import.meta.url);

const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const armSources = readdirSync(armsDir).map((file) =>
  readFileSync(new URL(file, armsDir), "utf-8"),
);
const skillsWithoutArm = skills.filter(
  (skill) => !armSources.some((source) => source.includes(`"${skill}"`)),
);

if (skillsWithoutArm.length > 0) {
  process.stderr.write(
    `Add an arm in evals/experiments for each skill. Missing: ${skillsWithoutArm.join(", ")}\n`,
  );
  process.exitCode = 1;
}
