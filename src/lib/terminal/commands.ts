import {
  TERMINAL_COMMAND_PALETTE_COMMANDS,
  TERMINAL_DEPLOY_TARGETS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_LOG_MESSAGES,
  TERMINAL_LOGS_HEADING,
} from "../../constants";
import type {
  CommandExecutionResult,
  PendingCommand,
  PendingCommandDescriptor,
  TerminalTranscriptItemContent,
} from "../../types";

const createTextItem = (text: string): TerminalTranscriptItemContent => ({
  kind: "text",
  text,
});

const createStatusItem = (
  level: "error" | "warning" | "success",
  text: string
): TerminalTranscriptItemContent => ({
  kind: "status",
  level,
  text,
});

const createImmediateResult = (
  items: readonly TerminalTranscriptItemContent[]
): CommandExecutionResult => ({
  mode: "immediate",
  items,
});

const createErrorResult = (text: string): CommandExecutionResult =>
  createImmediateResult([createStatusItem("error", text)]);

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
              kind: "palette",
              commands: TERMINAL_COMMAND_PALETTE_COMMANDS,
            },
          ])
        : createErrorResult("usage: help");
    case "echo": {
      const text = rest.join(" ").trim();
      return text
        ? createImmediateResult([createTextItem(text)])
        : createErrorResult("usage: echo <text>");
    }
    case "status": {
      const [level, ...messageParts] = rest;
      const message = messageParts.join(" ").trim();

      if (
        !level ||
        !message ||
        (level !== "success" && level !== "warning" && level !== "error")
      ) {
        return createErrorResult(
          "usage: status <success|warning|error> <message>"
        );
      }

      return createImmediateResult([createStatusItem(level, message)]);
    }
    case "logs":
      return rest.length === 0
        ? createImmediateResult([
            { kind: "heading", text: TERMINAL_LOGS_HEADING },
            ...TERMINAL_LOG_MESSAGES.map((message) => createTextItem(message)),
          ])
        : createErrorResult("usage: logs");
    case "jobs":
      return rest.length === 0
        ? createImmediateResult([
            { kind: "heading", text: TERMINAL_JOBS_HEADING },
            { kind: "list", items: TERMINAL_JOB_ITEMS },
          ])
        : createErrorResult("usage: jobs");
    case "deploy": {
      const [target, ...extra] = rest;
      if (!target || extra.length > 0 || !isDeployTarget(target)) {
        return createErrorResult("usage: deploy <staging|production>");
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
        : createErrorResult("usage: clear");
    default:
      return createErrorResult(`${name}: command not found`);
  }
};
