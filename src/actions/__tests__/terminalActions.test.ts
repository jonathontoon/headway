import { describe, expect, it } from "vitest";
import {
  clearInput,
  navigateHistory,
  resolvePendingCommand,
  setInput,
  submitInput,
} from "../terminalActions";
import { TERMINAL_ACTION_TYPES } from "../../constants";

describe("terminalActions", () => {
  it("creates a setInput action", () => {
    expect(setInput("help")).toEqual({
      type: TERMINAL_ACTION_TYPES.SET_INPUT,
      payload: "help",
    });
  });

  it("creates a clearInput action", () => {
    expect(clearInput()).toEqual({
      type: TERMINAL_ACTION_TYPES.CLEAR_INPUT,
    });
  });

  it("creates a navigateHistory action", () => {
    expect(navigateHistory("up")).toEqual({
      type: TERMINAL_ACTION_TYPES.NAVIGATE_HISTORY,
      payload: "up",
    });
  });

  it("creates a submitInput action", () => {
    expect(submitInput()).toEqual({
      type: TERMINAL_ACTION_TYPES.SUBMIT_INPUT,
    });
  });

  it("creates a resolvePendingCommand action", () => {
    const items = [
      {
        kind: "status" as const,
        level: "success" as const,
        message: "Deployment completed",
      },
    ] as const;

    expect(resolvePendingCommand(items)).toEqual({
      type: TERMINAL_ACTION_TYPES.RESOLVE_PENDING_COMMAND,
      payload: items,
    });
  });
});
