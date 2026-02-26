import { describe, it, expect, beforeEach } from "vitest";
import {
  historyAtom,
  inputAtom,
  cmdHistoryAtom,
  cmdHistoryIndexAtom,
  executeCommand,
  navigateHistory,
} from "@atoms/terminalAtoms";
import { todosAtom } from "@atoms/todoAtoms";
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
  todosAtom.set([...TEST_TODOS]);
  historyAtom.set([makeWelcomeEntry()]);
  inputAtom.set("");
  cmdHistoryAtom.set([]);
  cmdHistoryIndexAtom.set(-1);
});

describe("initial state", () => {
  it("history has 1 welcome entry", () => {
    expect(historyAtom.get()).toHaveLength(1);
    expect(historyAtom.get()[0].command).toBe("");
  });

  it("input is empty string", () => {
    expect(inputAtom.get()).toBe("");
  });
});

describe("inputAtom", () => {
  it("updates input to given value", () => {
    inputAtom.set("foo");
    expect(inputAtom.get()).toBe("foo");
  });
});

describe("executeCommand", () => {
  it("is a no-op for empty string", () => {
    executeCommand("");
    expect(historyAtom.get()).toHaveLength(1);
  });

  it("is a no-op for whitespace-only input", () => {
    executeCommand("   ");
    expect(historyAtom.get()).toHaveLength(1);
  });

  it("appends entry to history with the command", () => {
    executeCommand("list");
    const history = historyAtom.get();
    expect(history).toHaveLength(2);
    expect(history[1].command).toBe("list");
  });

  it("resets input to empty string after execution", () => {
    inputAtom.set("list");
    executeCommand("list");
    expect(inputAtom.get()).toBe("");
  });

  it("prepends executed commands to cmdHistory (newest first)", () => {
    executeCommand("list");
    executeCommand("help");
    const cmdHistory = cmdHistoryAtom.get();
    expect(cmdHistory[0]).toBe("help");
    expect(cmdHistory[1]).toBe("list");
  });

  it("clear empties history and resets input and cmdHistoryIndex", () => {
    executeCommand("list");
    executeCommand("clear");
    expect(historyAtom.get()).toHaveLength(0);
    expect(inputAtom.get()).toBe("");
    expect(cmdHistoryIndexAtom.get()).toBe(-1);
  });

  it("unknown command appends entry with error response", () => {
    executeCommand("foobar");
    const history = historyAtom.get();
    const last = history.at(-1)!;
    expect(last.command).toBe("foobar");
    expect(last.responses[0].type).toBe(ResponseType.Error);
  });
});

describe("navigateHistory", () => {
  beforeEach(() => {
    // Build cmdHistory: ["help", "list"] (newest first)
    executeCommand("list");
    executeCommand("help");
  });

  it("up sets input to most recent command", () => {
    navigateHistory("up");
    expect(inputAtom.get()).toBe("help");
  });

  it("up repeated clamps at oldest command", () => {
    navigateHistory("up"); // index 0 → "help"
    navigateHistory("up"); // index 1 → "list"
    navigateHistory("up"); // clamps at 1
    expect(inputAtom.get()).toBe("list");
    expect(cmdHistoryIndexAtom.get()).toBe(1);
  });

  it("down after up returns to more recent command", () => {
    navigateHistory("up"); // index 0 → "help"
    navigateHistory("up"); // index 1 → "list"
    navigateHistory("down"); // index 0 → "help"
    expect(inputAtom.get()).toBe("help");
  });

  it("down at index -1 stays at -1 with empty input", () => {
    navigateHistory("down");
    expect(cmdHistoryIndexAtom.get()).toBe(-1);
    expect(inputAtom.get()).toBe("");
  });
});
