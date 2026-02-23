import type { TerminalResponse } from '@models/terminalResponse';

const pushCommandToHistory = (
  command: string,
  pushResponses: (responses: TerminalResponse[]) => void
) => {
  pushResponses([{ type: 'prompt', value: command }]);
};

export default pushCommandToHistory;
