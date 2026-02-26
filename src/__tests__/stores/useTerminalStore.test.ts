import { describe, it, expect, beforeEach } from "vitest";
import { useTerminalStore } from "@stores/useTerminalStore";
import { useTodoStore } from "@stores/useTodoStore";
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
  useTodoStore.setState({ todos: [...TEST_TODOS] });
  useTerminalStore.setState({
    history: [makeWelcomeEntry()],
    input: "",
    cmdHistory: [],
    cmdHistoryIndex: -1,
  });
});

describe("initial state", () => {
  it("history has 1 welcome entry", () => {
    expect(useTerminalStore.getState().history).toHaveLength(1);
    expect(useTerminalStore.getState().history[0].command).toBe("");
  });

  it("input is empty string", () => {
    expect(useTerminalStore.getState().input).toBe("");
  });
});

describe("setInput", () => {
  it("updates input to given value", () => {
    useTerminalStore.getState().setInput("foo");
    expect(useTerminalStore.getState().input).toBe("foo");
  });
});

describe("executeCommand", () => {
  it("is a no-op for empty string", () => {
    useTerminalStore.getState().executeCommand("");
    expect(useTerminalStore.getState().history).toHaveLength(1);
  });

  it("is a no-op for whitespace-only input", () => {
    useTerminalStore.getState().executeCommand("   ");
    expect(useTerminalStore.getState().history).toHaveLength(1);
  });

  it("appends entry to history with the command", () => {
    useTerminalStore.getState().executeCommand("list");
    const { history } = useTerminalStore.getState();
    expect(history).toHaveLength(2);
    expect(history[1].command).toBe("list");
  });

  it("resets input to empty string after execution", () => {
    useTerminalStore.getState().setInput("list");
    useTerminalStore.getState().executeCommand("list");
    expect(useTerminalStore.getState().input).toBe("");
  });

  it("prepends executed commands to cmdHistory (newest first)", () => {
    useTerminalStore.getState().executeCommand("list");
    useTerminalStore.getState().executeCommand("help");
    const { cmdHistory } = useTerminalStore.getState();
    expect(cmdHistory[0]).toBe("help");
    expect(cmdHistory[1]).toBe("list");
  });

  it("clear empties history and resets input and cmdHistoryIndex", () => {
    useTerminalStore.getState().executeCommand("list");
    useTerminalStore.getState().executeCommand("clear");
    const { history, input, cmdHistoryIndex } = useTerminalStore.getState();
    expect(history).toHaveLength(0);
    expect(input).toBe("");
    expect(cmdHistoryIndex).toBe(-1);
  });

  it("unknown command appends entry with error response", () => {
    useTerminalStore.getState().executeCommand("foobar");
    const last = useTerminalStore.getState().history.at(-1)!;
    expect(last.command).toBe("foobar");
    expect(last.responses[0].type).toBe(ResponseType.Error);
  });
});

describe("navigateHistory", () => {
  beforeEach(() => {
    // Build cmdHistory: ["help", "list"] (newest first)
    useTerminalStore.getState().executeCommand("list");
    useTerminalStore.getState().executeCommand("help");
  });

  it("up sets input to most recent command", () => {
    useTerminalStore.getState().navigateHistory("up");
    expect(useTerminalStore.getState().input).toBe("help");
  });

  it("up repeated clamps at oldest command", () => {
    useTerminalStore.getState().navigateHistory("up"); // index 0 → "help"
    useTerminalStore.getState().navigateHistory("up"); // index 1 → "list"
    useTerminalStore.getState().navigateHistory("up"); // clamps at 1
    expect(useTerminalStore.getState().input).toBe("list");
    expect(useTerminalStore.getState().cmdHistoryIndex).toBe(1);
  });

  it("down after up returns to more recent command", () => {
    useTerminalStore.getState().navigateHistory("up"); // index 0 → "help"
    useTerminalStore.getState().navigateHistory("up"); // index 1 → "list"
    useTerminalStore.getState().navigateHistory("down"); // index 0 → "help"
    expect(useTerminalStore.getState().input).toBe("help");
  });

  it("down at index -1 stays at -1 with empty input", () => {
    useTerminalStore.getState().navigateHistory("down");
    expect(useTerminalStore.getState().cmdHistoryIndex).toBe(-1);
    expect(useTerminalStore.getState().input).toBe("");
  });
});
