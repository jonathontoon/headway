import { useCallback, useEffect, useReducer, useRef } from 'react';
import useViewportResize from '@hooks/useViewportResize';
import delay from '@utilities/delay';
import type { TerminalResponse } from '@models/terminalResponse';

export type TerminalInputCallback = (input: string) => void;

type TerminalAction =
  | { type: 'PUSH'; payload: TerminalResponse[] }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean };

type TerminalState = {
  history: TerminalResponse[];
  input: string;
  isProcessing: boolean;
};

const terminalReducer = (
  state: TerminalState,
  action: TerminalAction
): TerminalState => {
  switch (action.type) {
    case 'PUSH':
      return { ...state, history: [...state.history, ...action.payload] };
    case 'RESET':
      return { ...state, history: [] };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
  }
};

const useTerminal = (initialHistory: TerminalResponse[] = []) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [{ history, input, isProcessing }, dispatch] = useReducer(
    terminalReducer,
    {
      history: initialHistory,
      input: '',
      isProcessing: false,
    }
  );

  const [awaitingInput, setAwaitingInput] = useReducer(
    (
      _: { callback: TerminalInputCallback } | null,
      next: { callback: TerminalInputCallback } | null
    ) => next,
    null
  );

  const windowResizeEvent = useCallback(() => {
    if (terminalRef?.current) {
      const computedStyle = window.getComputedStyle(terminalRef.current);
      const paddingTop = parseInt(computedStyle.paddingTop, 10);
      const paddingBottom = parseInt(computedStyle.paddingBottom, 10);

      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight + paddingTop + paddingBottom,
        behavior: 'instant',
      });
    }
  }, [terminalRef]);

  useViewportResize(windowResizeEvent);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    windowResizeEvent();
    focusInput();
  }, [history, windowResizeEvent, focusInput]);

  const pushResponses = useCallback((responses: TerminalResponse[]) => {
    if (responses.some((r) => r.type === 'clear')) {
      dispatch({ type: 'RESET' });
    } else {
      dispatch({ type: 'PUSH', payload: responses });
    }
  }, []);

  const setInput = useCallback((value: string) => {
    dispatch({ type: 'SET_INPUT', payload: value });
  }, []);

  const setIsProcessing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: value });
  }, []);

  const pushToHistoryWithDelay = useCallback(
    async (response: TerminalResponse, delayTime: number = 0) => {
      await delay(delayTime);
      pushResponses([response]);
      return response;
    },
    [pushResponses]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_INPUT', payload: e.target.value });
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
    pushResponses,
    pushToHistoryWithDelay,
    terminalRef,
    inputRef,
    focusInput,
    handleInputChange,
  };
};

export default useTerminal;
