import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';

import useViewportResize from '@hooks/useViewportResize';

import type { TerminalAction, TerminalState } from '@reducers/terminalReducer';
import { terminalReducer, INITIAL_STATE } from '@reducers/terminalReducer';

export type { TerminalAction, TerminalState } from '@reducers/terminalReducer';

const TerminalStateContext = createContext<TerminalState | undefined>(undefined);
const TerminalDispatchContext = createContext<React.Dispatch<TerminalAction> | undefined>(undefined);
const TerminalRefsContext = createContext<{
  terminalRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
} | undefined>(undefined);

interface TerminalProviderProps {
  children: ReactNode;
}

export const TerminalProvider = ({ children }: TerminalProviderProps) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [state, dispatch] = useReducer(terminalReducer, INITIAL_STATE);

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
  }, []);

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
  }, [state.history, windowResizeEvent, focusInput]);

  return (
    <TerminalStateContext.Provider value={state}>
      <TerminalDispatchContext.Provider value={dispatch}>
        <TerminalRefsContext.Provider value={{ terminalRef, inputRef }}>
          {children}
        </TerminalRefsContext.Provider>
      </TerminalDispatchContext.Provider>
    </TerminalStateContext.Provider>
  );
};

export const useTerminalState = (): TerminalState => {
  const context = useContext(TerminalStateContext);
  if (context === undefined) {
    throw new Error('useTerminalState must be used within a TerminalProvider');
  }
  return context;
};

export const useTerminalDispatch = () => {
  const context = useContext(TerminalDispatchContext);
  if (context === undefined) {
    throw new Error('useTerminalDispatch must be used within a TerminalProvider');
  }
  return context;
};

export const useTerminalRefs = () => {
  const context = useContext(TerminalRefsContext);
  if (context === undefined) {
    throw new Error('useTerminalRefs must be used within a TerminalProvider');
  }
  return context;
};
