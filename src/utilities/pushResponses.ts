import type { TerminalAction } from '@reducers/terminalReducer';
import type { TerminalResponse } from '@models/terminalResponse';

const pushResponses = (
  dispatch: React.Dispatch<TerminalAction>,
  responses: TerminalResponse[]
): void => {
  if (responses.some((r) => r.type === 'clear')) {
    dispatch({ type: 'RESET' });
  } else {
    dispatch({ type: 'PUSH', payload: responses });
  }
};

export default pushResponses;
