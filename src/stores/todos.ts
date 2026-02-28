import { persistentAtom } from "@nanostores/persistent";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

export const $todos = persistentAtom<string[]>("headway:todos", [...DEFAULTS], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

const DATE_TOKEN = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY_TOKEN = /^\([A-Z]\)$/;

const today = (): string => new Date().toISOString().slice(0, 10);

const withCreationDate = (raw: string): string => {
  const tokens = raw.trim().split(/\s+/);

  if (!tokens[0]) return raw;

  if (tokens[0] === "x") {
    if (!DATE_TOKEN.test(tokens[1] ?? "")) return tokens.join(" ");
    if (DATE_TOKEN.test(tokens[2] ?? "")) return tokens.join(" ");
    return ["x", tokens[1], today(), ...tokens.slice(2)].join(" ");
  }

  if (PRIORITY_TOKEN.test(tokens[0])) {
    if (DATE_TOKEN.test(tokens[1] ?? "")) return tokens.join(" ");
    return [tokens[0], today(), ...tokens.slice(1)].join(" ");
  }

  if (DATE_TOKEN.test(tokens[0])) return tokens.join(" ");

  return [today(), ...tokens].join(" ");
};

export const addTodo = (raw: string) => {
  const todo = withCreationDate(raw);
  $todos.set([...$todos.get(), todo]);
  return todo;
};

export const removeTodo = (index: number) => {
  $todos.set($todos.get().filter((_, i) => i !== index - 1));
};

export const updateTodo = (args: { index: number; text: string }) => {
  $todos.set(
    $todos.get().map((t, i) => (i === args.index - 1 ? args.text : t))
  );
};

export const completeTodo = (index: number) => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      if (t.startsWith("x ")) return t;
      const withoutPriority = t.replace(/^\([A-Z]\) /, "");
      const date = new Date().toISOString().slice(0, 10);
      return `x ${date} ${withoutPriority}`;
    })
  );
};
