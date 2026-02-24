/**
 * Extracts the command from a full prompt string.
 */
export const parseCommand = (prompt: string): string =>
  prompt.trim().split(/\s+/)[0].toLowerCase();

/**
 * Extracts arguments from a prompt string after removing the command.
 */
export const parseArguments = (prompt: string, command: string): string[] => {
  const argumentString: string = prompt.trim().slice(command.length).trim();

  if (!argumentString) {
    return [];
  }

  const args: string[] = [];
  let currentChars: string[] = [];
  let inQuotes: boolean = false;

  for (let i = 0; i < argumentString.length; i++) {
    const char = argumentString[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === " " && !inQuotes) {
      if (currentChars.length > 0) {
        args.push(currentChars.join(""));
        currentChars = [];
      }
    } else {
      currentChars.push(char);
    }
  }

  if (currentChars.length > 0) {
    args.push(currentChars.join(""));
  }

  return args;
};
