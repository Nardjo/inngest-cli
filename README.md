# inngest-cli

A CLI wrapper for the [Inngest](https://www.inngest.com) REST API — inspect events, function runs, and create bulk cancellations from the terminal. Ships with an AgentSkill for Claude Code / OpenClaw / Cursor. Made with [api2cli.dev](https://api2cli.dev).

## Install

```bash
npx api2cli install Nardjo/inngest-cli
```

Clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill.

### Install the AgentSkill only

```bash
npx skills add Nardjo/inngest-cli
```

## Auth

Two different keys — the Inngest management API and the event ingestion endpoint are authenticated separately.

```bash
# 1. Signing key for the management API (events list/get, runs, cancellations)
inngest-cli auth set "signkey-prod-..."
inngest-cli auth test

# 2. Event key for sending events (used by `events send`)
export INNGEST_EVENT_KEY="your-event-key"
# Optional override:
# export INNGEST_EVENT_API="https://inn.gs"
```

## Usage

```bash
inngest-cli --help                      # List resources + global flags
inngest-cli events list --name app/user.signup --json
inngest-cli events runs 01HXYZ... --json
inngest-cli runs get 01HRUN... --json
inngest-cli runs cancel 01HRUN...
inngest-cli events send app/user.signup --data '{"userId":"123"}' --json
inngest-cli cancellations create --app-id my-app --function-id my-fn \
  --if "event.data.tenant == 'acme'"
```

## Resources

| Resource | Commands |
|---|---|
| `events` | `list`, `get <id>`, `runs <id>`, `send <name>` |
| `runs` | `get <id>`, `jobs <id>`, `cancel <id>` |
| `cancellations` | `create`, `list`, `delete <id>` |
| `auth` | `set <token>`, `show`, `remove`, `test` |

Run `inngest-cli <resource> --help` for flag details.

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`.

`--json` returns a standardized envelope: `{ "ok": true, "data": ..., "meta": {...} }`.

## API coverage

Currently covers the REST surface documented at [api-docs.inngest.com](https://api-docs.inngest.com):

- `/v1/events`, `/v1/events/:id`, `/v1/events/:id/runs`
- `/v1/runs/:id`, `/v1/runs/:id/jobs`, `POST /v1/runs/:id/cancel`
- `/v1/cancellations` (create/list/delete)
- Event ingestion via `https://inn.gs/e/<EVENT_KEY>`

GraphQL-only features (apps, functions metadata, env management) are not covered.

## License

MIT
