import type { TodoResponse as TodoResponseType } from "@types";
import Response from "./Response";
import TodoIndex from "@components/TodoIndex";
import TodoText from "@components/TodoText";

interface Props {
  response: TodoResponseType;
}

const TodoResponse = ({ response }: Props) => (
  <Response className="flex gap-2">
    <TodoIndex index={response.index} />
    <TodoText text={response.text} />
  </Response>
);

export default TodoResponse;
