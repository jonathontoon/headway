import { Fragment, useCallback } from "react";

import LogoResponse from "@common/LogoResponse";
import IntroResponse from "@common/IntroResponse";
import Terminal from "@common/Terminal";

import pushCommandToHistory from "@commands/pushCommandToHistory";
import addCommand from "@commands/addCommand";
import listCommand from "@commands/listCommand";
import doneCommand from "@commands/doneCommand";
import deleteCommand from "@commands/deleteCommand";
import clearCommand from "@commands/clearCommand";
import helpCommand from "@commands/helpCommand";
import defaultCommand from "@commands/defaultCommand";

import useTerminal from "@hooks/useTerminal";

import parseCommand from "@utilities/parseCommand";
import parseArguments from "@utilities/parseArguments";
import argumentAtIndex from "@utilities/argumentAtIndex";

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
    handleInputChange
  } = useTerminal([
    <Fragment>
      <LogoResponse />
      <IntroResponse />
    </Fragment>
  ]);

  /**
   * Executes the appropriate command handler based on the input prompt.
   */
  const executePrompt = useCallback(
    async (prompt: string) => {
      const command = parseCommand(prompt);
      const args = parseArguments(prompt, command);

      switch (command) {
        case "add":
        case "a":
          await addCommand(
            args.join(" "),
            pushToHistory
          );
          break;
        case "list":
        case "ls":
          await listCommand(
            argumentAtIndex(args, 0),
            pushToHistory
          );
          break;
        case "done":
          await doneCommand(
            argumentAtIndex(args, 0),
            pushToHistory
          );
          break;
        case "delete":
        case "rm":
          await deleteCommand(
            argumentAtIndex(args, 0),
            pushToHistory
          );
          break;
        case "clear":
          await clearCommand(resetTerminal);
          break;
        case "help":
          await helpCommand(pushToHistory);
          break;
        default:
          await defaultCommand(command, pushToHistory);
          break;
      }
    },
    [
      addCommand,
      listCommand,
      doneCommand,
      deleteCommand,
      clearCommand,
      helpCommand,
      pushToHistory,
      resetTerminal
    ]
  );

  /**
   * Handles keyboard events in the input field, specifically the Enter key
   * for command execution or input completion.
   */
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (awaitingInput) {
          pushCommandToHistory(input, pushToHistory);
          awaitingInput.callback(input);
        } else {
          pushCommandToHistory(input, pushToHistory);
          executePrompt(input);
        }
        setInput("");
      }
    },
    [executePrompt, input, pushCommandToHistory, awaitingInput, pushToHistory, setInput]
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
