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
      <span className="term-prompt-tilde">{head}</span>
      <span className="term-prompt-dollar">{rest.join("")}</span>
    </>
  );
}

function priorityClassName(letter: string): string | undefined {
  switch (letter.toUpperCase()) {
    case "A":
      return "term-error";
    case "B":
      return "term-warning";
    case "C":
      return "term-success";
    default:
      return undefined;
  }
}

function renderTaskFragments(text: string, today: string): ReactNode {
  return text.split(TASK_FRAGMENT_PATTERN).map((part, i) => {
    if (part.startsWith("+")) {
      return (
        <span key={i} className="term-project">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="term-context">
          {part}
        </span>
      );
    }
    const dueMatch = part.match(/^due:(\d{4}-\d{2}-\d{2})$/);
    if (dueMatch) {
      const date = dueMatch[1];
      const className =
        date < today
          ? "term-due-overdue"
          : date === today
            ? "term-due-today"
            : "term-due-future";
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
    <div key={key} className="terminal-row">
      <span className="term-muted">{id}.</span>{" "}
      {priority && <span className={priorityClass}>({priority}) </span>}
      {renderTaskFragments(rest, today)}
    </div>
  );
}

function statLabelClassName(label: string): string | undefined {
  if (label.startsWith("+")) return "term-project";
  if (label === "overdue") return "term-error";
  if (label === "due today") return "term-warning";
  if (label === "on the horizon") return "term-due-future";
  if (label === "parked in someday") return "term-project";
  if (label.startsWith("wrapped up")) return "term-success";
  return undefined;
}

function renderCountRow(match: RegExpMatchArray, key: number): ReactNode {
  const [, count, label] = match;
  return (
    <div key={key} className="terminal-row">
      <span className={`term-count ${statLabelClassName(label) ?? ""}`}>
        {count}
      </span>{" "}
      <span>{label}</span>
    </div>
  );
}

function renderHelpCommandSegment(segment: string): ReactNode {
  return segment.split(HELP_ARG_PATTERN).map((part, i) =>
    part.startsWith("<") || part.startsWith('"') ? (
      <span key={i} className="term-project">
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
    <div key={key} className="terminal-row terminal-row--help">
      <span className="term-help-command term-command-accent">
        {renderHelpCommandSegment(command)}
      </span>
      <span className="term-muted">{description}</span>
    </div>
  );
}

function renderBootBanner(line: string, key: number): ReactNode {
  const words = line.split(" ");
  const [arrow, ...rest] = words;
  const version = rest.pop();
  return (
    <div key={key} className="terminal-row">
      <span className="term-command-accent">{arrow}</span> {rest.join(" ")}{" "}
      <span className="term-project">{version}</span>
    </div>
  );
}

function renderGreeting(line: string, key: number): ReactNode {
  const parts = line.split(/(\d+ overdue tasks?|\d+ due today)/);
  return (
    <div key={key} className="terminal-row">
      {parts.map((part, i) => {
        if (/^\d+ overdue tasks?$/.test(part)) {
          return (
            <span key={i} className="term-error">
              {part}
            </span>
          );
        }
        if (/^\d+ due today$/.test(part)) {
          return (
            <span key={i} className="term-warning">
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
    <div key={key} className="terminal-row term-muted term-indent">
      {line}
    </div>
  );
}

function renderUrlLine(line: string, key: number): ReactNode {
  return (
    <div key={key} className="terminal-row term-project term-indent">
      {line}
    </div>
  );
}

function renderWithHeart(line: string): ReactNode {
  if (!HEART_PATTERN.test(line)) return line;
  return line.split(HEART_PATTERN).map((part, i) =>
    part === "♥" ? (
      <span key={i} className="term-error">
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
    colorClass = "term-error";
  } else if (line.startsWith("Warning:")) {
    colorClass = "term-warning";
  } else if (
    SUCCESS_PREFIXES.some((prefix) => line.startsWith(prefix)) ||
    line === "Opened in $EDITOR."
  ) {
    colorClass = "term-success";
  } else if (MUTED_PATTERN.test(line)) {
    colorClass = "term-muted";
  }

  return (
    <div key={key} className={`terminal-row ${colorClass}`}>
      {"→ "}
      {renderWithHeart(line)}
    </div>
  );
}

export function formatOutput(output: string): ReactNode {
  const today = getLocalDate();

  return output.split("\n").map((line, i) => {
    if (line === "") {
      return <div key={i} className="term-gap" aria-hidden="true" />;
    }
    if (SECTION_HEADERS.has(line)) {
      return (
        <div key={i} className="terminal-row term-muted term-header">
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
        <div key={i} className="terminal-row term-muted">
          {line}
        </div>
      );
    }

    if (URL_PATTERN.test(line)) return renderUrlLine(line, i);

    return renderMessageLine(line, i);
  });
}
