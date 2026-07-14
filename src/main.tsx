import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";
import { applyInitialTheme } from "./store/theme/applyTheme.ts";
import { loadStoredTodos } from "./store/todos/storage.ts";

// Caches the app shell so headway loads offline; new deploys activate
// automatically on the next visit.
registerSW();

applyInitialTheme();

// Best effort: asks the browser not to evict IndexedDB under storage
// pressure. Browsers may deny (or prompt) - the app works either way.
void navigator.storage?.persist?.();

// Hydrating before the first render keeps the reducer synchronous - no
// loading state, and the boot summary is computed from real todos.
const initialTodos = await loadStoredTodos();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialTodos={initialTodos} />
  </StrictMode>,
);
