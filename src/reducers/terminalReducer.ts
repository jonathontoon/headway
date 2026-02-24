import type { TerminalResponse } from '@models/terminalResponse';

export type TerminalAction =
  | { type: 'PUSH'; payload: TerminalResponse[] }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean };

export type TerminalState = {
  history: TerminalResponse[];
  input: string;
  isProcessing: boolean;
};

export const INITIAL_STATE: TerminalState = {
  history: [{ type: 'logo' }, { type: 'intro' }],
  input: '',
  isProcessing: false,
};

export const terminalReducer = (state: TerminalState, action: TerminalAction): TerminalState => {
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
