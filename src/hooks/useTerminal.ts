import { useCallback, useEffect, useState, type ReactNode, useRef } from "react";
import useViewportResize from "@hooks/useViewportResize";
import delay from "@utilities/delay";

export type TerminalHistoryItem = ReactNode | string;

export type TerminalHistory = TerminalHistoryItem[];

export type TerminalCommands = {
  [command: string]: () => void;
};

export type TerminalProps = {
  history: TerminalHistory;
  promptLabel?: TerminalHistoryItem;
  commands: TerminalCommands;
};

export type TerminalInputCallback = (input: string) => void;

const useTerminal = (initialHistory: TerminalHistory = []) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [history, setHistory] = useState<TerminalHistory>(initialHistory);
  const [input, setInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [awaitingInput, setAwaitingInput] = useState<{
    callback: TerminalInputCallback;
  } | null>(null);

  const windowResizeEvent = useCallback(() => {
    if (terminalRef?.current) {
      const computedStyle = window.getComputedStyle(terminalRef.current);
      const paddingTop = parseInt(computedStyle.paddingTop, 10);
      const paddingBottom = parseInt(computedStyle.paddingBottom, 10);

      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight + paddingTop + paddingBottom,
        behavior: "instant"
      });
    }
  }, [terminalRef]);

  useViewportResize(windowResizeEvent);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Focus input when terminal is ready
   */
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  /**
   * Scroll to the bottom of the terminal on every new history item
   */
  useEffect(() => {
    windowResizeEvent();
    focusInput();
  }, [history, windowResizeEvent, focusInput]);

  const pushToHistory = useCallback((item: TerminalHistoryItem) => {
    setHistory((old) => [...old, item]);
  }, []);

  /**
   * Write text to terminal with optional delay
   */
  const pushToHistoryWithDelay = useCallback(
    async (content: ReactNode, delayTime: number = 0) => {
      await delay(delayTime);
      pushToHistory(content);
      return content;
    },
    [pushToHistory]
  );

  /**
   * Reset the terminal window
   */
  const resetTerminal = useCallback(() => {
    setHistory([]);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  return {
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
    focusInput,
    handleInputChange
  };
};

export default useTerminal;
