const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

let todos: string[] = [...DEFAULTS];

export const getTodos = (): string[] => todos;

export const addTodo = (raw: string): void => {
  todos = [...todos, raw];
};
