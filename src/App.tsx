import { lazy, Suspense } from "react";
import { Terminal } from "./components/Terminal";
import { TerminalProvider } from "./store/terminal/context";

// Dynamically imported so its module (fixture data, sample GitHub output
// strings) is never fetched or evaluated in a production build - only
// import.meta.env.DEV's build-time `false` is needed to prove that.
const TestShowcase = lazy(() => import("./components/TestShowcase"));

type AppProps = {
  readonly initialTodos: readonly string[];
};

function App({ initialTodos }: AppProps) {
  if (import.meta.env.DEV && window.location.pathname === "/test") {
    return (
      <Suspense fallback={null}>
        <TestShowcase />
      </Suspense>
    );
  }

  return (
    <TerminalProvider initialTodos={initialTodos}>
      <Terminal />
    </TerminalProvider>
  );
}

export default App;
