import type { ParseTodoResult, TodoMetadata, TodoTask } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRIORITY_PATTERN = /^\(([A-Z])\)$/;
const METADATA_PATTERN = /^([^:\s]+):([^:\s]+)$/;

function extractProjects(words: readonly string[]): readonly string[] {
  return words
    .filter((word) => word.startsWith("+") && word.length > 1)
    .map((word) => word.slice(1));
}

function extractContexts(words: readonly string[]): readonly string[] {
  return words
    .filter((word) => word.startsWith("@") && word.length > 1)
    .map((word) => word.slice(1));
}

function extractMetadata(words: readonly string[]): readonly TodoMetadata[] {
  return words.flatMap((word) => {
    const match = word.match(METADATA_PATTERN);
    if (!match) {
      return [];
    }

    return [{ key: match[1]!, value: match[2]! }];
  });
}

/**
 * Tests whether a value has the todo.txt date format.
 *
 * @param value - Value to test.
 * @returns True when the value is `YYYY-MM-DD`.
 */
export function isTodoDate(value: string): boolean {
  return DATE_PATTERN.test(value);
}

/**
 * Parses one todo.txt line into structured task data.
 *
 * @param line - Raw todo.txt line.
 * @returns A parsed task or a parse error.
 */
export function parseTodoLine(line: string): ParseTodoResult {
  const trimmedLine = line.trim();

  if (trimmedLine === "") {
    return { ok: false, error: "blank todo.txt line" };
  }

  const words = trimmedLine.split(/\s+/);
  let index = 0;
  let completed = false;
  let completionDate: string | undefined;
  let priority: string | undefined;
  let creationDate: string | undefined;

  if (words[index] === "x") {
    completed = true;
    index += 1;

    const maybeCompletionDate = words[index];
    if (maybeCompletionDate !== undefined && isTodoDate(maybeCompletionDate)) {
      completionDate = maybeCompletionDate;
      index += 1;
    }

    const maybeCreationDate = words[index];
    if (maybeCreationDate !== undefined && isTodoDate(maybeCreationDate)) {
      creationDate = maybeCreationDate;
      index += 1;
    }
  } else {
    const priorityMatch = words[index]?.match(PRIORITY_PATTERN);
    if (priorityMatch) {
      priority = priorityMatch[1];
      index += 1;
    }

    const maybeCreationDate = words[index];
    if (maybeCreationDate !== undefined && isTodoDate(maybeCreationDate)) {
      creationDate = maybeCreationDate;
      index += 1;
    }
  }

  const textWords = words.slice(index);
  const text = textWords.join(" ");

  if (text === "") {
    return { ok: false, error: "todo.txt task requires text" };
  }

  const metadata = extractMetadata(textWords);
  const priorityMetadata = metadata.find((item) => item.key === "pri");

  return {
    ok: true,
    task: {
      completed,
      priority: completed ? priorityMetadata?.value : priority,
      completionDate,
      creationDate,
      text,
      projects: extractProjects(textWords),
      contexts: extractContexts(textWords),
      metadata,
    },
  };
}

/**
 * Replaces task text and refreshes parsed project, context, and metadata data.
 *
 * @param task - Source task.
 * @param text - Replacement task text.
 * @returns Task with updated text-derived fields.
 */
export function withTaskText(task: TodoTask, text: string): TodoTask {
  const parsed = parseTodoLine(serializeTodo({ ...task, text }));

  return parsed.ok
    ? parsed.task
    : {
        ...task,
        text,
        projects: [],
        contexts: [],
        metadata: [],
      };
}

/**
 * Serializes parsed task data back to todo.txt text.
 *
 * @param task - Task to serialize.
 * @returns A todo.txt line.
 */
export function serializeTodo(task: TodoTask): string {
  const parts: string[] = [];

  if (task.completed) {
    parts.push("x");
    if (task.completionDate) {
      parts.push(task.completionDate);
    }
    if (task.creationDate) {
      parts.push(task.creationDate);
    }
  } else {
    if (task.priority) {
      parts.push(`(${task.priority})`);
    }
    if (task.creationDate) {
      parts.push(task.creationDate);
    }
  }

  parts.push(task.text.trim());

  return parts.join(" ");
}
