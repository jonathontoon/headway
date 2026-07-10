import { Terminal } from "./components/Terminal";
import { TerminalProvider } from "./store/terminal/context";

function App() {
  return (
    <TerminalProvider>
      <Terminal />
    </TerminalProvider>
  );
}

export default App;
