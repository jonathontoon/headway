import { kvGet, kvSet } from "../db";
import { SAMPLE_TODOS } from "./sampleTodos";

const TODOS_DB_KEY = "todos";
const TODOS_CHANNEL_NAME = "headway-todos";

// IndexedDB (and the broadcast channel) are writable by anything running
// in the origin, so every value read back is validated before use.
export function sanitizeTodos(value: unknown): readonly string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

export async function loadStoredTodos(): Promise<readonly string[]> {
  const stored = sanitizeTodos(await kvGet(TODOS_DB_KEY));
  return stored ?? SAMPLE_TODOS;
}

function openTodosChannel(): BroadcastChannel | undefined {
  return typeof BroadcastChannel === "undefined"
    ? undefined
    : new BroadcastChannel(TODOS_CHANNEL_NAME);
}

export async function storeTodos(todos: readonly string[]): Promise<void> {
  await kvSet(TODOS_DB_KEY, [...todos]);

  // Other open tabs are told explicitly so their in-memory state stays fresh.
  const channel = openTodosChannel();
  if (channel) {
    channel.postMessage([...todos]);
    channel.close();
  }
}

export function subscribeTodos(
  callback: (todos: readonly string[]) => void,
): () => void {
  const channel = openTodosChannel();
  if (!channel) {
    return () => {};
  }

  channel.onmessage = (event: MessageEvent) => {
    const todos = sanitizeTodos(event.data);
    if (todos) {
      callback(todos);
    }
  };

  return () => channel.close();
}
