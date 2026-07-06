# Agent Instructions

## Commit messages

Always write commit messages using the [Conventional Commits](https://www.conventionalcommits.org/) format, per the `conventional-commit` skill (https://www.skills.sh/github/awesome-copilot/conventional-commit):

```
type(scope): description

[optional body]

[optional footer]
```

- `type` is required and must be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- `scope` is optional but recommended (e.g. the affected component or area).
- `description` is required, written in the imperative mood (e.g. "add" not "added"), and not capitalized.
- Use the body to explain _why_ the change was made when it isn't obvious from the diff.
- Add a `BREAKING CHANGE:` footer for any breaking change.

Before committing: run `git status` and `git diff` to review what's staged, then construct the message following the format above.
