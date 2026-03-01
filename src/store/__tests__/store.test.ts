import { afterEach, describe, expect, it } from "vitest";
import { setInput, submitInput } from "../../actions/terminalActions";
import { createInitialTerminalState } from "../../reducers/terminalReducer";
import { store } from "../index";

const resetStore = () => {
  store.dispatch(setInput("clear"));
  store.dispatch(submitInput());
};

afterEach(() => {
  resetStore();
});

describe("store", () => {
  it("starts with the terminal reducer state shape", () => {
    resetStore();

    expect(store.getState().terminal).toEqual(createInitialTerminalState());
  });

  it("updates the terminal slice when actions are dispatched", () => {
    resetStore();

    store.dispatch(setInput("typed command"));

    expect(store.getState().terminal.input).toBe("typed command");
  });
});
