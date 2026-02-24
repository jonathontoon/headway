import { useCallback, useState } from 'react';

import Terminal from '@components/Terminal';

import pushResponses from '@utilities/pushResponses';
import { resolveCommand } from '@actions/registry';
import { useTerminalState, useTerminalDispatch } from '@context/TerminalContext';
import parseCommand from '@utilities/parseCommand';
import parseArguments from '@utilities/parseArguments';

const App = () => {
  const { input, isProcessing } = useTerminalState();
  const dispatch = useTerminalDispatch();

  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

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
        pushResponses(dispatch, [{ type: 'prompt', value: input }]);
        executePrompt(input);
        if (input.trim()) {
          setCmdHistory((prev) => [input, ...prev]);
        }
        setHistoryIdx(-1);
        dispatch({ type: 'SET_INPUT', payload: '' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(newIdx);
        dispatch({ type: 'SET_INPUT', payload: cmdHistory[newIdx] ?? '' });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        dispatch({ type: 'SET_INPUT', payload: newIdx < 0 ? '' : (cmdHistory[newIdx] ?? '') });
      }
    },
    [executePrompt, input, dispatch, cmdHistory, historyIdx]
  );

  return (
    <div className="w-screen h-dvh bg-black">
      <Terminal
        onInputChange={handleInputChange}
        onInputKeyDown={handleInputKeyDown}
        hidden={isProcessing}
      />
    </div>
  );
};

export default App;
