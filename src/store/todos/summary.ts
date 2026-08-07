import {
  getMetadataValue,
  parseTasks,
  pluralize,
  type IndexedTask,
} from "./format";
import { terminalOutput, type TerminalOutput } from "../terminal/output";

function openTasksInFileOrder(
  todos: readonly string[],
): readonly IndexedTask[] {
  return parseTasks(todos).filter(({ task }) => !task.completed);
}

export function getLocalDate(): string {
  const date = new Date();
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatBootMessage(
  todos: readonly string[],
  today: string,
  greeting: string,
): { readonly message: TerminalOutput; readonly view: readonly number[] } {
  const open = openTasksInFileOrder(todos);
  const overdue = open.filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due < today;
  });
  const dueToday = open.filter(
    ({ task }) => getMetadataValue(task.metadata, "due") === today,
  );
  const output: TerminalOutput[] = [
    terminalOutput.boot(`↗ headway v${__APP_VERSION__}`),
    terminalOutput.greeting(
      `${greeting}. You have ${overdue.length} ${pluralize(
        overdue.length,
        "overdue task",
        "overdue tasks",
      )}, and ${dueToday.length} due today.`,
    ),
  ];

  let position = 1;
  let view: readonly number[] = [];

  for (const [heading, tasks] of [
    ["OVERDUE", overdue],
    ["TODAY", dueToday],
  ] as const) {
    if (tasks.length === 0) continue;
    output.push(
      terminalOutput.blank(),
      terminalOutput.muted(heading),
      terminalOutput.tasks(
        tasks.map((item, index) => ({
          position: position + index,
          task: item.task,
        })),
      ),
    );
    view = [...view, ...tasks.map((item) => item.id)];
    position += tasks.length;
  }

  output.push(
    terminalOutput.blank(),
    terminalOutput.muted("Type 'help' for all available commands."),
  );

  return { message: terminalOutput.group(...output), view };
}
