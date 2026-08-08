import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { indexedDB } from "../services/indexedDB";
import { __resetTodosStoreForTests } from "../store/todos/persistence";

beforeEach(() => {
  // Fresh indexedDB per test; the cached connection in indexedDB.ts would
  // otherwise keep pointing at the previous factory's database.
  globalThis.indexedDB = new IDBFactory();
  indexedDB.close();
  __resetTodosStoreForTests();
});
