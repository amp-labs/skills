# Skill evals

These evals measure whether a skill makes coding agents better at real Ampersand tasks. Each scenario runs three times
per model and per _arm_ (an agent with a set of skills, or none, at low or medium reasoning effort), and each
result is checked against a real Ampersand project. Runs use [`@vercel/agent-eval`](https://github.com/vercel-labs/agent-eval), with a fresh Docker
container for each run.

## Requirements

- Node.js 22.22.1 or later, or 24.11 or later
- Docker, running
- For the Claude arms, `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or `ANTHROPIC_API_KEY`
- For the Codex arms, `OPENAI_API_KEY`
- An Ampersand project used only for evals, and an API key for it. Runs create and delete integrations there.

## Run

```sh
cd evals
npm install
export CLAUDE_CODE_OAUTH_TOKEN=...
export AMP_API_KEY=...            # API key for the eval project
export AMP_EVAL_PROJECT=...       # name or ID of the eval project
npm run eval -- '*'                   # every arm
npm run eval -- claude-amp-cli-low    # one arm
```

agent-eval runs the arms you name at the same time, so on a small machine run them one by one.

Results go to `results/<arm>/<model>/<timestamp>/<scenario>/`. To browse them, run `npx agent-eval playground`.

`npm run eval` passes `--force`, so every run is fresh. agent-eval's result cache doesn't notice changes to the
skills or to the `amp` CLI.

Runs use the public `amp` release pinned in `lib/amp.ts`. To test a local build, set `AMP_CLI_BUILD` to a
directory that holds `linux_arm64/amp` and `linux_amd64/amp`.

## How a run works

1. agent-eval starts a container with the scenario's files.
2. Setup installs `amp` and copies the arm's skills where its agent looks for them: `.claude/skills/` for Claude
   Code, `.agents/skills/` for Codex. It also replaces `{{run}}` in
   `amp.yaml` integration names with an ID unique to the run, so parallel runs don't collide in the project.
3. The agent gets `PROMPT.md`, with `{{project}}` replaced by `AMP_EVAL_PROJECT`. `amp` reads `AMP_API_KEY`.
4. `EVAL.ts` checks the agent's work, such as the `amp` commands it ran.
5. On the host, `lib/arm.ts` checks the project, fails the run if the expected change is missing, and deletes what
   the run created.

## Scenarios

| Scenario             | Passes when                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy-integration` | The agent deploys an `amp.yaml` with the project passed explicitly, then checks it with `amp list:integrations`, and the integration exists in the project |

## Add a scenario

1. Create `evals/<scenario>/` with `PROMPT.md`, `EVAL.ts`, `package.json`, and the files the agent starts with.
2. Use `{{project}}` in the prompt and `{{run}}` in the name of any integration the agent deploys.
3. If the scenario changes the project, add a check for it to `projectChecksByScenario` in `lib/arm.ts`.
4. Add the scenario to the table above.

Arms are in `experiments/`, and the models they run on are in `lib/models.ts`.

## Run in CI

Maintainers can run the evals on GitHub with the keys in the `evals` environment. Results appear as a pass-rate
table; transcripts stay out of CI because the repository is public.

- Run the `evals` workflow from the Actions tab, with the arms to run or `all`.
- Add the `run-evals` label to a pull request from this repository. It runs every arm on the branch and on `main`,
  and comments both tables. Remove and add the label again to rerun.

## Checks

`npm run check` formats, lints, and type-checks this folder. Lint rules forbid comments (`lint-plugin.ts`), `any`,
type assertions, non-null assertions, unsafe use of `any` values, unhandled or misused promises, non-exhaustive
`switch` statements, and `console`. The script also fails on `oxlint-disable` or `eslint-disable` comments, and when a
skill in `skills/` has no arm in `experiments/`. `npm install` adds a pre-commit hook that runs it, and CI runs it on
every pull request.
