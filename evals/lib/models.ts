// The models each agent's arms run on. Every arm runs on each model of its agent.
export const models = {
  'claude-code': ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
};

export type Agent = keyof typeof models;

// Where each agent looks for project skills.
export const skillsDir: Record<Agent, string> = {
  'claude-code': '.claude/skills',
};
