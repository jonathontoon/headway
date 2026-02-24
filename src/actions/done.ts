import type { TerminalResponse } from '@models/terminalResponse';
import { completeTodo } from '@services/todoService';
import withTodos from '@actions/withTodos';

const doneCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const index = parseInt(indexStr, 10);

  if (!indexStr || isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: done [number]',
    };
  }

  return withTodos(
    index,
    (todos) => completeTodo(index, todos),
    () => ({ type: 'status', statusType: 'success', statusText: `Marked todo #${index} as complete.` }),
    'Failed to mark todo complete.'
  );
};

export default doneCommand;
