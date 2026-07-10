import { render, screen } from "@testing-library/react";
import { HELP_TEXT, SUCCESS_PREFIXES } from "../constants";
import { formatOutput } from "./terminalFormat";

describe("terminal output formatting", () => {
  it("colors aligned help rows as command and description columns", () => {
    render(<>{formatOutput(HELP_TEXT, 5)}</>);

    expect(screen.getByText("list today")).toHaveClass("text-role-command");
    expect(screen.getByText("due today and overdue")).toHaveClass(
      "text-role-muted",
    );
    expect(screen.getByText("archive")).toHaveClass("text-role-command");
    expect(screen.getByText("completed tasks")).toHaveClass("text-role-muted");
  });

  it("colors projects and contexts distinctly in task lines", () => {
    render(<>{formatOutput("1. (A) Ship release +work @laptop", 5)}</>);

    expect(screen.getByText("+work")).toHaveClass("text-role-accent");
    expect(screen.getByText("@laptop")).toHaveClass("text-role-context");
    expect(screen.getByText("(A)")).toHaveClass("text-terminal-1");
    expect(screen.getByText("1.")).toHaveClass("text-role-muted");
  });

  it("colors priorities beyond C with the warm-to-cool spectrum", () => {
    render(<>{formatOutput("2. (D) Water plants", 5)}</>);

    expect(screen.getByText("(D)")).toHaveClass("text-terminal-6");
  });

  it("classifies each success message template as success output", () => {
    for (const prefix of SUCCESS_PREFIXES) {
      const { container, unmount } = render(
        <>{formatOutput(`${prefix} something`, 5)}</>,
      );
      const line = container.querySelector("div");
      expect(line?.textContent).toBe(` → ${prefix} something`);
      expect(line).toHaveClass("text-role-success");
      unmount();
    }
  });

  it("accents the counts in summary header lines", () => {
    render(<>{formatOutput("5 projects, 12 tasks between them.", 5)}</>);

    expect(screen.getByText("5")).toHaveClass("text-role-accent");
    expect(screen.getByText("12")).toHaveClass("text-role-accent");
  });

  it("colors the show command's task line like a rendered list", () => {
    render(
      <>
        {formatOutput(
          "Ship release +work @laptop due:2020-01-01\ncreated: 2019-12-01  priority: A  due: 2020-01-01  status: open",
          5,
        )}
      </>,
    );

    expect(screen.getByText("+work")).toHaveClass("text-role-accent");
    expect(screen.getByText("@laptop")).toHaveClass("text-role-context");
    expect(screen.getByText("due:2020-01-01")).toHaveClass("text-role-error");
  });
});
