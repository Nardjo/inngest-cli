---
name: inngest-cli
description: "Manage Inngest via CLI - events, runs, cancellations. Use when user mentions 'inngest', 'send event', 'function runs', 'cancel run', 'bulk cancel', 'event history', or wants to interact with the Inngest REST API."
category: devtools
---

# inngest-cli

## When To Use This Skill

Use the `inngest-cli` skill when you need to:

- Inspect events received by an Inngest environment
- List or fetch function runs for a given event
- Check the status or output of a specific run
- Inspect a run's individual step executions (jobs)
- Cancel a single running function run
- Create, list, or delete bulk cancellations (by app + function, with optional filters)
- Send an event to Inngest from the terminal or a script

## Capabilities

- Read event history via the Inngest REST API (`/v1/events`, `/v1/events/:id`, `/v1/events/:id/runs`)
- Read run data (`/v1/runs/:id`, `/v1/runs/:id/jobs`)
- Cancel runs individually (`POST /v1/runs/:id/cancel`) or in bulk (`/v1/cancellations`)
- Send events via the ingestion endpoint (`inn.gs/e/<EVENT_KEY>`) using an event key (not the signing key)
- Uniform JSON envelope with `--json` for agent/script consumption

## Common Use Cases

- "Show me the last 20 events named `transcrio/transcribe.requested`"
- "What's the status of run `01H...`?"
- "Cancel run `01H...`"
- "Cancel all running `transcribe-media` runs in app `transcrio` started today"
- "Re-trigger a job by sending the event `transcrio/transcribe.requested` with this payload"
- "List the steps/jobs that ran inside run `01H...`"

## Setup

If `inngest-cli` is not found, install and build it:
```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle inngest
npx api2cli link inngest
```

`api2cli link` adds `~/.local/bin` to PATH automatically. The CLI is available in the next command.

Always use `--json` flag when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result.
- The management API (events list/get, runs, cancellations) uses the **signing key** via `auth set`.
- Event ingestion (`events send`) uses a **separate event key** — set `INNGEST_EVENT_KEY` or pass `--event-key`.
- Before a bulk cancel, run `cancellations list` or `events runs <id>` to confirm the scope.
- Prefer read commands first when you need to inspect current state before mutating data.

## Authentication

```bash
inngest-cli auth set "signkey-prod-..."   # Inngest signing key
inngest-cli auth test
```

Auth commands: `auth set <token>`, `auth show`, `auth remove`, `auth test`

Token stored in `~/.config/tokens/inngest-cli.txt` (chmod 600).

For event ingestion (`events send`), also export:

```bash
export INNGEST_EVENT_KEY="your-event-key"
# optionally override the ingestion host (defaults to https://inn.gs)
export INNGEST_EVENT_API="https://inn.gs"
```

## Resources

### `events` — event history + ingestion

| Command | Description | Key flags |
|---|---|---|
| `events list` | List events received by Inngest | `--name`, `--received-after <iso>`, `--received-before <iso>`, `--limit`, `--cursor`, `--json` |
| `events get <id>` | Get a specific event by ID | `--fields`, `--json` |
| `events runs <id>` | List function runs triggered by event | `--limit`, `--cursor`, `--json` |
| `events send <name>` | Send an event to Inngest | `--data <json>`, `--user <json>`, `--id`, `--ts`, `--event-key`, `--base-url` |

Examples:
```bash
inngest-cli events list --name transcrio/transcribe.requested --json
inngest-cli events runs 01HXYZ... --json
inngest-cli events send app/user.signup --data '{"userId":"123"}' --json
```

### `runs` — single-run inspection + cancel

| Command | Description | Key flags |
|---|---|---|
| `runs get <id>` | Get a run's status and output | `--fields`, `--json` |
| `runs jobs <id>` | List step executions inside a run | `--fields`, `--json` |
| `runs cancel <id>` | Cancel a running function run | `--json` |

Examples:
```bash
inngest-cli runs get 01HRUN... --json
inngest-cli runs jobs 01HRUN... --json
inngest-cli runs cancel 01HRUN...
```

### `cancellations` — bulk cancellations

| Command | Description | Key flags |
|---|---|---|
| `cancellations create` | Create bulk cancellation | `--app-id` (req), `--function-id` (req), `--started-after`, `--started-before`, `--if <CEL>` |
| `cancellations list` | List bulk cancellations | `--limit`, `--cursor`, `--json` |
| `cancellations delete <id>` | Delete a cancellation | `--json` |

Examples:
```bash
inngest-cli cancellations create \
  --app-id transcrio \
  --function-id transcribe-media \
  --started-after 2026-04-17T00:00:00Z \
  --if "event.data.userId == '123'"
inngest-cli cancellations list --json
```

## Output Format

`--json` returns a standardized envelope:
```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "message": "...", "status": 401 } }`

## Quick Reference

```bash
inngest-cli --help                      # List all resources and global flags
inngest-cli events --help               # Events actions
inngest-cli runs --help                 # Runs actions
inngest-cli cancellations --help        # Cancellations actions
inngest-cli <resource> <action> --help  # Flags for a specific action
```

## Global Flags

- `--json` — JSON envelope output (use this for scripting)
- `--format <text|json|csv|yaml>` — output format
- `--verbose` — debug logging (shows HTTP calls)
- `--no-color` — disable ANSI colors
- `--no-header` — omit table/CSV headers for piping
