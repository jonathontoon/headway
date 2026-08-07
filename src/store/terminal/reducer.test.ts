import { terminalActions } from "./actions";
import { createInitialTerminalState, terminalReducer } from "./reducer";
import { terminalOutput } from "./output";

describe("terminal reducer pending state", () => {
  const initial = createInitialTerminalState([]);

  it("starts idle", () => {
    expect(initial.pending).toBe(false);
  });

  it("submit sets pending per the action's flag", () => {
    const pending = terminalReducer(
      initial,
      terminalActions.submit("connect owner/repo", undefined, [], [], true),
    );
    expect(pending.pending).toBe(true);

    const idle = terminalReducer(
      pending,
      terminalActions.submit(
        "list",
        terminalOutput.text("output"),
        [],
        [],
        false,
      ),
    );
    expect(idle.pending).toBe(false);
  });

  it("endPending clears pending without touching entries", () => {
    const pending = terminalReducer(
      initial,
      terminalActions.submit("connect owner/repo", undefined, [], [], true),
    );
    const ended = terminalReducer(pending, terminalActions.endPending());

    expect(ended.pending).toBe(false);
    expect(ended.entries).toEqual(pending.entries);
  });

  it("cancelPending clears pending and appends the cancellation message", () => {
    const pending = terminalReducer(
      initial,
      terminalActions.submit("connect owner/repo", undefined, [], [], true),
    );
    const cancelled = terminalReducer(
      pending,
      terminalActions.cancelPending(
        terminalOutput.text("Connection cancelled."),
      ),
    );

    expect(cancelled.pending).toBe(false);
    expect(cancelled.entries.at(-1)).toEqual({
      id: pending.entries.length,
      output: terminalOutput.text("Connection cancelled."),
    });
  });
});
