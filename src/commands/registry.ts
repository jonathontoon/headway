type CommandDomain = "todo" | "github";

type CommandDefinition = {
  readonly verb: string;
  readonly section: string;
  readonly usage: string;
  readonly description: string;
  readonly domain: CommandDomain;
  readonly subcommands?: readonly string[];
};

const COMMANDS: readonly CommandDefinition[] = [
  {
    verb: "add",
    section: "TASKS",
    usage: 'add "text [+Project] [due:DATE] [@tag]"',
    description: "add a task",
    domain: "todo",
  },
  {
    verb: "edit",
    section: "TASKS",
    usage: "edit <#> <text>",
    description: "replace task line directly",
    domain: "todo",
  },
  {
    verb: "delete",
    section: "TASKS",
    usage: "delete <#> [<#>...]",
    description: "delete permanently",
    domain: "todo",
  },
  {
    verb: "complete",
    section: "STATUS",
    usage: "complete <#> [<#>...]",
    description: "mark done (priority -> pri:A)",
    domain: "todo",
  },
  {
    verb: "undo",
    section: "STATUS",
    usage: "undo <#> [<#>...]",
    description: "unmark (restores priority)",
    domain: "todo",
  },
  {
    verb: "due",
    section: "ATTRIBUTES",
    usage: "due <#> <YYYY-MM-DD>",
    description: "set or update due date",
    domain: "todo",
  },
  {
    verb: "priority",
    section: "ATTRIBUTES",
    usage: "priority <#> <A-Z>",
    description: "set or update priority",
    domain: "todo",
  },
  {
    verb: "tag",
    section: "ATTRIBUTES",
    usage: "tag <#> @tag [@tag...]",
    description: "add context tag(s)",
    domain: "todo",
  },
  {
    verb: "project",
    section: "ATTRIBUTES",
    usage: "project <#> +Project",
    description: "assign task to a project",
    domain: "todo",
  },
  {
    verb: "clear",
    section: "ATTRIBUTES",
    usage: "clear <#> due|priority|tags|project",
    description: "clear an attribute",
    domain: "todo",
  },
  {
    verb: "list",
    section: "VIEWS",
    usage: "list",
    description: "list incomplete tasks",
    domain: "todo",
    subcommands: ["today", "upcoming", "completed"],
  },
  {
    verb: "list",
    section: "VIEWS",
    usage: "list today",
    description: "due today and overdue",
    domain: "todo",
  },
  {
    verb: "list",
    section: "VIEWS",
    usage: "list upcoming",
    description: "future-dated tasks",
    domain: "todo",
  },
  {
    verb: "list",
    section: "VIEWS",
    usage: "list completed",
    description: "completed tasks",
    domain: "todo",
  },
  {
    verb: "list",
    section: "VIEWS",
    usage: "list /pattern/i",
    description: "filter incomplete task text",
    domain: "todo",
  },
  {
    verb: "connect",
    section: "SYNC",
    usage: "connect <owner>/<repo> [branch] [path]",
    description: "authorize and choose the repo file",
    domain: "github",
  },
  {
    verb: "disconnect",
    section: "SYNC",
    usage: "disconnect",
    description: "remove your GitHub connection",
    domain: "github",
  },
  {
    verb: "sync",
    section: "SYNC",
    usage: "sync status",
    description: "show sync target and state",
    domain: "github",
    subcommands: ["status", "backup", "restore"],
  },
  {
    verb: "sync",
    section: "SYNC",
    usage: "sync backup",
    description: "save local tasks to GitHub",
    domain: "github",
  },
  {
    verb: "sync",
    section: "SYNC",
    usage: "sync restore",
    description: "load tasks from GitHub",
    domain: "github",
  },
  {
    verb: "donate",
    section: "OTHER",
    usage: "donate",
    description: "support ongoing development",
    domain: "todo",
  },
  {
    verb: "version",
    section: "OTHER",
    usage: "version",
    description: "show version and deploy time",
    domain: "todo",
  },
  {
    verb: "help",
    section: "OTHER",
    usage: "help",
    description: "show all commands",
    domain: "todo",
  },
];

/** Unique first words supported by terminal commands. */
export const COMMAND_VERBS = [...new Set(COMMANDS.map(({ verb }) => verb))];

/** Supported subcommands by first command word. */
export const SUBCOMMAND_VERBS: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(
    COMMANDS.flatMap(({ verb, subcommands }) =>
      subcommands ? [[verb, subcommands]] : [],
    ),
  );

/** Help text rendered by the terminal `help` command. */
export const HELP_TEXT = [...new Set(COMMANDS.map(({ section }) => section))]
  .flatMap((section) => [
    section,
    ...COMMANDS.filter((command) => command.section === section).map(
      ({ usage, description }) => `${usage} - ${description}`,
    ),
    "",
  ])
  .slice(0, -1)
  .join("\n");

/**
 * Checks whether a command is handled by the GitHub command runner.
 *
 * @param command - Raw terminal command text.
 * @returns True when the first word belongs to the GitHub command domain.
 */
export function isGitHubCommand(command: string): boolean {
  const [verb] = command.trim().split(/\s+/);
  return COMMANDS.some(
    (definition) => definition.verb === verb && definition.domain === "github",
  );
}
