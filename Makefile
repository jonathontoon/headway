PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

install:
	install -m 755 headway.sh $(BINDIR)/hw

uninstall:
	rm -f $(BINDIR)/hw

test:
	sh tests/run.sh

.PHONY: install uninstall test
