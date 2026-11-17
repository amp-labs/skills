---
name: amp-new-integration
description: Set up a new Ampersand integration end to end, from connecting a provider to data arriving, whether it's the user's first integration or another provider for an app that already uses Ampersand. Use when the user wants to start with Ampersand or connect a provider such as HubSpot, Salesforce, GitHub or NetSuite to their app. Not for adding objects or fields to an integration that already works, or for fixing one that broke.
---

# Set up a new Ampersand integration

## What this skill does

It takes the user from "I want to connect HubSpot" to a test account connected and data arriving. It
works for a first integration and for adding another provider: it first checks what's already set up
and skips those steps. Plan for about 20 minutes the first time, most of it creating accounts.

## Ampersand in one minute

Ampersand lets the user's product read and write data in their end users' SaaS tools. Explain these
terms the first time each comes up:

| Term | What it is | Where it lives |
| --- | --- | --- |
| Org and project | The user's Ampersand account and workspace. Use one project for dev and a separate one for prod. | Ampersand dashboard |
| Provider | The SaaS tool being connected, such as HubSpot | |
| Provider app | The OAuth app end users sign in through. Only OAuth providers need one. | Provider's portal, then the dashboard |
| Integration | What to read, write or subscribe to, written in `amp.yaml` and deployed with the CLI | The user's repo |
| Destination | Where Ampersand delivers data it reads, such as a webhook URL. Only reads and subscribes need one. | Ampersand dashboard |
| Installation | Created when an end user connects their account and finishes setup | Ampersand |
| UI Library key | The API key for the install UI in the browser | Ampersand dashboard |
| Server or CLI key | The API key for the user's backend and for automated deploys. Create a new one for each use. | Ampersand dashboard |

The user is the builder, the developer setting up Ampersand. The end user is the builder's customer,
who connects their own account. While testing, the user plays the end user with a test account.

## Rules

- Confirm the Ampersand project before any change, and pass it to every command with `-p <project>`.
- Run `amp <command> --help` before using a command, and use only commands that `amp --help` lists.
- Never ask for a secret in chat or put one in a command. The user types secrets into the dashboard
  or the CLI's masked prompt.
- After each change, check it with a read command and tell the user what you checked.
- Names must match exactly. The `name` in `amp.yaml` must equal `integration` in the app, and every
  `destination` in `amp.yaml` must equal a destination in the dashboard.

## How to run this skill

- **Check that you can run commands.** Run `amp version`. If you can't run commands here, as in a
  chat app or a locked-down sandbox, switch to guided mode: give the user each command to run
  themselves, ask them to paste the output, and continue from it. Never ask them to paste secrets or
  tokens.
- **Show what you found first.** At the end of Step 1, show a table with the columns Component and
  Status (Done, Missing or Not needed), then list the steps that are left.
- **Track the steps.** If your agent has a to-do list, turn "Steps at a glance" into it and tick off
  each step as you finish it.
- **Use the question tool whenever your agent has one.** Use it for choices, such as Step 2, and to
  confirm a manual step, with options like "Done", "I need help" and "Skip for now". Without one,
  ask in one message and end your turn.
- **Keep working while the user does their part.** Give the user every manual task at once, carry on
  with the steps that don't depend on them, and pause only before a step that does. In this skill,
  that's one pause, at Step 9.
- **If no one can answer,** as in an unattended run, stop before the first step that needs the user
  and list what they need to do.

## Steps at a glance

- [ ] Step 1: See what's already set up
- [ ] Step 2: Ask what's missing
- [ ] Step 3: Check the tools and log in (new users only)
- [ ] Step 4: Choose how the provider authenticates
- [ ] Step 5: Hand the user their setup tasks
- [ ] Step 6: Write the integration in `amp.yaml`
- [ ] Step 7: Deploy
- [ ] Step 8: Connect the app
- [ ] Step 9: Confirm the user's tasks are done
- [ ] Step 10: Connect a test account
- [ ] Step 11: Check that it works

### Step 1: See what's already set up

Check these before asking anything:

| Check | What it tells you |
| --- | --- |
| `amp version` and `amp list:projects` | Whether the CLI is installed and the user is logged in |
| `amp list:integrations -p <project>` | Integrations already deployed, and names already taken |
| `amp list:destinations -p <project>` | Destinations the user can reuse |
| `amp.yaml` files in the repo | Integrations already written |
| `@amp-labs/react` in `package.json`, or `AmpersandProvider` in the code | Whether the install UI is already in the app |

