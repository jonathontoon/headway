export function formatValue(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function runCommand(command: string): string | undefined {
  const trimmedCommand = command.trim()

  if (trimmedCommand === '') {
    return undefined
  }

  if (trimmedCommand === 'help') {
    return 'Commands: help, clear, echo <text>, theme [name], theme import <alacritty-toml>. JavaScript expressions also work.'
  }

  if (trimmedCommand.startsWith('echo ')) {
    return trimmedCommand.slice(5)
  }

  try {
    const evaluate = Function(`"use strict"; return (${trimmedCommand})`)
    return formatValue(evaluate())
  } catch (error) {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error)
  }
}
