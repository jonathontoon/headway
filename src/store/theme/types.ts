export const THEME_ROLE_NAMES = [
  "error",
  "warning",
  "success",
  "info",
  "accent",
  "context",
  "command",
  "muted",
] as const;

export type ThemeRoleName = (typeof THEME_ROLE_NAMES)[number];

// number = index into Theme.colors; string = literal hex resolved at
// generation time (foreground fallback or contrast blend).
export type ThemeRoleValue = number | string;

export type ThemeRoles = Readonly<Record<ThemeRoleName, ThemeRoleValue>>;

export type Theme = {
  readonly name: string;
  readonly background: string;
  readonly foreground: string;
  readonly colors: string[];
  readonly roles: ThemeRoles;
};
