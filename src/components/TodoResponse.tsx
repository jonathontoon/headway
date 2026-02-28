import type { TodoResponse as TodoResponseData } from "@types";
import Response from "./Response";
import TodoRow from "@components/TodoRow";

interface Props {
  response: TodoResponseData;
}

const TodoResponse = ({ response }: Props) => (
  <Response as="ol" className="m-0 flex flex-col gap-0.5 list-none p-0">
    {response.items.map((r, i) => (
      <TodoRow key={i} response={r} />
    ))}
  </Response>
);

export default TodoResponse;
