export type Theme = {
  readonly name: string
  readonly variant: string
  readonly background: string
  readonly foreground: string
  readonly colors: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ]
}

export function themeId(theme: Pick<Theme, 'name' | 'variant'>): string {
  return `${theme.name}/${theme.variant}`
}
