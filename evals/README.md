# Skill evals

These evals show whether the skills in this repository make coding agents better at real Ampersand tasks. Each
scenario runs as an agent with no skills and with each skill under test (an *arm*), on several models, and checks
the result against a real Ampersand project.

The evals use [`@vercel/agent-eval`](https://github.com/vercel-labs/agent-eval). Each run gets a fresh Docker
container.

## Requirements

- Node.js 22 or later
- Docker, running
- A Claude credential: `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or `ANTHROPIC_API_KEY`
- An Ampersand project used only for evals, and an API key for it. Evals create and delete integrations in this
  project.

## Run

```sh
cd evals
npm install
export CLAUDE_CODE_OAUTH_TOKEN=...
export AMP_API_KEY=...            # API key for the eval project
export AMP_EVAL_PROJECT=...       # name or ID of the eval project
npm run eval -- '*'               # every arm
npm run eval -- claude-amp-cli    # one arm
```

Results go to `results/<arm>/<model>/<timestamp>/<scenario>/`. Browse them with `npx agent-eval playground`.

`npm run eval` always passes `--force`. agent-eval reuses earlier results when a run's fingerprint matches, and
that fingerprint does not cover the skills or the `amp` CLI that setup installs.

### Test with a local `amp` build

By default, runs use the public `amp` CLI release pinned in `lib/amp.ts`. To use your own build instead, point
`AMP_CLI_BUILD` at a directory that holds `linux_arm64/amp` and `linux_amd64/amp`:

```sh
AMP_CLI_BUILD=/path/to/build npm run eval -- '*'
```

## How a run works

1. agent-eval starts a container with the scenario's files.
2. Setup installs `amp`, copies the arm's skills into `.claude/skills/`, and replaces `{{run}}` in `amp.yaml`
   names with an ID unique to the run, so parallel runs don't collide in the shared project.
3. The agent gets `PROMPT.md`, with `{{project}}` replaced by `AMP_EVAL_PROJECT`. `amp` reads `AMP_API_KEY`.
4. `EVAL.ts` checks the agent's work, such as the `amp` commands it ran.
5. On the host, `lib/arm.ts` checks the project itself, fails the run if the expected change isn't there, and
   deletes what the run created.

## Layout

| Path | Contents |
| --- | --- |
| `experiments/` | The arms: an agent and the skills it gets |
| `lib/models.ts` | The models each agent's arms run on |
| `evals/<scenario>/` | A scenario: `PROMPT.md`, `EVAL.ts`, `package.json`, and the files the agent starts with |
| `lib/arm.ts` | Shared arm settings and the host-side checks for each scenario |

## Scenarios

| Scenario | What it checks |
| --- | --- |
| `deploy-integration` | The agent deploys an `amp.yaml` with the project passed explicitly, verifies it with `amp list:integrations`, and the integration exists in the project |

## Add a scenario

1. Create `evals/<scenario>/` with `PROMPT.md`, `EVAL.ts`, `package.json`, and the files the agent starts with.
2. Use `{{project}}` in the prompt, and `{{run}}` in any `amp.yaml` integration name the agent deploys.
3. If the scenario changes the project, add a check for it to `afterRun` in `lib/arm.ts`.
