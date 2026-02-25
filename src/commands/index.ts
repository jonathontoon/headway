import type { TerminalResponse } from "@types";
import * as add from "./add";
import * as list from "./list";
import * as edit from "./edit";
import * as done from "./done";
import * as remove from "./remove";
import * as help from "./help";

type CommandModule = {
  aliases: string[];
  execute: (args: string[]) => TerminalResponse[];
};

const modules: CommandModule[] = [add, list, edit, done, remove, help];

export const commandRegistry: Record<string, (args: string[]) => TerminalResponse[]> = {};

for (const mod of modules) {
  for (const alias of mod.aliases) {
    commandRegistry[alias] = mod.execute;
  }
}
