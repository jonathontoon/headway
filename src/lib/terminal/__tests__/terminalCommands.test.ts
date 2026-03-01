import {
  TERMINAL_COMMAND_SIGNATURES,
  TERMINAL_HELP_ROWS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_LOG_MESSAGES,
  TERMINAL_LOGS_HEADING,
  TERMINAL_STEPS_HEADING,
  TERMINAL_STEP_ITEMS,
  TERMINAL_UNKNOWN_COMMAND_DETAIL,
} from "../../../constants";
import { describe, expect, it } from "vitest";
import {
  createPendingCommandCompletionItems,
  executeCommand,
} from "../commands";

describe("executeCommand", () => {
  it("rejects whitespace-only input", () => {
    expect(executeCommand("   ")).toEqual({
      mode: "immediate",
      items: [{ kind: "status", level: "error", message: "Enter a command." }],
    });
  });

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

  it("treats command names as case-insensitive and trims whitespace", () => {
    expect(executeCommand("  HELP  ")).toEqual({
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

  it("rejects echo commands without text", () => {
    expect(executeCommand("echo")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "usage:",
          signature: TERMINAL_COMMAND_SIGNATURES.echo,
        },
      ],
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

  it.each([
    ["help extra", TERMINAL_COMMAND_SIGNATURES.help],
    ["logs extra", TERMINAL_COMMAND_SIGNATURES.logs],
    ["jobs extra", TERMINAL_COMMAND_SIGNATURES.jobs],
    ["clear extra", TERMINAL_COMMAND_SIGNATURES.clear],
  ])("rejects unexpected arguments for %s", (command, signature) => {
    expect(executeCommand(command)).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "usage:",
          signature,
        },
      ],
    });
  });

  it("returns a queued jobs list", () => {
    expect(executeCommand("jobs")).toEqual({
      mode: "immediate",
      items: [
        { kind: "heading", text: TERMINAL_JOBS_HEADING },
        { kind: "unordered-list", items: TERMINAL_JOB_ITEMS },
      ],
    });
  });

  it("returns an ordered deployment steps list", () => {
    expect(executeCommand("steps")).toEqual({
      mode: "immediate",
      items: [
        { kind: "heading", text: TERMINAL_STEPS_HEADING },
        { kind: "ordered-list", items: TERMINAL_STEP_ITEMS },
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

  it("returns deferred deploy output for production", () => {
    const pendingCommand = {
      kind: "deploy" as const,
      commandText: "deploy production",
      target: "production",
    };

    expect(executeCommand("deploy production")).toEqual({
      mode: "deferred",
      pendingCommand,
      loadingItem: {
        kind: "loading",
        text: "Deploying to production...",
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

  it("rejects unexpected arguments for steps", () => {
    expect(executeCommand("steps foo")).toEqual({
      mode: "immediate",
      items: [
        {
          kind: "status",
          level: "error",
          message: "usage:",
          signature: TERMINAL_COMMAND_SIGNATURES.steps,
        },
      ],
    });
  });

  it("returns a reset signal for clear", () => {
    expect(executeCommand("clear")).toEqual({ mode: "reset" });
  });
});
