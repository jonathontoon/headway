import { indexedDB } from "../../services/indexedDB";
import { SAMPLE_TODOS } from "./sampleTodos";

const TODOS_DB_KEY = "todos";
const TODOS_CHANNEL_NAME = "headway-todos";

type Listener = () => void;

let snapshot: readonly string[] = SAMPLE_TODOS;
let initialized = false;
let initialization: Promise<void> | undefined;
let todosChannel: BroadcastChannel | undefined;

const listeners = new Set<Listener>();

// indexedDB and BroadcastChannel are writable by anything running in the
// origin, so every value read back is validated before use.
export function sanitizeTodos(value: unknown): readonly string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function receiveTodos(event: MessageEvent): void {
  const todos = sanitizeTodos(event.data);
  if (todos) {
    snapshot = todos;
    emit();
  }
}

function openTodosChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") {
    return undefined;
  }

  todosChannel ??= new BroadcastChannel(TODOS_CHANNEL_NAME);
  todosChannel.onmessage = receiveTodos;
  return todosChannel;
}

async function initialize(): Promise<void> {
  if (initialized) {
    return;
  }

  initialization ??= indexedDB
    .get<unknown>(TODOS_DB_KEY)
    .then((value) => {
      snapshot = sanitizeTodos(value) ?? SAMPLE_TODOS;
      initialized = true;
      emit();
    })
    .catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });

  return initialization;
}

function getSnapshot(): readonly string[] {
  return snapshot;
}

function getServerSnapshot(): readonly string[] {
  return SAMPLE_TODOS;
}

async function setTodos(todos: readonly string[]): Promise<void> {
  const nextTodos = [...todos];
  await indexedDB.set(TODOS_DB_KEY, nextTodos);

  snapshot = nextTodos;
  emit();
  openTodosChannel()?.postMessage(nextTodos);
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  openTodosChannel();

  return () => {
    listeners.delete(listener);
  };
}

export const todosStore = {
  getSnapshot,
  getServerSnapshot,
  initialize,
  set: setTodos,
  subscribe,
};

// Tests replace indexedDB between cases and must also reset this store's
// in-memory snapshot and channel.
export function __resetTodosStoreForTests(): void {
  initialized = false;
  initialization = undefined;
  snapshot = SAMPLE_TODOS;
  listeners.clear();
  todosChannel?.close();
  todosChannel = undefined;
}
