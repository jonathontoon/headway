import { useCallback } from 'react';

import Terminal from '@common/Terminal';

import pushCommandToHistory from '@utilities/pushCommandToHistory';
import { resolveCommand } from '@commands/registry';
import useTerminal from '@hooks/useTerminal';
import parseCommand from '@utilities/parseCommand';
import parseArguments from '@utilities/parseArguments';

import type { TerminalResponse } from '@models/terminalResponse';

const INITIAL_HISTORY: TerminalResponse[] = [
  { type: 'logo' },
  { type: 'intro' },
];

const App = () => {
  const {
    history,
    input,
    isProcessing,
    awaitingInput,
    setInput,
    pushResponses,
    terminalRef,
    inputRef,
    handleInputChange,
  } = useTerminal(INITIAL_HISTORY);

  const executePrompt = useCallback(
    (prompt: string) => {
      const command = parseCommand(prompt);
      const args = parseArguments(prompt, command);
      const responses = resolveCommand(command, args);
      pushResponses(responses);
    },
    [pushResponses]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (awaitingInput) {
          pushCommandToHistory(input, pushResponses);
          awaitingInput.callback(input);
        } else {
          pushCommandToHistory(input, pushResponses);
          executePrompt(input);
        }
        setInput('');
      }
    },
    [executePrompt, input, awaitingInput, pushResponses, setInput]
  );

  return (
    <div className="w-screen h-dvh bg-black">
      <Terminal
        history={history}
        input={input}
        inputRef={inputRef}
        terminalRef={terminalRef}
        onInputChange={handleInputChange}
        onInputKeyDown={handleInputKeyDown}
        hidden={isProcessing && !awaitingInput}
      />
    </div>
  );
};

export default App;
