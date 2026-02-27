import type { Todo } from "@types";
import TodoIndex from "@components/TodoIndex";
import TodoText from "@components/TodoText";

interface Props {
  response: Todo;
}

const TodoRow = ({ response }: Props) => (
  <div className="flex gap-2">
    <TodoIndex index={response.index} />
    <TodoText text={response.text} />
  </div>
);

export default TodoRow;
