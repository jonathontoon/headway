import { useEffect, useRef } from "react";
import { useTerminal } from "@hooks/useTerminal";
import { useScrollToBottom } from "@hooks/useScrollToBottom";
import Prompt from "@components/terminal/Prompt";
import TerminalHistory from "@components/terminal/TerminalHistory";

const Terminal = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { transcript, input, onInputChange, onInputKeyDown } = useTerminal(
    inputRef
  );

  useScrollToBottom(scrollRef, [transcript]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [transcript]);

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
      <TerminalHistory history={transcript} />
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
