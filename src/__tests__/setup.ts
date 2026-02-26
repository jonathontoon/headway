import "@testing-library/jest-dom/vitest";

const _storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key) => _storage[key] ?? null,
  setItem: (key, value) => {
    _storage[key] = value;
  },
  removeItem: (key) => {
    delete _storage[key];
  },
  clear: () => {
    Object.keys(_storage).forEach((k) => delete _storage[k]);
  },
  length: 0,
  key: () => null,
} as Storage;
