const atCodexDefaultEffort = (model: string, effort: "low" | "medium") =>
  `${model}?reasoningEffort=${effort}`;

export const modelsByAgent = {
  "claude-code": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  codex: [
    atCodexDefaultEffort("gpt-6-luna", "medium"),
    atCodexDefaultEffort("gpt-6.1-terra", "low"),
    atCodexDefaultEffort("gpt-6.2-sol", "medium"),
  ],
};

export type Agent = keyof typeof modelsByAgent;

export const projectSkillsDirByAgent: Record<Agent, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};
