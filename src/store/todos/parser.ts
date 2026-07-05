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
    return match ? [{ key: match[1], value: match[2] }] : [];
  });
}

export function isTodoDate(value: string): boolean {
  return DATE_PATTERN.test(value);
}

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

    if (words[index] !== undefined && isTodoDate(words[index])) {
      completionDate = words[index];
      index += 1;
    }

    if (words[index] !== undefined && isTodoDate(words[index])) {
      creationDate = words[index];
      index += 1;
    }
  } else {
    const priorityMatch = words[index]?.match(PRIORITY_PATTERN);
    if (priorityMatch) {
      priority = priorityMatch[1];
      index += 1;
    }

    if (words[index] !== undefined && isTodoDate(words[index])) {
      creationDate = words[index];
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
