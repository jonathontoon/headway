import { memo, Fragment } from "react";
import type { TodoItem } from "@types";
import Muted from "./Muted";

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-red-500",
  B: "text-yellow-500",
  C: "text-green-500",
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const renderText = (text: string, completed: boolean) =>
  text.split(/(\s+)/).map((word, i) => {
    if (DATE_REGEX.test(word)) {
      return <Muted key={i}>{word}</Muted>;
    }

    if (!completed) {
      const match = word.match(/^([@+]\w+)(.*)$/);
      if (match) {
        const [_, tag, rest] = match;
        const colorClass = tag.startsWith("@") ? "text-cyan-400" : "text-blue-400";
        return (
          <Fragment key={i}>
            <span className={colorClass}>{tag}</span>
            {rest}
          </Fragment>
        );
      }
    }

    return <Fragment key={i}>{word}</Fragment>;
  });

interface LineProps {
  num: number;
  item: TodoItem;
}

const Line = memo(({ num, item }: LineProps) => {
  const { completed, priority, text } = item;

  return (
    <p className="flex">
      <Muted className="shrink-0 w-6">{num}.</Muted>
      <span className={completed ? "line-through text-gray-600" : "text-gray-100"}>
{priority && !completed && (
          <span className={PRIORITY_COLORS[priority] ?? "text-gray-500"}>
            ({priority})
          </span>
        )}
        <span className="pl-1">{renderText(text, completed)}</span>
      </span>
    </p>
  );
});

export default Line;
