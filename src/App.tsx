import { Terminal } from "@components";
import { useTerminalStore } from "@stores/useTerminalStore";

const App = () => {
  const { input, isProcessing, setInput, navigateHistory, executeCommand } =
    useTerminalStore();

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory("down");
    }
  };

  return (
    <div className="w-full h-dvh bg-black">
      <Terminal
        onInputChange={(e) => setInput(e.target.value)}
        onInputKeyDown={handleInputKeyDown}
        hidden={isProcessing}
      />
    </div>
  );
};

export default App;
