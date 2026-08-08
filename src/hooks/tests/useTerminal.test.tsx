import { renderHook } from "@testing-library/react";
import { type PropsWithChildren } from "react";
import { useTerminal } from "../useTerminal";
import {
  TerminalContext,
  type TerminalStore,
} from "../../store/terminal/context";

const terminalStore: TerminalStore = {
  state: {
    entries: [],
    command: "",
    historyIndex: null,
    view: [],
    pending: false,
  },
  todos: [],
  setCommand: vi.fn(),
  submitCommand: vi.fn(),
  navigateHistory: vi.fn(),
  cancelCommand: vi.fn(),
  clearScreen: vi.fn(),
};

describe("useTerminal", () => {
  it("returns the terminal context value", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TerminalContext.Provider value={terminalStore}>
        {children}
      </TerminalContext.Provider>
    );

    const { result } = renderHook(() => useTerminal(), { wrapper });

    expect(result.current).toBe(terminalStore);
  });

  it("throws when used outside a terminal provider", () => {
    expect(() => renderHook(() => useTerminal())).toThrow(
      "useTerminal must be used within a TerminalProvider",
    );
  });
});
