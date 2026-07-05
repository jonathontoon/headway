import {
  COMMANDS,
  HELP_TEXT,
  ECHO_COMMAND_PREFIX_LENGTH,
} from "../../constants";

export function formatValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function runCommand(command: string): string | undefined {
  const trimmedCommand = command.trim();

  if (trimmedCommand === "") {
    return undefined;
  }

  if (trimmedCommand === COMMANDS.help) {
    return HELP_TEXT;
  }

  if (trimmedCommand.startsWith(COMMANDS.echo)) {
    return trimmedCommand.slice(ECHO_COMMAND_PREFIX_LENGTH);
  }

  try {
    const evaluate = Function(`"use strict"; return (${trimmedCommand})`);
    return formatValue(evaluate());
  } catch (error) {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
  }
}
