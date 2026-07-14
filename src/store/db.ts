// Minimal promise wrapper around IndexedDB, holding a single "kv" object
// store. IndexedDB is no more XSS-resistant than localStorage (any
// same-origin script can read both - the CSP and validate-on-read are the
// real defenses); it's used for async I/O, larger quota, structured clone
// and navigator.storage.persist() eviction protection.

const DB_NAME = "headway";
const DB_VERSION = 1;
const STORE_NAME = "kv";

let dbPromise: Promise<IDBDatabase> | undefined;

function openHeadwayDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgrading the schema blocks until this connection
      // closes; drop the cached promise so the next call reopens.
      db.onversionchange = () => {
        db.close();
        dbPromise = undefined;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = undefined;
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openHeadwayDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));

        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () =>
          reject(transaction.error ?? new Error("IndexedDB transaction failed"));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
      }),
  );
}

export function kvGet(key: string): Promise<unknown> {
  return runTransaction("readonly", (store) => store.get(key));
}

export function kvSet(key: string, value: unknown): Promise<void> {
  return runTransaction("readwrite", (store) => store.put(value, key)).then(
    () => undefined,
  );
}

export function kvDelete(key: string): Promise<void> {
  return runTransaction("readwrite", (store) => store.delete(key)).then(
    () => undefined,
  );
}

// Tests swap globalThis.indexedDB between cases; the cached connection
// would otherwise keep pointing at the previous factory's database.
export function __resetDbForTests(): void {
  void dbPromise?.then((db) => db.close());
  dbPromise = undefined;
}
