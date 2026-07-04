# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
	cat <<EOF
headway $HEADWAY_VERSION - a shell-based todo.txt task manager.

Usage: headway              start the interactive shell
       headway <command>    run one command and exit
       headway --version    print the version and exit

Run \`headway\` with no arguments for the interactive shell, or pass any
command directly, e.g. \`headway add "Book flights"\`.

Task IDs are the task's current line number in TODO_FILE. They are NOT
stable across edits - deleting or archiving a task shifts the IDs of
every task below it.

Adding:
  add "text [+Project] [due:DATE] [@tag]"   add a task

Completing:
  complete <id> [<id>...]                   mark done (priority -> pri:A)
  undo <id> [<id>...]                       unmark (restores (A) priority)

Editing:
  edit <id>                                 open task in \$EDITOR
  edit <id> <text>                          replace task line directly
  due <id> <DATE>                           set or update due date
  priority <id> <A-Z>                       set or update priority
  tag <id> @tag [@tag...]                   add tag(s)
  project <id> +Project                     assign task to a project
  clear due <id> [<id>...]                  clear due date
  clear priority <id> [<id>...]             clear priority
  clear tags <id> [<id>...]                 clear all tags
  clear tags <id> @tag [@tag...]            remove specific tag(s)
  clear project <id> [<id>...]              clear project
  show <id>                                 print full detail for one task
  delete <id> [<id>...]                     delete permanently

Listing:
  list [+Project|@tag|"keyword"]            list incomplete tasks (grouped)
  inbox                                     tasks with no project
  today                                     due today, plus overdue
  upcoming                                  future-dated tasks
  someday                                   tasks with no due date
  logbook                                   completed tasks

Projects:
  projects                                  list all projects
  project +Project                          show tasks in a project

Maintenance:
  archive                                   move completed tasks to DONE_FILE
  stats                                     summary counts
  check                                     verify TODO_FILE is well-formed

Shell:
  help                                      show this help
  exit                                      end the shell session (also Ctrl-D)
EOF
}

init_runtime() {
	load_config
	detect_date_flavor
}

main() {
	# No arguments launches the shell; arguments run a single command
	# through the same dispatcher the shell uses.
	if [ "$#" -eq 0 ]; then
		init_runtime
		cmd_shell
		return
	fi

	if [ "$#" -eq 1 ]; then
		case "$1" in
		help)
			usage
			return 0
			;;
		--version)
			printf 'headway %s\n' "$HEADWAY_VERSION"
			return 0
			;;
		esac
	fi

	init_runtime
	dispatch_cmd "$@"
}

# Allow this script to be sourced as a library (e.g. by tests that want to
# call parse_line/format_line directly) without executing main().
if [ "${HEADWAY_LIB_ONLY:-false}" != "true" ]; then
	main "$@"
fi
