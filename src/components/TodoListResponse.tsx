import { memo, Fragment, type FunctionComponent, type JSX } from "react";
import type { TodoItem } from "@types";
import Response from "./Response";

interface TodoListResponseProps {
  todos: TodoItem[];
  title?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-red-500",
  B: "text-yellow-500",
  C: "text-green-500",
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const colorWord = (
  word: string,
  contexts: Set<string>,
  projects: Set<string>
): JSX.Element | string => {
  if (contexts.has(word)) return word;
  if (projects.has(word)) return word;
  if (DATE_REGEX.test(word))
    return <span className="text-gray-500">{word}</span>;
  return word;
};

const renderText = (text: string, contexts: string[], projects: string[], done = false) => {
  if (done) return <>{text}</>;

  const ctx = new Set(contexts);
  const proj = new Set(projects);
  const words = text.split(/(\s+)/);

  return (
    <Fragment>
      {words.map((word, i) => (
        <Fragment key={i}>{colorWord(word, ctx, proj)}</Fragment>
      ))}
    </Fragment>
  );
};

interface LineProps {
  num: number;
  item: TodoItem;
}

const Line = memo(({ num, item }: LineProps) => {
  const { done, priority, text, contexts, projects } = item;
  const cls = done ? "line-through text-gray-600" : "text-gray-100";
  const pri =
    priority && !done ? PRIORITY_COLORS[priority] || "text-gray-500" : "";

  return (
    <p className="flex">
      <span className="text-gray-500 shrink-0 w-6">{num}.</span>
      <span className={cls}>
{pri && <span className={pri}>({priority})</span>}
        <span className="pl-1">{renderText(text, contexts, projects, done)}</span>
      </span>
    </p>
  );
});

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
        {todos.map((todo, i) => (
          <Line key={todo.id} num={i + 1} item={todo} />
        ))}
      </div>
    </Response>
  );
};

export default TodoListResponse;
