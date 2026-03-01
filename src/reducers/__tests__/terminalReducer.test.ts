import {
  TERMINAL_ACTION_TYPES,
  TERMINAL_COMMAND_SYNTAXES,
  TERMINAL_HELP_ROWS,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_PENDING_WARNING,
  TERMINAL_PENDING_WARNING_DETAIL,
  TERMINAL_STEPS_HEADING,
  TERMINAL_STEP_ITEMS,
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

  it("submits help and appends a help transcript item", () => {
    const state = reduce(setInput("help"), submitInput());

    expect(state.input).toBe("");
    expect(state.history).toEqual(["help"]);
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "help" },
      {
        id: 2,
        kind: "help",
        rows: TERMINAL_HELP_ROWS,
      },
    ]);
    expect(state.pendingCommand).toBeNull();
  });

  it("appends structured usage errors for invalid command input", () => {
    const state = reduce(setInput("status foo Ready"), submitInput());

    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "status foo Ready" },
      {
        id: 2,
        kind: "status",
        level: "error",
        message: "usage:",
        syntax: TERMINAL_COMMAND_SYNTAXES.status,
      },
    ]);
  });

  it("submits jobs and appends a heading plus list", () => {
    const state = reduce(setInput("jobs"), submitInput());

    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "jobs" },
      { id: 2, kind: "heading", text: TERMINAL_JOBS_HEADING },
      { id: 3, kind: "unordered-list", items: TERMINAL_JOB_ITEMS },
    ]);
    expect(state.pendingCommand).toBeNull();
  });

  it("submits steps and appends an ordered list", () => {
    const state = reduce(setInput("steps"), submitInput());

    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
      { id: 1, kind: "command", text: "steps" },
      { id: 2, kind: "heading", text: TERMINAL_STEPS_HEADING },
      { id: 3, kind: "ordered-list", items: TERMINAL_STEP_ITEMS },
    ]);
    expect(state.pendingCommand).toBeNull();
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
        message: "Deployment completed",
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

  it("does not navigate history when the history is empty", () => {
    const initialState = createInitialTerminalState();

    expect(terminalReducer(initialState, navigateHistory("up"))).toBe(
      initialState
    );
    expect(terminalReducer(initialState, navigateHistory("down"))).toBe(
      initialState
    );
  });

  it("shows a warning with detail when another command is already running", () => {
    const state = reduce(
      setInput("deploy staging"),
      submitInput(),
      setInput("deploy production"),
      submitInput()
    );

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
      { id: 3, kind: "command", text: "deploy production" },
      {
        id: 4,
        kind: "status",
        level: "warning",
        message: TERMINAL_PENDING_WARNING,
        detail: TERMINAL_PENDING_WARNING_DETAIL,
      },
    ]);
  });

  it("clears only the input field when clearInput is dispatched", () => {
    const state = reduce(setInput("echo pending"), clearInput());

    expect(state.input).toBe("");
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
    ]);
  });

  it("resets the history index when clearInput is dispatched", () => {
    const stateWithHistory = reduce(
      setInput("echo one"),
      submitInput(),
      setInput("echo two"),
      submitInput()
    );
    const navigatedState = terminalReducer(
      stateWithHistory,
      navigateHistory("up")
    );
    const clearedState = terminalReducer(navigatedState, clearInput());

    expect(clearedState.input).toBe("");
    expect(clearedState.historyIndex).toBe(-1);
    expect(clearedState.items).toEqual(navigatedState.items);
  });

  it("ignores whitespace-only submissions", () => {
    const state = reduce(setInput("   "), submitInput());

    expect(state.input).toBe("   ");
    expect(state.history).toEqual([]);
    expect(state.items).toEqual([
      { id: 0, kind: "text", text: TERMINAL_WELCOME_MESSAGE },
    ]);
  });

  it("does nothing when resolving a command with no pending work", () => {
    const initialState = createInitialTerminalState();

    expect(
      terminalReducer(
        initialState,
        resolvePendingCommand([{ kind: "text", text: "done" }])
      )
    ).toBe(initialState);
  });

  it("ignores malformed action payloads", () => {
    const initialState = createInitialTerminalState();

    expect(
      terminalReducer(initialState, {
        type: TERMINAL_ACTION_TYPES.SET_INPUT,
        payload: 123,
      })
    ).toBe(initialState);
    expect(
      terminalReducer(initialState, {
        type: TERMINAL_ACTION_TYPES.NAVIGATE_HISTORY,
        payload: "sideways",
      })
    ).toBe(initialState);
    expect(
      terminalReducer(initialState, {
        type: TERMINAL_ACTION_TYPES.RESOLVE_PENDING_COMMAND,
        payload: { kind: "text", text: "done" },
      })
    ).toBe(initialState);
  });

  it("returns the current state for unknown actions", () => {
    const state = reduce(setInput("help"), submitInput());

    expect(terminalReducer(state, { type: "terminal/unknown" })).toBe(state);
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
