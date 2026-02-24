import { useCallback, useRef, useState } from 'react';

import Terminal from '@components/Terminal';

import pushResponses from '@utilities/pushResponses';
import { resolveCommand } from '@actions/registry';
import { useTerminalState, useTerminalDispatch } from '@context/TerminalContext';
import parseCommand from '@utilities/parseCommand';
import parseArguments from '@utilities/parseArguments';

const App = () => {
  const { input, isProcessing } = useTerminalState();
  const dispatch = useTerminalDispatch();

  // Keep a ref to the current input value so handleInputKeyDown doesn't need
  // `input` as a dependency (avoids recreating the callback on every keystroke).
  const inputRef = useRef(input);
  inputRef.current = input;

  // Merge command history and navigation index into a single state object so
  // arrow-key handling always sees consistent values via the functional updater.
  const [, setCmdHist] = useState<{ items: string[]; idx: number }>({
    items: [],
    idx: -1,
  });

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
        const current = inputRef.current;
        pushResponses(dispatch, [{ type: 'prompt', value: current }]);
        executePrompt(current);
        setCmdHist((prev) => ({
          items: current.trim() ? [current, ...prev.items] : prev.items,
          idx: -1,
        }));
        dispatch({ type: 'SET_INPUT', payload: '' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCmdHist((prev) => {
          const newIdx = Math.min(prev.idx + 1, prev.items.length - 1);
          dispatch({ type: 'SET_INPUT', payload: prev.items[newIdx] ?? '' });
          return { ...prev, idx: newIdx };
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCmdHist((prev) => {
          const newIdx = prev.idx - 1;
          dispatch({ type: 'SET_INPUT', payload: newIdx < 0 ? '' : (prev.items[newIdx] ?? '') });
          return { ...prev, idx: newIdx };
        });
      }
    },
    [executePrompt, dispatch]
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
