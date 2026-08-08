import { render, screen } from "@testing-library/react";
import { terminalOutput } from "../../store/terminal/output";
import { parseTodoLine } from "../../store/todos/parser";
import { TerminalOutputView } from "../TerminalOutputView";

describe("terminal output formatting", () => {
  it("colors aligned help rows as command and description columns", () => {
    render(<TerminalOutputView output={terminalOutput.help()} taskCount={5} />);

    expect(screen.getByText("list today")).toHaveClass("text-role-command");
    expect(screen.getByText("due today and overdue")).toHaveClass(
      "text-role-muted",
    );
    expect(screen.getByText("list completed")).toHaveClass("text-role-command");
    expect(screen.getByText("completed tasks")).toHaveClass("text-role-muted");
  });

  it("colors projects and contexts distinctly in task lines", () => {
    const parsed = parseTodoLine("(A) Ship release +work @laptop");
    if (!parsed.ok) throw new Error("expected valid task");
    render(
      <TerminalOutputView
        output={terminalOutput.tasks([{ position: 1, task: parsed.task }])}
        taskCount={5}
      />,
    );

    expect(screen.getByText("+work")).toHaveClass("text-role-accent");
    expect(screen.getByText("@laptop")).toHaveClass("text-role-context");
    expect(screen.getByText("(A)")).toHaveClass("text-terminal-1");
    expect(screen.getByText("1.")).toHaveClass("text-role-muted");
  });

  it("colors priorities beyond C with the warm-to-cool spectrum", () => {
    const parsed = parseTodoLine("(D) Water plants");
    if (!parsed.ok) throw new Error("expected valid task");
    render(
      <TerminalOutputView
        output={terminalOutput.tasks([{ position: 2, task: parsed.task }])}
        taskCount={5}
      />,
    );

    expect(screen.getByText("(D)")).toHaveClass("text-terminal-6");
  });

  it("renders an explicitly successful message", () => {
    const { container } = render(
      <TerminalOutputView
        output={terminalOutput.success("Saved: something")}
        taskCount={5}
      />,
    );
    const line = container.querySelector("div");
    expect(line?.textContent).toBe(" → Saved: something");
    expect(line).toHaveClass("text-role-success");
  });
});
