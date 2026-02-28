export enum TERMINAL_ACTION_TYPES {
  SET_INPUT = "terminal/setInput",
  CLEAR_INPUT = "terminal/clearInput",
  NAVIGATE_HISTORY = "terminal/navigateHistory",
  SUBMIT_INPUT = "terminal/submitInput",
  RESOLVE_PENDING_COMMAND = "terminal/resolvePendingCommand",
}

export const TERMINAL_COMMAND_PALETTE_TITLE = "Command palette";

export const TERMINAL_COMMAND_PALETTE_COMMANDS = [
  { name: "help", description: "show the command palette" },
  { name: "echo <text>", description: "print plain text" },
  {
    name: "status <success|warning|error> <message>",
    description: "show a status line",
  },
  { name: "logs", description: "show recent build logs" },
  { name: "jobs", description: "show queued jobs" },
  {
    name: "deploy <staging|production>",
    description: "simulate a deployment",
  },
  { name: "clear", description: "reset the terminal" },
] as const;

export const TERMINAL_DEPLOY_DELAY_MS = 700;
export const TERMINAL_DEPLOY_TARGETS = ["staging", "production"] as const;
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
export const TERMINAL_PENDING_WARNING = "A deployment is already running.";
export const TERMINAL_INPUT_LABEL = "Terminal command";
export const TERMINAL_OUTPUT_LABEL = "Terminal output";
export const TERMINAL_WELCOME_MESSAGE = 'React Redux terminal POC. Type "help".';
