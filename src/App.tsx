import { lazy, Suspense } from "react";

const Editor = lazy(() => import("./components/common/Editor"));

const App = () => (
  <Suspense fallback={<div className="w-screen h-dvh bg-black" />}>
    <Editor />
  </Suspense>
);

export default App;
