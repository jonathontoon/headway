import { Terminal } from "@components";
import { useTerminalStore } from "@contexts/TerminalContext";
import { useCommands } from "@hooks/useCommands";
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

  const commands = useCommands();

  const executePrompt = (prompt: string) => {
    const command = parseCommand(prompt);
    const args = parseArguments(prompt, command);

    // Show prompt in history
    addResponse([{ type: "prompt", value: prompt }]);
    addCommand(prompt);

    // Execute command
    switch (command) {
      case "add":
      case "a":
        commands.add(args.join(" "));
        break;
      case "list":
      case "ls":
        commands.list(args[0]);
        break;
      case "edit":
        if (args.length < 2) {
          addResponse([
            {
              type: "status",
              statusType: "error",
              statusText: "Missing arguments.",
              hintText: "Usage: edit [number] [text]",
            },
          ]);
        } else {
          commands.edit(parseInt(args[0], 10), args.slice(1).join(" "));
        }
        break;
      case "done":
        if (!args[0]) {
          addResponse([
            {
              type: "status",
              statusType: "error",
              statusText: "Invalid todo number.",
              hintText: "Usage: done [number]",
            },
          ]);
        } else {
          commands.done(parseInt(args[0], 10));
        }
        break;
      case "remove":
      case "rm":
        if (!args[0]) {
          addResponse([
            {
              type: "status",
              statusType: "error",
              statusText: "Invalid todo number.",
              hintText: "Usage: remove [number]",
            },
          ]);
        } else {
          commands.remove(parseInt(args[0], 10));
        }
        break;
      case "archive":
        commands.archive();
        break;
      case "help":
        addResponse([{ type: "help" }]);
        break;
      default:
        addResponse([
          {
            type: "default",
            commandName: command,
            hintText: "Type 'help' for commands.",
          },
        ]);
    }

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
