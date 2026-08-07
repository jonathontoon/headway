import type { TerminalOutput } from "../store/terminal/output";
import { OUTPUT_TYPE } from "../store/terminal/output";
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

  switch (output.type) {
    case OUTPUT_TYPE.BLANK:
      return <TerminalBlank />;
    case OUTPUT_TYPE.TEXT:
      return <TerminalMessage line={output.text} tone={output.tone} />;
    case OUTPUT_TYPE.TASKS:
      return output.tasks.map((task) => (
        <TerminalTask
          key={task.position}
          item={task}
          today={today}
          idColumnWidth={idColumnWidth}
        />
      ));
    case OUTPUT_TYPE.HELP:
      return <TerminalHelpOutput />;
    case OUTPUT_TYPE.PROGRESS:
      return <TerminalSpinner line={output.text} />;
    case OUTPUT_TYPE.BOOT:
      return <TerminalBootBanner line={output.text} />;
    case OUTPUT_TYPE.GREETING:
      return <TerminalGreeting line={output.text} />;
    case OUTPUT_TYPE.SECONDARY:
      return <TerminalSecondary line={output.text} />;
    case OUTPUT_TYPE.LINK:
      return <TerminalURL line={output.href} />;
    case OUTPUT_TYPE.GROUP:
      return output.items.map((item, index) => (
        <TerminalOutputView
          key={`${item.type}-${index}`}
          output={item}
          taskCount={taskCount}
        />
      ));
  }
};
