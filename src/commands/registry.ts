import type { TerminalResponse } from '@models/terminalResponse';

import addCommand from '@commands/addCommand';
import listCommand from '@commands/listCommand';
import doneCommand from '@commands/doneCommand';
import deleteCommand from '@commands/deleteCommand';
import clearCommand from '@commands/clearCommand';
import helpCommand from '@commands/helpCommand';
import priCommand from '@commands/priCommand';
import depriCommand from '@commands/depriCommand';
import appendCommand from '@commands/appendCommand';
import prependCommand from '@commands/prependCommand';
import replaceCommand from '@commands/replaceCommand';
import listpriCommand from '@commands/listpriCommand';
import listconCommand from '@commands/listconCommand';
import listprojCommand from '@commands/listprojCommand';
import archiveCommand from '@commands/archiveCommand';

type CommandFn = (args: string[]) => TerminalResponse | TerminalResponse[];

const registry: Record<string, CommandFn> = {
  add: addCommand,
  a: addCommand,
  list: listCommand,
  ls: listCommand,
  done: doneCommand,
  delete: deleteCommand,
  rm: deleteCommand,
  clear: clearCommand,
  help: helpCommand,
  pri: priCommand,
  p: priCommand,
  depri: depriCommand,
  dp: depriCommand,
  append: appendCommand,
  app: appendCommand,
  prepend: prependCommand,
  prep: prependCommand,
  replace: replaceCommand,
  listpri: listpriCommand,
  lsp: listpriCommand,
  listcon: listconCommand,
  lsc: listconCommand,
  listproj: listprojCommand,
  lsprj: listprojCommand,
  archive: archiveCommand,
};

export const resolveCommand = (
  name: string,
  args: string[]
): TerminalResponse[] => {
  const fn = registry[name];
  if (!fn) {
    return [
      {
        type: 'default',
        commandName: name,
        hintText: "Type 'help' for commands.",
      },
    ];
  }
  const result = fn(args);
  return Array.isArray(result) ? result : [result];
};
