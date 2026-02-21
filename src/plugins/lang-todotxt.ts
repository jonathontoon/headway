import { StreamLanguage, LanguageSupport } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

export const todotxtTags = {
  completionMark: Tag.define(), // the leading 'x'
  completedText: Tag.define(),  // all tokens on a completed line
  priorityA: Tag.define(),      // (A)
  priorityB: Tag.define(),      // (B)
  priorityC: Tag.define(),      // (C)
  priorityOther: Tag.define(),  // (D)–(Z)
  date: Tag.define(),           // YYYY-MM-DD
  context: Tag.define(),        // @Word
  project: Tag.define(),        // +Word
  metadata: Tag.define(),       // key:value
};

interface TodoState {
  linePos: "start" | "after_x" | "after_priority" | "after_date" | "text";
  isCompleted: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}(?= |$)/;
const PRIORITY_RE = /^\([A-Z]\)(?= |$)/;

const todotxtParser = StreamLanguage.define<TodoState>({
  name: "todotxt",

  startState(): TodoState {
    return { linePos: "start", isCompleted: false };
  },

  token(stream, state): string | null {
    // Reset state at the start of each line
    if (stream.sol()) {
      state.linePos = "start";
      state.isCompleted = false;
    }

    // Skip whitespace (produces no token)
    if (stream.eatSpace()) return null;

    // --- Line-start special tokens ---
    if (state.linePos === "start") {
      // Completion marker: 'x' followed by a space
      if (stream.match(/^x(?= )/)) {
        state.linePos = "after_x";
        state.isCompleted = true;
        return "completionMark";
      }
      // Priority: (A)–(Z) followed by a space
      const pri = stream.match(PRIORITY_RE) as RegExpMatchArray | false;
      if (pri) {
        state.linePos = "after_priority";
        const letter = (pri as unknown as string)[1];
        if (letter === "A") return "priorityA";
        if (letter === "B") return "priorityB";
        if (letter === "C") return "priorityC";
        return "priorityOther";
      }
      // Date at line start (creation date with no priority/completion)
      if (stream.match(DATE_RE)) {
        state.linePos = "text";
        return "date";
      }
      state.linePos = "text";
      // fall through to text handling
    }

    // --- After 'x ': expect optional completion date ---
    if (state.linePos === "after_x") {
      if (stream.match(DATE_RE)) {
        state.linePos = "after_date";
        return "date";
      }
      state.linePos = "text";
    }

    // --- After completion date: expect optional creation date ---
    if (state.linePos === "after_date") {
      if (stream.match(DATE_RE)) {
        state.linePos = "text";
        return "date";
      }
      state.linePos = "text";
    }

    // --- After priority: expect optional creation date ---
    if (state.linePos === "after_priority") {
      if (stream.match(DATE_RE)) {
        state.linePos = "text";
        return "date";
      }
      state.linePos = "text";
    }

    // --- Text body: contexts, projects, metadata, plain words ---
    if (stream.match(/^@\S+/)) {
      return state.isCompleted ? "completedText" : "context";
    }
    if (stream.match(/^\+\S+/)) {
      return state.isCompleted ? "completedText" : "project";
    }
    // key:value — word chars, colon, then non-space
    if (stream.match(/^\w+:\S+/)) {
      return state.isCompleted ? "completedText" : "metadata";
    }
    // Plain word
    stream.match(/^\S+/);
    return state.isCompleted ? "completedText" : null;
  },

  blankLine(state) {
    state.linePos = "start";
    state.isCompleted = false;
  },

  tokenTable: {
    completionMark: todotxtTags.completionMark,
    completedText: todotxtTags.completedText,
    priorityA: todotxtTags.priorityA,
    priorityB: todotxtTags.priorityB,
    priorityC: todotxtTags.priorityC,
    priorityOther: todotxtTags.priorityOther,
    date: todotxtTags.date,
    context: todotxtTags.context,
    project: todotxtTags.project,
    metadata: todotxtTags.metadata,
  },
});

export function todotxt(): LanguageSupport {
  return new LanguageSupport(todotxtParser);
}
