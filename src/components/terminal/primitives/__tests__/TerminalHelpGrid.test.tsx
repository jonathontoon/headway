import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TERMINAL_HELP_ROWS } from "../../../../constants";
import TerminalHelpGrid from "../TerminalHelpGrid";

describe("TerminalHelpGrid", () => {
  it("renders command signatures and descriptions", () => {
    render(<TerminalHelpGrid rows={TERMINAL_HELP_ROWS} />);

    expect(screen.getByText("show the command palette")).toBeInTheDocument();
    expect(screen.getByText("help")).toHaveClass("text-terminal-text");
    expect(screen.getByText("<success|warning|error>")).toHaveClass(
      "text-cyan-300"
    );
    expect(screen.getByText("<message>")).toHaveClass("text-yellow-200");
    expect(screen.getAllByRole("listitem")[0]).toHaveClass("grid-cols-1");
    expect(screen.getAllByRole("listitem")[0]).toHaveClass(
      "sm:grid-cols-[1fr_2fr]"
    );
  });
});
