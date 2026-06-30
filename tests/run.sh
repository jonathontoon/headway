#!/bin/sh
# Entry point for `make test` / CI. Runs every tests/test_*.sh as its own
# `sh` subprocess (isolating globals, since POSIX sh has no `local`) and
# aggregates pass/fail across all of them.

set -eu

cd "$(dirname "$0")/.."

total_pass=0
total_fail=0
any_failed=0

for t in tests/test_*.sh; do
	[ -e "$t" ] || continue
	printf '%s\n' "$t"
	if sh "$t"; then
		total_pass=$((total_pass + 1))
	else
		total_fail=$((total_fail + 1))
		any_failed=1
	fi
done

printf '\n%d test file(s) passed, %d test file(s) failed\n' "$total_pass" "$total_fail"
exit "$any_failed"
