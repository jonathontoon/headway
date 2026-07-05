import { parseAlacrittyToml } from "./parseTheme";
import type { Theme, ThemeFamily } from "./types";
import {
  COMMANDS,
  THEME_ERROR_MESSAGES,
  THEME_COMMAND_PREFIX_LENGTH,
  THEME_IMPORT_COMMAND_PREFIX_LENGTH,
} from "../../constants";

type ThemeCommandContext = {
  themes: readonly ThemeFamily[];
  currentTheme: Theme;
  setTheme: (name: string) => void;
  importTheme: (theme: Theme) => void;
};

function formatList(
  themes: readonly ThemeFamily[],
  currentName: string,
): string {
  const nameWidth = Math.max(...themes.map((t) => t.name.length));

  return themes
    .map((theme) => {
      const marker = theme.name === currentName ? "*" : " ";
      return `${marker} ${theme.name.padEnd(nameWidth)}`;
    })
    .join("\n");
}

export function handleThemeCommand(
  command: string,
  ctx: ThemeCommandContext,
): string | undefined {
  const trimmed = command.trim();

  if (trimmed === COMMANDS.theme) {
    return formatList(ctx.themes, ctx.currentTheme.name);
  }

  if (trimmed.startsWith(COMMANDS.themeImport)) {
    const raw = trimmed.slice(THEME_IMPORT_COMMAND_PREFIX_LENGTH);
    const parsed = parseAlacrittyToml(raw);
    if (!parsed) {
      return THEME_ERROR_MESSAGES.invalidAlacrittyFormat;
    }
    ctx.importTheme(parsed);
    return THEME_ERROR_MESSAGES.themeImported;
  }

  if (trimmed.startsWith(COMMANDS.theme)) {
    const args = trimmed.slice(THEME_COMMAND_PREFIX_LENGTH).trim().split(/\s+/);
    const [name, variant] = args;

    const found = ctx.themes.find((t) => t.name === name);

    if (!found) {
      return THEME_ERROR_MESSAGES.themeNotFound(name);
    }

    if (variant) {
      return THEME_ERROR_MESSAGES.manualVariantsNotSupported;
    }

    ctx.setTheme(name);
    return THEME_ERROR_MESSAGES.themeSetWithoutVariant(name);
  }

  return undefined;
}
