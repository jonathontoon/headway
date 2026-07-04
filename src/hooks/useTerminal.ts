import { useContext } from 'react'
import { TerminalContext } from '../contexts/TerminalContext'

export function useTerminal() {
  const terminal = useContext(TerminalContext)

  if (!terminal) {
    throw new Error('useTerminal must be used within a TerminalProvider')
  }

  return terminal
}
