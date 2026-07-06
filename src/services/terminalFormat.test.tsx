import { render, screen } from "@testing-library/react";
import { HELP_TEXT } from "../constants";
import { formatOutput } from "./terminalFormat";

describe("terminal output formatting", () => {
  it("colors aligned help rows as command and description columns", () => {
    render(<>{formatOutput(HELP_TEXT)}</>);

    expect(screen.getByText("list today")).toHaveClass("text-terminal-3");
    expect(screen.getByText("due today and overdue")).toHaveClass(
      "text-terminal-8",
    );
    expect(screen.getByText("archive")).toHaveClass("text-terminal-3");
    expect(screen.getByText("completed tasks")).toHaveClass("text-terminal-8");
  });
});
