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
    usage: "pri [n] [A-Z] / p",
    description: "Set priority (A-Z) on todo #n.",
    category: "Priority Management",
  },
  {
    usage: "depri [n] / dp",
    description: "Remove priority from todo #n.",
    category: "Priority Management",
  },
  {
    usage: "append [n] [text] / app",
    description: "Append text to end of todo #n.",
    category: "Text Editing",
  },
  {
    usage: "prepend [n] [text] / prep",
    description: "Prepend text to start of todo #n.",
    category: "Text Editing",
  },
  {
    usage: "replace [n] [text]",
    description: "Replace todo #n entirely with new text.",
    category: "Text Editing",
  },
  {
    usage: "listpri [A-Z] / lsp",
    description: "List all todos with priority (A-Z).",
    category: "Discovery",
  },
  {
    usage: "listcon / lsc",
    description: "List all unique @context tags.",
    category: "Discovery",
  },
  {
    usage: "listproj / lsprj",
    description: "List all unique +project tags.",
    category: "Discovery",
  },
  {
    usage: "archive",
    description: "Remove all completed todos.",
    category: "Maintenance",
  },
  {
    usage: "clear",
    description: "Clear the terminal screen.",
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
import done from "./done";
import deleteAction from "./delete";
import clear from "./clear";
import help from "./help";
import pri from "./pri";
import depri from "./depri";
import append from "./append";
import prepend from "./prepend";
import replace from "./replace";
import listpri from "./listpri";
import listcon from "./listcon";
import listproj from "./listproj";
import archive from "./archive";

type CommandFn = (args: string[]) => TerminalResponse | TerminalResponse[];

const registry: Record<string, CommandFn> = {
  add: add,
  a: add,
  list: list,
  ls: list,
  done: done,
  delete: deleteAction,
  rm: deleteAction,
  clear: clear,
  help: help,
  pri: pri,
  p: pri,
  depri: depri,
  dp: depri,
  append: append,
  app: append,
  prepend: prepend,
  prep: prepend,
  replace: replace,
  listpri: listpri,
  lsp: listpri,
  listcon: listcon,
  lsc: listcon,
  listproj: listproj,
  lsprj: listproj,
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
