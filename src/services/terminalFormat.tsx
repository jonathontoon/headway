import { Fragment, type CSSProperties, type ReactNode } from "react";
import { getLocalDate } from "../store/todos/summary";
import { TERMINAL_BLOCK_GAP_H } from "../constants";
import { HELP_TEXT } from "../commands/registry";
import type {
  MessageTone,
  TerminalOutput,
  TerminalTask,
} from "../store/terminal/output";

const SECTION_HEADERS = new Set([
  "TASKS",
  "STATUS",
  "ATTRIBUTES",
  "VIEWS",
  "SYNC",
  "OTHER",
  "OVERDUE",
  "TODAY",
]);

const HELP_ROW_PATTERN = /^(.+?)(?: - |\s{2,})(.+)$/;
const URL_PATTERN = /^https?:\/\//;
const TASK_FRAGMENT_PATTERN = /(\+[\w-]+|@[\w-]+|due:\d{4}-\d{2}-\d{2})/g;
const HELP_ARG_PATTERN = /(<[^>]+>|"[^"]*")/g;
const HEART_PATTERN = /(♥)/;
const INLINE_URL_PATTERN = /(https?:\/\/\S+)/g;
const DEVICE_CODE_PATTERN = /\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/g;
const DEVICE_CODE_TEST_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

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
  return PRIORITY_COLORS[charCode] ?? "text-role-muted";
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
      const date = dueMatch[1]!;
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
  item: TerminalTask,
  today: string,
  key: number,
  idColumnWidth: number,
): ReactNode {
  const { position: id, task } = item;
  const priority = task.completed ? undefined : task.priority;
  const rest = task.text.replace(/\s+pri:[^:\s]+/g, "").trim();

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
          const command = helpMatch[1]!;
          const description = helpMatch[2]!;
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
        className="text-role-accent underline hover:no-underline"
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

function renderDeviceCodes(segment: string, key: number): ReactNode {
  const parts = segment.split(DEVICE_CODE_PATTERN);
  if (parts.length === 1)
    return <Fragment key={key}>{renderWithHeart(segment)}</Fragment>;

  return (
    <Fragment key={key}>
      {parts.map((part, i) =>
        DEVICE_CODE_TEST_PATTERN.test(part) ? (
          <span key={i} className="text-role-context font-bold">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{renderWithHeart(part)}</Fragment>
        ),
      )}
    </Fragment>
  );
}

function renderInlineText(line: string): ReactNode {
  const segments = line.split(INLINE_URL_PATTERN);
  if (segments.length === 1) return renderDeviceCodes(line, 0);

  return segments.map((segment, i) =>
    URL_PATTERN.test(segment) ? (
      <a
        key={i}
        href={segment}
        target="_blank"
        rel="noopener noreferrer"
        className="text-role-accent underline hover:no-underline"
      >
        {segment}
      </a>
    ) : (
      renderDeviceCodes(segment, i)
    ),
  );
}

// Only error and warning get a distinct mark; success and everything else
// (plain info/muted prose) share the neutral arrow, since color already
// carries the success signal. Error/warning avoid x- and !-shaped glyphs: x
// collides visually with the completed-task marker, and a bare "!" reads
// too alarming for routine status messages.
function toneClassName(tone: MessageTone): string {
  switch (tone) {
    case "error":
      return "text-role-error";
    case "warning":
      return "text-role-warning";
    case "success":
      return "text-role-success";
    case "muted":
      return "text-role-muted";
    case "normal":
      return "";
  }
}

function messageGlyph(tone: MessageTone): string {
  if (tone === "error") return "×";
  if (tone === "warning") return "▫";
  return "→";
}

// Wrapped continuation lines hang-indent to the column right after the
// glyph, instead of falling back to the left margin under the glyph
// itself. The indent width depends on the glyph's own width (e.g. "[×]"
// is wider than "→"), so it's computed per-prefix rather than fixed.
function hangingIndentStyle(prefix: string): CSSProperties {
  const width = `${prefix.length}ch`;
  return { paddingLeft: width, textIndent: `-${width}` };
}

// "Error:"/"Warning:" are pure classification labels - the × / ▫ glyph and
// the color already say that, so the label itself is stripped from the
// displayed text rather than shown twice. Success prefixes (Added:,
// Updated:, ...) stay, since the verb itself is meaningful content, not
// just a category label.
function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

function stripRedundantLabel(line: string, tone: MessageTone): string {
  if (tone === "error" && line.startsWith("Error:")) {
    return capitalize(line.slice("Error:".length).trim());
  }
  if (tone === "warning" && line.startsWith("Warning:")) {
    return capitalize(line.slice("Warning:".length).trim());
  }
  return line;
}

function renderMessageLine(
  line: string,
  tone: MessageTone,
  key: number,
): ReactNode {
  const colorClass = toneClassName(tone);
  const prefix = ` ${messageGlyph(tone)} `;

  return (
    <div
      key={key}
      className={`block whitespace-pre-wrap ${colorClass}`}
      style={hangingIndentStyle(prefix)}
    >
      {prefix}
      {renderInlineText(stripRedundantLabel(line, tone))}
    </div>
  );
}

function renderSpinnerLine(line: string, key: number): ReactNode {
  return (
    <div key={key} className="block whitespace-pre-wrap text-role-muted">
      {` ${line}`}
    </div>
  );
}

function renderOutputLine(
  output: TerminalOutput,
  taskCount: number,
  key: number,
): ReactNode {
  const today = getLocalDate();
  const idColumnWidth = String(taskCount).length + 1;

  switch (output.kind) {
    case "blank":
      return (
        <div key={key} className={TERMINAL_BLOCK_GAP_H} aria-hidden="true" />
      );
    case "text":
      return renderMessageLine(output.text, output.tone, key);
    case "tasks":
      return output.tasks.map((task, index) =>
        renderTaskLine(task, today, index, idColumnWidth),
      );
    case "help":
      return renderHelpOutput();
    case "progress":
      return renderSpinnerLine(output.text, key);
    case "boot":
      return renderBootBanner(output.text, key);
    case "greeting":
      return renderGreeting(output.text, key);
    case "secondary":
      return renderSecondaryLine(output.text, key);
    case "link":
      return renderUrlLine(output.href, key);
    case "group":
      return output.items.map((item, index) =>
        renderOutputLine(item, taskCount, index),
      );
  }
}

export function formatOutput(
  output: TerminalOutput,
  taskCount: number,
): ReactNode {
  return renderOutputLine(output, taskCount, 0);
}
