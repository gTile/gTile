.PHONY: help
help: ## this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

schemas/gschemas.compiled: ## compile org.gnome.shell.extensions.gtile.gschema.xml and anything else in schema/
	glib-compile-schemas schemas/

.PHONY: build
build: ## build using bazel
	bazel run :install-extension

.PHONY: restart
restart: ## restart gnome
	killall -3 gnome-shell

.PHONY: dev
dev: schemas/gschemas.compiled build restart ## Build and reload the ext. Run make clean if schemas/ was changed

.PHONY: debug
debug: ## display running logs
	journalctl /usr/bin/gnome-shell -f


.PHONY: clean
clean: ## clean up junk. Also use this if schemas/ was changed.
	rm schemas/gschemas.compiled
	bazel clean