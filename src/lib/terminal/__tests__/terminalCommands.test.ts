import {
  TERMINAL_COMMAND_SIGNATURES,
  TERMINAL_HELP_ROWS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_LOG_MESSAGES,
  TERMINAL_LOGS_HEADING,
  TERMINAL_UNKNOWN_COMMAND_DETAIL,
} from "../../../constants";
import { describe, expect, it } from "vitest";
import {
  createPendingCommandCompletionItems,
  executeCommand,
} from "../commands";

describe("executeCommand", () => {
  it("returns an inline command palette for help", () => {
    expect(executeCommand("help")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "help",
          rows: TERMINAL_HELP_ROWS,
        },
      ],
    });
  });

  it("echoes plain text", () => {
    expect(executeCommand("echo hello world")).toEqual({
      mode: "immediate",
      items: [{ kind: "text", text: "hello world" }],
    });
  });

  it("renders a success status message", () => {
    expect(executeCommand("status success Ready")).toEqual({
      mode: "immediate",
      items: [{ kind: "status", level: "success", message: "Ready" }],
    });
  });

  it("rejects invalid status levels", () => {
    expect(executeCommand("status foo Ready")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "usage:",
          signature: TERMINAL_COMMAND_SIGNATURES.status,
        },
      ],
    });
  });

  it("adds a help hint for unknown commands", () => {
    expect(executeCommand("unknown-command")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "'unknown-command' was not recognized.",
          detail: TERMINAL_UNKNOWN_COMMAND_DETAIL,
        },
      ],
    });
  });

  it("returns simulated log output", () => {
    expect(executeCommand("logs")).toEqual({
      mode: "immediate",
      items: [
        { kind: "heading", text: TERMINAL_LOGS_HEADING },
        ...TERMINAL_LOG_MESSAGES.map((message) => ({
          kind: "text" as const,
          text: message,
        })),
      ],
    });
  });

  it("returns a queued jobs list", () => {
    expect(executeCommand("jobs")).toEqual({
      mode: "immediate",
      items: [
        { kind: "heading", text: TERMINAL_JOBS_HEADING },
        { kind: "list", items: TERMINAL_JOB_ITEMS },
      ],
    });
  });

  it("returns deferred deploy output for supported targets", () => {
    const pendingCommand = {
      kind: "deploy" as const,
      commandText: "deploy staging",
      target: "staging",
    };

    expect(executeCommand("deploy staging")).toEqual({
      mode: "deferred",
      pendingCommand,
      loadingItem: {
        kind: "loading",
        text: "Deploying to staging...",
      },
      completionItems: createPendingCommandCompletionItems(pendingCommand),
    });
  });

  it("creates deploy completion items with a single-line success status", () => {
    expect(
      createPendingCommandCompletionItems({
        kind: "deploy",
        commandText: "deploy staging",
        target: "staging",
      })
    ).toEqual([
      {
        kind: "status",
        level: "success",
        message: "Deployment completed",
      },
      {
        kind: "text",
        text: "staging is live and smoke checks passed.",
      },
    ]);
  });

  it("rejects unsupported deploy targets", () => {
    expect(executeCommand("deploy qa")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "usage:",
          signature: TERMINAL_COMMAND_SIGNATURES.deploy,
        },
      ],
    });
  });

  it("returns a reset signal for clear", () => {
    expect(executeCommand("clear")).toEqual({ mode: "reset" });
  });
});
