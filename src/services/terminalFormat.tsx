import type { ReactNode } from "react";
import { getLocalDate } from "../store/todos/summary";

const SECTION_HEADERS = new Set([
  "TASKS",
  "STATUS",
  "ATTRIBUTES",
  "VIEWS",
  "OTHER",
  "OVERDUE",
  "TODAY",
  "INBOX",
]);

const SUCCESS_PREFIXES = [
  "Added:",
  "Updated:",
  "Deleted:",
  "Completed:",
  "Reopened:",
];
const MUTED_PATTERN =
  /\b(empty|is clear|No |not a recognized command|not found)\b/i;
const SECONDARY_LINE_PREFIXES = ["created:", "If it's saved you time"];

const TASK_LINE_PATTERN = /^(\d+)\.\s+(?:\((\w)\)\s+)?(.*)$/;
const COUNT_ROW_PATTERN = /^(\d+)\s+(\+[\w-]+|[a-z][a-z ]*)$/;
const HELP_ROW_PATTERN = /^(.+?) - (.+)$/;
const URL_PATTERN = /^https?:\/\//;
const BOOT_BANNER_PATTERN = /^↗ /;
const GREETING_PATTERN = /^(Good morning|Good afternoon|Good evening)\./;
const TASK_FRAGMENT_PATTERN = /(\+[\w-]+|@[\w-]+|due:\d{4}-\d{2}-\d{2})/g;
const HELP_ARG_PATTERN = /(<[^>]+>|"[^"]*")/g;
const HEART_PATTERN = /(♥)/;

export function formatPromptSymbol(prompt: string): ReactNode {
  const [head, ...rest] = prompt;
  return (
    <>
      <span className="text-terminal-6">{head}</span>
      <span className="text-terminal-3">{rest.join("")}</span>
    </>
  );
}

function priorityClassName(letter: string): string | undefined {
  switch (letter.toUpperCase()) {
    case "A":
      return "text-terminal-1";
    case "B":
      return "text-terminal-11";
    case "C":
      return "text-terminal-2";
    default:
      return undefined;
  }
}

function renderTaskFragments(text: string, today: string): ReactNode {
  return text.split(TASK_FRAGMENT_PATTERN).map((part, i) => {
    if (part.startsWith("+")) {
      return (
        <span key={i} className="text-terminal-6">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-terminal-6">
          {part}
        </span>
      );
    }
    const dueMatch = part.match(/^due:(\d{4}-\d{2}-\d{2})$/);
    if (dueMatch) {
      const date = dueMatch[1];
      const className =
        date < today
          ? "text-terminal-1"
          : date === today
            ? "text-terminal-11"
            : "text-terminal-5";
      return (
        <span key={i} className={className}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function renderTaskLine(
  match: RegExpMatchArray,
  today: string,
  key: number,
): ReactNode {
  const [, id, priority, rest] = match;
  const priorityClass = priority ? priorityClassName(priority) : undefined;

  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span className="text-terminal-8">{id}.</span>{" "}
      {priority && <span className={priorityClass}>({priority}) </span>}
      {renderTaskFragments(rest, today)}
    </div>
  );
}

function statLabelClassName(label: string): string | undefined {
  if (label.startsWith("+")) return "text-terminal-6";
  if (label === "overdue") return "text-terminal-1";
  if (label === "due today") return "text-terminal-11";
  if (label === "on the horizon") return "text-terminal-5";
  if (label === "parked in someday") return "text-terminal-6";
  if (label.startsWith("wrapped up")) return "text-terminal-2";
  return undefined;
}

function renderCountRow(match: RegExpMatchArray, key: number): ReactNode {
  const [, count, label] = match;
  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span
        className={`inline-block min-w-[3ch] text-right ${statLabelClassName(label) ?? ""}`}
      >
        {count}
      </span>{" "}
      <span>{label}</span>
    </div>
  );
}

function renderHelpCommandSegment(segment: string): ReactNode {
  return segment.split(HELP_ARG_PATTERN).map((part, i) =>
    part.startsWith("<") || part.startsWith('"') ? (
      <span key={i} className="text-terminal-6">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function renderHelpRow(match: RegExpMatchArray, key: number): ReactNode {
  const [, command, description] = match;
  return (
    <div
      key={key}
      className="grid grid-cols-[290px_1fr] gap-4 whitespace-pre-wrap"
    >
      <span className="text-terminal-3">
        {renderHelpCommandSegment(command)}
      </span>
      <span className="text-terminal-8">{description}</span>
    </div>
  );
}

function renderBootBanner(line: string, key: number): ReactNode {
  const words = line.split(" ");
  const [arrow, ...rest] = words;
  const version = rest.pop();
  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span className="text-terminal-3">{arrow}</span> {rest.join(" ")}{" "}
      <span className="text-terminal-6">{version}</span>
    </div>
  );
}

function renderGreeting(line: string, key: number): ReactNode {
  const parts = line.split(/(\d+ overdue tasks?|\d+ due today)/);
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\d+ overdue tasks?$/.test(part)) {
          return (
            <span key={i} className="text-terminal-1">
              {part}
            </span>
          );
        }
        if (/^\d+ due today$/.test(part)) {
          return (
            <span key={i} className="text-terminal-11">
              {part}
            </span>
          );
        }
        return part;
      })}
    </div>
  );
}

