PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

install:
	install -m 755 headway.sh $(BINDIR)/headway
	ln -sf headway $(BINDIR)/hw

uninstall:
	rm -f $(BINDIR)/headway $(BINDIR)/hw

test:
	sh tests/run.sh

.PHONY: install uninstall test
