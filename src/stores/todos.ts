import { persistentAtom } from "@nanostores/persistent";

const dateOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const makeDefaults = (): string[] => {
  const t = dateOffset(0);
  return [
    // Inbox — raw captures (no @/+/key:value markers)
    "Call dentist to reschedule",
    "Research standing desk options",
    "Ask Mike about project timeline",
    "Look into travel insurance for trip",
    "Order birthday gift for dad",
    // Today / Overdue
    `(A) Call back landlord @phone due:${dateOffset(-3)}`,
    `Pick up prescription @errands due:${dateOffset(-1)}`,
    `Pay credit card bill @computer +finance due:${t}`,
    `Submit expense report +work @computer due:${t}`,
    // Upcoming
    `Review and sign lease renewal +home due:${dateOffset(1)}`,
    `Dentist appointment @health due:${dateOffset(4)}`,
    `(B) Prepare quarterly review +work due:${dateOffset(10)}`,
    `File tax return +finance @computer due:${dateOffset(15)}`,
    // Anytime
    "Read Atomic Habits +personal",
    "Organize garage +home @weekend",
    "Learn basic Spanish on Duolingo +personal",
    "(C) Update LinkedIn profile @computer +work",
    "Set up automatic bill payments @computer +finance",
    // Completed
    `x ${dateOffset(-4)} Return library books @errands`,
    `x ${dateOffset(-8)} Cancel old streaming subscription +finance @computer`,
  ];
};

export const $todos = persistentAtom<string[]>("headway:todos", makeDefaults(), {
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

const DUE_TOKEN = /\bdue:(\d{4}-\d{2}-\d{2})\b/;
const BUCKET_TOKEN = /\bbucket:(\S+)\b/;

export const getDueDate = (todo: string): string | null =>
  todo.match(DUE_TOKEN)?.[1] ?? null;

export const getBucket = (todo: string): string | null =>
  todo.match(BUCKET_TOKEN)?.[1] ?? null;

export type BucketName = "today" | "upcoming" | "inbox" | "anytime";

const hasProcessedMarker = (todo: string): boolean =>
  todo.split(/\s+/).some(token =>
    (token.startsWith('@') && token.length > 1) ||
    (token.startsWith('+') && token.length > 1) ||
    (/^\S+:\S+$/.test(token) && !token.startsWith('due:') && !token.startsWith('bucket:'))
  );

export const classifyTodo = (todo: string, todayStr: string): BucketName => {
  const due = getDueDate(todo);
  if (due) return due <= todayStr ? "today" : "upcoming";
  return hasProcessedMarker(todo) ? "anytime" : "inbox";
};

const removeKeyValue = (todo: string, key: string): string =>
  todo.replace(new RegExp(`\\s*\\b${key}:\\S+`, "g"), "").trim();

export const setDueDate = (index: number, date: string | null): void => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      let updated = removeKeyValue(t, "due");
      if (date !== null) {
        updated = removeKeyValue(updated, "bucket");
        updated = `${updated} due:${date}`;
      }
      return updated;
    })
  );
};

export const removeInboxBucket = (index: number): void => {
  $todos.set(
    $todos.get().map((t, i) =>
      i !== index - 1 ? t : removeKeyValue(t, "bucket")
    )
  );
};

export const moveToInbox = (index: number): void => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      return t.split(/\s+/)
        .filter(token =>
          !token.startsWith('@') &&
          !token.startsWith('+') &&
          !/^\S+:\S+$/.test(token)
        )
        .join(' ');
    })
  );
};

export const addTodo = (raw: string) => {
  const todo = withCreationDate(raw);
  $todos.set([...$todos.get(), todo]);
  return todo;
};

export const addTag = (index: number, tag: string): void => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      if (t.split(/\s+/).includes(tag)) return t;
      return `${t} ${tag}`;
    })
  );
};

export const removeTag = (index: number, tag: string): void => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      return t.split(/\s+/).filter(token => token !== tag).join(' ');
    })
  );
};

export const removeTodo = (index: number) => {
  $todos.set($todos.get().filter((_, i) => i !== index - 1));
};

export const updateTodo = (args: { index: number; text: string }) => {
  $todos.set(
    $todos.get().map((t, i) => (i === args.index - 1 ? args.text : t))
  );
};

export const setPriority = (index: number, priority: string | null): void => {
  $todos.set(
    $todos.get().map((t, i) => {
      if (i !== index - 1) return t;
      if (t.startsWith("x ")) {
        const body = t.slice(2).replace(/^\([A-Z]\) /, "");
        return priority !== null ? `x (${priority}) ${body}` : `x ${body}`;
      }
      const body = t.replace(/^\([A-Z]\) /, "");
      return priority !== null ? `(${priority}) ${body}` : body;
    })
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
