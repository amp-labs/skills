---
name: amp-cli
description: Run the installed public Ampersand amp CLI to onboard, test, inspect, or maintain integrations. Use only to operate integrations through existing amp commands for projects, destinations, manifests, provider apps, connections, installations, operations, local webhooks, or tunnels. Do not use for work on the amp CLI product itself, including its code, commands, tests, bugs, or documentation. Do not use for provider websites, credentials, raw APIs, or embedded UI.
---

# Amp CLI

Let the installed `amp` CLI define what is available. Choose the shortest command sequence that
meets the user's goal.

## Start

1. Check `amp version` and `amp --help`.
2. Use only commands shown by `amp --help`. Read `<command> --help` before running it.
3. Run `amp list:projects` to confirm access. Use `amp login` if authentication is required.
4. Ask the user to choose the exact project when more than one matches.
5. If `amp` or a required command is unavailable, say what is missing and stop. Do not switch to
   another interface.

## Choose the command

| Goal | Command |
|---|---|
| Create a project | `create:project` |
| Register an existing provider app | `create:provider-app` |
| Create or reconcile a destination | `deploy:destination` |
| Deploy `amp.yaml` | `deploy` |
| Start OAuth authorization | `connect:provider` |
| Create an installation from explicit config | `create:installation` |
| Inspect or change installation config | `get:installation`, then `update:installation` |
| Inspect recent activity | `list:operations` |
| Receive webhook deliveries locally | `listen` |
| Route a destination to the local listener | `tunnel` |
| Inspect or remove existing resources | the matching public `list:*` or `delete:*` command |

## Work safely

- Pass the confirmed project explicitly when the command supports `--project`.
- Require the user to identify or confirm the exact resource. Do not choose a likely match from
  names or prior activity.
- Inspect existing state before creating, updating, or deleting a resource.
- Before a remote change, state the project and resource. Ask for confirmation unless the user
  already requested that exact change.
- Prefer JSON output when the command supports it.
- Check both the exit status and output. After a change, verify it with a public read command when
  one exists.
- Never put secrets in arguments, logs, or chat. Use only the CLI's masked prompt or documented
  standard-input option.

## Keep claims exact

- A successful `deploy` means Ampersand accepted the manifest. It does not prove that data flows.
- Deploying an integration does not update an existing installation. Inspect it before applying an
  explicit patch.
- `list:operations` shows operation activity. Subscribe delivery is observed by the destination.
- If the CLI cannot execute or verify an action, say so.

## Check local delivery

1. Start `listen` to receive local requests.
2. Start `tunnel` to create a public route and temporarily update the destination.
3. Keep payload values hidden unless the user explicitly asks to show them.
4. Stop the tunnel normally and verify that it restored the destination.

## Report

Report the CLI version, project, commands run, remote changes, verification, and any step the
installed CLI could not perform. Distinguish what was proved from what remains unverified.
