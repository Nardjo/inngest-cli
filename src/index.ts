#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { eventsResource } from "./resources/events.js";
import { runsResource } from "./resources/runs.js";
import { cancellationsResource } from "./resources/cancellations.js";

const program = new Command();

program
  .name("inngest-cli")
  .description("CLI for the Inngest REST API — inspect events, runs, and cancel executions")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Resources
program.addCommand(eventsResource);
program.addCommand(runsResource);
program.addCommand(cancellationsResource);

program.parse();
