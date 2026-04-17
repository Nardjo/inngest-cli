/**
 * Events resource — read events received by Inngest and send new events.
 *
 * Management endpoints (list/get/runs) use the REST API at api.inngest.com
 * with the Bearer signing key. The `send` command uses the separate event
 * ingestion endpoint at inn.gs/e/<EVENT_KEY>.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ListOpts {
  name?: string;
  received_after?: string;
  received_before?: string;
  limit?: string;
  cursor?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface GetOpts {
  fields?: string;
  json?: boolean;
  format?: string;
}

interface RunsOpts {
  limit?: string;
  cursor?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface SendOpts {
  data?: string;
  user?: string;
  id?: string;
  ts?: string;
  eventKey?: string;
  baseUrl?: string;
  json?: boolean;
}

export const eventsResource = new Command("events").description(
  "Inspect events received by Inngest and send new events",
);

// ── LIST ──────────────────────────────────────────────
eventsResource
  .command("list")
  .description("List events received by Inngest")
  .option("--name <name>", "Filter by event name (e.g. app/user.signup)")
  .option("--received-after <iso>", "ISO timestamp — events received after this time")
  .option("--received-before <iso>", "ISO timestamp — events received before this time")
  .option("--limit <n>", "Max results", "40")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  inngest-cli events list --name app/user.signup\n  inngest-cli events list --received-after 2026-04-01T00:00:00Z --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.name) params.name = opts.name;
      if (opts.received_after) params.received_after = opts.received_after;
      if (opts.received_before) params.received_before = opts.received_before;
      if (opts.limit) params.limit = opts.limit;
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/v1/events", params);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
eventsResource
  .command("get")
  .description("Get a specific event by ID")
  .argument("<id>", "Event ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  inngest-cli events get 01H...")
  .action(async (id: string, opts: GetOpts) => {
    try {
      const data = await client.get(`/v1/events/${id}`);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── RUNS FOR EVENT ────────────────────────────────────
eventsResource
  .command("runs")
  .description("List function runs triggered by a specific event")
  .argument("<id>", "Event ID")
  .option("--limit <n>", "Max results", "40")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  inngest-cli events runs 01H... --json")
  .action(async (id: string, opts: RunsOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.limit) params.limit = opts.limit;
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get(`/v1/events/${id}/runs`, params);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SEND ──────────────────────────────────────────────
eventsResource
  .command("send")
  .description("Send an event to Inngest (uses INNGEST_EVENT_KEY)")
  .argument("<name>", 'Event name, e.g. "app/user.signup"')
  .option("--data <json>", "Event data payload as JSON string", "{}")
  .option("--user <json>", "Event user payload as JSON string")
  .option("--id <id>", "Idempotency ID for the event")
  .option("--ts <ms>", "Timestamp in ms since epoch")
  .option(
    "--event-key <key>",
    "Event key (defaults to INNGEST_EVENT_KEY env var)",
  )
  .option(
    "--base-url <url>",
    "Ingestion base URL (defaults to INNGEST_EVENT_API or https://inn.gs)",
  )
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    '\nExamples:\n  inngest-cli events send app/user.signup --data \'{"userId":"123"}\'\n  INNGEST_EVENT_KEY=xxx inngest-cli events send app/foo --data \'{"a":1}\' --json',
  )
  .action(async (name: string, opts: SendOpts) => {
    try {
      const eventKey = opts.eventKey ?? process.env.INNGEST_EVENT_KEY;
      if (!eventKey) {
        throw new Error(
          "Event key required. Pass --event-key or set INNGEST_EVENT_KEY.",
        );
      }

      const baseUrl =
        opts.baseUrl ?? process.env.INNGEST_EVENT_API ?? "https://inn.gs";

      let dataPayload: unknown = {};
      let userPayload: unknown;
      try {
        dataPayload = opts.data ? JSON.parse(opts.data) : {};
      } catch {
        throw new Error("--data must be valid JSON");
      }
      if (opts.user) {
        try {
          userPayload = JSON.parse(opts.user);
        } catch {
          throw new Error("--user must be valid JSON");
        }
      }

      const payload: Record<string, unknown> = { name, data: dataPayload };
      if (userPayload !== undefined) payload.user = userPayload;
      if (opts.id) payload.id = opts.id;
      if (opts.ts) payload.ts = Number(opts.ts);

      const res = await fetch(`${baseUrl}/e/${eventKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          `${res.status}: ${(body as { error?: string })?.error ?? res.statusText}`,
        );
      }
      output(body ?? { ok: true }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
