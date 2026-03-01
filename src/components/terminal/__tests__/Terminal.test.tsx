import { act, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import {
  TERMINAL_DEPLOY_DELAY_MS,
  TERMINAL_HELP_ROWS,
  TERMINAL_INPUT_LABEL,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
  TERMINAL_STEPS_HEADING,
  TERMINAL_STEP_ITEMS,
  TERMINAL_UNKNOWN_COMMAND_DETAIL,
  TERMINAL_WELCOME_MESSAGE,
} from "../../../constants";
import { terminalReducer } from "../../../reducers/terminalReducer";
import Terminal from "../Terminal";

const renderTerminal = () => {
  const store = configureStore({
    reducer: {
      terminal: terminalReducer,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <Terminal />
      </Provider>
    ),
  };
};

describe("Terminal", () => {
  it("renders inline palette, lists, and richer status primitives", () => {
    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(
      screen.getByText(TERMINAL_HELP_ROWS[0].description)
    ).toBeInTheDocument();
    expect(screen.getByText("<success|warning|error>")).toHaveClass(
      "text-cyan-300"
    );
    expect(screen.getByText("<message>")).toHaveClass("text-yellow-200");

    fireEvent.change(input, { target: { value: "jobs" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText(TERMINAL_JOBS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TERMINAL_JOB_ITEMS[0])).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "steps" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText(TERMINAL_STEPS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TERMINAL_STEP_ITEMS[0])).toBeInTheDocument();
    expect(
      screen.getByText(TERMINAL_STEP_ITEMS[0]).closest("ol")
    ).not.toBeNull();
    expect(screen.getByText("1.")).toBeInTheDocument();

    fireEvent.change(input, {
      target: { value: "status warning Build queued" },
    });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("[!]")).toBeInTheDocument();
    expect(screen.getByText("Build queued")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "status foo Ready" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("usage:")).toBeInTheDocument();
    expect(screen.getAllByText("<success|warning|error>")).toHaveLength(2);
    expect(screen.getAllByText("<message>")).toHaveLength(2);

    fireEvent.change(input, { target: { value: "unknown-command" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getAllByText("[×]")).toHaveLength(2);
    expect(
      screen.getByText("'unknown-command' was not recognized.")
    ).toBeInTheDocument();
    expect(screen.getByText(TERMINAL_UNKNOWN_COMMAND_DETAIL)).toHaveClass(
      "text-terminal-muted"
    );
  });

  it("resolves deploy loading, keeps history, and still clears", async () => {
    vi.useFakeTimers();

    try {
      renderTerminal();

      const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

      fireEvent.change(input, { target: { value: "deploy staging" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(screen.getByText("Deploying to staging...")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(TERMINAL_DEPLOY_DELAY_MS);
      });

      expect(screen.getByText("[√]")).toBeInTheDocument();
      expect(screen.getByText("Deployment completed")).toBeInTheDocument();
      expect(
        screen.getByText("staging is live and smoke checks passed.")
      ).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "ArrowUp", code: "ArrowUp" });
      expect(input).toHaveValue("deploy staging");

      fireEvent.change(input, { target: { value: "clear" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(screen.getByText(TERMINAL_WELCOME_MESSAGE)).toBeInTheDocument();
      expect(
        screen.queryByText("Deployment completed")
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the current input on Escape without changing the transcript", () => {
    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

    fireEvent.change(input, { target: { value: "draft command" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(input).toHaveValue("");
    expect(screen.getByText(TERMINAL_WELCOME_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText("draft command")).not.toBeInTheDocument();
  });

  it("keeps the prompt blank when navigating down from the reset history position", () => {
    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });

    expect(input).toHaveValue("");
  });

  it("warns when a second deploy starts before the first one resolves", () => {
    vi.useFakeTimers();

    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

    fireEvent.change(input, { target: { value: "deploy staging" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    fireEvent.change(input, { target: { value: "deploy production" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(
      screen.getByText("A command is already running.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Wait for the current command to finish before starting another."
      )
    ).toBeInTheDocument();
  });

  it("re-focuses the prompt after transcript updates", () => {
    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

    input.blur();
    expect(document.activeElement).not.toBe(input);

    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(document.activeElement).toBe(input);
  });

  it("cleans up the pending deploy timeout on unmount", () => {
    vi.useFakeTimers();

    const { unmount } = renderTerminal();
    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });
    const timerCountBeforeDeploy = vi.getTimerCount();

    fireEvent.change(input, { target: { value: "deploy staging" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(vi.getTimerCount()).toBeGreaterThan(timerCountBeforeDeploy);

    unmount();

    expect(vi.getTimerCount()).toBe(timerCountBeforeDeploy);
  });
});
