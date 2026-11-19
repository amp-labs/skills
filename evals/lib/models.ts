export const modelsByAgent = {
  "claude-code": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  codex: ["gpt-6-luna", "gpt-6.1-terra", "gpt-6.2-sol"],
};

export type Agent = keyof typeof modelsByAgent;

const efforts = ["low", "medium", "high"] as const;

type Effort = (typeof efforts)[number];

const isEffort = (value: string): value is Effort => efforts.some((effort) => effort === value);

export function effortFromEnvironment(): Effort {
  const requested = process.env.EVAL_EFFORT || "medium";
  if (!isEffort(requested))
    throw new Error(`EVAL_EFFORT must be one of ${efforts.join(", ")}, not "${requested}"`);
  return requested;
}

export const projectSkillsDirByAgent: Record<Agent, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};
