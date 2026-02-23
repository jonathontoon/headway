import { type FunctionComponent, type JSX } from "react";
import type { TodoItem } from "@services/todoService";

import Response from "@common/Response";
import Paragraph from "@base/Paragraph";
import Span from "@base/Span";
import Div from "@base/Div";

interface TodoListResponseProps {
  todos: TodoItem[];
  title?: string;
}

const TodoListResponse: FunctionComponent<TodoListResponseProps> = ({
  todos,
  title
}) => {
  if (todos.length === 0) {
    return (
      <Response className="flex flex-col gap-2">
        <Paragraph className="text-gray-500">No todos to display.</Paragraph>
      </Response>
    );
  }

  return (
    <Response className="flex flex-col gap-2">
      <Div className="flex flex-col gap-1">
        {title && (
          <Paragraph className="text-gray-400 mb-2">{title}</Paragraph>
        )}
        {todos.map((todo, index) => (
          <TodoLineItem key={index} number={index + 1} todo={todo} />
        ))}
      </Div>
    </Response>
  );
};

interface TodoLineItemProps {
  number: number;
  todo: TodoItem;
}

const TodoLineItem: FunctionComponent<TodoLineItemProps> = ({ number, todo }) => {
  const { done, priority, text, contexts, projects } = todo;

  // Base class with strikethrough for done items
  const contentClass = done ? "line-through text-gray-600" : "text-gray-100";

  return (
    <Paragraph className="flex">
      <Span className="text-gray-500 shrink-0 w-6">{number}.</Span>
      <Span className={contentClass}>
        {done && <Span className="text-gray-500 mr-1">✓</Span>}
        {priority && !done && (
          <Span className={getPriorityColor(priority)}>({priority})</Span>
        )}
        <Span className="pl-1">
          {renderTodoText(text, contexts, projects)}
        </Span>
      </Span>
    </Paragraph>
  );
};

/**
 * Get color class based on priority
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case "A":
      return "text-red-500";
    case "B":
      return "text-yellow-500";
    case "C":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Render todo text with colored @contexts and +projects
 */
function renderTodoText(
  text: string,
  contexts: string[],
  projects: string[]
): JSX.Element {
  // Split text into words
  const words = text.split(/(\s+)/);

  return (
    <>
      {words.map((word, idx) => {
        if (contexts.includes(word)) {
          return (
            <Span key={idx} className="text-cyan-400">
              {word}
            </Span>
          );
        }
        if (projects.includes(word)) {
          return (
            <Span key={idx} className="text-blue-400">
              {word}
            </Span>
          );
        }
        // Check if word is a date (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(word)) {
          return (
            <Span key={idx} className="text-gray-500">
              {word}
            </Span>
          );
        }
        return word;
      })}
    </>
  );
}

export default TodoListResponse;
