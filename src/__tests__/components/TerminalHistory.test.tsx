// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TerminalHistory from "@components/TerminalHistory";
import { ResponseType, type HistoryEntry } from "@types";

afterEach(cleanup);

describe("TerminalHistory", () => {
  it("announces appended output through a labeled live log region", () => {
    const history: HistoryEntry[] = [
      {
        id: "1",
        command: "echo hello",
        responses: [{ type: ResponseType.Text, text: "hello" }],
      },
    ];

    render(<TerminalHistory history={history} />);

    const log = screen.getByRole("log", { name: "Terminal output" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions text");
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders empty history without errors", () => {
    render(<TerminalHistory history={[]} />);

    const log = screen.getByRole("log", { name: "Terminal output" });
    expect(log).toBeInTheDocument();
    expect(log.children).toHaveLength(0);
  });

  it("renders multiple history entries", () => {
    const history: HistoryEntry[] = [
      {
        id: "1",
        command: "echo first",
        responses: [{ type: ResponseType.Text, text: "first" }],
      },
      {
        id: "2",
        command: "echo second",
        responses: [{ type: ResponseType.Text, text: "second" }],
      },
    ];

    render(<TerminalHistory history={history} />);

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("renders commands in read-only mode", () => {
    const history: HistoryEntry[] = [
      {
        id: "1",
        command: "list",
        responses: [{ type: ResponseType.Text, text: "Items listed" }],
      },
    ];

    render(<TerminalHistory history={history} />);

    const command = screen.getByText("list");
    expect(command).toHaveClass("text-terminal-text");
  });

  it("renders multiple response types in a single entry", () => {
    const history: HistoryEntry[] = [
      {
        id: "1",
        command: "list",
        responses: [
          { type: ResponseType.Text, text: "Header" },
          {
            type: ResponseType.Todo,
            items: [{ index: 1, text: "Task" }],
          },
        ],
      },
    ];

    render(<TerminalHistory history={history} />);

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
  });
});
