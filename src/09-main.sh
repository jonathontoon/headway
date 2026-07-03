# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
	cat <<EOF
headway $HEADWAY_VERSION - a shell-based todo.txt task manager.

Usage: headway              start the interactive shell
       headway --help       print this help and exit
       headway --version    print the version and exit

headway runs as a shell: launch it with \`headway\`, then type commands
at the prompt. There is no one-shot command mode.

Every command below accepts \`--help\` for its own usage line.

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
  due <id> <DATE|none>                      set, update, or clear due date
  priority <id> <A-Z|none>                  set or clear priority
  tag <id> @tag                             add a tag
  tag <id> -@tag                            remove a tag
  tag <id> none                             clear all tags
  project <id> +Project                     assign task to a project
  project <id> none                         clear task's project
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

main() {
	# headway is a shell, not a one-shot CLI. The only outer-level options
	# are --help and --version; no arguments launches the shell; anything
	# else is a usage error.
	if [ "$#" -eq 0 ]; then
		load_config
		detect_date_flavor
		cmd_shell
		return
	fi

	if [ "$#" -eq 1 ]; then
		case "$1" in
		--help)
			usage
			return 0
			;;
		--version)
			printf 'headway %s\n' "$HEADWAY_VERSION"
			return 0
			;;
		esac
	fi

	err "headway takes no command-line arguments"
	err "run 'headway' to start the shell, 'headway --help' for help"
	exit 2
}

# Allow this script to be sourced as a library (e.g. by tests that want to
# call parse_line/format_line directly) without executing main().
if [ "${HEADWAY_LIB_ONLY:-false}" != "true" ]; then
	main "$@"
fi
