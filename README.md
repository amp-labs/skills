<br />
<div align="center">
  <a href="https://www.withampersand.com/">
    <img src="https://res.cloudinary.com/dycvts6vp/image/upload/v1723671980/ampersand-logo-black.svg" height="30" alt="Ampersand logo">
  </a>
  <br />
  <a href="https://github.com/amp-labs/skills/releases">
    <img src="https://img.shields.io/github/v/release/amp-labs/skills?filter=amp-cli-v%2A&amp;label=amp-cli" alt="Latest amp-cli release">
  </a>
  <a href="https://github.com/amp-labs/skills/actions/workflows/check.yml">
    <img src="https://github.com/amp-labs/skills/actions/workflows/check.yml/badge.svg" alt="Validation status">
  </a>
</div>

# Ampersand Agent Skills

Official [Agent Skills](https://agentskills.io/specification) for using Ampersand.

## Skills

- [`amp-cli`](skills/amp-cli): Use the official [`amp` CLI](https://github.com/amp-labs/cli) to
  onboard, test, and maintain Ampersand integrations.

## Install

Install with [`npx skills`](https://github.com/vercel-labs/skills):

```sh
npx skills add amp-labs/skills --skill amp-cli
```

Or copy the skill manually. For Codex:

```sh
cp -r skills/amp-cli ~/.agents/skills/
```

Then ask:

```text
Use $amp-cli to help me onboard this Ampersand integration.
```

## Develop

Install [`pipx`](https://pipx.pypa.io/stable/installation/), then run:

```sh
pipx run \
  --spec "git+https://github.com/agentskills/agentskills.git@69ef37e9424c0a7ea9dd2293b559e43ec8176379#subdirectory=skills-ref" \
  skills-ref validate ./skills/amp-cli
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change.

## License

[MIT](LICENSE)
