// ============================================================================
// Command Definitions
// ============================================================================

export interface CommandDef {
  usage: string;
  description: string;
  category: string;
}

// Security Limits
export const MAX_TODO_LENGTH = 1000;
export const MAX_TODO_COUNT = 500;

export const commandDefs: CommandDef[] = [
  {
    usage: "help",
    description: "Show available commands",
    category: "General",
  },
  {
    usage: "add",
    description: "Create a new task",
    category: "Todo",
  },
  {
    usage: "list [filter]",
    description:
      "List all tasks. Filters: completed, archived, @context, +project",
    category: "Todo",
  },
  {
    usage: "edit [number] [text]",
    description: "Edit a task's text",
    category: "Todo",
  },
  {
    usage: "done [number]",
    description: "Mark a task as complete",
    category: "Todo",
  },
  {
    usage: "remove [number]",
    description: "Delete a task",
    category: "Todo",
  },
];
