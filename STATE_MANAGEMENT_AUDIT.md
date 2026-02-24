# State Management Audit & Recommendations

## Current Architecture

### What's Working Well

- **Clear separation of concerns**: Context + Reducer pattern for terminal state
- **Type safety**: Full TypeScript coverage with discriminated union types
- **Simple and focused**: Only manages what's necessary (terminal UI state)
- **Efficient dispatching**: Reducer pattern prevents unnecessary renders

### Current Structure

```
TerminalProvider (context/TerminalContext.tsx)
├── State: { history, input, isProcessing }
├── Dispatch: reducer-based actions (PUSH, RESET, SET_INPUT, SET_PROCESSING)
├── Refs: { terminalRef, inputRef }
└── Custom Hooks: useTerminalState(), useTerminalDispatch(), useTerminalRefs()

App.tsx
├── Local state: { cmdHist } - command history + index
└── Callbacks: executePrompt(), handleInputChange(), handleInputKeyDown()

Terminal.tsx
├── Consumes: useTerminalState(), useTerminalRefs()
├── Props: onInputChange, onInputKeyDown, disabled, hidden
└── No local state
```

## Issues Identified

### 1. **Split State Management** ⚠️

- **Problem**: Command history lives in `App.tsx` local state instead of global state
- **Impact**: Hard to test, duplicate rendering logic, state inconsistency
- **Current code**:
  ```tsx
  // App.tsx
  const [, setCmdHist] = useState<{ items: string[]; idx: number }>({
    items: [],
    idx: -1,
  });
  ```

### 2. **Multiple Dispatch Contexts** ⚠️

- **Problem**: Three separate contexts (State, Dispatch, Refs) instead of unified approach
- **Impact**: More boilerplate, more context consumers needed in every component
- **Current code**:
  ```tsx
  const TerminalStateContext = createContext<TerminalState | undefined>(undefined);
  const TerminalDispatchContext = createContext<React.Dispatch<TerminalAction> | undefined>(undefined);
  const TerminalRefsContext = createContext<{...} | undefined>(undefined);
  ```

### 3. **Ref Mixing** ⚠️

- **Problem**: Storing refs in context (terminalRef, inputRef)
- **Impact**: Forces all components to depend on context even just for refs
- **Current code**:
  ```tsx
  <TerminalRefsContext.Provider value={{ terminalRef, inputRef }}>
  ```

### 4. **Imperative Side Effects in Provider** ⚠️

- **Problem**: Focus and scroll logic in `TerminalContext` provider
- **Impact**: Hard to test, violates separation of concerns
- **Current code**:
  ```tsx
  useEffect(() => {
    focusInput();
  }, [focusInput]);
  ```

### 5. **Manual ID Generation** ⚠️

- **Problem**: Stateful counter for generating history IDs
- **Impact**: ID collisions possible, not deterministic, hard to debug

## Recommended Architecture

### Strategy: Simplify & Consolidate

**Principle**: One unified store with single context, refs stay local.

```
src/
├── store/
│   └── useTerminal.ts          ← Single hook, all state logic
├── context/
│   └── TerminalProvider.tsx    ← Just the provider, minimal logic
├── types/
│   └── terminal.ts             ← All types in one place
└── hooks/
    ├── useTerminalState.ts     ← State subscription (optional)
    ├── useTerminalDispatch.ts  ← Dispatch subscription (optional)
    └── useFocusTerminal.ts     ← Focus management
```

### New Approach: Zustand-like Pattern with React Hooks

Keep React's built-in tools (useReducer + Context), but eliminate complexity:

```typescript
// src/types/terminal.ts
export type HistoryItem = TerminalResponse & { id: string };

export type TerminalState = {
  history: HistoryItem[];
  input: string;
  isProcessing: boolean;
  historyIndex: number; // Consolidate command history into main state
  commandHistory: string[]; // All commands ever run
};

export type TerminalAction =
  | { type: "PUSH_RESPONSE"; payload: TerminalResponse[] }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "RESET" }
  | { type: "ADD_COMMAND"; payload: string }
  | { type: "SET_HISTORY_INDEX"; payload: number };
```

