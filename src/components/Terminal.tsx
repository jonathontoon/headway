import {
  useLayoutEffect,
  useRef,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useTerminal } from "../hooks/useTerminal";
import { TerminalHistory } from "./TerminalHistory";
import { TerminalCommandForm } from "./TerminalCommandForm";

export function Terminal() {
  const {
    state,
    setCommand,
    submitCommand,
    navigateHistory,
    cancelCommand,
    clearScreen,
  } = useTerminal();
  const bottomRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [state.entries.length]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCommand();
  }

  function handleContextMenu(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT") {
      event.preventDefault();
    }
  }

  return (
    <main
      className="block min-h-svh p-4 sm:p-6 md:p-8 box-border"
      aria-label="Terminal prompt"
      onContextMenu={handleContextMenu}
    >
      <TerminalHistory entries={state.entries} />
      <TerminalCommandForm
        command={state.command}
        onSubmit={handleSubmit}
        onChange={setCommand}
        onNavigateHistory={navigateHistory}
        onCancel={cancelCommand}
        onClearScreen={clearScreen}
      />
      <div ref={bottomRef} />
    </main>
  );
}
