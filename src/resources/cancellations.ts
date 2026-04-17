/**
 * Bulk cancellations — cancel many function runs at once by filter.
 * See https://api-docs.inngest.com for the cancellation payload shape.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface CreateOpts {
  appId?: string;
  functionId?: string;
  startedAfter?: string;
  startedBefore?: string;
  ifExpr?: string;
  json?: boolean;
}

interface ListOpts {
  limit?: string;
  cursor?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface DeleteOpts {
  json?: boolean;
}

export const cancellationsResource = new Command("cancellations").description(
  "Create, list, and delete bulk cancellation requests",
);

// ── CREATE ────────────────────────────────────────────
cancellationsResource
  .command("create")
  .description("Create a bulk cancellation for runs matching filters")
  .requiredOption("--app-id <id>", "App ID the function belongs to")
  .requiredOption("--function-id <id>", "Function ID to cancel runs for")
  .option("--started-after <iso>", "ISO timestamp — target runs started after")
  .option("--started-before <iso>", "ISO timestamp — target runs started before")
  .option("--if <expr>", "CEL expression (e.g. event.data.userId == '123')")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    '\nExample:\n  inngest-cli cancellations create --app-id my-app --function-id my-fn --if "event.data.tenant == \'acme\'"',
  )
  .action(async (opts: CreateOpts) => {
    try {
      const body: Record<string, unknown> = {
        app_id: opts.appId,
        function_id: opts.functionId,
      };
      if (opts.startedAfter) body.started_after = opts.startedAfter;
      if (opts.startedBefore) body.started_before = opts.startedBefore;
      if (opts.ifExpr) body.if = opts.ifExpr;
      const data = await client.post("/v1/cancellations", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── LIST ──────────────────────────────────────────────
cancellationsResource
  .command("list")
  .description("List existing bulk cancellations")
  .option("--limit <n>", "Max results", "40")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (opts: ListOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.limit) params.limit = opts.limit;
      if (opts.cursor) params.cursor = opts.cursor;
      const data = await client.get("/v1/cancellations", params);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
cancellationsResource
  .command("delete")
  .description("Delete a cancellation by ID")
  .argument("<id>", "Cancellation ID")
  .option("--json", "Output as JSON")
  .action(async (id: string, opts: DeleteOpts) => {
    try {
      await client.delete(`/v1/cancellations/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
