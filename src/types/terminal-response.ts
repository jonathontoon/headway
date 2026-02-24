import type { StatusType } from "@components/Status";
import type { TodoItem } from "@lib/models";

export type TerminalResponse =
  | {
      type: "status";
      statusType: StatusType;
      statusText: string;
      hintText?: string;
    }
  | { type: "todo"; todos: TodoItem[]; title?: string }
  | { type: "tag"; tags: string[]; variant: "context" | "project" }
  | { type: "help" }
  | { type: "intro" }
  | { type: "logo" }
  | { type: "default"; commandName: string; hintText?: string }
  | { type: "clear" }
  | { type: "prompt"; value: string };
