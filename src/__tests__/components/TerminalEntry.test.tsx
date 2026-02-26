// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TerminalEntry from "@components/TerminalEntry";
import { ResponseType, type HistoryEntry } from "@types";

afterEach(cleanup);

const makeEntry = (
  command: string,
  responses: HistoryEntry["responses"]
): HistoryEntry => ({ id: "1", command, responses });

describe("TerminalEntry", () => {
  it("renders $ prompt marker and command text when entry.command is truthy", () => {
    render(<TerminalEntry entry={makeEntry("list", [])} />);
    expect(screen.getByText("$", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("list")).toBeInTheDocument();
  });

  it("does not render prompt marker when entry.command is empty", () => {
    const { container } = render(<TerminalEntry entry={makeEntry("", [])} />);
    expect(container.querySelector(".text-sky-400")).toBeNull();
  });

  it("ResponseType.Text: response text appears in output", () => {
    render(
      <TerminalEntry
        entry={makeEntry("", [{ type: ResponseType.Text, text: "hello text" }])}
      />
    );
    expect(screen.getByText("hello text")).toBeInTheDocument();
  });

  it("ResponseType.Error: ✗ icon and text appear", () => {
    render(
      <TerminalEntry
        entry={makeEntry("", [{ type: ResponseType.Error, text: "bad error" }])}
      />
    );
    expect(screen.getByText("✗")).toBeInTheDocument();
    expect(screen.getByText("bad error")).toBeInTheDocument();
  });

  it("ResponseType.Success: ✓ icon and text appear", () => {
    render(
      <TerminalEntry
        entry={makeEntry("", [
          { type: ResponseType.Success, text: "all good" },
        ])}
      />
    );
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("all good")).toBeInTheDocument();
  });

  it("ResponseType.Warning: ~ icon and text appear", () => {
    render(
      <TerminalEntry
        entry={makeEntry("", [
          { type: ResponseType.Warning, text: "be careful" },
        ])}
      />
    );
    expect(screen.getByText("~")).toBeInTheDocument();
    expect(screen.getByText("be careful")).toBeInTheDocument();
  });

  it("ResponseType.Todo: todo index number and text appear", () => {
    const { container } = render(
      <TerminalEntry
        entry={makeEntry("", [
          { type: ResponseType.Todo, index: 3, text: "my task" },
        ])}
      />
    );
    expect(screen.getByText("3.")).toBeInTheDocument();
    // TodoText splits words into individual spans; check via container textContent
    expect(container.textContent).toContain("my task");
  });

  it("ResponseType.Help: section command name appears", () => {
    render(
      <TerminalEntry
        entry={makeEntry("", [
          {
            type: ResponseType.Help,
            sections: [
              {
                title: "Core",
                commands: [{ name: "add", description: "Add a todo" }],
              },
            ],
          },
        ])}
      />
    );
    expect(screen.getByText("add")).toBeInTheDocument();
  });

  it("spaceBefore: first Todo after a Text response gets mt-4 class", () => {
    const { container } = render(
      <TerminalEntry
        entry={makeEntry("", [
          { type: ResponseType.Text, text: "results:" },
          { type: ResponseType.Todo, index: 1, text: "first todo" },
        ])}
      />
    );
    const todoRow = container.querySelector(".mt-4");
    expect(todoRow).not.toBeNull();
  });

  it("spaceBefore: second consecutive Todo does NOT get mt-4 class", () => {
    const { container } = render(
      <TerminalEntry
        entry={makeEntry("", [
          { type: ResponseType.Text, text: "results:" },
          { type: ResponseType.Todo, index: 1, text: "first todo" },
          { type: ResponseType.Todo, index: 2, text: "second todo" },
        ])}
      />
    );
    const mtElements = container.querySelectorAll(".mt-4");
    expect(mtElements).toHaveLength(1);
  });
});
