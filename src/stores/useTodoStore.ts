import { create } from "zustand";
import type { TodoItem } from "@types";
import { parseTodos, serializeTodos } from "@utils/todos";
import { loadContent, saveContent } from "@utils/storage";

interface TodoStore {
  todos: TodoItem[];
  setTodos: (todos: TodoItem[]) => void;
}

export const useTodoStore = create<TodoStore>((set) => {
  
  const todos: TodoItem[] = parseTodos(loadContent());
  
  const setTodos = (todos: TodoItem[]) => {
    saveContent(serializeTodos(todos));
    set({ todos });
  };

  return {
    todos,
    setTodos,
  };
});
