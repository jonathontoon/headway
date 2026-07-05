import { THEME_ID_SEPARATOR } from "../../constants";

export type Theme = {
  readonly name: string;
  readonly variant: string;
  readonly background: string;
  readonly foreground: string;
  readonly colors: string[];
};

export function themeId(theme: Pick<Theme, "name" | "variant">): string {
  return `${theme.name}${THEME_ID_SEPARATOR}${theme.variant}`;
}
