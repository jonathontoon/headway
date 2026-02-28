import Terminal from "@components/terminal/Terminal";
import { TaskProvider } from "@contexts/TaskContext";
import { TerminalProvider } from "@contexts/TerminalContext";
import { Agentation } from "agentation";

const App = () => (
  <TaskProvider>
    <TerminalProvider>
      <div className="w-full h-dvh bg-[radial-gradient(ellipse_at_50%_35%,#18181b_0%,#09090b_70%)]">
        <Terminal />
      </div>
      {import.meta.env.DEV ? <Agentation endpoint="/agentation" /> : null}
    </TerminalProvider>
  </TaskProvider>
);

export default App;
