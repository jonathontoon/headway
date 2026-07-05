import { createContext, useContext } from 'react'
import type { Theme } from './types'

export type ThemeStore = {
  readonly theme: Theme
  readonly themes: readonly Theme[]
  readonly setTheme: (name: string, variant: string) => void
  readonly importTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeStore | null>(null)

export function useTheme(): ThemeStore {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
