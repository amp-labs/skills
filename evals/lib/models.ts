export const modelsByAgent = {
  "claude-code": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  codex: ["gpt-6-luna", "gpt-6.1-terra", "gpt-6.2-sol"],
};

export type Agent = keyof typeof modelsByAgent;

export type Effort = "low" | "medium";

export const projectSkillsDirByAgent: Record<Agent, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};
