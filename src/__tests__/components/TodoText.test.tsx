// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TodoText from "@components/TodoText";

afterEach(cleanup);

describe("TodoText", () => {
  it("renders @context token with text-terminal-prioF class", () => {
    render(<TodoText text="buy @groceries" />);
    expect(screen.getByText("@groceries")).toHaveClass("text-terminal-prioF");
  });

  it("renders +project token with text-terminal-prioH class", () => {
    render(<TodoText text="fix +headway bug" />);
    expect(screen.getByText("+headway")).toHaveClass("text-terminal-prioH");
  });

  it("renders (A) priority with text-terminal-prioA class", () => {
    render(<TodoText text="(A) urgent task" />);
    expect(screen.getByText("(A)")).toHaveClass("text-terminal-prioA");
  });

  it("renders (B) priority with text-terminal-prioB class", () => {
    render(<TodoText text="(B) less urgent" />);
    expect(screen.getByText("(B)")).toHaveClass("text-terminal-prioB");
  });

  it("renders YYYY-MM-DD date with text-zinc-600 class", () => {
    render(<TodoText text="2024-01-15 some task" />);
    expect(screen.getByText("2024-01-15")).toHaveClass("text-zinc-600");
  });

  it("renders plain text token with no class", () => {
    render(<TodoText text="plain word" />);
    const el = screen.getByText("plain");
    expect(el.className).toBe("");
  });

  it("completed todo: root span has line-through and text-zinc-700", () => {
    const { container } = render(<TodoText text="x done task" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("line-through");
    expect(root).toHaveClass("text-zinc-700");
  });

  it("completed todo: x prefix is not rendered as a token", () => {
    render(<TodoText text="x done task" />);
    expect(screen.queryByText("x")).toBeNull();
  });

  it("completed todo: colored tokens lose their class", () => {
    render(<TodoText text="x done @context +project" />);
    expect(screen.getByText("@context").className).toBe("");
    expect(screen.getByText("+project").className).toBe("");
  });
});
