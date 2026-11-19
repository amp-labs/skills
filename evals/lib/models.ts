// The models each agent's arms run on. Every arm runs on each model of its agent.
// Codex models keep the reasoning effort Codex defaults to for them; agent-eval would otherwise force medium.
export const models = {
  "claude-code": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  codex: [
    "gpt-6-luna?reasoningEffort=medium",
    "gpt-6.1-terra?reasoningEffort=low",
    "gpt-6.2-sol?reasoningEffort=medium",
  ],
};

export type Agent = keyof typeof models;

// Where each agent looks for project skills.
export const skillsDir: Record<Agent, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};
