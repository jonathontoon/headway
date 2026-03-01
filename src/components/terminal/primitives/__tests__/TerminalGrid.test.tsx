import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TerminalGrid from "../TerminalGrid";

describe("TerminalGrid", () => {
  it("renders display cells with the responsive layout classes", () => {
    const rows = [
      {
        label: <span className="text-terminal-text">help</span>,
        value: <span className="text-terminal-muted">show the command palette</span>,
      },
    ] as const;

    render(<TerminalGrid rows={rows} />);

    expect(screen.getByText("help")).toBeInTheDocument();
    expect(screen.getByText("show the command palette")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveClass("grid-cols-1");
    expect(screen.getByRole("listitem")).toHaveClass("sm:grid-cols-[1fr_2fr]");
  });
});
