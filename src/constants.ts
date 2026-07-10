// Terminal UI
export const TERMINAL_PROMPT = "~$";

// Command keywords
export const COMMANDS = {
  help: "help",
} as const;

export const HELP_TEXT = [
  "TASKS",
  'add "text [+Project] [due:DATE] [@tag]" - add a task',
  "edit <id> <text> - replace task line directly",
  "show <id> - print full detail for one task",
  "delete <id> [<id>...] - delete permanently",
  "",
  "STATUS",
  "complete <id> [<id>...] - mark done (priority -> pri:A)",
  "undo <id> [<id>...] - unmark (restores priority)",
  "",
  "ATTRIBUTES",
  "due <id> <YYYY-MM-DD> - set or update due date",
  "priority <id> <A-Z> - set or update priority",
  "tag <id> @tag [@tag...] - add context tag(s)",
  "project <id> +Project - assign task to a project",
  "clear due|priority|tags|project <id> [<id>...] - clear attributes",
  "",
  "VIEWS",
  "list                         list incomplete tasks",
  "list today                   due today and overdue",
  "list upcoming                future-dated tasks",
  "list inbox                   no due date and no project",
  "list someday                 project tasks with no due date",
  'list +Project|@tag|"keyword"     filter incomplete tasks',
  "",
  "archive                      completed tasks",
  "projects                     list all projects",
  "",
  "OTHER",
  "stats - summary counts",
  "donate - donation link",
].join("\n");

// Output classification, used by terminalFormat to color message lines.
// Keep in sync with the message templates in src/store/todos/commands.ts.
export const SUCCESS_PREFIXES = [
  "Added:",
  "Updated:",
  "Deleted:",
  "Completed:",
  "Reopened:",
] as const;

export const MUTED_PATTERN =
  /\b(empty|is clear|No |not a recognized command|not found)\b/i;

export const SECONDARY_LINE_PREFIXES = [
  "created:",
  "If it's saved you time",
] as const;

// Keyboard navigation
export const KEYBOARD_KEYS = {
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  tab: "Tab",
} as const;

// First-word command verbs, used for Tab completion
export const COMMAND_VERBS = [
  "add",
  "edit",
  "show",
  "delete",
  "complete",
  "undo",
  "due",
  "priority",
  "tag",
  "project",
  "clear",
  "list",
  "inbox",
  "today",
  "upcoming",
  "someday",
  "archive",
  "projects",
  "stats",
  "donate",
  "help",
] as const;

// Second-word subcommand verbs, keyed by first-word command, used for Tab completion
export const SUBCOMMAND_VERBS: Readonly<Record<string, readonly string[]>> = {
  clear: ["due", "priority", "tags", "project"],
  list: ["today", "upcoming", "inbox", "someday"],
};
