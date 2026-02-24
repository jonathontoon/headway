import type { TerminalResponse } from '@models/terminalResponse';
import { appendToTodo } from '@services/todoService';
import withTodos from '@actions/withTodos';

const appendCommand = (args: string[]): TerminalResponse => {
  const indexStr = args[0] ?? '';
  const text = args.slice(1).join(' ');

  if (!indexStr || !text) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Missing arguments.',
      hintText: 'Usage: append [number] [text]',
    };
  }

  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) {
    return {
      type: 'status',
      statusType: 'error',
      statusText: 'Invalid todo number.',
      hintText: 'Usage: append [number] [text]',
    };
  }

  return withTodos(
    index,
    (todos) => appendToTodo(index, text, todos),
    () => ({ type: 'status', statusType: 'success', statusText: `Appended to todo #${index}.` }),
    'Failed to append text.'
  );
};

export default appendCommand;
