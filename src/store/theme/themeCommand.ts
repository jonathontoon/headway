import type { Theme, ThemeFamily, ThemeMode } from "./types";
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
