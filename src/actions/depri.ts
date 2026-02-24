import type { TerminalResponse } from '@models/terminalResponse';
import { removePriority } from '@services/todoService';
import withTodos from '@actions/withTodos';

const depriCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: depri [number]',
    };
  }

  return withTodos(
    index,
    (todos) => removePriority(index, todos),
    () => ({ type: 'status', statusType: 'success', statusText: `Removed priority from todo #${index}.` }),
    'Failed to remove priority.'
  );
};

export default depriCommand;