function renderSecondaryLine(line: string, key: number): ReactNode {
  return (
    <div
      key={key}
      className="block whitespace-pre-wrap text-terminal-8 pl-[2ch]"
    >
      {line}
    </div>
  );
}

function renderUrlLine(line: string, key: number): ReactNode {
  return (
    <div
      key={key}
      className="block whitespace-pre-wrap text-terminal-6 pl-[2ch]"
    >
      {line}
    </div>
  );
}

function renderWithHeart(line: string): ReactNode {
  if (!HEART_PATTERN.test(line)) return line;
  return line.split(HEART_PATTERN).map((part, i) =>
    part === "♥" ? (
      <span key={i} className="text-terminal-1">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function renderMessageLine(line: string, key: number): ReactNode {
  let colorClass = "";
  if (line.startsWith("Error:")) {
    colorClass = "text-terminal-1";
  } else if (line.startsWith("Warning:")) {
    colorClass = "text-terminal-11";
  } else if (
    SUCCESS_PREFIXES.some((prefix) => line.startsWith(prefix)) ||
    line === "Opened in $EDITOR."
  ) {
    colorClass = "text-terminal-2";
  } else if (MUTED_PATTERN.test(line)) {
    colorClass = "text-terminal-8";
  }

  return (
    <div key={key} className={`block whitespace-pre-wrap ${colorClass}`}>
      {"→ "}
      {renderWithHeart(line)}
    </div>
  );
}

export function formatOutput(output: string): ReactNode {
  const today = getLocalDate();

  return output.split("\n").map((line, i) => {
    if (line === "") {
      return <div key={i} className="h-[0.5em]" aria-hidden="true" />;
    }
    if (SECTION_HEADERS.has(line)) {
      return (
        <div
          key={i}
          className="block whitespace-pre-wrap text-terminal-8 mt-[0.5em]"
        >
          {line}
        </div>
      );
    }

    const taskMatch = line.match(TASK_LINE_PATTERN);
    if (taskMatch) return renderTaskLine(taskMatch, today, i);

    const countMatch = line.match(COUNT_ROW_PATTERN);
    if (countMatch) return renderCountRow(countMatch, i);

    if (SECONDARY_LINE_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      return renderSecondaryLine(line, i);
    }

    const helpMatch = line.match(HELP_ROW_PATTERN);
    if (helpMatch) return renderHelpRow(helpMatch, i);

    if (BOOT_BANNER_PATTERN.test(line)) return renderBootBanner(line, i);
    if (GREETING_PATTERN.test(line)) return renderGreeting(line, i);

    if (line === "Type 'help' for all available commands.") {
      return (
        <div key={i} className="block whitespace-pre-wrap text-terminal-8">
          {line}
        </div>
      );
    }

    if (URL_PATTERN.test(line)) return renderUrlLine(line, i);

    return renderMessageLine(line, i);
  });
}
