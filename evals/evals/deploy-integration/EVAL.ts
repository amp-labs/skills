// Whether the integration really reached the project is checked on the host after the run (lib/arm.ts).
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const { o11y } = JSON.parse(readFileSync('__agent_eval__/results.json', 'utf-8'));
// Each amp invocation the agent ran, in order, split out of chained shell commands.
const amp: string[] = (o11y?.shellCommands ?? [])
  .flatMap((c: { command: string }) => c.command.split(/;|&&|\|\||\||\n/))
  .map((part: string) => part.trim().replace(/^(\S+=\S+\s+)+/, ''))
  .filter((part: string) => /^amp\s/.test(part));
const isHelp = (c: string) => /\s(--help|-h)(\s|$)/.test(c);
const deploys = amp.map((c, i) => [c, i] as const).filter(([c]) => /^amp\s+deploy(\s|$)/.test(c) && !isHelp(c));

test('deploys with the project passed explicitly', () => {
  expect(deploys.length).toBeGreaterThan(0);
  expect(deploys.filter(([c]) => !/\s(-p|--project)[\s=]/.test(c))).toEqual([]);
});

test('verifies the deploy with a read command afterwards', () => {
  const lastDeploy = deploys.at(-1)?.[1] ?? Infinity;
  expect(amp.slice(lastDeploy + 1).some((c) => /^amp\s+list:integrations\b/.test(c))).toBe(true);
});
