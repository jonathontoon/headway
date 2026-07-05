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

export const HELP_TEXT =
  "Commands: help, clear, echo <text>, theme [name], theme import <alacritty-toml>. JavaScript expressions also work.";

// Keyboard navigation
export const KEYBOARD_KEYS = {
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
} as const;

// Command parsing
export const ECHO_COMMAND_PREFIX_LENGTH = 5; // 'echo '.length
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
