# Contributing to Ampersand Agent Skills

Thanks for helping improve Ampersand Agent Skills.

## Guidelines

- Test skill changes with a real task and describe the result in your pull request.
- Add guidance only when a test shows that an agent needs it.
- Use the installed `amp` help instead of remembered syntax.
- Depend only on public commands shown by the installed CLI.
- Keep claims exact. Deployment, installation health, operations, and delivery prove different
  things.
- Keep the skill on the CLI boundary. Do not add API, provider, browser, or credential workflows.

## Checks

Install [`pipx`](https://pipx.pypa.io/stable/installation/), then run:

```sh
pipx run \
  --spec "git+https://github.com/agentskills/agentskills.git@69ef37e9424c0a7ea9dd2293b559e43ec8176379#subdirectory=skills-ref" \
  skills-ref validate ./skills/amp-cli
```

This uses the reference implementation of the Agent Skills specification. Its source commit is
pinned so validator updates are deliberate.

## Commits and pull requests

Open an issue before starting a large change. Keep pull requests focused, use conventional commits,
and explain why the change is needed.
