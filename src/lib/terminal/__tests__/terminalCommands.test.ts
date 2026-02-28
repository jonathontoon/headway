import {
  TERMINAL_COMMAND_PALETTE_COMMANDS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_LOG_MESSAGES,
  TERMINAL_LOGS_HEADING,
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
          kind: "palette",
          commands: TERMINAL_COMMAND_PALETTE_COMMANDS,
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
      items: [{ kind: "status", level: "success", text: "Ready" }],
    });
  });

  it("rejects invalid status levels", () => {
    expect(executeCommand("status foo Ready")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          text: "usage: status <success|warning|error> <message>",
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

  it("rejects unsupported deploy targets", () => {
    expect(executeCommand("deploy qa")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          text: "usage: deploy <staging|production>",
        },
      ],
    });
  });

  it("returns a reset signal for clear", () => {
    expect(executeCommand("clear")).toEqual({ mode: "reset" });
  });
});
