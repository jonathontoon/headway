import { Fragment, type ReactNode } from "react";
import { getLocalDate } from "../store/todos/summary";
import {
  HELP_TEXT,
  MUTED_PATTERN,
  SECONDARY_LINE_PREFIXES,
  SUCCESS_PREFIXES,
} from "../constants";
import type { ThemeRoleName } from "../store/theme/types";

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

const TASK_LINE_PATTERN = /^(\d+)\.\s+(?:\((\w)\)\s+)?(.*)$/;
const COUNT_ROW_PATTERN = /^(\d+)\s+(\+[\w-]+|[a-z][a-z ]*)$/;
const HELP_ROW_PATTERN = /^(.+?)(?: - |\s{2,})(.+)$/;
const URL_PATTERN = /^https?:\/\//;
const BOOT_BANNER_PATTERN = /^↗ /;
const GREETING_PATTERN = /^(Good morning|Good afternoon|Good evening)\./;
const TASK_FRAGMENT_PATTERN = /(\+[\w-]+|@[\w-]+|due:\d{4}-\d{2}-\d{2})/g;
const HELP_ARG_PATTERN = /(<[^>]+>|"[^"]*")/g;
const HEART_PATTERN = /(♥)/;
const THEME_BASE_COLOR_PATTERN =
  /^(background|foreground) (#[0-9a-f]{6}): (.*)$/;
const THEME_INDEXED_COLOR_PATTERN =
  /^(color([0-9]|1[0-5])) (#[0-9a-f]{6}): (.*)$/;
const THEME_ROLE_PATTERN = /^role ([a-z]+) (#[0-9a-f]{6}): (.*)$/;
const SUMMARY_HEADER_PATTERN =
  /^(?:\d+ tasks on your radar right now\.|\d+ projects, \d+ tasks between them\.)$/;

const TERMINAL_TEXT_CLASSES = [
  "text-terminal-0",
  "text-terminal-1",
  "text-terminal-2",
  "text-terminal-3",
  "text-terminal-4",
  "text-terminal-5",
  "text-terminal-6",
  "text-terminal-7",
  "text-terminal-8",
  "text-terminal-9",
  "text-terminal-10",
  "text-terminal-11",
  "text-terminal-12",
  "text-terminal-13",
  "text-terminal-14",
  "text-terminal-15",
] as const;

const ROLE_TEXT_CLASSES: Record<ThemeRoleName, string> = {
  error: "text-role-error",
  warning: "text-role-warning",
  success: "text-role-success",
  info: "text-role-info",
  accent: "text-role-accent",
  context: "text-role-context",
  command: "text-role-command",
  muted: "text-role-muted",
};

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
  // Warm to cool priority gradient: red → yellow → green → cyan → blue → magenta
  // Using terminal colors in temperature order for visual spectrum
  const PRIORITY_COLORS = [
    "text-terminal-1", // A: red (warm)
    "text-terminal-3", // B: yellow
    "text-terminal-2", // C: green
    "text-terminal-6", // D: cyan
    "text-terminal-4", // E: blue (cool)
    "text-terminal-5", // F: magenta
    "text-terminal-9", // G: bright red
    "text-terminal-11", // H: bright yellow
    "text-terminal-10", // I: bright green
    "text-terminal-14", // J: bright cyan
    "text-terminal-12", // K: bright blue
    "text-terminal-13", // L: bright magenta
    "text-terminal-7", // M: white
    "text-terminal-15", // N: bright white
  ] as const;
  const charCode = letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const colorIndex = charCode % PRIORITY_COLORS.length;
  return PRIORITY_COLORS[Math.max(0, colorIndex)];
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
): ReactNode {
  const [, id, priority, rest] = match;

  return (
    <div key={key} className="block whitespace-pre-wrap">
      <span className="text-role-muted">{id}.</span>{" "}
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
              <span className="whitespace-pre-wrap text-role-command">
                {renderHelpCommandSegment(command)}
              </span>
              <span className="whitespace-pre-wrap text-role-muted mb-2 sm:mb-0">
                {description}
              </span>
            </Fragment>
          );
        }

        return (
          <div key={i} className="sm:col-span-2 whitespace-pre-wrap">
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
      className="block whitespace-pre-wrap text-role-muted pl-[2ch]"
    >
      {line}
    </div>
  );
}

function renderUrlLine(line: string, key: number): ReactNode {
  return (
    <div key={key} className="block whitespace-pre-wrap pl-[2ch]">
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

function renderColorSwatch(color: string): ReactNode {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[1em] w-[2ch] align-[-0.12em] border border-role-muted"
      style={{ backgroundColor: color }}
    />
  );
}

function renderThemeBaseColorLine(
  match: RegExpMatchArray,
  key: number,
): ReactNode {
  const [, role, color, description] = match;
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {renderColorSwatch(color)}{" "}
      <span className="text-role-command">{role}</span>{" "}
      <span className="text-role-muted">{color}</span>: {description}
    </div>
  );
}

function renderThemeIndexedColorLine(
  match: RegExpMatchArray,
  key: number,
): ReactNode {
  const [, label, indexText, color, description] = match;
  const index = Number(indexText);
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {renderColorSwatch(color)}{" "}
      <span className={TERMINAL_TEXT_CLASSES[index]} data-testid={label}>
        {label} sample
      </span>{" "}
      <span className="text-role-muted">{color}</span>: {description}
    </div>
  );
}

function renderThemeRoleLine(match: RegExpMatchArray, key: number): ReactNode {
  const [, role, color, description] = match;
  const roleClass = ROLE_TEXT_CLASSES[role as ThemeRoleName];
  return (
    <div key={key} className="block whitespace-pre-wrap">
      {renderColorSwatch(color)}{" "}
      <span className={roleClass} data-testid={`role-${role}`}>
        role {role} sample
      </span>{" "}
      <span className="text-role-muted">{color}</span>: {description}
    </div>
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
      {"→ "}
      {renderWithHeart(line)}
    </div>
  );
}

export function formatOutput(output: string): ReactNode {
  if (output === HELP_TEXT) return renderHelpOutput();

  const today = getLocalDate();

  return output.split("\n").map((line, i) => {
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
    if (taskMatch) return renderTaskLine(taskMatch, today, i);

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
        <div key={i} className="block whitespace-pre-wrap text-role-muted">
          {line}
        </div>
      );
    }

    if (URL_PATTERN.test(line)) return renderUrlLine(line, i);

    const themeBaseColorMatch = line.match(THEME_BASE_COLOR_PATTERN);
    if (themeBaseColorMatch) {
      return renderThemeBaseColorLine(themeBaseColorMatch, i);
    }

    const themeIndexedColorMatch = line.match(THEME_INDEXED_COLOR_PATTERN);
    if (themeIndexedColorMatch) {
      return renderThemeIndexedColorLine(themeIndexedColorMatch, i);
    }

    const themeRoleMatch = line.match(THEME_ROLE_PATTERN);
    if (themeRoleMatch && themeRoleMatch[1] in ROLE_TEXT_CLASSES) {
      return renderThemeRoleLine(themeRoleMatch, i);
    }

    return renderMessageLine(line, i);
  });
}
