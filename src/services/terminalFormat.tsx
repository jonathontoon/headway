import { Fragment, type ReactNode } from "react";
import { getLocalDate } from "../store/todos/summary";
import {
  HELP_TEXT,
  MUTED_PATTERN,
  SECONDARY_LINE_PREFIXES,
  SUCCESS_PREFIXES,
} from "../constants";

const SECTION_HEADERS = new Set([
  "TASKS",
  "STATUS",
  "ATTRIBUTES",
  "VIEWS",
  "SYNC",
  "OTHER",
  "OVERDUE",
  "TODAY",
  "INBOX",
]);

const TASK_LINE_PATTERN = /^(\d+)\.\s+(?:\((\w)\)\s+)?(.*)$/;
const COUNT_ROW_PATTERN = /^(\d+)\s+(\+[\w-]+|[a-z][a-z ]*)$/;
const HELP_ROW_PATTERN = /^(.+?)(?: - |\s{2,})(.+)$/;
const URL_PATTERN = /^https?:\/\//;
const BOOT_BANNER_PATTERN = /^↗ /;
const GREETING_PATTERN = /^(Good morning|Good afternoon|Good evening)\./;
const TASK_FRAGMENT_PATTERN = /(\+[\w-]+|@[\w-]+|due:\d{4}-\d{2}-\d{2})/g;
const HELP_ARG_PATTERN = /(<[^>]+>|"[^"]*")/g;
const HEART_PATTERN = /(♥)/;
const SUMMARY_HEADER_PATTERN =
  /^(?:\d+ tasks on your radar right now\.|\d+ projects, \d+ tasks between them\.)$/;

export function formatPromptSymbol(prompt: string): ReactNode {
  const [head, ...rest] = prompt;
  return (
    <>
      <span className="text-role-accent">{head}</span>
      <span className="text-role-command">{rest.join("")}</span>
    </>
  );
}

function priorityClassName(letter: string): string {
  // Warm to cool priority gradient for the top 5 priorities: red → yellow → green → cyan → blue
  const PRIORITY_COLORS = [
    "text-terminal-1", // A: red (warm)
    "text-terminal-3", // B: yellow
    "text-terminal-2", // C: green
    "text-terminal-6", // D: cyan
    "text-terminal-4", // E: blue (cool)
  ] as const;
  const charCode = letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  if (charCode < 0 || charCode >= PRIORITY_COLORS.length)
    return "text-role-muted";
  return PRIORITY_COLORS[charCode];
}

