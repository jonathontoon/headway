import type { TerminalResponse } from "../../types/terminal-response";

export interface CommandDef {
  usage: string;
  description: string;
  category: string;
}

export const commandDefs: CommandDef[] = [
  {
    usage: "add [text] / a",
    description: "Add a new todo item.",
    category: "Core Commands",
  },
  {
    usage: "list [filter] / ls",
    description: "List all todos, optionally filter by @context or +project.",
    category: "Core Commands",
  },
  {
    usage: "edit [n] [text]",
    description: "Edit todo #n with new text.",
    category: "Core Commands",
  },
  {
    usage: "done [n]",
    description: "Mark todo #n as complete.",
    category: "Core Commands",
  },
  {
    usage: "delete [n] / rm",
    description: "Delete todo #n.",
    category: "Core Commands",
  },
  {
    usage: "archive",
    description: "Remove all completed todos.",
    category: "Maintenance",
  },
  {
    usage: "help",
    description: "Show this help message.",
    category: "Maintenance",
  },
];

import add from "./add";
import list from "./list";
import edit from "./edit";
import done from "./done";
import deleteAction from "./delete";
import help from "./help";
import archive from "./archive";

type CommandFn = (args: string[]) => TerminalResponse | TerminalResponse[];

const registry: Record<string, CommandFn> = {
  add: add,
  a: add,
  list: list,
  ls: list,
  edit: edit,
  done: done,
  delete: deleteAction,
  rm: deleteAction,
  help: help,
  archive: archive,
};

export const resolveCommand = (
  name: string,
  args: string[]
): TerminalResponse[] => {
  const fn = registry[name];
  if (!fn) {
    return [
      {
        type: "default",
        commandName: name,
        hintText: "Type 'help' for commands.",
      },
    ];
  }
  const result = fn(args);
  return Array.isArray(result) ? result : [result];
};
