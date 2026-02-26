import { persistentAtom } from "@nanostores/persistent";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

export const todosAtom = persistentAtom<string[]>("headway:todos", [...DEFAULTS], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const addTodo = (raw: string) => {
  todosAtom.set([...todosAtom.get(), raw]);
};

export const removeTodo = (index: number) => {
  todosAtom.set(todosAtom.get().filter((_, i) => i !== index - 1));
};

export const updateTodo = (args: { index: number; text: string }) => {
  todosAtom.set(
    todosAtom.get().map((t, i) => (i === args.index - 1 ? args.text : t))
  );
};

export const completeTodo = (index: number) => {
  todosAtom.set(
    todosAtom.get().map((t, i) => {
      if (i !== index - 1) return t;
      if (t.startsWith("x ")) return t;
      const withoutPriority = t.replace(/^\([A-Z]\) /, "");
      const date = new Date().toISOString().slice(0, 10);
      return `x ${date} ${withoutPriority}`;
    })
  );
};
