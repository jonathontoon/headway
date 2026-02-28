import { configureStore } from "@reduxjs/toolkit";
import { terminalReducer } from "../reducers/terminalReducer";

export const store = configureStore({
  reducer: {
    terminal: terminalReducer,
  },
});
