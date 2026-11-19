import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function shellCommandsRun(results: unknown): string[] {
  if (!isRecord(results) || !isRecord(results.o11y)) return [];
  const { shellCommands } = results.o11y;
  if (!Array.isArray(shellCommands)) return [];
  return shellCommands.flatMap((entry: unknown) =>
    isRecord(entry) && typeof entry.command === "string" ? [entry.command] : [],
  );
}

function simpleCommandsUnquotedAndUnwrapped(script: string): string[][] {
  const commands: string[][] = [];
  let words: string[] = [];
  let word = "";
  let quote = "";
  const endWord = () => {
    if (word) words.push(word);
    word = "";
  };
  const endCommand = () => {
    endWord();
    while (/^\w+=/.test(words[0] ?? "")) words.shift();
    if (/(^|\/)(ba)?sh$/.test(words[0] ?? "") && /^-\w*c$/.test(words[1] ?? "")) {
      commands.push(...simpleCommandsUnquotedAndUnwrapped(words[2] ?? ""));
    } else if (words.length > 0) {
      commands.push(words);
    }
    words = [];
  };
  for (let i = 0; i < script.length; i++) {
    const char = script[i];
    if (char === "\\" && quote !== "'") {
      word += script[++i] ?? "";
    } else if (quote) {
      if (char === quote) quote = "";
      else word += char;
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === "\n" || ";&|()`".includes(char)) {
      endCommand();
    } else if (/\s/.test(char)) {
      endWord();
    } else {
      word += char;
    }
  }
  endCommand();
  return commands;
}

const results: unknown = JSON.parse(readFileSync("__agent_eval__/results.json", "utf-8"));
const ampArgumentsInOrder: string[][] = shellCommandsRun(results)
  .flatMap(simpleCommandsUnquotedAndUnwrapped)
  .filter((words) => /(^|\/)amp$/.test(words[0] ?? ""))
  .map((words) => words.slice(1));
const deploys = ampArgumentsInOrder
  .map((args, i) => [args, i] as const)
  .filter(([args]) => args[0] === "deploy" && !args.includes("--help") && !args.includes("-h"));

test("deploys with the project passed explicitly", () => {
  expect(deploys.length).toBeGreaterThan(0);
  const explicit = (args: readonly string[]) => args.some((a) => /^(-p|--project)(=|$)/.test(a));
  expect(deploys.filter(([args]) => !explicit(args))).toEqual([]);
});

test("verifies the deploy with a read command afterwards", () => {
  const lastDeploy = deploys.at(-1)?.[1] ?? Infinity;
  expect(
    ampArgumentsInOrder.slice(lastDeploy + 1).some((args) => args[0] === "list:integrations"),
  ).toBe(true);
});
