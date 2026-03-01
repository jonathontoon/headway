import type { TerminalCommandSyntax, TerminalHelpRow } from "./types";

export enum TERMINAL_ACTION_TYPES {
  SET_INPUT = "terminal/setInput",
  CLEAR_INPUT = "terminal/clearInput",
  NAVIGATE_HISTORY = "terminal/navigateHistory",
  SUBMIT_INPUT = "terminal/submitInput",
  RESOLVE_PENDING_COMMAND = "terminal/resolvePendingCommand",
}

export const TERMINAL_DEPLOY_TARGETS = ["staging", "production"] as const;

export const TERMINAL_COMMAND_SYNTAXES = {
  help: {
    command: "help",
  },
  echo: {
    command: "echo",
    arguments: [{ kind: "value", name: "text" }],
  },
  status: {
    command: "status",
    arguments: [
      { kind: "choice", options: ["success", "warning", "error"] },
      { kind: "value", name: "message" },
    ],
  },
  logs: {
    command: "logs",
  },
  jobs: {
    command: "jobs",
  },
  steps: {
    command: "steps",
  },
  deploy: {
    command: "deploy",
    arguments: [{ kind: "choice", options: TERMINAL_DEPLOY_TARGETS }],
  },
  clear: {
    command: "clear",
  },
} as const satisfies Record<string, TerminalCommandSyntax>;

export const TERMINAL_HELP_ROWS = [
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.help,
    description: "show the command palette",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.echo,
    description: "print plain text",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.status,
    description: "show a status line",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.logs,
    description: "show recent build logs",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.jobs,
    description: "show queued jobs",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.steps,
    description: "show deployment steps",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.deploy,
    description: "simulate a deployment",
  },
  {
    syntax: TERMINAL_COMMAND_SYNTAXES.clear,
    description: "reset the terminal",
  },
] as const satisfies readonly TerminalHelpRow[];

export const TERMINAL_DEPLOY_DELAY_MS = 700;
export const TERMINAL_LOGS_HEADING = "Recent logs";
export const TERMINAL_JOBS_HEADING = "Queued jobs";
export const TERMINAL_STEPS_HEADING = "Deployment steps";
export const TERMINAL_LOG_MESSAGES = [
  "vite build completed in 842ms",
  "smoke tests passed on preview-143",
  "release artifact uploaded to edge cache",
] as const;
export const TERMINAL_JOB_ITEMS = [
  "lint: waiting for runner",
  "typecheck: queued behind preview deploy",
  "e2e: retrying flaky checkout suite",
] as const;
export const TERMINAL_STEP_ITEMS = [
  "Run typecheck and lint",
  "Build the preview bundle",
  "Promote the release to production",
] as const;
export const TERMINAL_PENDING_WARNING = "A command is already running.";
export const TERMINAL_PENDING_WARNING_DETAIL =
  "Wait for the current command to finish before starting another.";
export const TERMINAL_UNKNOWN_COMMAND_DETAIL =
  "Type 'help' for a list of available commands.";
export const TERMINAL_INPUT_LABEL = "Terminal command";
export const TERMINAL_OUTPUT_LABEL = "Terminal output";
export const TERMINAL_WELCOME_MESSAGE =
  'React Redux terminal POC. Type "help".';
