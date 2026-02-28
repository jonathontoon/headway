import {
  TASK_BUCKETS,
  TASK_PRIORITIES,
  type TaskBucket,
  type TaskPriority,
} from "@reducers/tasks/taskTypes";
import type { ParseResult } from "@reducers/terminal/terminalTypes";

const isTaskBucket = (value: string): value is TaskBucket =>
  TASK_BUCKETS.includes(value as TaskBucket);

const isTaskPriority = (value: string): value is TaskPriority =>
  TASK_PRIORITIES.includes(value as TaskPriority);

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const parseCommand = (raw: string): ParseResult => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a command." };
  }

  const [name, ...rest] = trimmed.split(/\s+/);

  switch (name.toLowerCase()) {
    case "help":
      return rest.length === 0
        ? { ok: true, command: { type: "help" } }
        : { ok: false, error: "usage: help" };
    case "clear":
      return rest.length === 0
        ? { ok: true, command: { type: "clear" } }
        : { ok: false, error: "usage: clear" };
    case "list":
      return rest.length === 0
        ? { ok: true, command: { type: "list" } }
        : { ok: false, error: "usage: list" };
    case "add": {
      const title = rest.join(" ").trim();
      return title
        ? { ok: true, command: { type: "add", title } }
        : { ok: false, error: "usage: add <title>" };
    }
    case "done":
      return rest[0]
        ? { ok: true, command: { type: "done", target: rest[0] } }
        : { ok: false, error: "usage: done <id-or-index>" };
    case "delete":
      return rest[0]
        ? { ok: true, command: { type: "delete", target: rest[0] } }
        : { ok: false, error: "usage: delete <id-or-index>" };
    case "edit": {
      const [target, ...titleParts] = rest;
      const title = titleParts.join(" ").trim();
      if (!target || !title) {
        return { ok: false, error: "usage: edit <id-or-index> <title>" };
      }

      return { ok: true, command: { type: "edit", target, title } };
    }
    case "move": {
      const [target, bucket] = rest;
      if (!target || !bucket || !isTaskBucket(bucket)) {
        return {
          ok: false,
          error: "usage: move <id-or-index> <inbox|today|upcoming|anytime>",
        };
      }

      return { ok: true, command: { type: "move", target, bucket } };
    }
    case "priority": {
      const [target, rawPriority] = rest;
      if (!target || !rawPriority) {
        return {
          ok: false,
          error: "usage: priority <id-or-index> <A|B|C|none>",
        };
      }

      const normalized = rawPriority.toUpperCase();
      if (normalized !== "NONE" && !isTaskPriority(normalized)) {
        return {
          ok: false,
          error: "priority must be A, B, C, or none",
        };
      }

      return {
        ok: true,
        command: {
          type: "priority",
          target,
          priority: normalized === "NONE" ? null : normalized,
        },
      };
    }
    case "due": {
      const [target, rawDueDate] = rest;
      if (!target || !rawDueDate) {
        return {
          ok: false,
          error: "usage: due <id-or-index> <YYYY-MM-DD|none>",
        };
      }

      if (rawDueDate.toLowerCase() !== "none" && !isIsoDate(rawDueDate)) {
        return {
          ok: false,
          error: "due date must be YYYY-MM-DD or none",
        };
      }

      return {
        ok: true,
        command: {
          type: "due",
          target,
          dueDate: rawDueDate.toLowerCase() === "none" ? null : rawDueDate,
        },
      };
    }
    default:
      return { ok: false, error: `${name}: command not found` };
  }
};
