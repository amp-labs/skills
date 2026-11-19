import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// The Ampersand project the evals run in, and a key for it. Both come from the host environment.
export const project = process.env.AMP_EVAL_PROJECT;
const key = process.env.AMP_API_KEY;
const api = "https://api.withampersand.com/v1";

// Setup replaces this in a scenario's amp.yaml with an id unique to the run (see lib/arm.ts).
export const runIdPlaceholder = "{{run}}";
const runIdPattern = "[0-9a-f]{8}";

type Integration = { id: string; name: string };

async function request(method: string, path: string): Promise<unknown> {
  const response = await fetch(`${api}/projects/${project}${path}`, {
    method,
    headers: { "X-Api-Key": key! },
  });
  if (!response.ok)
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  return method === "GET" ? response.json() : undefined;
}

// The scenario's integrations that this run deployed, from amp's deploy confirmations in the run's transcript.
// Other runs' names can appear in a listing of the shared project, but only this run's deploys confirm here.
export function deployedByRun(scenarioDir: string, transcript = ""): string[] {
  const templates = ampYamlFiles(scenarioDir)
    .flatMap((path) =>
      (parse(readFileSync(path, "utf-8"))?.integrations ?? []).map((i: { name: string }) => i.name),
    )
    .filter((name: string) => name.includes(runIdPlaceholder));
  const names = templates.flatMap((template: string) => {
    const name = template.split(runIdPlaceholder).map(escape).join(runIdPattern);
    const confirmation = new RegExp(`Successfully deployed your integration (${name})`, "g");
    return [...transcript.matchAll(confirmation)].map((match) => match[1]);
  });
  return [...new Set(names)];
}

// Checks that each named integration exists in the project, then deletes it so runs don't affect each other.
export async function expectDeployedThenDelete(names: string[]): Promise<void> {
  if (names.length === 0) throw new Error("the run never deployed the integration");
  const deployed = (await request("GET", "/integrations")) as Integration[];
  const missing = names.filter((name) => !deployed.some((i) => i.name === name));
  for (const integration of deployed.filter((i) => names.includes(i.name))) {
    await request("DELETE", `/integrations/${integration.id}`);
  }
  if (missing.length > 0)
    throw new Error(`not deployed to project ${project}: ${missing.join(", ")}`);
}

function ampYamlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : ampYamlFiles(path);
    return entry.name === "amp.yaml" ? [path] : [];
  });
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
