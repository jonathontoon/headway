import {
  TERMINAL_COMMAND_SYNTAXES,
  TERMINAL_HELP_ROWS,
  TERMINAL_DEPLOY_TARGETS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_LOG_MESSAGES,
  TERMINAL_LOGS_HEADING,
  TERMINAL_STEPS_HEADING,
  TERMINAL_STEP_ITEMS,
  TERMINAL_UNKNOWN_COMMAND_DETAIL,
} from "../../constants";
import type {
  CommandExecutionResult,
  PendingCommand,
  PendingCommandDescriptor,
  TerminalCommandSyntax,
  TerminalStatusLevel,
  TerminalTranscriptItemContent,
} from "../../types";

const createTextItem = (text: string): TerminalTranscriptItemContent => ({
  kind: "text",
  text,
});

const createStatusItem = (
  level: TerminalStatusLevel,
  message: string,
  detail?: string,
  syntax?: TerminalCommandSyntax
): TerminalTranscriptItemContent => ({
  kind: "status",
  level,
  message,
  ...(detail ? { detail } : {}),
  ...(syntax ? { syntax } : {}),
});

const createImmediateResult = (
  items: readonly TerminalTranscriptItemContent[]
): CommandExecutionResult => ({
  mode: "immediate",
  items,
});

const createErrorResult = (
  message: string,
  detail?: string
): CommandExecutionResult =>
  createImmediateResult([createStatusItem("error", message, detail)]);

const createUsageErrorResult = (
  syntax: TerminalCommandSyntax
): CommandExecutionResult =>
  createImmediateResult([
    createStatusItem("error", "usage:", undefined, syntax),
  ]);

const isDeployTarget = (
  value: string
): value is (typeof TERMINAL_DEPLOY_TARGETS)[number] =>
  TERMINAL_DEPLOY_TARGETS.includes(
    value as (typeof TERMINAL_DEPLOY_TARGETS)[number]
  );

export const createPendingCommandCompletionItems = (
  pendingCommand: PendingCommand | PendingCommandDescriptor
): readonly TerminalTranscriptItemContent[] => [
  createStatusItem("success", "Deployment completed"),
  createTextItem(`${pendingCommand.target} is live and smoke checks passed.`),
];

export const executeCommand = (raw: string): CommandExecutionResult => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return createErrorResult("Enter a command.");
  }

  const [name, ...rest] = trimmed.split(/\s+/);
  const command = name.toLowerCase();

  switch (command) {
    case "help":
      return rest.length === 0
        ? createImmediateResult([
            {
              kind: "help",
              rows: TERMINAL_HELP_ROWS,
            },
          ])
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.help);
    case "echo": {
      const text = rest.join(" ").trim();
      return text
        ? createImmediateResult([createTextItem(text)])
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.echo);
    }
    case "status": {
      const [level, ...messageParts] = rest;
      const message = messageParts.join(" ").trim();

      if (
        !level ||
        !message ||
        (level !== "success" && level !== "warning" && level !== "error")
      ) {
        return createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.status);
      }

      return createImmediateResult([createStatusItem(level, message)]);
    }
    case "logs":
      return rest.length === 0
        ? createImmediateResult([
            { kind: "heading", text: TERMINAL_LOGS_HEADING },
            ...TERMINAL_LOG_MESSAGES.map((message) => createTextItem(message)),
          ])
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.logs);
    case "jobs":
      return rest.length === 0
        ? createImmediateResult([
            { kind: "heading", text: TERMINAL_JOBS_HEADING },
            { kind: "unordered-list", items: TERMINAL_JOB_ITEMS },
          ])
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.jobs);
    case "steps":
      return rest.length === 0
        ? createImmediateResult([
            { kind: "heading", text: TERMINAL_STEPS_HEADING },
            { kind: "ordered-list", items: TERMINAL_STEP_ITEMS },
          ])
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.steps);
    case "deploy": {
      const [target, ...extra] = rest;
      if (!target || extra.length > 0 || !isDeployTarget(target)) {
        return createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.deploy);
      }

      const pendingCommand: PendingCommandDescriptor = {
        kind: "deploy",
        commandText: trimmed,
        target,
      };

      return {
        mode: "deferred",
        pendingCommand,
        loadingItem: {
          kind: "loading",
          text: `Deploying to ${target}...`,
        },
        completionItems: createPendingCommandCompletionItems(pendingCommand),
      };
    }
    case "clear":
      return rest.length === 0
        ? { mode: "reset" }
        : createUsageErrorResult(TERMINAL_COMMAND_SYNTAXES.clear);
    default:
      return createErrorResult(
        `'${name}' was not recognized.`,
        TERMINAL_UNKNOWN_COMMAND_DETAIL
      );
  }
};
