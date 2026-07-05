import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { DEFAULT_THEMES } from './defaultThemes'
import { ThemeContext, type ThemeStore } from './themeContext'
import type { Theme } from './types'

function applyTheme(theme: Theme) {
  const style = document.documentElement.style
  style.setProperty('--background', theme.background)
  style.setProperty('--foreground', theme.foreground)
  theme.colors.forEach((color, i) => style.setProperty(`--color${i}`, color))
}

function readStoredTheme(): { name: string; variant: string } {
  try {
    const stored = localStorage.getItem('headway-theme')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.name && parsed.variant) return parsed
    }
  } catch {
    // ignore
  }
  return { name: 'default', variant: 'default' }
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(
      'headway-theme',
      JSON.stringify({ name: theme.name, variant: theme.variant }),
    )
  } catch {
    // ignore in environments without localStorage
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeKey, setThemeKey] = useState<{ name: string; variant: string }>(
    readStoredTheme,
  )
  const [customTheme, setCustomTheme] = useState<Theme | null>(null)

  const theme = useMemo<Theme>(() => {
    if (customTheme) return customTheme
    return (
      DEFAULT_THEMES.find(
        (t) => t.name === themeKey.name && t.variant === themeKey.variant,
      ) ?? DEFAULT_THEMES[0]
    )
  }, [themeKey, customTheme])

  useEffect(() => {
    applyTheme(theme)
    writeStoredTheme(theme)
  }, [theme])

  const store = useMemo<ThemeStore>(
    () => ({
      theme,
      themes: DEFAULT_THEMES,
      setTheme(name: string, variant: string) {
        setCustomTheme(null)
        setThemeKey({ name, variant })
      },
      importTheme(imported: Theme) {
        setCustomTheme(imported)
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={store}>{children}</ThemeContext.Provider>
}
