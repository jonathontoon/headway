import { describe, expect, it } from 'vitest'
import { formatValue, runCommand } from './terminalCommands'

describe('terminalCommands', () => {
  it('returns undefined for empty commands', () => {
    expect(runCommand('   ')).toBeUndefined()
  })

  it('prints built-in help text', () => {
    expect(runCommand('help')).toBe(
      'Commands: help, clear, echo <text>. JavaScript expressions also work.',
    )
  })

  it('echoes text without evaluating it', () => {
    expect(runCommand('echo hello world')).toBe('hello world')
  })

  it('evaluates JavaScript expressions and formats values', () => {
    expect(runCommand('1 + 1')).toBe('2')
    expect(runCommand('({ ok: true })')).toBe('{"ok":true}')
  })

  it('formats strings and undefined explicitly', () => {
    expect(formatValue('hello')).toBe('hello')
    expect(formatValue(undefined)).toBe('undefined')
  })

  it('returns a readable error when evaluation fails', () => {
    expect(runCommand('doesNotExist')).toMatch(/^ReferenceError:/)
  })
})
