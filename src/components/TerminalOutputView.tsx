import type { TerminalOutput } from "../store/terminal/output";
import { getLocalDate } from "../store/todos/summary";
import { TerminalBlank } from "./TerminalBlank";
import { TerminalBootBanner } from "./TerminalBootBanner";
import { TerminalGreeting } from "./TerminalGreeting";
import { TerminalHelpOutput } from "./TerminalHelpOutput";
import { TerminalMessage } from "./TerminalMessage";
import { TerminalSecondary } from "./TerminalSecondary";
import { TerminalSpinner } from "./TerminalSpinner";
import { TerminalTask } from "./TerminalTask";
import { TerminalURL } from "./TerminalURL";

type TerminalOutputViewProps = {
  readonly output: TerminalOutput;
  readonly taskCount: number;
};

export const TerminalOutputView = ({
  output,
  taskCount,
}: TerminalOutputViewProps) => {
  const today = getLocalDate();
  const idColumnWidth = String(taskCount).length + 1;

  switch (output.kind) {
    case "blank":
      return <TerminalBlank />;
    case "text":
      return <TerminalMessage line={output.text} tone={output.tone} />;
    case "tasks":
      return output.tasks.map((task) => (
        <TerminalTask
          key={task.position}
          item={task}
          today={today}
          idColumnWidth={idColumnWidth}
        />
      ));
    case "help":
      return <TerminalHelpOutput />;
    case "progress":
      return <TerminalSpinner line={output.text} />;
    case "boot":
      return <TerminalBootBanner line={output.text} />;
    case "greeting":
      return <TerminalGreeting line={output.text} />;
    case "secondary":
      return <TerminalSecondary line={output.text} />;
    case "link":
      return <TerminalURL line={output.href} />;
    case "group":
      return output.items.map((item, index) => (
        <TerminalOutputView
          key={`${item.kind}-${index}`}
          output={item}
          taskCount={taskCount}
        />
      ));
  }
};
