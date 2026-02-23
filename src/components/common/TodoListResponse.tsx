import { type FunctionComponent, type JSX } from 'react';
import type { TodoItem } from '@services/todoService';

import Response from '@common/Response';

interface TodoListResponseProps {
  todos: TodoItem[];
  title?: string;
}

const TodoListResponse: FunctionComponent<TodoListResponseProps> = ({
  todos,
  title,
}) => {
  if (todos.length === 0) {
    return (
      <Response className="flex flex-col gap-2">
        <p className="text-gray-500">No todos to display.</p>
      </Response>
    );
  }

  return (
    <Response className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {title && <p className="text-gray-400 mb-2">{title}</p>}
        {todos.map((todo, index) => (
          <TodoLineItem key={index} number={index + 1} todo={todo} />
        ))}
      </div>
    </Response>
  );
};

interface TodoLineItemProps {
  number: number;
  todo: TodoItem;
}

const TodoLineItem: FunctionComponent<TodoLineItemProps> = ({
  number,
  todo,
}) => {
  const { done, priority, text, contexts, projects } = todo;

  // Base class with strikethrough for done items
  const contentClass = done ? 'line-through text-gray-600' : 'text-gray-100';

  return (
    <p className="flex">
      <span className="text-gray-500 shrink-0 w-6">{number}.</span>
      <span className={contentClass}>
        {done && <span className="text-gray-500 mr-1">✓</span>}
        {priority && !done && (
          <span className={getPriorityColor(priority)}>({priority})</span>
        )}
        <span className="pl-1">{renderTodoText(text, contexts, projects)}</span>
      </span>
    </p>
  );
};

/**
 * Get color class based on priority
 */
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'A':
      return 'text-red-500';
    case 'B':
      return 'text-yellow-500';
    case 'C':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Render todo text with colored @contexts and +projects
 */
const renderTodoText = (
  text: string,
  contexts: string[],
  projects: string[]
): JSX.Element => {
  // Split text into words
  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, idx) => {
        if (contexts.includes(word)) {
          return (
            <span key={idx} className="text-cyan-400">
              {word}
            </span>
          );
        }
        if (projects.includes(word)) {
          return (
            <span key={idx} className="text-blue-400">
              {word}
            </span>
          );
        }
        // Check if word is a date (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(word)) {
          return (
            <span key={idx} className="text-gray-500">
              {word}
            </span>
          );
        }
        return word;
      })}
    </>
  );
};

export default TodoListResponse;
