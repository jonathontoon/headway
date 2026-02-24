import type { TerminalResponse } from '@models/terminalResponse';
import { setPriority } from '@services/todoService';
import withTodos from '@actions/withTodos';

const priCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const priorityStr = args[1] ?? '';

  if (!indexStr || !priorityStr || !/^[A-Z]$/.test(priorityStr)) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid arguments.',
      hintText: 'Usage: pri [number] [A-Z]',
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: pri [number] [A-Z]',
    };
  }

  return withTodos(
    index,
    (todos) => setPriority(index, priorityStr, todos),
    () => ({ type: 'status', statusType: 'success', statusText: `Set priority (${priorityStr}) for todo #${index}.` }),
    'Failed to set priority.'
  );
};

export default priCommand;
