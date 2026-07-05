import { parseAlacrittyToml } from "./parseTheme";
import { themeId, type Theme } from "./types";
import {
  COMMANDS,
  THEME_ERROR_MESSAGES,
  THEME_COMMAND_PREFIX_LENGTH,
  THEME_IMPORT_COMMAND_PREFIX_LENGTH,
} from "../../constants";

type ThemeCommandContext = {
  themes: readonly Theme[];
  currentTheme: Theme;
  setTheme: (name: string, variant: string) => void;
  importTheme: (theme: Theme) => void;
};

function groupByName(themes: readonly Theme[]): Map<string, readonly Theme[]> {
  const map = new Map<string, Theme[]>();
  for (const t of themes) {
    const group = map.get(t.name) ?? [];
    group.push(t);
    map.set(t.name, group);
  }
  return map;
}

function formatList(themes: readonly Theme[], currentId: string): string {
  const groups = groupByName(themes);
  const nameWidth = Math.max(...[...groups.keys()].map((n) => n.length));

  return [...groups.entries()]
    .map(([name, variants]) => {
      const variantStr = variants
        .map((t) => (themeId(t) === currentId ? `${t.variant}*` : t.variant))
        .join("  ");
      return `  ${name.padEnd(nameWidth)}  ${variantStr}`;
    })
    .join("\n");
}

export function handleThemeCommand(
  command: string,
  ctx: ThemeCommandContext,
): string | undefined {
  const trimmed = command.trim();
  const currentId = themeId(ctx.currentTheme);

  if (trimmed === COMMANDS.theme) {
    return formatList(ctx.themes, currentId);
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

    const matches = ctx.themes.filter((t) => t.name === name);

    if (matches.length === 0) {
      return THEME_ERROR_MESSAGES.themeNotFound(name);
    }

    if (variant) {
      const found = matches.find((t) => t.variant === variant);
      if (!found) {
        const available = matches.map((t) => t.variant).join(", ");
        return THEME_ERROR_MESSAGES.variantNotFound(variant, name, available);
      }
      ctx.setTheme(name, variant);
      return THEME_ERROR_MESSAGES.themeSet(name, variant);
    }

    // No variant specified
    if (matches.length === 1) {
      ctx.setTheme(name, matches[0].variant);
      return THEME_ERROR_MESSAGES.themeSetWithoutVariant(name);
    }

    const variantList = matches.map((t) => t.variant).join(", ");
    return THEME_ERROR_MESSAGES.variantsList(name, variantList);
  }

  return undefined;
}
