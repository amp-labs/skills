import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { integrationsConfirmedDeployedIn } from "../lib/project.ts";

const scenarioDir = fileURLToPath(new URL("../evals/deploy-integration/", import.meta.url));

const transcripts: Record<string, string> = {
  "own-deploy": "Successfully deployed your integration hubspotContacts1a2b3c4d.",
  "other-run-in-a-listing":
    "Integration ID: 11111111-2222-3333-4444-555555555555, Integration Name: hubspotContacts9f8e7d6c (no installations)",
  "own-deploy-and-other-run-in-a-listing": [
    "Successfully deployed your integration hubspotContacts1a2b3c4d.",
    "Integration ID: 11111111-2222-3333-4444-555555555555, Integration Name: hubspotContacts1a2b3c4d (no installations)",
    "Integration ID: 66666666-7777-8888-9999-000000000000, Integration Name: hubspotContacts9f8e7d6c (no installations)",
  ].join("\n"),
  "deployed-twice": [
    "Successfully deployed your integration hubspotContacts1a2b3c4d.",
    "Successfully deployed your integration hubspotContacts1a2b3c4d.",
  ].join("\n"),
  "unreplaced-placeholder": "Successfully deployed your integration hubspotContacts{{run}}.",
  "id-of-another-format": "Successfully deployed your integration hubspotContactsw7wnc7.",
  "no-transcript": "",
};

test.each(Object.keys(transcripts))("%s", async (name) => {
  const transcript = transcripts[name] ?? "";
  const credited = integrationsConfirmedDeployedIn(scenarioDir, transcript);
  const recording = [
    "transcript:",
    transcript || "(empty)",
    "",
    `credited to the run: ${credited.join(", ") || "none"}`,
    "",
  ].join("\n");
  await expect(recording).toMatchFileSnapshot(`recordings/deploy-attribution/${name}.txt`);
});
