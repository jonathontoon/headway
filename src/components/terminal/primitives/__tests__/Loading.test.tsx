import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "../Loading";

describe("Loading", () => {
  it("renders a blinking status marker and loading text", () => {
    render(<Loading text="Deploying preview..." />);

    expect(screen.getByText("●")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("●")).toHaveClass("animate-terminal-blink");
    expect(screen.getByText("●")).toHaveClass("text-terminal-info");
    expect(screen.getByText("Deploying preview...")).toHaveClass(
      "wrap-break-word"
    );
    expect(screen.getByText("Deploying preview...")).toHaveClass(
      "text-terminal-text"
    );
  });
});
