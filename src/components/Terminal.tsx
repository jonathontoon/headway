import { useEffect, useRef } from "react";
import { useTerminalStore } from "@stores/useTerminalStore";
import { useTerminal } from "@hooks/useTerminal";
import { useScrollToBottom } from "@hooks/useScrollToBottom";
import TerminalHistory from "@components/TerminalHistory";
import Prompt from "@components/Prompt";

const Terminal = () => {
  const history = useTerminalStore((s) => s.history);
  const { input, onInputChange, onInputKeyDown } = useTerminal();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollToBottom(scrollRef, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [history]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 flex flex-col gap-1"
    >
      {/*
        Optimization: TerminalHistory is memoized and only depends on 'history'.
        This prevents the entire history list from being re-mapped/re-processed
        on every keystroke (when 'input' changes).
      */}
      <TerminalHistory history={history} />
      <Prompt
        ref={inputRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
      />
    </div>
  );
};

export default Terminal;
