import { create } from "zustand";
import { devtools } from "zustand/middleware";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

interface TodoState {
  todos: string[];
}

interface TodoActions {
  addTodo: (raw: string) => void;
  removeTodo: (index: number) => void;
  updateTodo: (index: number, text: string) => void;
  completeTodo: (index: number) => void;
}

export const useTodoStore = create<TodoState & TodoActions>()(
  devtools(
    (set) => ({
      todos: [...DEFAULTS],

      addTodo: (raw) =>
        set((state) => ({ todos: [...state.todos, raw] }), false, "addTodo"),

      removeTodo: (index) =>
        set(
          (state) => ({ todos: state.todos.filter((_, i) => i !== index - 1) }),
          false,
          "removeTodo"
        ),

      updateTodo: (index, text) =>
        set(
          (state) => ({
            todos: state.todos.map((t, i) => (i === index - 1 ? text : t)),
          }),
          false,
          "updateTodo"
        ),

      completeTodo: (index) =>
        set(
          (state) => ({
            todos: state.todos.map((t, i) => {
              if (i !== index - 1) return t;
              if (t.startsWith("x ")) return t;
              const withoutPriority = t.replace(/^\([A-Z]\) /, "");
              const date = new Date().toISOString().slice(0, 10);
              return `x ${date} ${withoutPriority}`;
            }),
          }),
          false,
          "completeTodo"
        ),
    }),
    { name: "TodoStore" }
  )
);