function renderTaskFragments(text: string, today: string): ReactNode {
  return text.split(TASK_FRAGMENT_PATTERN).map((part, i) => {
    if (part.startsWith("+")) {
      return (
        <span key={i} className="text-role-accent">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-role-context">
          {part}
        </span>
      );
    }
    const dueMatch = part.match(/^due:(\d{4}-\d{2}-\d{2})$/);
    if (dueMatch) {
      const date = dueMatch[1];
      const className =
        date < today
          ? "text-role-error"
          : date === today
            ? "text-role-warning"
            : "text-role-info";
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
  idColumnWidth: number,
): ReactNode {
  const [, id, priority, rest] = match;

  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span
        className="inline-block text-right text-role-muted"
        style={{ minWidth: `${idColumnWidth}ch` }}
      >
        {id}.
      </span>{" "}
      {priority && (
        <span className={priorityClassName(priority)}>({priority}) </span>
      )}
      {renderTaskFragments(rest, today)}
    </div>
  );
}

function statLabelClassName(label: string): string | undefined {
  if (label.startsWith("+")) return "text-role-accent";
  if (label === "overdue") return "text-role-error";
  if (label === "due today") return "text-role-warning";
  if (label === "on the horizon") return "text-role-info";
  if (label === "parked in someday") return "text-role-muted";
  if (label.startsWith("wrapped up")) return "text-role-success";
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
      <span key={i} className="text-role-accent">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function renderHelpOutput(): ReactNode {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-0 sm:gap-y-[0.5em]">
      {HELP_TEXT.split("\n").map((line, i) => {
        if (line === "") {
          return (
            <div
              key={i}
              className="sm:col-span-2 h-2 sm:h-0"
              aria-hidden="true"
            />
          );
        }

        if (SECTION_HEADERS.has(line)) {
          return (
            <div
              key={i}
              className="sm:col-span-2 whitespace-pre-wrap text-role-muted"
            >
              {line}
            </div>
          );
        }

        const helpMatch = line.match(HELP_ROW_PATTERN);
        if (helpMatch) {
          const [, command, description] = helpMatch;
          return (
            <Fragment key={i}>
              <span className="whitespace-pre-wrap text-role-command pl-[1ch]">
                {renderHelpCommandSegment(command)}
              </span>
              <span className="whitespace-pre-wrap text-role-muted mb-2 sm:mb-0">
                {description}
              </span>
            </Fragment>
          );
        }

        return (
          <div
            key={i}
            className="sm:col-span-2 whitespace-pre-wrap pl-[1ch] text-role-muted"
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

function renderBootBanner(line: string, key: number): ReactNode {
  const words = line.split(" ");
  const [arrow, ...rest] = words;
  const version = rest.pop();
  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span className="text-role-command">{arrow}</span> {rest.join(" ")}{" "}
      <span className="text-role-accent">{version}</span>
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
            <span key={i} className="text-role-error">
              {part}
            </span>
          );
        }
        if (/^\d+ due today$/.test(part)) {
          return (
            <span key={i} className="text-role-warning">
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
      className="block whitespace-pre-wrap text-role-muted pl-[3ch]"
    >
      {line}
    </div>
  );
}

function renderUrlLine(line: string, key: number): ReactNode {
  return (
    <div key={key} className="block whitespace-pre-wrap pl-[3ch]">
      <a
        href={line}
        target="_blank"
        rel="noopener noreferrer"
        className="text-role-accent underline"
      >
        {line}
      </a>
    </div>
  );
}

function renderWithHeart(line: string): ReactNode {
  if (!HEART_PATTERN.test(line)) return line;
  return line.split(HEART_PATTERN).map((part, i) =>
    part === "♥" ? (
      <span key={i} className="text-role-error">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function renderSummaryHeader(line: string, key: number): ReactNode {
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {line.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i} className="text-role-accent">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </div>
  );
}

function renderMessageLine(line: string, key: number): ReactNode {
  let colorClass = "";
  if (line.startsWith("Error:")) {
    colorClass = "text-role-error";
  } else if (line.startsWith("Warning:")) {
    colorClass = "text-role-warning";
  } else if (SUCCESS_PREFIXES.some((prefix) => line.startsWith(prefix))) {
    colorClass = "text-role-success";
  } else if (MUTED_PATTERN.test(line)) {
    colorClass = "text-role-muted";
  }

  return (
    <div key={key} className={`block whitespace-pre-wrap ${colorClass}`}>
      {" → "}
      {renderWithHeart(line)}
    </div>
  );
}

function renderTaskDetailLine(
  line: string,
  today: string,
  key: number,
): ReactNode {
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {" → "}
      {renderTaskFragments(line, today)}
    </div>
  );
}

export function formatOutput(output: string, taskCount: number): ReactNode {
  if (output === HELP_TEXT) return renderHelpOutput();

  const today = getLocalDate();
  const lines = output.split("\n");
  // Sized to the total task count (not just what's in this block) so the id
  // column lines up the same way across every rendered list, not just within
  // one of them.
  const idColumnWidth = String(taskCount).length + 1;

  return lines.map((line, i) => {
    if (line === "") {
      return <div key={i} className="h-[1rem]" aria-hidden="true" />;
    }
    if (SECTION_HEADERS.has(line)) {
      return (
        <div
          key={i}
          className="block whitespace-pre-wrap text-role-muted mt-[1rem]"
        >
          {line}
        </div>
      );
    }

    const taskMatch = line.match(TASK_LINE_PATTERN);
    if (taskMatch) return renderTaskLine(taskMatch, today, i, idColumnWidth);

    const countMatch = line.match(COUNT_ROW_PATTERN);
    if (countMatch) return renderCountRow(countMatch, i);

    if (SUMMARY_HEADER_PATTERN.test(line)) return renderSummaryHeader(line, i);

    if (SECONDARY_LINE_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      return renderSecondaryLine(line, i);
    }

    if (BOOT_BANNER_PATTERN.test(line)) return renderBootBanner(line, i);
    if (GREETING_PATTERN.test(line)) return renderGreeting(line, i);

    if (line === "Type 'help' for all available commands.") {
      return (
        <div
          key={i}
          className="block whitespace-pre-wrap text-role-muted mt-[1rem]"
        >
          {line}
        </div>
      );
    }

    if (URL_PATTERN.test(line)) return renderUrlLine(line, i);

    // `show <#>` prints the task line followed by a `created:` detail row;
    // give that task line the same fragment coloring as a rendered list.
    if (lines[i + 1]?.startsWith("created:")) {
      return renderTaskDetailLine(line, today, i);
    }

    return renderMessageLine(line, i);
  });
}
