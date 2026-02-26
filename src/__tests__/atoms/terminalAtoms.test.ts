import { describe, it, expect, beforeEach } from "vitest";
import { getDefaultStore } from "jotai";
import {
  historyAtom,
  inputAtom,
  cmdHistoryAtom,
  cmdHistoryIndexAtom,
  executeCommandAtom,
  navigateHistoryAtom,
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

const store = getDefaultStore();

beforeEach(() => {
  store.set(todosAtom, [...TEST_TODOS]);
  store.set(historyAtom, [makeWelcomeEntry()]);
  store.set(inputAtom, "");
  store.set(cmdHistoryAtom, []);
  store.set(cmdHistoryIndexAtom, -1);
});

describe("initial state", () => {
  it("history has 1 welcome entry", () => {
    expect(store.get(historyAtom)).toHaveLength(1);
    expect(store.get(historyAtom)[0].command).toBe("");
  });

  it("input is empty string", () => {
    expect(store.get(inputAtom)).toBe("");
  });
});

describe("inputAtom", () => {
  it("updates input to given value", () => {
    store.set(inputAtom, "foo");
    expect(store.get(inputAtom)).toBe("foo");
  });
});

describe("executeCommandAtom", () => {
  it("is a no-op for empty string", () => {
    store.set(executeCommandAtom, "");
    expect(store.get(historyAtom)).toHaveLength(1);
  });

  it("is a no-op for whitespace-only input", () => {
    store.set(executeCommandAtom, "   ");
    expect(store.get(historyAtom)).toHaveLength(1);
  });

  it("appends entry to history with the command", () => {
    store.set(executeCommandAtom, "list");
    const history = store.get(historyAtom);
    expect(history).toHaveLength(2);
    expect(history[1].command).toBe("list");
  });

  it("resets input to empty string after execution", () => {
    store.set(inputAtom, "list");
    store.set(executeCommandAtom, "list");
    expect(store.get(inputAtom)).toBe("");
  });

  it("prepends executed commands to cmdHistory (newest first)", () => {
    store.set(executeCommandAtom, "list");
    store.set(executeCommandAtom, "help");
    const cmdHistory = store.get(cmdHistoryAtom);
    expect(cmdHistory[0]).toBe("help");
    expect(cmdHistory[1]).toBe("list");
  });

  it("clear empties history and resets input and cmdHistoryIndex", () => {
    store.set(executeCommandAtom, "list");
    store.set(executeCommandAtom, "clear");
    expect(store.get(historyAtom)).toHaveLength(0);
    expect(store.get(inputAtom)).toBe("");
    expect(store.get(cmdHistoryIndexAtom)).toBe(-1);
  });

  it("unknown command appends entry with error response", () => {
    store.set(executeCommandAtom, "foobar");
    const history = store.get(historyAtom);
    const last = history.at(-1)!;
    expect(last.command).toBe("foobar");
    expect(last.responses[0].type).toBe(ResponseType.Error);
  });
});

describe("navigateHistoryAtom", () => {
  beforeEach(() => {
    // Build cmdHistory: ["help", "list"] (newest first)
    store.set(executeCommandAtom, "list");
    store.set(executeCommandAtom, "help");
  });

  it("up sets input to most recent command", () => {
    store.set(navigateHistoryAtom, "up");
    expect(store.get(inputAtom)).toBe("help");
  });

  it("up repeated clamps at oldest command", () => {
    store.set(navigateHistoryAtom, "up"); // index 0 → "help"
    store.set(navigateHistoryAtom, "up"); // index 1 → "list"
    store.set(navigateHistoryAtom, "up"); // clamps at 1
    expect(store.get(inputAtom)).toBe("list");
    expect(store.get(cmdHistoryIndexAtom)).toBe(1);
  });

  it("down after up returns to more recent command", () => {
    store.set(navigateHistoryAtom, "up"); // index 0 → "help"
    store.set(navigateHistoryAtom, "up"); // index 1 → "list"
    store.set(navigateHistoryAtom, "down"); // index 0 → "help"
    expect(store.get(inputAtom)).toBe("help");
  });

  it("down at index -1 stays at -1 with empty input", () => {
    store.set(navigateHistoryAtom, "down");
    expect(store.get(cmdHistoryIndexAtom)).toBe(-1);
    expect(store.get(inputAtom)).toBe("");
  });
});
