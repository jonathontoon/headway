import {
  TERMINAL_COMMAND_PALETTE_COMMANDS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_WELCOME_MESSAGE,
} from "../../constants";
import { describe, expect, it } from "vitest";
import {
  clearInput,
  navigateHistory,
  resolvePendingCommand,
  setInput,
  submitInput,
} from "../../actions/terminalActions";
import { createPendingCommandCompletionItems } from "../../lib/terminal/commands";
import {
  createInitialTerminalState,
  terminalReducer,
} from "../terminalReducer";

const reduce = (...actions: Parameters<typeof terminalReducer>[1][]) =>
  actions.reduce(terminalReducer, createInitialTerminalState());

describe("terminalReducer", () => {
  it("creates the expected initial state", () => {
    expect(createInitialTerminalState()).toEqual({
      input: "",
      items: [{ id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE }],
      history: [],
      historyIndex: -1,
      nextItemId: 1,
      pendingCommand: null,
    });
  });

  it("submits help and appends a command palette", () => {
    const state = reduce(setInput("help"), submitInput());

    expect(state.input).toBe("");
    expect(state.history).toEqual(["help"]);
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "help" },
      {
        id: 2,
        kind: "palette",
        commands: TERMINAL_COMMAND_PALETTE_COMMANDS,
      },
    ]);
    expect(state.pendingCommand).toBeNull();
  });

  it("submits jobs and appends a heading plus list", () => {
    const state = reduce(setInput("jobs"), submitInput());

    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "jobs" },
      { id: 2, kind: "heading", text: TERMINAL_JOBS_HEADING },
      { id: 3, kind: "list", items: TERMINAL_JOB_ITEMS },
    ]);
  });

  it("tracks pending deploy commands and resolves them later", () => {
    let state = reduce(setInput("deploy staging"), submitInput());

    expect(state.pendingCommand).toEqual({
      kind: "deploy",
      commandText: "deploy staging",
      target: "staging",
      loadingItemId: 2,
    });
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "deploy staging" },
      { id: 2, kind: "loading", text: "Deploying to staging..." },
    ]);

    state = terminalReducer(
      state,
      resolvePendingCommand(
        createPendingCommandCompletionItems(state.pendingCommand!)
      )
    );

    expect(state.pendingCommand).toBeNull();
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "deploy staging" },
      {
        id: 3,
        kind: "status",
        level: "success",
        text: "Deployment completed",
      },
      {
        id: 4,
        kind: "text",
        text: "staging is live and smoke checks passed.",
      },
    ]);
  });

  it("navigates command history with the items state model", () => {
    let state = reduce(
      setInput("echo first"),
      submitInput(),
      setInput("echo second"),
      submitInput()
    );

    state = terminalReducer(state, navigateHistory("up"));
    expect(state.input).toBe("echo second");
    expect(state.historyIndex).toBe(0);

    state = terminalReducer(state, navigateHistory("up"));
    expect(state.input).toBe("echo first");
    expect(state.historyIndex).toBe(1);

    state = terminalReducer(state, navigateHistory("down"));
    expect(state.input).toBe("echo second");
    expect(state.historyIndex).toBe(0);

    state = terminalReducer(state, navigateHistory("down"));
    expect(state.input).toBe("");
    expect(state.historyIndex).toBe(-1);
  });

  it("clears only the input field when clearInput is dispatched", () => {
    const state = reduce(setInput("echo pending"), clearInput());

    expect(state.input).toBe("");
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
    ]);
  });

  it("resets transcript, history, and pending state for clear", () => {
    const state = reduce(
      setInput("deploy staging"),
      submitInput(),
      setInput("clear"),
      submitInput()
    );

    expect(state).toEqual(createInitialTerminalState());
  });
});
