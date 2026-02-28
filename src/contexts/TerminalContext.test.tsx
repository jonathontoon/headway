// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TaskProvider } from "@contexts/TaskContext";
import {
  TerminalProvider,
  useTerminalController,
  useTerminalState,
} from "@contexts/TerminalContext";

const TerminalHarness = () => {
  const { input, setInput, submit } = useTerminalController();
  const state = useTerminalState();

  return (
    <div>
      <span data-testid="entry-count">{state.transcript.length}</span>
      <span data-testid="input-value">{input}</span>
      <button
        onClick={() => {
          setInput("add Write docs");
          void submit("add Write docs");
        }}
        type="button"
      >
        Submit
      </button>
      <div>{state.transcript.at(-1)?.events.at(0)?.kind ?? "none"}</div>
    </div>
  );
};

describe("TerminalProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("submits commands through the controller and appends transcript entries", async () => {
    render(
      <TaskProvider>
        <TerminalProvider>
          <TerminalHarness />
        </TerminalProvider>
      </TaskProvider>
    );

    expect(screen.getByTestId("entry-count")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByTestId("entry-count")).toHaveTextContent("2");
    });

    expect(screen.getByTestId("input-value")).toHaveTextContent("");
    expect(screen.getByText("message")).toBeInTheDocument();
  });
});
