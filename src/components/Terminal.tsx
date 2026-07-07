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
      className="block h-dvh overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))] box-border [-webkit-overflow-scrolling:touch]"
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
      <div
        ref={bottomRef}
        className="h-0 scroll-mb-[calc(1rem+env(safe-area-inset-bottom))] sm:scroll-mb-[calc(1.5rem+env(safe-area-inset-bottom))] md:scroll-mb-[calc(2rem+env(safe-area-inset-bottom))]"
        aria-hidden="true"
      />
    </main>
  );
}
