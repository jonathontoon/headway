const STORAGE_KEY = "headway:content";

export const loadContent = (fallback: string): string =>
  localStorage.getItem(STORAGE_KEY) ?? fallback;

export const saveContent = (value: string): void =>
  void localStorage.setItem(STORAGE_KEY, value);
