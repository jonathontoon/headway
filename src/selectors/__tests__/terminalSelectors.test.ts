import { describe, expect, it } from "vitest";
import { selectTerminalInput } from "../selectTerminalInput";
import { selectTerminalItems } from "../selectTerminalItems";
import { selectTerminalPendingCommand } from "../selectTerminalPendingCommand";
import type { RootState } from "../../types";

const state: RootState = {
  terminal: {
    input: "deploy staging",
    items: [
      { id: 0, kind: "text", text: 'React Redux terminal POC. Type "help".' },
      { id: 1, kind: "command", text: "deploy staging" },
    ],
    history: ["deploy staging"],
    historyIndex: 0,
    nextItemId: 2,
    pendingCommand: {
      kind: "deploy",
      commandText: "deploy staging",
      target: "staging",
      loadingItemId: 2,
    },
  },
};

describe("terminal selectors", () => {
  it("selects the terminal input", () => {
    expect(selectTerminalInput(state)).toBe("deploy staging");
  });

  it("selects the terminal transcript items", () => {
    expect(selectTerminalItems(state)).toBe(state.terminal.items);
  });

  it("selects the pending command", () => {
    expect(selectTerminalPendingCommand(state)).toBe(
      state.terminal.pendingCommand
    );
  });
});
