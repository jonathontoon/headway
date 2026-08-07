import type { TerminalTask as TerminalTaskOutput } from "../store/terminal/output";

type TerminalTaskProps = {
  readonly item: TerminalTaskOutput;
  readonly today: string;
  readonly idColumnWidth: number;
};

const TASK_FRAGMENT_PATTERN = /(\+[\w-]+|@[\w-]+|due:\d{4}-\d{2}-\d{2})/g;

const priorityClassName = (letter: string): string => {
  const priorityColors = [
    "text-terminal-1",
    "text-terminal-3",
    "text-terminal-2",
    "text-terminal-6",
    "text-terminal-4",
  ] as const;
  const charCode = letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);

  if (charCode < 0 || charCode >= priorityColors.length) {
    return "text-role-muted";
  }

  return priorityColors[charCode] ?? "text-role-muted";
};

const renderTaskFragments = (text: string, today: string) => {
  return text.split(TASK_FRAGMENT_PATTERN).map((part, i) => {
    if (part.startsWith("+")) {
      return (
        <span key={i} className="text-role-accent">
          {part}
        </span>
      );
    }

    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-role-context">
          {part}
        </span>
      );
    }

    const dueMatch = part.match(/^due:(\d{4}-\d{2}-\d{2})$/);
    if (dueMatch) {
      const date = dueMatch[1]!;
      const className =
        date < today
          ? "text-role-error"
          : date === today
            ? "text-role-warning"
            : "text-role-info";

      return (
        <span key={i} className={className}>
          {part}
        </span>
      );
    }

    return part;
  });
};

export const TerminalTask = ({
  item,
  today,
  idColumnWidth,
}: TerminalTaskProps) => {
  const { position: id, task } = item;
  const priority = task.completed ? undefined : task.priority;
  const rest = task.text.replace(/\s+pri:[^:\s]+/g, "").trim();

  return (
    <div className="block whitespace-pre-wrap">
      <span
        className="inline-block text-right text-role-muted"
        style={{ minWidth: `${idColumnWidth}ch` }}
      >
        {id}.
      </span>{" "}
      {priority && (
        <span className={priorityClassName(priority)}>({priority}) </span>
      )}
      {renderTaskFragments(rest, today)}
    </div>
  );
};
