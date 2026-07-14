import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { __resetDbForTests } from "./store/db";

const storage = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
  },
  configurable: true,
});

beforeEach(() => {
  // Fresh IndexedDB per test; the cached connection in db.ts would
  // otherwise keep pointing at the previous factory's database.
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
});
