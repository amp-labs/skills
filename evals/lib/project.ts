import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const evalProject = process.env.AMP_EVAL_PROJECT;
const ampersandApi = "https://api.withampersand.com/v1";

export const runIdPlaceholder = "{{run}}";
const runIdPattern = "[0-9a-f]{8}";

type Integration = { id: string; name: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

async function requestEvalProject(method: "GET" | "DELETE", path: string): Promise<unknown> {
  const apiKey = process.env.AMP_API_KEY;
  if (!apiKey) throw new Error("AMP_API_KEY is not set");
  const response = await fetch(`${ampersandApi}/projects/${evalProject}${path}`, {
    method,
    headers: { "X-Api-Key": apiKey },
  });
  if (!response.ok)
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  const body: unknown = method === "GET" ? await response.json() : undefined;
  return body;
}

function integrationsIn(body: unknown): Integration[] {
  if (!Array.isArray(body)) throw new Error("the integrations response is not a list");
  return body.flatMap((item: unknown) =>
    isRecord(item) && typeof item.id === "string" && typeof item.name === "string"
      ? [{ id: item.id, name: item.name }]
      : [],
  );
}

function integrationNames(manifest: unknown): string[] {
  if (!isRecord(manifest) || !Array.isArray(manifest.integrations)) return [];
  return manifest.integrations.flatMap((item: unknown) =>
    isRecord(item) && typeof item.name === "string" ? [item.name] : [],
  );
}

export function integrationsConfirmedDeployedIn(scenarioDir: string, transcript = ""): string[] {
  const runSpecificNames = ampYamlFiles(scenarioDir)
    .flatMap((path) => {
      const manifest: unknown = parse(readFileSync(path, "utf-8"));
      return integrationNames(manifest);
    })
    .filter((name) => name.includes(runIdPlaceholder));
  const confirmed = runSpecificNames.flatMap((template) => {
    const name = template.split(runIdPlaceholder).map(escapeRegExp).join(runIdPattern);
    const deployConfirmation = new RegExp(`Successfully deployed your integration (${name})`, "g");
    return [...transcript.matchAll(deployConfirmation)].flatMap((match) => match[1] ?? []);
  });
  return [...new Set(confirmed)];
}

export async function expectDeployedThenDelete(names: string[]): Promise<void> {
  if (names.length === 0) throw new Error("the run never deployed the integration");
  const deployed = integrationsIn(await requestEvalProject("GET", "/integrations"));
  const missing = names.filter(
    (name) => !deployed.some((integration) => integration.name === name),
  );
  for (const integration of deployed.filter((each) => names.includes(each.name))) {
    await requestEvalProject("DELETE", `/integrations/${integration.id}`);
  }
  if (missing.length > 0)
    throw new Error(`not deployed to project ${evalProject}: ${missing.join(", ")}`);
}

function ampYamlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : ampYamlFiles(path);
    return entry.name === "amp.yaml" ? [path] : [];
  });
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
