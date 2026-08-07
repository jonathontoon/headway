import {
  TERMINAL_ACTION_TYPE,
  createInitialTerminalState,
  terminalReducer,
} from "./reducer";
import { terminalOutput } from "./output";

describe("terminal reducer pending state", () => {
  const initial = createInitialTerminalState([]);

  it("starts idle", () => {
    expect(initial.pending).toBe(false);
  });

  it("submit sets pending per the action's flag", () => {
    const pending = terminalReducer(initial, {
      type: TERMINAL_ACTION_TYPE.SUBMIT,
      command: "connect owner/repo",
      output: undefined,
      todos: [],
      view: [],
      pending: true,
    });
    expect(pending.pending).toBe(true);

    const idle = terminalReducer(pending, {
      type: TERMINAL_ACTION_TYPE.SUBMIT,
      command: "list",
      output: terminalOutput.text("output"),
      todos: [],
      view: [],
      pending: false,
    });
    expect(idle.pending).toBe(false);
  });

  it("endPending clears pending without touching entries", () => {
    const pending = terminalReducer(initial, {
      type: TERMINAL_ACTION_TYPE.SUBMIT,
      command: "connect owner/repo",
      output: undefined,
      todos: [],
      view: [],
      pending: true,
    });
    const ended = terminalReducer(pending, {
      type: TERMINAL_ACTION_TYPE.END_PENDING,
    });

    expect(ended.pending).toBe(false);
    expect(ended.entries).toEqual(pending.entries);
  });

  it("cancelPending clears pending and appends the cancellation message", () => {
    const pending = terminalReducer(initial, {
      type: TERMINAL_ACTION_TYPE.SUBMIT,
      command: "connect owner/repo",
      output: undefined,
      todos: [],
      view: [],
      pending: true,
    });
    const cancelled = terminalReducer(pending, {
      type: TERMINAL_ACTION_TYPE.CANCEL_PENDING,
      output: terminalOutput.text("Connection cancelled."),
    });

    expect(cancelled.pending).toBe(false);
    expect(cancelled.entries.at(-1)).toEqual({
      id: pending.entries.length,
      output: terminalOutput.text("Connection cancelled."),
    });
  });
});
