import type { TodoResponse } from "@types";
import Response from "./Response";
import TodoRow from "@components/TodoRow";

interface Props {
  responses: TodoResponse[];
}

const TodoList = ({ responses }: Props) => (
  <Response className="flex flex-col gap-0.5">
    {responses.map((r, i) => (
      <TodoRow key={i} response={r} />
    ))}
  </Response>
);

export default TodoList;
