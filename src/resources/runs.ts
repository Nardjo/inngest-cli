/**
 * Runs resource — inspect and manage function runs.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface GetOpts {
  fields?: string;
  json?: boolean;
  format?: string;
}

interface JobsOpts {
  fields?: string;
  json?: boolean;
  format?: string;
}

interface CancelOpts {
  json?: boolean;
}

export const runsResource = new Command("runs").description(
  "Inspect and cancel function runs",
);

// ── GET ───────────────────────────────────────────────
runsResource
  .command("get")
  .description("Get a run's status and output")
  .argument("<id>", "Run ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  inngest-cli runs get 01H...")
  .action(async (id: string, opts: GetOpts) => {
    try {
      const data = await client.get(`/v1/runs/${id}`);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── JOBS (steps) ──────────────────────────────────────
runsResource
  .command("jobs")
  .description("List step executions (jobs) inside a run")
  .argument("<id>", "Run ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  inngest-cli runs jobs 01H... --json")
  .action(async (id: string, opts: JobsOpts) => {
    try {
      const data = await client.get(`/v1/runs/${id}/jobs`);
      const fields = opts.fields?.split(",");
      output(data, { json: opts.json, format: opts.format, fields });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CANCEL ────────────────────────────────────────────
runsResource
  .command("cancel")
  .description("Cancel a running function run")
  .argument("<id>", "Run ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  inngest-cli runs cancel 01H...")
  .action(async (id: string, opts: CancelOpts) => {
    try {
      const data = await client.post(`/v1/runs/${id}/cancel`);
      output(data ?? { cancelled: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
