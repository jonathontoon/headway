import { HELP_TEXT } from "../constants";
import { runTodoCommand } from "../store/todos/commands";
import { formatBootMessage } from "../store/todos/summary";
import type { TodoClock, TodoCommandState } from "../store/todos/types";

export type ShowcaseEntry = {
  readonly command?: string;
  readonly output?: string;
};

export type ShowcaseSection = {
  readonly title: string;
  readonly entries: readonly ShowcaseEntry[];
};

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// Fixed anchor date (not tied to the real clock) so the overdue/today/upcoming
// split in the showcase is stable no matter when this page is loaded.
const ANCHOR = "2026-01-15";
const OVERDUE = addDays(ANCHOR, -5);
const DUE_TODAY = ANCHOR;
const UPCOMING = addDays(ANCHOR, 10);
const UPCOMING_LATER = addDays(ANCHOR, 20);
const NEW_TASK_DUE = addDays(ANCHOR, 12);
const CREATED = addDays(ANCHOR, -14);
const COMPLETED_ON = addDays(ANCHOR, -4);

const SEED_TODOS: readonly string[] = [
  `(A) ${CREATED} Ship the release +Launch @work due:${OVERDUE}`,
  `(B) ${CREATED} Review pull requests +Launch @work due:${DUE_TODAY}`,
  `(C) ${CREATED} Write documentation +Launch @home due:${UPCOMING}`,
  `(D) ${CREATED} Plan the roadmap +Vision`,
  `(E) ${CREATED} Reply to email @home`,
  `(F) ${CREATED} Archive old files`,
  `${CREATED} Water the plants @home`,
  `${CREATED} Read a book +Personal`,
  `x ${COMPLETED_ON} ${CREATED} Buy groceries +Personal @home`,
];

export const SHOWCASE_TASK_COUNT = SEED_TODOS.length + 1;

const clock: TodoClock = { today: () => ANCHOR };

// Run in one continuous session, in order - later commands rely on the
// `view` (and task ids) produced by earlier `list` calls, exactly
// like a real terminal session. Grouped into sections only for the page's
// headings; state threads across every section.
const COMMAND_SECTIONS: readonly {
  readonly title: string;
  readonly commands: readonly string[];
}[] = [
  {
    title: "LISTS",
    commands: [
      "list",
      "list today",
      "list upcoming",
      "list completed",
      "list /\\+Launch/",
      "list /@home/i",
      "list /roadmap/i",
      "list /nomatch/i",
    ],
  },
  {
    title: "ADD & EDIT",
    commands: [
      `add Prepare demo +Launch @work due:${NEW_TASK_DUE}`,
      "add",
      "list",
      `edit 1 (A) Ship the v2 release +Launch @work due:${OVERDUE}`,
      "edit 1",
      "edit 999 text",
    ],
  },
  {
    title: "COMPLETE & UNDO",
    commands: ["complete 2", "complete 2", "undo 2", "undo 2"],
  },
  {
    title: "ATTRIBUTES",
    commands: [
      `due 3 ${UPCOMING_LATER}`,
      "due 3 notadate",
      "priority 4 B",
      "priority 4 123",
      "tag 5 @errands",
      "tag 5",
      "project 6 +Cleanup",
      "project 6 NotAProject",
    ],
  },
  {
    title: "CLEAR",
    commands: [
      "clear due 7",
      "clear priority 1",
      "clear tags 8",
      "clear project 9",
      "clear bogus 1",
    ],
  },
  {
    title: "DELETE",
    commands: ["delete 2", "list completed", "delete 1"],
  },
  {
    title: "MISC",
    commands: ["donate", "frobnicate"],
  },
];

function buildTodoSections(): readonly ShowcaseSection[] {
  let state: TodoCommandState = { todos: SEED_TODOS, view: [] };

  return COMMAND_SECTIONS.map(({ title, commands }) => {
    const entries = commands.map((command) => {
      const result = runTodoCommand(command, state, clock);
      state = { todos: result.nextTodos, view: result.view ?? state.view };
      return { command, output: result.output };
    });
    return { title, entries };
  });
}

function buildBootSection(): ShowcaseSection {
  const { message } = formatBootMessage(SEED_TODOS, ANCHOR, "Good morning");
  return { title: "BOOT & GREETING", entries: [{ output: message }] };
}

