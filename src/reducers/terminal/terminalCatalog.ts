import type { HelpSection } from "@reducers/terminal/terminalTypes";

export const HELP_SECTIONS: readonly HelpSection[] = [
  {
    title: "Commands",
    commands: [
      { name: "help", description: "show the available commands" },
      { name: "clear", description: "clear terminal history and command state" },
      { name: "list", description: "show active tasks grouped by bucket" },
      { name: "add <title>", description: "add a new task to Inbox" },
      { name: "done <id-or-index>", description: "mark a task as completed" },
      { name: "delete <id-or-index>", description: "remove a task" },
      { name: "edit <id-or-index> <title>", description: "rename a task" },
      {
        name: "move <id-or-index> <bucket>",
        description: "move a task to inbox, today, upcoming, or anytime",
      },
      {
        name: "priority <id-or-index> <A|B|C|none>",
        description: "set or clear a task priority",
      },
      {
        name: "due <id-or-index> <YYYY-MM-DD|none>",
        description: "set or clear a task due date",
      },
    ],
  },
];

export const COMMAND_NAMES = HELP_SECTIONS.flatMap((section) =>
  section.commands.map((command) => command.name.split(" ")[0])
);