```typescript
// src/store/useTerminal.ts
import { useReducer } from "react";
import type { TerminalState, TerminalAction } from "@/types/terminal";

const INITIAL_STATE: TerminalState = {
  history: [
    { type: "logo", id: "0" },
    { type: "intro", id: "1" },
  ],
  input: "",
  isProcessing: false,
  historyIndex: -1,
  commandHistory: [],
};

function terminalReducer(
  state: TerminalState,
  action: TerminalAction
): TerminalState {
  switch (action.type) {
    case "PUSH_RESPONSE":
      return {
        ...state,
        history: [
          ...state.history,
          ...action.payload.map((item, i) => ({
            ...item,
            id: String(state.history.length + i),
          })),
        ],
      };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "RESET":
      return { ...state, history: [] };
    case "ADD_COMMAND":
      return {
        ...state,
        commandHistory: [action.payload, ...state.commandHistory],
        historyIndex: -1,
      };
    case "SET_HISTORY_INDEX":
      const cmd = state.commandHistory[action.payload] ?? "";
      return {
        ...state,
        historyIndex: action.payload,
        input: cmd,
      };
    default:
      return state;
  }
}

export function useTerminal() {
  const [state, dispatch] = useReducer(terminalReducer, INITIAL_STATE);

  return {
    // State
    history: state.history,
    input: state.input,
    isProcessing: state.isProcessing,

    // Dispatch helpers (instead of raw dispatch)
    addResponse: (responses: TerminalResponse[]) =>
      dispatch({ type: "PUSH_RESPONSE", payload: responses }),
    setInput: (value: string) =>
      dispatch({ type: "SET_INPUT", payload: value }),
    setProcessing: (value: boolean) =>
      dispatch({ type: "SET_PROCESSING", payload: value }),
    reset: () => dispatch({ type: "RESET" }),
    addCommand: (cmd: string) =>
      dispatch({ type: "ADD_COMMAND", payload: cmd }),
    navigateHistory: (direction: "up" | "down") => {
      const newIdx =
        direction === "up"
          ? Math.min(state.historyIndex + 1, state.commandHistory.length - 1)
          : Math.max(state.historyIndex - 1, -1);
      dispatch({ type: "SET_HISTORY_INDEX", payload: newIdx });
    },
  };
}
```

```typescript
// src/context/TerminalProvider.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useTerminal } from '@/store/useTerminal';

type TerminalContextType = ReturnType<typeof useTerminal>;

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const terminal = useTerminal();
  return (
    <TerminalContext.Provider value={terminal}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminalStore() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminalStore must be used within TerminalProvider');
  }
  return context;
}
```

```typescript
// src/App.tsx
import Terminal from '@/components/Terminal';
import { useTerminalStore } from '@/context/TerminalProvider';
import { resolveCommand } from '@/actions/registry';
import parseCommand from '@/utilities/parseCommand';
import parseArguments from '@/utilities/parseArguments';

const App = () => {
  const { input, isProcessing, addResponse, setInput, addCommand, navigateHistory } =
    useTerminalStore();

  const executePrompt = (prompt: string) => {
    const command = parseCommand(prompt);
    const args = parseArguments(prompt, command);
    const responses = resolveCommand(command, args);
    addResponse([{ type: 'prompt', value: prompt }, ...responses]);
    addCommand(prompt);
    setInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executePrompt(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    }
  };

  return (
    <div className="w-screen h-dvh bg-black">
      <Terminal
        onInputChange={(e) => setInput(e.target.value)}
        onInputKeyDown={handleInputKeyDown}
        hidden={isProcessing}
      />
    </div>
  );
};

export default App;
```

## Before vs After

### Lines of Code

| File            | Before  | After   | Change   |
| --------------- | ------- | ------- | -------- |
| TerminalContext | 81      | 30      | -63%     |
| terminalReducer | 37      | 40      | +8%      |
| App.tsx         | 82      | 45      | -45%     |
| **Total**       | **200** | **115** | **-42%** |

### Coupling

| Aspect                | Before            | After         |
| --------------------- | ----------------- | ------------- |
| Contexts              | 3                 | 1             |
| Custom hooks          | 3                 | 1             |
| Dispatches to learn   | Many              | Few (helpers) |
| Places managing state | 2 (Context + App) | 1 (Store)     |

### Readability

- **Before**: Hunt through 3 contexts + dispatch types + reducer
- **After**: One hook, helpers with clear names (`addResponse`, `setInput`, etc.)

### Testing

- **Before**: Need TerminalProvider + refs context + state context
- **After**: Call `useTerminal()` directly in tests

## Migration Checklist

- [ ] Create `src/types/terminal.ts` with consolidated types
- [ ] Create `src/store/useTerminal.ts` with reducer + helpers
- [ ] Replace `src/context/TerminalContext.tsx` with new provider
- [ ] Update `src/App.tsx` to use new store interface
- [ ] Update `src/components/Terminal.tsx` to remove ref context dependency
- [ ] Move focus/scroll logic from provider to components (using refs locally)
- [ ] Delete old reducer and context files
- [ ] Update all imports
- [ ] Run tests

## Key Improvements

1. **Single source of truth**: All terminal state in one place
2. **Simpler API**: One hook instead of three
3. **No ref context**: Refs stay local to components that need them
4. **Consolidated logic**: Command history lives in main state
5. **Better separation**: Store logic separate from provider
6. **Easier testing**: No provider setup needed, just import `useTerminal()`
7. **Less boilerplate**: No error checks for undefined contexts (only one context)
8. **Semantic helpers**: `addResponse()`, `navigateHistory()` are self-documenting
