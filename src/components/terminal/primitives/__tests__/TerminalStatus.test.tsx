import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TERMINAL_COMMAND_SIGNATURES } from "../../../../constants";
import TerminalStatus from "../TerminalStatus";

describe("TerminalStatus", () => {
  it("renders a warning status with detail", () => {
    render(
      <TerminalStatus
        level="warning"
        message="Initiating download"
        detail="Your file will begin downloading shortly."
      />
    );

    expect(screen.getByText("[!]")).toHaveClass("text-terminal-warning");
    expect(screen.getByText("Initiating download")).toBeInTheDocument();
    expect(
      screen.getByText("Your file will begin downloading shortly.")
    ).toHaveClass("text-terminal-muted");
  });

  it("renders a success status without a detail line", () => {
    const { container } = render(
      <TerminalStatus
        level="success"
        message="secret.txt loaded successfully."
      />
    );

    expect(screen.getByText("[√]")).toHaveClass("text-terminal-success");
    expect(
      screen.getByText("secret.txt loaded successfully.")
    ).toBeInTheDocument();
    expect(container.querySelector(".text-terminal-muted")).toBeNull();
  });

  it("renders a usage status with a formatted signature", () => {
    render(
      <TerminalStatus
        level="error"
        message="usage:"
        signature={TERMINAL_COMMAND_SIGNATURES.status}
      />
    );

    expect(screen.getByText("[×]")).toHaveClass("text-terminal-error");
    expect(screen.getByText("usage:")).toHaveClass("text-terminal-text");
    expect(screen.getByText("status")).toHaveClass("text-terminal-text");
    expect(screen.getByText("<success|warning|error>")).toHaveClass(
      "text-cyan-300"
    );
    expect(screen.getByText("<message>")).toHaveClass("text-yellow-200");
  });
});
