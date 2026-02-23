export interface TodoItem {
  raw: string;
  done: boolean;
  priority?: string;
  completionDate?: string;
  creationDate?: string;
  text: string;
  contexts: string[];
  projects: string[];
}

/**
 * Parse todo.txt format text into TodoItem objects
 */
export const parseTodos = (text: string): TodoItem[] => {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  return lines.map((raw) => parseTodoLine(raw));
};

/**
 * Parse a single todo.txt line
 */
const parseTodoLine = (raw: string): TodoItem => {
  let remaining = raw;
  let done = false;
  let completionDate: string | undefined;
  let creationDate: string | undefined;
  let priority: string | undefined;

  // Check for completion marker
  const completionMatch = remaining.match(/^x\s+/);
  if (completionMatch) {
    done = true;
    remaining = remaining.slice(completionMatch[0].length);

    // Check for completion date YYYY-MM-DD
    const dateMatch = remaining.match(/^(\d{4}-\d{2}-\d{2})\s+/);
    if (dateMatch) {
      completionDate = dateMatch[1];
      remaining = remaining.slice(dateMatch[0].length);
    }
  }

  // Check for creation date YYYY-MM-DD (at the start if not done)
  if (!done) {
    const dateMatch = remaining.match(/^(\d{4}-\d{2}-\d{2})\s+/);
    if (dateMatch) {
      creationDate = dateMatch[1];
      remaining = remaining.slice(dateMatch[0].length);
    }
  }

  // Check for priority (A) (B) (C)
  const priorityMatch = remaining.match(/^\(([A-Z])\)\s+/);
  if (priorityMatch) {
    priority = priorityMatch[1];
    remaining = remaining.slice(priorityMatch[0].length);
  }

  // Extract @contexts and +projects from the whole line
  const contexts = extractTokens(remaining, '@');
  const projects = extractTokens(remaining, '+');

  return {
    raw,
    done,
    priority,
    completionDate,
    creationDate,
    text: remaining,
    contexts,
    projects,
  };
};

/**
 * Extract @context or +project tokens from text
 */
const extractTokens = (text: string, prefix: string): string[] => {
  const tokens: string[] = [];
  const regex = new RegExp(`\\${prefix}(\\w+)`, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(`${prefix}${match[1]}`);
  }
  return Array.from(new Set(tokens));
};

/**
 * Serialize TodoItem array back to todo.txt format
 */
export const serializeTodos = (items: TodoItem[]): string =>
  items.map((item) => serializeTodoLine(item)).join('\n');

/**
 * Serialize a single TodoItem to todo.txt format
 */
const serializeTodoLine = (item: TodoItem): string => {
  let line = '';

  if (item.done) {
    line += 'x';
    if (item.completionDate) {
      line += ` ${item.completionDate}`;
    }
    if (item.creationDate) {
      line += ` ${item.creationDate}`;
    }
  } else {
    if (item.creationDate) {
      line += item.creationDate + ' ';
    }
  }

  if (item.priority && !item.done) {
    line += `(${item.priority}) `;
  }

  line += item.text;
  return line;
};

/**
 * Add a new todo to the list
 */
export const addTodo = (text: string, items: TodoItem[]): TodoItem[] => {
  const newItem = parseTodoLine(text.trim());
  return [...items, newItem];
};

/**
 * Mark a todo as complete (1-indexed)
 */
export const completeTodo = (n: number, items: TodoItem[]): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  const index = n - 1;
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    done: true,
    completionDate: new Date().toISOString().split('T')[0],
  };
  return updated;
};

/**
 * Delete a todo from the list (1-indexed)
 */
export const deleteTodo = (n: number, items: TodoItem[]): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  return items.filter((_, i) => i !== n - 1);
};

/**
 * Filter todos by @context or +project prefix
 */
export const filterTodos = (query: string, items: TodoItem[]): TodoItem[] => {
  if (!query) {
    return items;
  }

  if (query.startsWith('@')) {
    return items.filter((item) => item.contexts.includes(query));
  } else if (query.startsWith('+')) {
    return items.filter((item) => item.projects.includes(query));
  }

  return items;
};

/**
 * Set priority on a todo (1-indexed)
 */
export const setPriority = (
  n: number,
  priority: string,
  items: TodoItem[]
): TodoItem[] => {
  if (n < 1 || n > items.length || !/^[A-Z]$/.test(priority)) {
    return items;
  }
  const index = n - 1;
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    priority,
  };
  return updated;
};

/**
 * Remove priority from a todo (1-indexed)
 */
export const removePriority = (n: number, items: TodoItem[]): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  const index = n - 1;
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    priority: undefined,
  };
  return updated;
};

/**
 * Append text to a todo (1-indexed)
 */
export const appendToTodo = (
  n: number,
  text: string,
  items: TodoItem[]
): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  const index = n - 1;
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    text: updated[index].text + ' ' + text,
  };
  return updated;
};

/**
 * Prepend text to a todo (1-indexed)
 */
export const prependToTodo = (
  n: number,
  text: string,
  items: TodoItem[]
): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  const index = n - 1;
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    text: text + ' ' + updated[index].text,
  };
  return updated;
};

/**
 * Replace entire todo content (1-indexed), re-parsing to extract contexts/projects
 */
export const replaceTodo = (
  n: number,
  text: string,
  items: TodoItem[]
): TodoItem[] => {
  if (n < 1 || n > items.length) {
    return items;
  }
  const index = n - 1;
  const newItem = parseTodoLine(text.trim());
  const updated = [...items];
  updated[index] = newItem;
  return updated;
};

/**
 * Filter todos by priority (A-Z)
 */
export const filterByPriority = (
  priority: string,
  items: TodoItem[]
): TodoItem[] => {
  if (!/^[A-Z]$/.test(priority)) {
    return [];
  }
  return items.filter((item) => item.priority === priority && !item.done);
};

/**
 * Get unique priority levels present in todos (sorted A-Z)
 */
export const getUniquePriorities = (items: TodoItem[]): string[] => {
  const priorities = new Set<string>();
  items.forEach((item) => {
    if (item.priority && !item.done) {
      priorities.add(item.priority);
    }
  });
  return Array.from(priorities).sort();
};

/**
 * Get unique @context tags (sorted)
 */
export const getUniqueContexts = (items: TodoItem[]): string[] => {
  const contexts = new Set<string>();
  items.forEach((item) => {
    item.contexts.forEach((ctx) => contexts.add(ctx));
  });
  return Array.from(contexts).sort();
};

/**
 * Get unique +project tags (sorted)
 */
export const getUniqueProjects = (items: TodoItem[]): string[] => {
  const projects = new Set<string>();
  items.forEach((item) => {
    item.projects.forEach((proj) => projects.add(proj));
  });
  return Array.from(projects).sort();
};

/**
 * Archive (remove) completed todos, keep only active items
 */
export const archiveTodos = (items: TodoItem[]): TodoItem[] =>
  items.filter((item) => !item.done);
