import { memo, type FunctionComponent } from "react";
import type { TodoItem } from "@types";
import Response from "./Response";
import Stack from "./Stack";
import Hint from "./Hint";
import Label from "./Label";
import Line from "./TodoLine";

interface TodoListResponseProps {
  todos: TodoItem[];
  title?: string;
}

const TodoListResponse: FunctionComponent<TodoListResponseProps> = memo(
  ({ todos, title }) => {
    if (todos.length === 0) {
      return (
        <Response>
          <Hint>No tasks to display.</Hint>
        </Response>
      );
    }

    return (
      <Response>
        <Stack>
          {title && <Label className="mb-2">{title}</Label>}
          {todos.map((todo, i) => (
            <Line key={todo.id} num={i + 1} item={todo} />
          ))}
        </Stack>
      </Response>
    );
  }
);

export default TodoListResponse;
