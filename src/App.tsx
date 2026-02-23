import { Fragment, useCallback } from 'react';

import LogoResponse from '@common/LogoResponse';
import IntroResponse from '@common/IntroResponse';
import Terminal from '@common/Terminal';

import pushCommandToHistory from '@utilities/pushCommandToHistory';
import addCommand from '@commands/addCommand';
import listCommand from '@commands/listCommand';
import doneCommand from '@commands/doneCommand';
import deleteCommand from '@commands/deleteCommand';
import clearCommand from '@commands/clearCommand';
import helpCommand from '@commands/helpCommand';
import defaultCommand from '@commands/defaultCommand';
import priCommand from '@commands/priCommand';
import depriCommand from '@commands/depriCommand';
import appendCommand from '@commands/appendCommand';
import prependCommand from '@commands/prependCommand';
import replaceCommand from '@commands/replaceCommand';
import listpriCommand from '@commands/listpriCommand';
import listconCommand from '@commands/listconCommand';
import listprojCommand from '@commands/listprojCommand';
import archiveCommand from '@commands/archiveCommand';

import useTerminal from '@hooks/useTerminal';

import parseCommand from '@utilities/parseCommand';
import parseArguments from '@utilities/parseArguments';
import argumentAtIndex from '@utilities/argumentAtIndex';

const App = () => {
  const {
    history,
    input,
    isProcessing,
    awaitingInput,
    setInput,
    pushToHistory,
    terminalRef,
    inputRef,
    resetTerminal,
    handleInputChange,
  } = useTerminal([
    <Fragment>
      <LogoResponse />
      <IntroResponse />
    </Fragment>,
  ]);

  /**
   * Executes the appropriate command handler based on the input prompt.
   */
  const executePrompt = useCallback(
    async (prompt: string) => {
      const command = parseCommand(prompt);
      const args = parseArguments(prompt, command);

      switch (command) {
        case 'add':
        case 'a':
          await addCommand(args.join(' '), pushToHistory);
          break;
        case 'list':
        case 'ls':
          await listCommand(argumentAtIndex(args, 0), pushToHistory);
          break;
        case 'done':
          await doneCommand(argumentAtIndex(args, 0), pushToHistory);
          break;
        case 'delete':
        case 'rm':
          await deleteCommand(argumentAtIndex(args, 0), pushToHistory);
          break;
        case 'clear':
          await clearCommand(resetTerminal);
          break;
        case 'help':
          await helpCommand(pushToHistory);
          break;
        case 'pri':
        case 'p':
          await priCommand(args.join(' '), pushToHistory);
          break;
        case 'depri':
        case 'dp':
          await depriCommand(argumentAtIndex(args, 0), pushToHistory);
          break;
        case 'append':
        case 'app':
          await appendCommand(args.join(' '), pushToHistory);
          break;
        case 'prepend':
        case 'prep':
          await prependCommand(args.join(' '), pushToHistory);
          break;
        case 'replace':
          await replaceCommand(args.join(' '), pushToHistory);
          break;
        case 'listpri':
        case 'lsp':
          await listpriCommand(argumentAtIndex(args, 0), pushToHistory);
          break;
        case 'listcon':
        case 'lsc':
          await listconCommand(args.join(' '), pushToHistory);
          break;
        case 'listproj':
        case 'lsprj':
          await listprojCommand(args.join(' '), pushToHistory);
          break;
        case 'archive':
          await archiveCommand(args.join(' '), pushToHistory);
          break;
        default:
          await defaultCommand(command, pushToHistory);
          break;
      }
    },
    [pushToHistory, resetTerminal]
  );

  /**
   * Handles keyboard events in the input field, specifically the Enter key
   * for command execution or input completion.
   */
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (awaitingInput) {
          pushCommandToHistory(input, pushToHistory);
          awaitingInput.callback(input);
        } else {
          pushCommandToHistory(input, pushToHistory);
          executePrompt(input);
        }
        setInput('');
      }
    },
    [executePrompt, input, awaitingInput, pushToHistory, setInput]
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
