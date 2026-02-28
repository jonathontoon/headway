import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TerminalStatus from "../TerminalStatus";

describe("TerminalStatus", () => {
  it("renders a warning status marker and message", () => {
    render(<TerminalStatus level="warning" text="Build queued" />);

    expect(screen.getByText("[warn]")).toHaveClass("text-terminal-warning");
    expect(screen.getByText("Build queued")).toBeInTheDocument();
  });
});
