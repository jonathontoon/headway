// Terminal UI
export const TERMINAL_PROMPT = "~$";

// Command keywords
export const COMMANDS = {
  help: "help",
  clear: "clear",
  echo: "echo ",
  theme: "theme",
} as const;

export const HELP_TEXT = [
  "TASKS",
  'add "text [+Project] [due:DATE] [@tag]" - add a task',
  "edit <id> - open task in $EDITOR",
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
  'list [+Project|@tag|"keyword"] - list incomplete tasks',
  "inbox - tasks with no due date and no project",
  "today - due today, plus overdue",
  "upcoming - future-dated tasks",
  "someday - project tasks with no due date",
  "archive - completed tasks",
  "projects - list all projects",
  "",
  "OTHER",
  "stats - summary counts",
  "export - print canonical todo.txt",
  "import <todo.txt lines> - replace stored tasks",
  "theme - print the current theme name",
  "theme set <name> - switch themes",
  "theme random <dark|light> - switch to a random theme with that mode",
  "clear - clear terminal output",
  "echo <text> - print text",
  "donate - donation link",
].join("\n");

// Keyboard navigation
export const KEYBOARD_KEYS = {
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
} as const;

export const THEME_COMMAND_PREFIX_LENGTH = 6; // 'theme '.length

// Theme command error messages
export const THEME_ERROR_MESSAGES = {
  themeNotFound: (name: string) =>
    `Theme "${name}" not found. Use "theme random dark" or "theme random light" to discover themes.`,
  themeSetWithoutVariant: (name: string) => `Theme set to ${name}.`,
  randomModeRequired: "Usage: theme random <dark|light>.",
  setNameRequired: "Usage: theme set <name>.",
  unsupportedThemeCommand:
    'Unsupported theme command. Use "theme", "theme set <name>", or "theme random <dark|light>".',
} as const;
