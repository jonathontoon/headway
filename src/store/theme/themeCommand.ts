import {
  THEME_ROLE_NAMES,
  type Theme,
  type ThemeFamily,
  type ThemeMode,
  type ThemeRoleName,
} from "./types";
import { resolveRoleColor } from "./applyTheme";
import { contrastRatio } from "./contrast";
import {
  COMMANDS,
  THEME_ERROR_MESSAGES,
  THEME_COMMAND_PREFIX_LENGTH,
} from "../../constants";

type ThemeCommandContext = {
  themes: readonly ThemeFamily[];
  currentTheme: Theme;
  setTheme: (name: string) => void;
  random?: () => number;
};

const ANSI_COLOR_ROLES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "bright black",
  "bright red",
  "bright green",
  "bright yellow",
  "bright blue",
  "bright magenta",
  "bright cyan",
  "bright white",
] as const;

const HEADWAY_COLOR_USAGE = [
  "available as text-terminal-0",
  "default source for role error",
  "default source for role success",
  "default source for roles warning and command",
  "default source for role context",
  "default source for role info",
  "default source for role accent",
  "available as text-terminal-7",
  "default source for role muted",
  "fallback source for roles error and warning",
  "fallback source for role success",
  "fallback source for roles warning and command",
  "fallback source for roles context, info, and accent",
  "fallback source for roles info and context",
  "fallback source for roles success, accent, and command",
  "available as text-terminal-15",
] as const;

const ROLE_USAGE: Record<ThemeRoleName, string> = {
  error: "errors, overdue dates, priority A, donation heart",
  warning: "warnings, due today, priority B",
  success: "success messages, completed stats, priority C",
  info: "future due dates, upcoming stats",
  accent: "projects, prompt prefix, URLs, help arguments",
  context: "context tags",
  command: "help command names, prompt suffix, boot arrow",
  muted: "task ids, section headers, help descriptions, priorities D-Z",
};

const HYPER_COLOR_SOURCE_USAGE = [
  "terminal.ansiBlack",
  "inferred from red token color #e06c75",
  "terminal.ansiGreen",
  "inferred from yellow token color #e0c285",
  "inferred from blue token color #52adf2",
  "inferred from magenta token color #d55fde",
  "inferred from cyan token color #57b6c2",
  "inferred from white token color #ffffff",
  "inferred from comment/muted token color #5c6370",
  "inferred from red token color #ef596f",
  "inferred from green token color #89ca78",
  "inferred from terminal.ansiYellow / yellow token color #e5c07b",
  "inferred from info/blue token color #6796e6",
  "inferred from magenta token color #c679dd",
  "inferred from terminal.ansiBlue-adjacent cyan token color #2bbac5",
  "inferred from activityBarBadge.foreground #f8fafd",
] as const;

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === "dark" || value === "light";
}

function randomThemeName(
  themes: readonly ThemeFamily[],
  mode: ThemeMode,
  random: () => number,
): string | null {
  const candidates = themes.filter((theme) => theme[mode]);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)]?.name ?? null;
}

function themeSourceUsage(theme: Theme, index: number): string {
  if (theme.name === "hyper") {
    return HYPER_COLOR_SOURCE_USAGE[index] ?? "inferred from Hyper source";
  }

  return "theme palette color";
}

function formatThemeTest(theme: Theme): string {
  const lines = [
    `Theme ${theme.name} (${theme.mode})`,
    `background ${theme.background}: app background; source: ${theme.name === "hyper" ? "editor.background / activityBar.background / statusBar.background" : "theme background"}`,
    `foreground ${theme.foreground}: default app text and terminal output; source: ${theme.name === "hyper" ? "terminal.foreground" : "theme foreground"}`,
  ];

  theme.colors.forEach((color, index) => {
    lines.push(
      `color${index} ${color}: ANSI ${ANSI_COLOR_ROLES[index]}; Headway use: ${HEADWAY_COLOR_USAGE[index]}; source: ${themeSourceUsage(theme, index)}`,
    );
  });

  THEME_ROLE_NAMES.forEach((role) => {
    const value = theme.roles[role];
    const color = resolveRoleColor(theme, value);
    const source =
      typeof value === "number"
        ? `from color${value}`
        : value === theme.foreground
          ? "from foreground"
          : "blended for contrast";
    const ratio = contrastRatio(color, theme.background).toFixed(1);
    lines.push(
      `role ${role} ${color}: ${source}; contrast ${ratio}; Headway use: ${ROLE_USAGE[role]}`,
    );
  });

  return lines.join("\n");
}

export function handleThemeCommand(
  command: string,
  ctx: ThemeCommandContext,
): string | undefined {
  const trimmed = command.trim();

  if (trimmed === COMMANDS.theme) {
    return ctx.currentTheme.name;
  }

  if (trimmed.startsWith(COMMANDS.theme)) {
    const args = trimmed.slice(THEME_COMMAND_PREFIX_LENGTH).trim().split(/\s+/);
    const [subcommand, value, extra] = args;

    if (subcommand === "test") {
      if (value) return THEME_ERROR_MESSAGES.unsupportedThemeCommand;
      return formatThemeTest(ctx.currentTheme);
    }

    if (subcommand === "set") {
      if (!value || extra) return THEME_ERROR_MESSAGES.setNameRequired;

      const found = ctx.themes.find((theme) => theme.name === value);
      if (!found) return THEME_ERROR_MESSAGES.themeNotFound(value);

      ctx.setTheme(value);
      return THEME_ERROR_MESSAGES.themeSetWithoutVariant(value);
    }

    if (subcommand === "random") {
      if (!isThemeMode(value) || extra) {
        return THEME_ERROR_MESSAGES.randomModeRequired;
      }

      const name = randomThemeName(
        ctx.themes,
        value,
        ctx.random ?? Math.random,
      );
      if (!name) return THEME_ERROR_MESSAGES.randomModeRequired;

      ctx.setTheme(name);
      return THEME_ERROR_MESSAGES.themeSetWithoutVariant(name);
    }

    return THEME_ERROR_MESSAGES.unsupportedThemeCommand;
  }

  return undefined;
}
