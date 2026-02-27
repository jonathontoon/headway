import { describe, it, expect, beforeEach } from "vitest";
import {
  $history,
  $input,
  $cmdHistory,
  $cmdHistoryIndex,
  executeCommand,
  navigateHistory,
} from "@stores/terminal";
import { $todos } from "@stores/todos";
import { ResponseType, type HistoryEntry } from "@types";

const TEST_TODOS = [
  "Do the thing",
  "Do another thing",
  "x 2026-01-01 Done already",
];

const makeWelcomeEntry = (): HistoryEntry => ({
  id: "welcome",
  command: "",
  responses: [
    {
      type: ResponseType.Text,
      text: "Welcome to Headway. Type 'help' for available commands.",
    },
    ...TEST_TODOS.map((text, i) => ({
      type: ResponseType.Todo as const,
      index: i + 1,
      text,
    })),
  ],
});

beforeEach(() => {
  $todos.set([...TEST_TODOS]);
  $history.set([makeWelcomeEntry()]);
  $input.set("");
  $cmdHistory.set([]);
  $cmdHistoryIndex.set(-1);
});

describe("initial state", () => {
  it("history has 1 welcome entry", () => {
    expect($history.get()).toHaveLength(1);
    expect($history.get()[0].command).toBe("");
  });

  it("input is empty string", () => {
    expect($input.get()).toBe("");
  });
});

describe("$input", () => {
  it("updates input to given value", () => {
    $input.set("foo");
    expect($input.get()).toBe("foo");
  });
});

describe("executeCommand", () => {
  it("is a no-op for empty string", () => {
    executeCommand("");
    expect($history.get()).toHaveLength(1);
  });

  it("is a no-op for whitespace-only input", () => {
    executeCommand("   ");
    expect($history.get()).toHaveLength(1);
  });

  it("appends entry to history with the command", () => {
    executeCommand("list");
    const history = $history.get();
    expect(history).toHaveLength(2);
    expect(history[1].command).toBe("list");
  });

  it("resets input to empty string after execution", () => {
    $input.set("list");
    executeCommand("list");
    expect($input.get()).toBe("");
  });

  it("prepends executed commands to $cmdHistory (newest first)", () => {
    executeCommand("list");
    executeCommand("help");
    const cmdHistory = $cmdHistory.get();
    expect(cmdHistory[0]).toBe("help");
    expect(cmdHistory[1]).toBe("list");
  });

  it("clear empties history and resets input and $cmdHistoryIndex", () => {
    executeCommand("list");
    executeCommand("clear");
    expect($history.get()).toHaveLength(0);
    expect($input.get()).toBe("");
    expect($cmdHistoryIndex.get()).toBe(-1);
  });

  it("unknown command appends entry with error response", () => {
    executeCommand("foobar");
    const history = $history.get();
    const last = history.at(-1)!;
    expect(last.command).toBe("foobar");
    expect(last.responses[0].type).toBe(ResponseType.Error);
  });
});

describe("navigateHistory", () => {
  beforeEach(() => {
    // Build $cmdHistory: ["help", "list"] (newest first)
    executeCommand("list");
    executeCommand("help");
  });

  it("up sets input to most recent command", () => {
    navigateHistory("up");
    expect($input.get()).toBe("help");
  });

  it("up repeated clamps at oldest command", () => {
    navigateHistory("up"); // index 0 → "help"
    navigateHistory("up"); // index 1 → "list"
    navigateHistory("up"); // clamps at 1
    expect($input.get()).toBe("list");
    expect($cmdHistoryIndex.get()).toBe(1);
  });

  it("down after up returns to more recent command", () => {
    navigateHistory("up"); // index 0 → "help"
    navigateHistory("up"); // index 1 → "list"
    navigateHistory("down"); // index 0 → "help"
    expect($input.get()).toBe("help");
  });

  it("down at index -1 stays at -1 with empty input", () => {
    navigateHistory("down");
    expect($cmdHistoryIndex.get()).toBe(-1);
    expect($input.get()).toBe("");
  });
});
