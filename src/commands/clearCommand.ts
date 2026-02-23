import type { TerminalResponse } from '@models/terminalResponse';

const clearCommand = (): TerminalResponse => ({ type: 'clear' });

export default clearCommand;
