import { describe, it, expect } from 'vitest';
import {
  parseTodos,
  serializeTodos,
  addTodo,
  completeTodo,
  deleteTodo,
  appendToTodo,
  prependToTodo,
  replaceTodo,
  setPriority,
  removePriority,
  filterTodos,
  filterByPriority,
  archiveTodos,
} from '../todoService';

const SAMPLE = [
  'Buy groceries +shopping @errands',
  '(A) Call dentist @phone',
  'x 2026-01-10 Read book +reading',
  '2026-02-01 Write report +work @computer',
].join('\n');

describe('parseTodos / serializeTodos', () => {
  it('round-trips through parse and serialize', () => {
    const todos = parseTodos(SAMPLE);
    expect(serializeTodos(todos)).toBe(SAMPLE);
  });

  it('parses done status correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[2].done).toBe(true);
    expect(todos[0].done).toBe(false);
  });

  it('parses priority correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[1].priority).toBe('A');
    expect(todos[0].priority).toBeUndefined();
  });

  it('parses @contexts correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[0].contexts).toEqual(['@errands']);
    expect(todos[1].contexts).toEqual(['@phone']);
  });

  it('parses +projects correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[0].projects).toEqual(['+shopping']);
    expect(todos[3].projects).toEqual(['+work']);
  });

  it('parses creation date correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[3].creationDate).toBe('2026-02-01');
  });

  it('parses completion date correctly', () => {
    const todos = parseTodos(SAMPLE);
    expect(todos[2].completionDate).toBe('2026-01-10');
  });
});

describe('addTodo', () => {
  it('appends a new todo', () => {
    const todos = parseTodos(SAMPLE);
    const result = addTodo('New task @home', todos);
    expect(result).toHaveLength(todos.length + 1);
    expect(result[result.length - 1].text).toBe('New task @home');
    expect(result[result.length - 1].contexts).toEqual(['@home']);
  });
});

describe('completeTodo', () => {
  it('marks a todo as done', () => {
    const todos = parseTodos(SAMPLE);
    const result = completeTodo(1, todos);
    expect(result[0].done).toBe(true);
    expect(result[0].completionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns unchanged list for out-of-bounds index', () => {
    const todos = parseTodos(SAMPLE);
    expect(completeTodo(0, todos)).toBe(todos);
    expect(completeTodo(99, todos)).toBe(todos);
  });
});

describe('deleteTodo', () => {
  it('removes the todo at 1-based index', () => {
    const todos = parseTodos(SAMPLE);
    const result = deleteTodo(1, todos);
    expect(result).toHaveLength(todos.length - 1);
    expect(result[0].text).toBe(todos[1].text);
  });

  it('returns unchanged list for out-of-bounds index', () => {
    const todos = parseTodos(SAMPLE);
    expect(deleteTodo(0, todos)).toBe(todos);
    expect(deleteTodo(99, todos)).toBe(todos);
  });
});

describe('appendToTodo', () => {
  it('appends text to the todo', () => {
    const todos = parseTodos(SAMPLE);
    const result = appendToTodo(1, 'and milk', todos);
    expect(result[0].text).toBe('Buy groceries +shopping @errands and milk');
  });

  it('re-parses @contexts after append', () => {
    const todos = parseTodos(SAMPLE);
    const result = appendToTodo(1, '@home', todos);
    expect(result[0].contexts).toContain('@home');
    expect(result[0].contexts).toContain('@errands');
  });

  it('re-parses +projects after append', () => {
    const todos = parseTodos(SAMPLE);
    const result = appendToTodo(1, '+personal', todos);
    expect(result[0].projects).toContain('+personal');
    expect(result[0].projects).toContain('+shopping');
  });
});

describe('prependToTodo', () => {
  it('prepends text to the todo', () => {
    const todos = parseTodos(SAMPLE);
    const result = prependToTodo(1, 'URGENT:', todos);
    expect(result[0].text).toBe('URGENT: Buy groceries +shopping @errands');
  });

  it('re-parses @contexts after prepend', () => {
    const todos = parseTodos(SAMPLE);
    const result = prependToTodo(1, '@home', todos);
    expect(result[0].contexts).toContain('@home');
    expect(result[0].contexts).toContain('@errands');
  });

  it('re-parses +projects after prepend', () => {
    const todos = parseTodos(SAMPLE);
    const result = prependToTodo(1, '+urgent', todos);
    expect(result[0].projects).toContain('+urgent');
    expect(result[0].projects).toContain('+shopping');
  });
});

describe('replaceTodo', () => {
  it('replaces the todo entirely', () => {
    const todos = parseTodos(SAMPLE);
    const result = replaceTodo(1, 'Completely new task @work', todos);
    expect(result[0].text).toBe('Completely new task @work');
    expect(result[0].contexts).toEqual(['@work']);
    expect(result[0].projects).toEqual([]);
  });
});

describe('setPriority', () => {
  it('sets priority on a todo', () => {
    const todos = parseTodos(SAMPLE);
    const result = setPriority(1, 'B', todos);
    expect(result[0].priority).toBe('B');
  });

  it('returns unchanged list for invalid priority', () => {
    const todos = parseTodos(SAMPLE);
    expect(setPriority(1, 'a', todos)).toBe(todos);
    expect(setPriority(1, 'AB', todos)).toBe(todos);
  });
});

describe('removePriority', () => {
  it('removes priority from a todo', () => {
    const todos = parseTodos(SAMPLE);
    const result = removePriority(2, todos);
    expect(result[1].priority).toBeUndefined();
  });

  it('returns unchanged list for out-of-bounds index', () => {
    const todos = parseTodos(SAMPLE);
    expect(removePriority(0, todos)).toBe(todos);
  });
});

describe('filterTodos', () => {
  it('filters by @context', () => {
    const todos = parseTodos(SAMPLE);
    const result = filterTodos('@errands', todos);
    expect(result).toHaveLength(1);
    expect(result[0].contexts).toContain('@errands');
  });

  it('filters by +project', () => {
    const todos = parseTodos(SAMPLE);
    const result = filterTodos('+work', todos);
    expect(result).toHaveLength(1);
    expect(result[0].projects).toContain('+work');
  });

  it('returns all todos when query is empty', () => {
    const todos = parseTodos(SAMPLE);
    expect(filterTodos('', todos)).toBe(todos);
  });
});

describe('filterByPriority', () => {
  it('returns todos with the given priority', () => {
    const todos = parseTodos(SAMPLE);
    const result = filterByPriority('A', todos);
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('A');
  });

  it('excludes done todos', () => {
    const todos = parseTodos('(A) Active task\nx (A) Done task');
    const result = filterByPriority('A', todos);
    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(false);
  });

  it('returns empty array for invalid priority', () => {
    const todos = parseTodos(SAMPLE);
    expect(filterByPriority('a', todos)).toEqual([]);
  });
});

describe('archiveTodos', () => {
  it('removes completed todos', () => {
    const todos = parseTodos(SAMPLE);
    const result = archiveTodos(todos);
    expect(result.every((t) => !t.done)).toBe(true);
    expect(result.length).toBeLessThan(todos.length);
  });

  it('keeps all active todos', () => {
    const todos = parseTodos(SAMPLE);
    const active = todos.filter((t) => !t.done);
    const result = archiveTodos(todos);
    expect(result).toHaveLength(active.length);
  });
});
