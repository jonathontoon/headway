import { parseAlacrittyToml } from './parseTheme'
import { themeId, type Theme } from './types'

type ThemeCommandContext = {
  themes: readonly Theme[]
  currentTheme: Theme
  setTheme: (name: string, variant: string) => void
  importTheme: (theme: Theme) => void
}

function groupByName(themes: readonly Theme[]): Map<string, readonly Theme[]> {
  const map = new Map<string, Theme[]>()
  for (const t of themes) {
    const group = map.get(t.name) ?? []
    group.push(t)
    map.set(t.name, group)
  }
  return map
}

function formatList(themes: readonly Theme[], currentId: string): string {
  const groups = groupByName(themes)
  const nameWidth = Math.max(...[...groups.keys()].map((n) => n.length))

  return [...groups.entries()]
    .map(([name, variants]) => {
      const variantStr = variants
        .map((t) => (themeId(t) === currentId ? `${t.variant}*` : t.variant))
        .join('  ')
      return `  ${name.padEnd(nameWidth)}  ${variantStr}`
    })
    .join('\n')
}

export function handleThemeCommand(
  command: string,
  ctx: ThemeCommandContext,
): string | undefined {
  const trimmed = command.trim()
  const currentId = themeId(ctx.currentTheme)

  if (trimmed === 'theme') {
    return formatList(ctx.themes, currentId)
  }

  if (trimmed.startsWith('theme import ')) {
    const raw = trimmed.slice('theme import '.length)
    const parsed = parseAlacrittyToml(raw)
    if (!parsed) {
      return 'Error: could not parse theme. Paste an Alacritty .toml file from terminalcolors.com.'
    }
    ctx.importTheme(parsed)
    return 'Theme imported.'
  }

  if (trimmed.startsWith('theme ')) {
    const args = trimmed.slice('theme '.length).trim().split(/\s+/)
    const [name, variant] = args

    const matches = ctx.themes.filter((t) => t.name === name)

    if (matches.length === 0) {
      return `Theme "${name}" not found. Run "theme" to list available themes.`
    }

    if (variant) {
      const found = matches.find((t) => t.variant === variant)
      if (!found) {
        const available = matches.map((t) => t.variant).join(', ')
        return `Variant "${variant}" not found for ${name}. Available: ${available}.`
      }
      ctx.setTheme(name, variant)
      return `Theme set to ${name} ${variant}.`
    }

    // No variant specified
    if (matches.length === 1) {
      ctx.setTheme(name, matches[0].variant)
      return `Theme set to ${name}.`
    }

    const variantList = matches.map((t) => t.variant).join(', ')
    return `${name} variants: ${variantList}. Use "theme ${name} <variant>" to switch.`
  }

  return undefined
}
