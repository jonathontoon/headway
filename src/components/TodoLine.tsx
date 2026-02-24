import { memo, Fragment } from "react";
import type { TodoItem } from "@types";

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-red-500",
  B: "text-yellow-500",
  C: "text-green-500",
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const renderText = (text: string) =>
  text.split(/(\s+)/).map((word, i) => (
    <Fragment key={i}>
      {DATE_REGEX.test(word) ? <span className="text-gray-500">{word}</span> : word}
    </Fragment>
  ));

interface LineProps {
  num: number;
  item: TodoItem;
}

const Line = memo(({ num, item }: LineProps) => {
  const { completed, priority, text } = item;

  return (
    <p className="flex">
      <span className="text-gray-500 shrink-0 w-6">{num}.</span>
      <span className={completed ? "line-through text-gray-600" : "text-gray-100"}>
        {completed && <span className="text-gray-500 mr-1">(✕)</span>}
        {priority && !completed && (
          <span className={PRIORITY_COLORS[priority] ?? "text-gray-500"}>
            ({priority})
          </span>
        )}
        <span className="pl-1">{completed ? text : renderText(text)}</span>
      </span>
    </p>
  );
});

export default Line;
