import type { TerminalResponse } from '@models/terminalResponse';

const defaultCommand = (commandName: string): TerminalResponse => ({
  type: 'default',
  commandName,
  hintText: "Type 'help' for available commands.",
});

export default defaultCommand;
