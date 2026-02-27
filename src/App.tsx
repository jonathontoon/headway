import Terminal from "@components/Terminal";
import { Agentation } from "agentation";

const App = () => (
  <>
    <div className="w-full h-dvh bg-[radial-gradient(ellipse_at_50%_35%,#0f0f13_0%,#09090b_70%)]">
      <Terminal />
    </div>
    {process.env.NODE_ENV === "development" && (
      <Agentation endpoint="http://localhost:4747" />
    )}
  </>
);

export default App;
