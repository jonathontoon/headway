import { useEffect, useRef } from "react";
import { useTerminalStore } from "@stores/useTerminalStore";
import { useTerminal } from "@hooks/useTerminal";
import { useScrollToBottom } from "@hooks/useScrollToBottom";
import HistoryEntry from "@components/HistoryEntry";
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
      {history.map((entry) => (
        <HistoryEntry key={entry.id} entry={entry} />
      ))}
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