// GitHub/sync output requires network and async spinners, so it can't be
// driven through the real dispatcher here. These are literal copies of the
// message templates in src/store/github/commands.ts and
// src/store/terminal/context.tsx - keep them in sync with that file.
const GITHUB_SECTION: ShowcaseSection = {
  title: "GITHUB & SYNC",
  entries: [
    {
      command: "connect",
      output:
        "Error: no GitHub client id is configured - set VITE_GITHUB_CLIENT_ID and rebuild.",
    },
    { command: "connect", output: "⠋ Connecting to GitHub..." },
    {
      output:
        "Visit https://github.com/login/device and enter code WDJB-MJHT.\n⠙ Waiting for authorization...",
    },
    {
      output:
        "Connected as octocat.\nThis token can read and write every repo on your account - 'disconnect' revokes it.",
    },
    {
      command: "disconnect",
      output: "Disconnected from GitHub and revoked the token.",
    },
    {
      command: "disconnect",
      output:
        "Disconnected from GitHub, but the token could not be revoked automatically - review it at https://github.com/settings/applications.",
    },
    { command: "disconnect", output: "No GitHub connection to disconnect." },
    {
      command: "sync setup octocat/todos",
      output: "Updated: sync target set to octocat/todos:todo.txt (main)",
    },
    {
      command: "sync setup badformat",
      output: "Error: usage: sync setup <owner>/<repo> [branch] [path].",
    },
    {
      command: "sync setup octocat/todos main ../secrets.txt",
      output:
        "Error: path must be a relative file path without '.' or '..' segments.",
    },
    {
      command: "sync status",
      output:
        "Not syncing yet - run 'sync setup <owner>/<repo>' then 'connect' to get started.",
    },
    {
      command: "sync status",
      output:
        "Syncing isn't set up yet, though you're connected as octocat - run 'sync setup <owner>/<repo>' to choose a repo.",
    },
    {
      command: "sync status",
      output:
        "Syncing to octocat/todos:todo.txt (main) as octocat - nothing's been saved yet, run 'sync backup' to save your tasks.",
    },
    {
      command: "sync status",
      output:
        "Syncing to octocat/todos:todo.txt (main) as octocat - you have unsaved changes, run 'sync backup' to save them.",
    },
    {
      command: "sync status",
      output:
        "Syncing to octocat/todos:todo.txt (main) as octocat - everything's saved (last backup 3 hours ago).",
    },
    { command: "sync backup", output: "⠋ Saving to GitHub..." },
    {
      output: "Saved: 8 tasks to octocat/todos:todo.txt (a1b2c3d)",
    },
    {
      output:
        "Warning: overwrote a version already saved on GitHub.\nSaved: 8 tasks to octocat/todos:todo.txt (a1b2c3d)",
    },
    {
      command: "sync restore",
      output:
        "Error: this would replace local tasks that aren't backed up - run 'sync restore --force' to continue.",
    },
    { command: "sync restore --force", output: "⠋ Loading from GitHub..." },
    {
      output:
        "Warning: replaced local changes that weren't saved.\nLoaded: 8 tasks from octocat/todos:todo.txt (a1b2c3d)",
    },
    { command: "sync restore", output: "⠋ Loading from GitHub..." },
    {
      output: "Loaded: 8 tasks from octocat/todos:todo.txt (a1b2c3d)",
    },
    {
      output:
        "Error: todo.txt not found in octocat/todos - run 'sync backup' first.",
    },
    {
      command: "sync frobnicate",
      output:
        "sync frobnicate is not a recognized command. Try 'sync setup', 'sync status', 'sync backup' or 'sync restore'.",
    },
    { output: "Error: not connected - run 'connect' first." },
    {
      output: "Error: no sync target - run 'sync setup <owner>/<repo>' first.",
    },
    { output: "Error: GitHub rejected the token - run 'connect' again." },
    { output: "Connection cancelled, stopped waiting for authorization." },
    { output: "sync backup cancelled." },
  ],
};

const HELP_SECTION: ShowcaseSection = {
  title: "HELP",
  entries: [{ command: "help", output: HELP_TEXT }],
};

export function buildShowcaseSections(): readonly ShowcaseSection[] {
  return [
    buildBootSection(),
    ...buildTodoSections(),
    GITHUB_SECTION,
    HELP_SECTION,
  ];
}
