import { type FunctionComponent } from "react";
import type { TodoItem } from "@types";
import Response from "./Response";
import Line from "./TodoLine";

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
        {todos.map((todo, i) => (
          <Line key={todo.id} num={i + 1} item={todo} />
        ))}
      </div>
    </Response>
  );
};

export default TodoListResponse;
