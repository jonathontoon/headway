/**
 * Extracts the command from a full prompt string.
 * @param {string} prompt - The full command string
 * @returns {string} The command portion of the prompt
 */
const parseCommand = (prompt: string): string => {
  return prompt.trim().split(/\s+/)[0].toLowerCase()
}

export default parseCommand
