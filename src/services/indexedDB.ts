// Same-origin scripts can read indexedDB, so the CSP and validate-on-read are
// the real defenses. indexedDB provides async I/O, structured clone support,
// larger quota, and navigator.storage.persist() eviction protection.

const DB_NAME = "headway";
const DB_VERSION = 1;
const STORE_NAME = "kv";

export type IndexedDBClient = {
  readonly get: <T>(key: string) => Promise<T | undefined>;
  readonly set: <T>(key: string, value: T) => Promise<void>;
  readonly remove: (key: string) => Promise<void>;
};

let promise: Promise<IDBDatabase> | undefined;

const open = (): Promise<IDBDatabase> => {
  promise ??= new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgrading the schema blocks until this connection
      // closes; drop the cached promise so the next call reopens.
      db.onversionchange = () => {
        db.close();
        promise = undefined;
      };
      db.onclose = () => {
        promise = undefined;
      };
      resolve(db);
    };
    request.onblocked = () => {
      reject(new Error("Opening the indexedDB database was blocked"));
    };
    request.onerror = () => {
      promise = undefined;
      reject(request.error ?? new Error("Failed to open indexedDB"));
    };
  });

  return promise;
};

const runTransaction = <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> =>
  open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));

        request.onerror = () =>
          reject(request.error ?? new Error("indexedDB request failed"));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error("indexedDB transaction failed"),
          );
        transaction.onabort = () =>
          reject(
            transaction.error ?? new Error("indexedDB transaction aborted"),
          );
      }),
  );

const get = <T>(key: string): Promise<T | undefined> =>
  runTransaction<T | undefined>("readonly", (store) => store.get(key));

const set = <T>(key: string, value: T): Promise<void> =>
  runTransaction("readwrite", (store) => store.put(value, key)).then(
    () => undefined,
  );

const remove = (key: string): Promise<void> =>
  runTransaction("readwrite", (store) => store.delete(key)).then(
    () => undefined,
  );

export const indexedDB: IndexedDBClient = {
  get,
  set,
  remove,
};

// Tests swap globalThis.indexedDB between cases; the cached connection
// would otherwise keep pointing at the previous factory's database.
export function __resetDbForTests(): void {
  const promiseCopy = promise;
  promise = undefined;
  void promiseCopy?.then((db) => db.close());
}
