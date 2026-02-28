// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TerminalHistory from "@components/TerminalHistory";
import { ResponseType, type HistoryEntry } from "@types";

afterEach(cleanup);

describe("TerminalHistory", () => {
  it("announces appended output through a labeled live log region", () => {
    const history: HistoryEntry[] = [
      {
        id: "1",
        command: "echo hello",
        responses: [{ type: ResponseType.Text, text: "hello" }],
      },
    ];

    render(<TerminalHistory history={history} />);

    const log = screen.getByRole("log", { name: "Terminal output" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions text");
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
