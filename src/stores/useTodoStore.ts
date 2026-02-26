import { create, type StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

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

type SetTodo = Parameters<
  StateCreator<
    TodoState & TodoActions,
    [["zustand/devtools", never], ["zustand/persist", unknown]],
    []
  >
>[0];

const defaultState: TodoState = {
  todos: [...DEFAULTS],
};

const addTodo =
  (set: SetTodo) =>
  (raw: string): void =>
    set((state) => ({ todos: [...state.todos, raw] }), false, "addTodo");

const removeTodo =
  (set: SetTodo) =>
  (index: number): void =>
    set(
      (state) => ({ todos: state.todos.filter((_, i) => i !== index - 1) }),
      false,
      "removeTodo"
    );

const updateTodo =
  (set: SetTodo) =>
  (index: number, text: string): void =>
    set(
      (state) => ({
        todos: state.todos.map((t, i) => (i === index - 1 ? text : t)),
      }),
      false,
      "updateTodo"
    );

const completeTodo =
  (set: SetTodo) =>
  (index: number): void =>
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
    );

export const useTodoStore = create<TodoState & TodoActions>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,
        addTodo: addTodo(set),
        removeTodo: removeTodo(set),
        updateTodo: updateTodo(set),
        completeTodo: completeTodo(set),
      }),
      {
        name: "headway:todos",
        partialize: (state) => ({ todos: state.todos }),
      }
    ),
    { name: "TodoStore" }
  )
);
