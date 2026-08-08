import "@testing-library/jest-dom";
import "fake-indexedDB/auto";
import { IDBFactory } from "fake-indexedDB";
import { indexedDB } from "./services/indexedDB";
import { __resetTodosStoreForTests } from "./store/todos/persistence";

beforeEach(() => {
  // Fresh indexedDB per test; the cached connection in indexedDB.ts would
  // otherwise keep pointing at the previous factory's database.
  globalThis.indexedDB = new IDBFactory();
  indexedDB.close();
  __resetTodosStoreForTests();
});
