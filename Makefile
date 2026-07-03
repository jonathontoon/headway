PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

install:
	install -m 755 headway.sh $(BINDIR)/headway

uninstall:
	rm -f $(BINDIR)/headway

test:
	sh tests/run.sh

.PHONY: install uninstall test
