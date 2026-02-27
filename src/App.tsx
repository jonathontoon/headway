import Terminal from "@components/Terminal";
import { Agentation } from "agentation";

const App = () => (
  <>
    <div className="w-full h-dvh bg-[radial-gradient(ellipse_at_50%_35%,#0f0f13_0%,#09090b_70%)]">
      <Terminal />
    </div>
    {import.meta.env.DEV && <Agentation endpoint="/agentation" />}
  </>
);

export default App;
