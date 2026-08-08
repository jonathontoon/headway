import { INDEXED_DB_OPTIONS } from "../constants";

// Same-origin scripts can read indexedDB, so the CSP and validate-on-read are
// the real defenses. indexedDB provides async I/O, structured clone support,
// larger quota, and navigator.storage.persist() eviction protection.

/** Options used to create an IndexedDB key-value client. */
export type IndexedDBOptions = {
  readonly dbName: string;
  readonly storeName: string;
  readonly version?: number;
};

/** Small async key-value client backed by IndexedDB. */
export type IndexedDBClient = {
  readonly get: <T>(key: string) => Promise<T | undefined>;
  readonly set: <T>(key: string, value: T) => Promise<void>;
  readonly remove: (key: string) => Promise<void>;
  readonly close: () => void;
};

/**
 * Creates an IndexedDB-backed key-value client.
 *
 * @param options - Database name, object-store name, and schema version.
 * @returns Client for reading, writing, removing, and closing storage.
 */
export const createIndexedDB = ({
  dbName,
  storeName,
  version = 1,
}: IndexedDBOptions): IndexedDBClient => {
  let promise: Promise<IDBDatabase> | undefined;

  const open = (): Promise<IDBDatabase> => {
    if (promise) {
      return promise;
    }

    const factory = globalThis.indexedDB;
    if (!factory) {
      return Promise.reject(new Error("indexedDB is not available"));
    }

    const clearIfActive = (candidate: Promise<IDBDatabase>): void => {
      if (promise === candidate) {
        promise = undefined;
      }
    };

    const activePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(dbName, version);

      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (promise !== activePromise) {
          db.close();
          return;
        }

        // Another tab upgrading the schema blocks until this connection
        // closes; drop the cached promise so the next call reopens.
        db.onversionchange = () => {
          db.close();
          clearIfActive(activePromise);
        };
        db.onclose = () => {
          clearIfActive(activePromise);
        };
        resolve(db);
      };
      request.onblocked = () => {
        clearIfActive(activePromise);
        reject(new Error("Opening the indexedDB database was blocked"));
      };
      request.onerror = () => {
        clearIfActive(activePromise);
        reject(request.error ?? new Error("Failed to open indexedDB"));
      };
    });

    promise = activePromise;
    return activePromise;
  };

  const runTransaction = <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> =>
    open().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const transaction = db.transaction(storeName, mode);
          const request = operation(transaction.objectStore(storeName));

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

  const close = (): void => {
    const promiseCopy = promise;
    promise = undefined;
    void promiseCopy?.then((db) => db.close());
  };

  return { get, set, remove, close };
};

/** Default application IndexedDB client. */
export const indexedDB = createIndexedDB(INDEXED_DB_OPTIONS);