A user with none of these is new to Ampersand. A user with the install UI and a deployed integration
is adding a provider, and skips Step 3, the UI Library key in Step 5, and most of Step 8. Ask only
when the checks disagree, such as a logged-in user whose repo uses a different project.

### Step 2: Ask what's missing

Ask these in one message, skipping any the user or Step 1 already answered:

1. Which provider? If they don't know, suggest HubSpot, Salesforce or GitHub, which have ready-made
   `amp.yaml` files.
2. What should the integration do: bring the provider's data into the app, write to the provider
   from the app's backend, or both? This decides whether a destination is needed. If data comes in,
   also ask where it should go: a test webhook for now, their own backend, or a warehouse or queue
   such as Snowflake, S3 or SQS.
3. New users only: the starter project, a sample React app that stands in for their product, or
   their own React app? Recommend the starter project for a first try.
4. New users only: do they have an Ampersand account? If not, send them to
   [sign up](https://dashboard.withampersand.com/sign-up), which creates their org and first
   project. You can't do this for them.
5. Do they have a test account at the provider? Never use a real end user's account.

### Step 3: Check the tools and log in (new users only)

```bash
node --version   # needs 18 or later
git --version
amp version
```

If `amp` is missing, install it. On macOS:

```bash
brew tap amp-labs/cli && brew install amp-labs/cli/cli
```

For other systems, follow the [CLI install docs](https://docs.withampersand.com/cli/overview). Then
log in and pick the project:

```bash
amp login            # opens a browser for the user to sign in
amp list:projects
```

### Step 4: Choose how the provider authenticates

Read the provider's guide through the Ampersand docs MCP server (`https://docs.ampersand.ai/mcp`, no
account needed) if the user has it, or at
`https://docs.withampersand.com/provider-guides/<provider>`. Use the auth method it recommends, such
as M2M for NetSuite, and note the scopes.

| Auth type | What the user does now | What the end user does at install |
| --- | --- | --- |
| OAuth, with the user's own provider app | Step 5 | Signs in to the provider and approves |
| API key, basic or M2M | Nothing; no provider app task in Step 5 | Pastes their key, login or credentials |

### Step 5: Hand the user their setup tasks

Give the user every task below that applies, in one message, then carry on with Steps 6 to 8 while
they work. Tell them you'll check in when they're done.

**Provider app.** Only for OAuth providers, and only if **Provider apps** in the
[dashboard](https://dashboard.withampersand.com) doesn't already have one for this provider.

1. Create an app in the provider's portal, following the provider guide, with the callback URL
   `https://api.withampersand.com/callbacks/v1/oauth` and the scopes from the guide.
2. Open **Provider apps** in the dashboard, pick the provider, and enter the client ID and secret
   yourself.

**Destination.** Only for reads and subscribes, and only if they aren't reusing one from
`amp list:destinations`. Name it exactly as you will in Step 6, such as `defaultWebhook`.
Destinations don't need an API key.

- **A test webhook:** open [play.svix.com](https://play.svix.com) and copy the URL it shows; the
  page keeps working after the tab is closed. Then create a webhook destination with that URL under
  **Destinations** in the dashboard.
- **Their own backend:** create a webhook destination with the public URL of the handler you'll
  write in Step 8, and put its signing secret in an environment variable. While developing locally,
  the handler needs a public URL, such as a tunnel they already use.
- **A warehouse or queue:** create that destination type under **Destinations**, following its page
  in the [destinations docs](https://docs.withampersand.com/destinations/overview). The user enters
  its credentials in the dashboard.

**UI Library key.** New users only.

1. Under **API keys** in the dashboard, create a key and choose **UI Library**.
2. Once Step 8 is done, paste it into `apiKey` in the file the agent names. It's fine for testing;
   production switches to JWT.

### Step 6: Write the integration in amp.yaml

Start from one of these:

- the starter project's `integrations/<provider>/amp.yaml`
- a sample from the [samples repo](https://github.com/amp-labs/samples)
- the [YAML generator](https://ampersand.ai/yaml-generator), if the user wants to pick their own
  objects

Put it in its own folder, `integrations/<provider>/amp.yaml`. Give it a `name` that isn't already
used in the project; Step 1 lists the names in use. Reads and subscribes need a `destination`, set
to the name from Step 5; writes and proxy calls don't. If the user wants more than the sample,
choose with them, using the provider guide: which objects and fields, read on a schedule or
subscribe to changes (or both), and how much history to backfill.

```yaml
specVersion: 1.0.0
integrations:
  - name: hubspotCRM          # Step 8 needs this exact name
    provider: hubspot
    read:
      objects:
        - objectName: contacts
          destination: defaultWebhook   # must match the dashboard (Step 5)
          schedule: "*/10 * * * *"
```

### Step 7: Deploy

```bash
amp deploy integrations/<provider> -p <project>
amp list:integrations -p <project>   # the new name should be listed
```

`amp login` covers deploys from the user's machine. Automated deploys, such as from CI, need their
own Server or CLI key.

### Step 8: Connect the app

For a returning user, find the existing `InstallIntegration` in their code and add another one, or a
way to choose, for the new integration. They already have a UI Library key.

For a new user with the starter project:

```bash
git clone https://github.com/amp-labs/starter-project.git
cd starter-project
npm install
```

For a new user with their own React app:

```bash
npm install @amp-labs/react
```

```tsx
import { AmpersandProvider, InstallIntegration } from '@amp-labs/react';
import '@amp-labs/react/styles';

const options = {
  project: 'PROJECT_NAME_OR_ID',
  apiKey: 'UI_LIBRARY_API_KEY', // the user pastes their key here
};

export function Integrations() {
  return (
    <AmpersandProvider options={options}>
      <InstallIntegration
        integration="INTEGRATION_NAME" // must equal `name` in amp.yaml
        consumerRef="test-user-id"
        consumerName="Test user"
        groupRef="test-company-id"
        groupName="Test company"
      />
    </AmpersandProvider>
  );
}
```

Set `integration` to the `name` from Step 6 and `project` to the project name or ID. In the starter
project, both are in `src/App.tsx`. Leave the `apiKey` placeholder for the user, and tell them which
file and line it's on.

If the user wants installations created from their backend instead of an install UI, that's beyond
this skill. Point them to Ampersand's API docs.

If the data goes to the user's own backend, also write the webhook handler there, following
`references/webhook-handler.md`. It must:

- verify the message's Svix signature against the raw request body
- read records from the message, or from its download URL when they're too large to send inline
- store them per customer, using `groupRef`, and upsert by record ID, since messages can repeat

### Step 9: Confirm the user's tasks are done

Ask with the question tool if you have one: "Have you finished the setup tasks?" with the options
"Done", "I need help" and "Skip for now". If they need help, walk them through the task they're
stuck on.

When they say done, check each task:

- Destination: `amp list:destinations -p <project>` lists it, with the exact name from Step 6.
- Provider app: the user confirms it saved.
- UI Library key: the `apiKey` value is no longer the placeholder. Check this without printing the
  key.

If something is missing, tell the user which task and ask again.

### Step 10: Connect a test account

Start the app (`npm run dev` in the starter project, at `http://localhost:5173`). Ask the user to
click Connect and go through setup the way an end user would:

- OAuth: sign in to the test account and approve.
- API key, basic or M2M: paste the test account's key, login or credentials.

The installation is only created when they finish the last screen, **Review**.

### Step 11: Check that it works

```bash
amp list:integrations -p <project>                       # copy the integration ID
amp list:installations <integration-id> -p <project>     # the new installation should be listed
```

For reads and subscribes, check the destination: ask the user about their play.svix.com page, check
that the handler stored records, or ask them to look in their warehouse or queue. The starter
integrations read existing records first, so they should arrive soon after setup. The dashboard's
installation page shows its operations and logs.

## If something fails

Many setup errors only show in the browser. Ask the user to open DevTools, go to the **Network**
tab, repeat the action, click the failed request, and paste its error message without any tokens.
For problems after setup, check the installation's operations and logs in the dashboard.

| What the user sees | Likely cause | Fix |
| --- | --- | --- |
| Connect fails; the Network tab says "No provider app found" | The project has no provider app for this provider | Step 5 |
| Install fails; the Network tab mentions destinations | A `destination` in `amp.yaml` doesn't match the dashboard | Fix the name, then Step 7 |
| The install UI shows no integration or no objects | `integration` in the app doesn't match `name`, or the file wasn't deployed | Step 8, then Step 7 |
| `amp deploy` says the project doesn't exist | The project name didn't match | Use the project ID from the dashboard's General Settings |
| `amp deploy` rejects the name | Another integration in the project uses it | Choose a new `name`, then update Step 8 |
| Connected, but no data arrives | Setup wasn't finished, or the destination URL is wrong | Finish **Review**, then check the destination |
| `amp: command not found` | The CLI isn't installed | Step 3 |

## Done when

`amp list:installations` lists the new installation, and for reads and subscribes, records have
reached the destination the user chose.

Finish with a short report: what was already set up, which steps you skipped, what you created
(project, provider app, integration name, destination), what you checked yourself, and what only the
user confirmed. Then suggest next steps that fit, such as writing to the provider from their app or
preparing for production.
