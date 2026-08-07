import type { TerminalOutput } from "../store/terminal/output";
import { TERMINAL_OUTPUT_KIND } from "../store/terminal/output";
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
    case TERMINAL_OUTPUT_KIND.BLANK:
      return <TerminalBlank />;
    case TERMINAL_OUTPUT_KIND.TEXT:
      return <TerminalMessage line={output.text} tone={output.tone} />;
    case TERMINAL_OUTPUT_KIND.TASKS:
      return output.tasks.map((task) => (
        <TerminalTask
          key={task.position}
          item={task}
          today={today}
          idColumnWidth={idColumnWidth}
        />
      ));
    case TERMINAL_OUTPUT_KIND.HELP:
      return <TerminalHelpOutput />;
    case TERMINAL_OUTPUT_KIND.PROGRESS:
      return <TerminalSpinner line={output.text} />;
    case TERMINAL_OUTPUT_KIND.BOOT:
      return <TerminalBootBanner line={output.text} />;
    case TERMINAL_OUTPUT_KIND.GREETING:
      return <TerminalGreeting line={output.text} />;
    case TERMINAL_OUTPUT_KIND.SECONDARY:
      return <TerminalSecondary line={output.text} />;
    case TERMINAL_OUTPUT_KIND.LINK:
      return <TerminalURL line={output.href} />;
    case TERMINAL_OUTPUT_KIND.GROUP:
      return output.items.map((item, index) => (
        <TerminalOutputView
          key={`${item.kind}-${index}`}
          output={item}
          taskCount={taskCount}
        />
      ));
  }
};
