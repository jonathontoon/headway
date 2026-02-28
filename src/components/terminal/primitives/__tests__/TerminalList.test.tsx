import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TerminalList from "../TerminalList";

describe("TerminalList", () => {
  it("renders a list of terminal items", () => {
    render(<TerminalList items={["first task", "second task"]} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("first task")).toBeInTheDocument();
    expect(screen.getByText("second task")).toBeInTheDocument();
  });
});
