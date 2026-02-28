import type { BucketedTodoResponse as Data } from "@types";
import TodoRow from "@components/TodoRow";

interface Props {
  response: Data;
}

const BucketedTodoResponse = ({ response }: Props) => (
  <div className="flex flex-col gap-6">
    {response.sections.map((section) => (
      <div key={section.label} className="flex flex-col gap-0.5">
        <div className="text-terminal-muted text-sm mb-1 select-none">
          -- {section.label} --
        </div>
        <ol className="m-0 p-0 list-none flex flex-col gap-0.5">
          {section.items.map((item, i) => (
            <TodoRow key={i} response={item} />
          ))}
        </ol>
      </div>
    ))}
  </div>
);

export default BucketedTodoResponse;
