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

## Semantic versioning

This project follows [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`), tracked in the `version` field of `package.json`, with changes recorded in `CHANGELOG.md` (following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)).

The Conventional Commit `type` you're already required to choose maps to a bump level:

- `fix`, `perf` → patch
- `feat` → minor
- A `BREAKING CHANGE:` footer (or `!` after `type`/`scope`) → major
- `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`, `revert` → no bump by default

**Before every commit**, after determining the commit type, check whether it warrants a version bump per the mapping above. If it does, ask the user whether to bump the version as part of that commit — do not bump automatically. If they confirm:

1. Update `version` in `package.json`.
2. Move the relevant entries out of `CHANGELOG.md`'s `[Unreleased]` section into a new `## [X.Y.Z] - YYYY-MM-DD` section.
3. Include both file changes in the same commit as the code change (or a separate `chore(release): vX.Y.Z` commit).
