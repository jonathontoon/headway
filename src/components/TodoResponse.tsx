import type { TodoResponse as TodoResponseType } from "@types";
import TodoIndex from "@components/TodoIndex";
import TodoText from "@components/TodoText";

interface Props {
  response: TodoResponseType;
}

const TodoResponse = ({ response }: Props) => (
  <div className="flex gap-2">
    <TodoIndex index={response.index} />
    <TodoText raw={response.raw} />
  </div>
);

export default TodoResponse;
