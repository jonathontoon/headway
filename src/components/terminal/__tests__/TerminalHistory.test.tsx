import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TERMINAL_OUTPUT_LABEL } from "../../../constants";
import TerminalHistory from "../TerminalHistory";

describe("TerminalHistory", () => {
  it("renders an accessible log with one line per transcript item", () => {
    const items = [
      { id: 1, kind: "text" as const, text: "ready" },
      { id: 2, kind: "heading" as const, text: "Queued jobs" },
    ];

    render(<TerminalHistory items={items} />);

    const log = screen.getByRole("log", { name: TERMINAL_OUTPUT_LABEL });

    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions text");
    expect(log.childElementCount).toBe(items.length);
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByText("Queued jobs")).toBeInTheDocument();
  });
});
