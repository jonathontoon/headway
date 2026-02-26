import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const DEFAULTS = [
  "(A) Call mom @phone +personal",
  "(B) 2026-02-25 Buy groceries @errands +home",
  "x 2026-02-24 Read chapter 3 +book",
  "Submit quarterly report +work @computer",
  "(C) Fix leaky faucet @home",
];

export const todosAtom = atomWithStorage<string[]>("headway:todos", [
  ...DEFAULTS,
]);

export const addTodoAtom = atom(null, (get, set, raw: string) => {
  set(todosAtom, [...get(todosAtom), raw]);
});

export const removeTodoAtom = atom(null, (get, set, index: number) => {
  set(
    todosAtom,
    get(todosAtom).filter((_, i) => i !== index - 1)
  );
});

export const updateTodoAtom = atom(
  null,
  (get, set, args: { index: number; text: string }) => {
    set(
      todosAtom,
      get(todosAtom).map((t, i) => (i === args.index - 1 ? args.text : t))
    );
  }
);

export const completeTodoAtom = atom(null, (get, set, index: number) => {
  set(
    todosAtom,
    get(todosAtom).map((t, i) => {
      if (i !== index - 1) return t;
      if (t.startsWith("x ")) return t;
      const withoutPriority = t.replace(/^\([A-Z]\) /, "");
      const date = new Date().toISOString().slice(0, 10);
      return `x ${date} ${withoutPriority}`;
    })
  );
});
