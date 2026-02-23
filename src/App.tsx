import { useCallback } from 'react';

import Terminal from '@common/Terminal';

import pushCommandToHistory from '@utilities/pushCommandToHistory';
import pushResponses from '@utilities/pushResponses';
import { resolveCommand } from '@commands/registry';
import { useTerminalState, useTerminalDispatch } from '@context/TerminalContext';
import parseCommand from '@utilities/parseCommand';
import parseArguments from '@utilities/parseArguments';

const App = () => {
  const { input, isProcessing, awaitingInput } = useTerminalState();
  const dispatch = useTerminalDispatch();

  const executePrompt = useCallback(
    (prompt: string) => {
      const command = parseCommand(prompt);
      const args = parseArguments(prompt, command);
      const responses = resolveCommand(command, args);
      pushResponses(dispatch, responses);
    },
    [dispatch]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_INPUT', payload: e.target.value });
  }, [dispatch]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (awaitingInput) {
          pushCommandToHistory(input, (responses) => pushResponses(dispatch, responses));
          awaitingInput.callback(input);
        } else {
          pushCommandToHistory(input, (responses) => pushResponses(dispatch, responses));
          executePrompt(input);
        }
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
    },
    [executePrompt, input, awaitingInput, dispatch]
  );

  return (
    <div className="w-screen h-dvh bg-black">
      <Terminal
        onInputChange={handleInputChange}
        onInputKeyDown={handleInputKeyDown}
        hidden={isProcessing && !awaitingInput}
      />
    </div>
  );
};

export default App;
