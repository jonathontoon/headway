import { create } from "zustand";
import type { TodoItem } from "@types";
import {
  parseTodos,
  serializeTodos,
  addTodo as todoAddUtil,
  completeTodo as todoCompleteUtil,
  archiveTodos,
  deleteTodo,
  replaceTodo,
} from "@utils/todos";
import { loadContent, saveContent } from "@utils/storage";

interface TodoStore {
  todos: TodoItem[];
  setTodos: (todos: TodoItem[]) => void;
  addTodo: (text: string) => { todos: TodoItem[] } | { error: string };
  completeTodo: (n: number) => { todos: TodoItem[] } | { error: string };
  removeTodo: (n: number) => { todos: TodoItem[] } | { error: string };
  editTodo: (n: number, text: string) => { todos: TodoItem[] } | { error: string };
}

export const useTodoStore = create<TodoStore>((set, get) => {

  const todos: TodoItem[] = parseTodos(loadContent());

  const setTodos = (todos: TodoItem[]) => {
    saveContent(serializeTodos(todos));
    set({ todos });
  };

  const addTodo = (text: string): { todos: TodoItem[] } | { error: string } => {
    try {
      const updated = todoAddUtil(text, get().todos);
      setTodos(updated);
      return { todos: updated };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to add task." };
    }
  };

  const completeTodo = (n: number): { todos: TodoItem[] } | { error: string } => {
    const { todos } = get();
    if (n < 1 || n > todos.length) {
      return { error: `Task #${n} not found.` };
    }
    try {
      const updated = archiveTodos(todoCompleteUtil(n, todos));
      setTodos(updated);
      return { todos: updated };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to mark task complete." };
    }
  };

  const removeTodo = (n: number): { todos: TodoItem[] } | { error: string } => {
    const { todos } = get();
    if (n < 1 || n > todos.length) {
      return { error: `Task #${n} not found.` };
    }
    try {
      const updated = deleteTodo(n, todos);
      setTodos(updated);
      return { todos: updated };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to remove task." };
    }
  };

  const editTodo = (n: number, text: string): { todos: TodoItem[] } | { error: string } => {
    const { todos } = get();
    if (n < 1 || n > todos.length) {
      return { error: `Task #${n} not found.` };
    }
    try {
      const updated = replaceTodo(n, text, todos);
      setTodos(updated);
      return { todos: updated };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to edit task." };
    }
  };

  return {
    todos,
    setTodos,
    addTodo,
    completeTodo,
    removeTodo,
    editTodo,
  };
});
