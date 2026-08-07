import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { __resetDbForTests } from "./store/db";

beforeEach(() => {
  // Fresh IndexedDB per test; the cached connection in db.ts would
  // otherwise keep pointing at the previous factory's database.
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
});
