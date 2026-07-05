// Terminal UI
export const TERMINAL_PROMPT = "~$";

// Command keywords
export const COMMANDS = {
  help: "help",
  clear: "clear",
  echo: "echo ",
  theme: "theme",
  themeImport: "theme import ",
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
  "theme [name] - list or switch themes",
  "theme import <alacritty-toml> - import a theme",
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
export const THEME_IMPORT_COMMAND_PREFIX_LENGTH = 13; // 'theme import '.length

// Syntax highlighting
export const ERROR_OUTPUT_PATTERN = /^[A-Z][a-zA-Z]*Error:/;
export const SYNTAX_HIGHLIGHT_LANGUAGE = "javascript";

// Theme
export const THEME_ID_SEPARATOR = "/";
export const THEME_VARIANTS = {
  dark: "dark",
  mirage: "mirage",
  light: "light",
  mocha: "mocha",
  macchiato: "macchiato",
  frappe: "frappe",
  latte: "latte",
  default: "default",
  storm: "storm",
  moon: "moon",
} as const;

// Theme command error messages
export const THEME_ERROR_MESSAGES = {
  invalidAlacrittyFormat:
    "Error: could not parse theme. Paste an Alacritty .toml file from terminalcolors.com.",
  themeNotFound: (name: string) =>
    `Theme "${name}" not found. Run "theme" to list available themes.`,
  variantNotFound: (variant: string, name: string, available: string) =>
    `Variant "${variant}" not found for ${name}. Available: ${available}.`,
  themeSet: (name: string, variant: string) =>
    `Theme set to ${name} ${variant}.`,
  themeSetWithoutVariant: (name: string) => `Theme set to ${name}.`,
  variantsList: (name: string, variants: string) =>
    `${name} variants: ${variants}. Use "theme ${name} <variant>" to switch.`,
  themeImported: "Theme imported.",
} as const;
