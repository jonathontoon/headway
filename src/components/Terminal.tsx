import type { FormEvent } from "react";
import { useTerminal } from "../hooks/useTerminal";
import { TerminalHistory } from "./TerminalHistory";
import { TerminalCommandForm } from "./TerminalCommandForm";

export function Terminal() {
  const { state, setCommand, submitCommand, navigateHistory } = useTerminal();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCommand();
  }

  return (
    <main
      className="block min-h-svh p-6 box-border"
      aria-label="Terminal prompt"
    >
      <TerminalHistory entries={state.entries} />
      <TerminalCommandForm
        command={state.command}
        onSubmit={handleSubmit}
        onChange={setCommand}
        onNavigateHistory={navigateHistory}
      />
    </main>
  );
}
