import {
  formatSection,
  getMetadataValue,
  parseTasks,
  type IndexedTask,
} from "./format";

function openTasksInFileOrder(
  todos: readonly string[],
): readonly IndexedTask[] {
  return parseTasks(todos).filter(({ task }) => !task.completed);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
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
): { readonly message: string; readonly view: readonly number[] } {
  const open = openTasksInFileOrder(todos);
  const overdue = open.filter(({ task }) => {
    const due = getMetadataValue(task.metadata, "due");
    return due !== undefined && due < today;
  });
  const dueToday = open.filter(
    ({ task }) => getMetadataValue(task.metadata, "due") === today,
  );
  const inbox = open.filter(
    ({ task }) =>
      task.projects.length === 0 && !getMetadataValue(task.metadata, "due"),
  );

  const lines = [
    `↗ headway v${__APP_VERSION__}`,
    `${greeting}. You have ${overdue.length} ${pluralize(
      overdue.length,
      "overdue task",
      "overdue tasks",
    )}, and ${dueToday.length} due today.`,
  ];

  let position = 1;
  let view: readonly number[] = [];

  for (const [heading, tasks] of [
    ["OVERDUE", overdue],
    ["TODAY", dueToday],
    ["INBOX", inbox],
  ] as const) {
    if (tasks.length === 0) continue;
    const section = formatSection(tasks, position);
    lines.push(heading, ...section.lines);
    view = [...view, ...section.ids];
    position += tasks.length;
  }

  lines.push("Type 'help' for all available commands.");

  return { message: lines.join("\n"), view };
}
