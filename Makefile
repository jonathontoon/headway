PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

# headway.sh is built by concatenating src/*.sh in filename order
# (numeric prefixes make cat produce a deterministic result). The
# bundle is committed so `curl | sh` and Homebrew keep working without
# a build step on the consumer side; CI (verify target) catches drift.
headway.sh: src/*.sh
	cat src/*.sh > $@
	chmod +x $@

build: headway.sh

install: headway.sh
	install -m 755 headway.sh $(BINDIR)/headway

uninstall:
	rm -f $(BINDIR)/headway

test: headway.sh
	sh tests/run.sh

# verify: assert headway.sh matches a fresh build of src/*.sh - catches
# edits made to the bundle instead of the source. Runs in CI; the diff
# on failure tells you which file to fix.
verify:
	@tmp=$$(mktemp) && cat src/*.sh > $$tmp && \
		if ! diff -u headway.sh $$tmp; then \
			rm -f $$tmp; \
			echo "headway.sh is out of sync with src/*.sh - run 'make build'" >&2; \
			exit 1; \
		fi; \
		rm -f $$tmp

.PHONY: install uninstall test build verify
