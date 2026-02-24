import type { TerminalResponse } from '@models/terminalResponse';

const helpCommand = (): TerminalResponse => ({ type: 'help' });

export default helpCommand;
