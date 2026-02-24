import type { TerminalResponse } from "../../types/terminal-response";

const defaultCommand = (commandName: string): TerminalResponse => ({
  type: "default",
  commandName,
  hintText: "Type 'help' for available commands.",
});

export default defaultCommand;
