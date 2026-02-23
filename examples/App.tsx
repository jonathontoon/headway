import { Fragment, useCallback, useState, useRef } from "react";

import LogoResponse from "@organisms/LogoResponse.tsx";
import IntroResponse from "@organisms/IntroResponse.tsx";
import Terminal from "@organisms/Terminal.tsx";

import pushCommandToHistory from "@commands/pushCommandToHistory.tsx";
import handleDefaultCommand from "@commands/defaultCommand.tsx";
import handleStartCommand from "@commands/startCommand.tsx";
import handleCountdownCommand from "@commands/countdownCommand.tsx";
import handleEchoCommand from "@commands/echoCommand.tsx";
import handleClearCommand from "@commands/clearCommand.tsx";
import handleHelpCommand from "@commands/helpCommand.tsx";
import handleCompleteCommand from "@commands/completeCommand.tsx";
import handleVersionCommand from "@commands/versionCommand.tsx";

import useTerminal from "@hooks/useTerminal.ts";
import useDispatchEvent from "@hooks/useDispatchEvent.ts";

import parseCommand from "@utilities/parseCommand.ts";
import parseArguments from "@utilities/parseArguments.ts";
import argumentAtIndex from "@utilities/argumentAtIndex.ts";

const App = () => {
  const {
    history,
    input,
    isProcessing,
    awaitingInput,
    setInput,
    setIsProcessing,
    setAwaitingInput,
    pushToHistory,
    pushToHistoryWithDelay,
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

  useDispatchEvent("react-loaded");

  /**
   * Executes the appropriate command handler based on the input prompt.
   * @param {string} prompt - The full command string to execute
   */
  const executePrompt = useCallback(
    async (prompt: string) => {
      const command = parseCommand(prompt);
      const args = parseArguments(prompt, command);

      switch (command) {
        case "start":
          await handleStartCommand(pushToHistory);
          break;
        case "countdown":
          await handleCountdownCommand(
            argumentAtIndex(args, 0), 
            pushToHistory, 
            setIsProcessing, 
            pushToHistoryWithDelay
          );
          break;
        case "echo":
          await handleEchoCommand(args, pushToHistory);
          break;
        case "clear":
          await handleClearCommand(resetTerminal);
          break;
        case "complete":
          await handleCompleteCommand(
            setIsProcessing, 
            pushToHistory, 
            setAwaitingInput
          );
          break;
        case "help":
          await handleHelpCommand(pushToHistory);
          break;
        case "version":
          await handleVersionCommand(pushToHistory);
          break;
        default:
          await handleDefaultCommand(
            command, 
            pushToHistory
          );
          break;
      }
    },
    [
      handleStartCommand,
      handleCountdownCommand,
      handleEchoCommand,
      handleClearCommand,
      handleDefaultCommand,
      handleCompleteCommand,
      handleHelpCommand,
      handleVersionCommand
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
    <Terminal
      history={history}
      input={input}
      inputRef={inputRef}
      terminalRef={terminalRef}
      onInputChange={handleInputChange}
      onInputKeyDown={handleInputKeyDown}
      hidden={isProcessing && !awaitingInput}
    />
  );
};

export default App;
