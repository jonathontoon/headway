/**
 * Extracts arguments from a prompt string after removing the command.
 * @param {string} prompt - The full command string
 * @param {string} command - The command to remove from the prompt
 * @returns {string[]} Array of argument strings
 */
const parseArguments = (prompt: string, command: string): string[] => {
  const argumentString: string = prompt.trim().slice(command.length).trim()

  if (!argumentString) {
    return []
  }

  const args: string[] = []
  let currentArg: string = ""
  let inQuotes: boolean = false

  for (let i = 0; i < argumentString.length; i++) {
    const char = argumentString[i]

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes
      continue
    }

    if (char === " " && !inQuotes) {
      if (currentArg) {
        args.push(currentArg)
        currentArg = ""
      }
    } else {
      currentArg += char
    }
  }

  if (currentArg) {
    args.push(currentArg)
  }

  return args
}

export default parseArguments
