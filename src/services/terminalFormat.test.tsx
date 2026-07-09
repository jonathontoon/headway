import { render, screen } from "@testing-library/react";
import { HELP_TEXT, SUCCESS_PREFIXES } from "../constants";
import { formatOutput } from "./terminalFormat";

describe("terminal output formatting", () => {
  it("colors aligned help rows as command and description columns", () => {
    render(<>{formatOutput(HELP_TEXT)}</>);

    expect(screen.getByText("list today")).toHaveClass("text-role-command");
    expect(screen.getByText("due today and overdue")).toHaveClass(
      "text-role-muted",
    );
    expect(screen.getByText("archive")).toHaveClass("text-role-command");
    expect(screen.getByText("completed tasks")).toHaveClass("text-role-muted");
  });

  it("colors projects and contexts distinctly in task lines", () => {
    render(<>{formatOutput("1. (A) Ship release +work @laptop")}</>);

    expect(screen.getByText("+work")).toHaveClass("text-role-accent");
    expect(screen.getByText("@laptop")).toHaveClass("text-role-context");
    expect(screen.getByText("(A)")).toHaveClass("text-role-error");
    expect(screen.getByText("1.")).toHaveClass("text-role-muted");
  });

  it("mutes priorities below C instead of leaving them unstyled", () => {
    render(<>{formatOutput("2. (D) Water plants")}</>);

    expect(screen.getByText("(D)")).toHaveClass("text-role-muted");
  });

  it("classifies each success message template as success output", () => {
    for (const prefix of SUCCESS_PREFIXES) {
      const { container, unmount } = render(
        <>{formatOutput(`${prefix} something`)}</>,
      );
      const line = container.querySelector("div");
      expect(line?.textContent).toBe(`→ ${prefix} something`);
      expect(line).toHaveClass("text-role-success");
      unmount();
    }
  });

  it("accents the counts in summary header lines", () => {
    render(<>{formatOutput("5 projects, 12 tasks between them.")}</>);

    expect(screen.getByText("5")).toHaveClass("text-role-accent");
    expect(screen.getByText("12")).toHaveClass("text-role-accent");
  });
});
