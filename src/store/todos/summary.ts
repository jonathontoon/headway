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

/**
 * Gets the current local date in `YYYY-MM-DD` format.
 *
 * @returns The local calendar date.
 */
export function getLocalDate(): string {
  const date = new Date();
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Selects a time-of-day greeting.
 *
 * @param date - Date used to choose the greeting.
 * @returns Morning, afternoon, or evening greeting text.
 */
export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Builds the boot summary shown when the terminal starts.
 *
 * @param todos - Raw todo.txt lines.
 * @param today - Current local date in `YYYY-MM-DD` format.
 * @param greeting - Greeting text for the current time of day.
 * @returns Grouped terminal output and the source ids shown in the summary.
 */
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
    terminalOutput.boot("↗ headway"),
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
      terminalOutput.heading(heading),
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
