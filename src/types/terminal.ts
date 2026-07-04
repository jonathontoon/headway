export type TerminalEntry = {
  readonly id: number
  readonly command: string
  readonly output?: string
}

export type TerminalState = {
  readonly entries: readonly TerminalEntry[]
  readonly command: string
  readonly historyIndex: number | null
}
