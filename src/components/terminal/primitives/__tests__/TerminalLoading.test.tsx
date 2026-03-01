import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TerminalLoading from "../TerminalLoading";

describe("TerminalLoading", () => {
  it("renders a blinking status marker and loading text", () => {
    render(<TerminalLoading text="Deploying preview..." />);

    expect(screen.getByText("●")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("●")).toHaveClass("animate-terminal-blink");
    expect(screen.getByText("●")).toHaveClass("text-terminal-info");
    expect(screen.getByText("Deploying preview...")).toHaveClass("break-words");
    expect(screen.getByText("Deploying preview...")).toHaveClass(
      "text-terminal-text"
    );
  });
});
