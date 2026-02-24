// ============================================================================
// Command Definitions
// ============================================================================

export interface CommandDef {
  usage: string;
  description: string;
  category: string;
}

export const commandDefs: CommandDef[] = [
  {
    usage: "help",
    description: "Show available commands",
    category: "General",
  },
  {
    usage: "add",
    description: "Create a new todo",
    category: "Todo",
  },
  {
    usage: "list [filter]",
    description: "List todos. Filters: completed, archived, @context, +project",
    category: "Todo",
  },
  {
    usage: "edit [number] [text]",
    description: "Edit a todo's text",
    category: "Todo",
  },
  {
    usage: "done [number]",
    description: "Mark a todo as complete",
    category: "Todo",
  },
  {
    usage: "remove [number]",
    description: "Delete a todo",
    category: "Todo",
  },
];
