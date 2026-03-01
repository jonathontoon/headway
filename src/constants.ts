import type {
  TerminalCommandSignature,
  TerminalHelpRow,
} from "./types";

export enum TERMINAL_ACTION_TYPES {
  SET_INPUT = "terminal/setInput",
  CLEAR_INPUT = "terminal/clearInput",
  NAVIGATE_HISTORY = "terminal/navigateHistory",
  SUBMIT_INPUT = "terminal/submitInput",
  RESOLVE_PENDING_COMMAND = "terminal/resolvePendingCommand",
}

export const TERMINAL_DEPLOY_TARGETS = ["staging", "production"] as const;

export const TERMINAL_COMMAND_SIGNATURES = {
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
  deploy: {
    command: "deploy",
    arguments: [{ kind: "choice", options: TERMINAL_DEPLOY_TARGETS }],
  },
  clear: {
    command: "clear",
  },
} as const satisfies Record<string, TerminalCommandSignature>;

export const TERMINAL_HELP_ROWS = [
  {
    signature: TERMINAL_COMMAND_SIGNATURES.help,
    description: "show the command palette",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.echo,
    description: "print plain text",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.status,
    description: "show a status line",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.logs,
    description: "show recent build logs",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.jobs,
    description: "show queued jobs",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.deploy,
    description: "simulate a deployment",
  },
  {
    signature: TERMINAL_COMMAND_SIGNATURES.clear,
    description: "reset the terminal",
  },
] as const satisfies readonly TerminalHelpRow[];

export const TERMINAL_DEPLOY_DELAY_MS = 700;
export const TERMINAL_LOGS_HEADING = "Recent logs";
export const TERMINAL_JOBS_HEADING = "Queued jobs";
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
export const TERMINAL_PENDING_WARNING = "A command is already running.";
export const TERMINAL_PENDING_WARNING_DETAIL =
  "Wait for the current command to finish before starting another.";
export const TERMINAL_UNKNOWN_COMMAND_DETAIL =
  "Type 'help' for a list of available commands.";
export const TERMINAL_INPUT_LABEL = "Terminal command";
export const TERMINAL_OUTPUT_LABEL = "Terminal output";
export const TERMINAL_WELCOME_MESSAGE = "React Redux terminal POC. Type \"help\".";
