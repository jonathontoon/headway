const STORAGE_KEY = 'headway:content';

const defaultContent = `(A) Review project proposal +webapp @work
(B) Fix login bug +webapp @work
(C) Buy groceries +groceries @home
2026-02-21 Update documentation +webapp @work
Call dentist @phone
Organise notes @home +personal
x 2026-02-20 2026-02-19 Set up repository +webapp @work
`;

/**
 * Load todo content from localStorage
 */
export const loadContent = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ?? defaultContent;
};

/**
 * Save todo content to localStorage
 */
export const saveContent = (text: string): void => {
  localStorage.setItem(STORAGE_KEY, text);
};
