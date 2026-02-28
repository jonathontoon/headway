import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $history } from "@stores/terminal";
import { useTerminal } from "@hooks/useTerminal";
import { useScrollToBottom } from "@hooks/useScrollToBottom";
import TerminalHistory from "@components/TerminalHistory";
import Prompt from "@components/Prompt";

const Terminal = () => {
  const history = useStore($history);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { input, onInputChange, onInputKeyDown } = useTerminal(inputRef);

  useScrollToBottom(scrollRef, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [history]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 flex flex-col gap-4
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-500
        [&::-webkit-scrollbar-thumb]:rounded-sm
        [&::-webkit-scrollbar-thumb:hover]:bg-zinc-400"
    >
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
