import type { TerminalResponse } from '@models/terminalResponse';

export type HistoryItem = TerminalResponse & { id: string };

let _nextId = 0;
const withIds = (items: TerminalResponse[]): HistoryItem[] =>
  items.map((item) => ({ ...item, id: String(_nextId++) }));

export type TerminalAction =
  | { type: 'PUSH'; payload: TerminalResponse[] }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean };

export type TerminalState = {
  history: HistoryItem[];
  input: string;
  isProcessing: boolean;
};

export const INITIAL_STATE: TerminalState = {
  history: withIds([{ type: 'logo' }, { type: 'intro' }]),
  input: '',
  isProcessing: false,
};

export const terminalReducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'PUSH':
      return { ...state, history: [...state.history, ...withIds(action.payload)] };
    case 'RESET':
      return { ...state, history: [] };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
  }
};
