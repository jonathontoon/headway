import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TERMINAL_DEPLOY_DELAY_MS,
  TERMINAL_HELP_ROWS,
  TERMINAL_INPUT_LABEL,
  TERMINAL_JOBS_HEADING,
  TERMINAL_JOB_ITEMS,
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

  render(
    <Provider store={store}>
      <Terminal />
    </Provider>
  );
};

afterEach(cleanup);

describe("Terminal", () => {
  it("renders inline palette, lists, and richer status primitives", () => {
    renderTerminal();

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });

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

    fireEvent.change(input, { target: { value: "status warning Build queued" } });
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
    expect(
      screen.getByText(TERMINAL_UNKNOWN_COMMAND_DETAIL)
    ).toHaveClass("text-terminal-muted");
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
});
