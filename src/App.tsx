import { Terminal } from "@components";
import { useTerminalStore } from "@contexts/TerminalContext";
import { resolveCommand } from "@lib/commands";
import { parseCommand, parseArguments } from "@utils/parse";

const App = () => {
  const {
    input,
    isProcessing,
    addResponse,
    setInput,
    addCommand,
    navigateHistory,
  } = useTerminalStore();

  const executePrompt = (prompt: string) => {
    const command = parseCommand(prompt);
    const args = parseArguments(prompt, command);
    const responses = resolveCommand(command, args);
    addResponse([{ type: "prompt", value: prompt }, ...responses]);
    addCommand(prompt);
    setInput("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executePrompt(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory("down");
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
