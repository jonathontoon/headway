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

  it("does not highlight a date at the start of active todo", () => {
    render(<TodoText text="2024-01-15 some task" />);
    expect(screen.getByText("2024-01-15").className).toBe("");
  });

  it("does not highlight a date in the task body", () => {
    render(<TodoText text="plan launch for 2024-01-15" />);
    expect(screen.getByText("2024-01-15").className).toBe("");
  });

  it("renders plain text token with no class", () => {
    render(<TodoText text="plain word" />);
    const el = screen.getByText("plain");
    expect(el.className).toBe("");
  });

  it("renders multiple tokens in one todo", () => {
    render(<TodoText text="(A) @phone +personal call mom" />);
    expect(screen.getByText("(A)")).toHaveClass("text-terminal-prioA");
    expect(screen.getByText("@phone")).toHaveClass("text-terminal-prioF");
    expect(screen.getByText("+personal")).toHaveClass("text-terminal-prioH");
    expect(screen.getByText("call").className).toBe("");
  });

  describe("completed todos", () => {
    it("root span has line-through and text-terminal-muted", () => {
      const { container } = render(<TodoText text="x 2024-01-16 done task" />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass("line-through");
      expect(root).toHaveClass("text-terminal-muted");
    });

    it("x prefix is not rendered as a token", () => {
      render(<TodoText text="x 2024-01-16 done task" />);
      expect(screen.queryByText("x")).toBeNull();
    });

    it("colored tokens lose their class", () => {
      render(<TodoText text="x 2024-01-16 @context +project" />);
      expect(screen.getByText("@context").className).toBe("");
      expect(screen.getByText("+project").className).toBe("");
    });

    it("date token loses its class when completed", () => {
      render(<TodoText text="x 2024-01-16 reminder" />);
      expect(screen.getByText("2024-01-16").className).toBe("");
    });
  });
});
