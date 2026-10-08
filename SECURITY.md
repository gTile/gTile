# Security notes for the GNOME 51 port

GNOME extensions run inside the compositor with the desktop user's privileges.
Only install extension archives from sources you trust.

This port:

- Uses GNOME 51's Clutter input controllers and native GI API declarations.
- Disconnects signals from their original objects and unregisters shortcuts
  during synchronous disable. Cleanup continues after individual failures.
- Rolls back partial startup and cancels timers before actors are destroyed.
- Renders application window titles as plain text and escapes custom shortcut
  markup with `GLib.markup_escape_text`, including ampersands.
- Bounds grid parsing to 8192 characters, 32 nesting levels, and 1024 cells;
  rejects trailing data, unsafe numbers, out-of-grid coordinates, and invalid
  numeric ratios.
- Sends finite integer positions and positive dimensions to Mutter.
- Builds from a clean staging directory rather than deleting local checkout
  files or including existing generated artifacts accidentally.

The shipped extension does not evaluate user input, start subprocesses, make
network requests, or require credentials. The integration harness does start
test processes, but is excluded from the installable archive. npm dependencies
are development tools and are also excluded.

Dependency installation uses the committed lockfile and npm integrity checks.
Development dependencies were refreshed, including fixes for reported `tar`
and `brace-expansion` advisories. npm still reports advisories in AVA's
transitive globbing and TAP-reporting dependencies (`braces`, `js-yaml`, and
`sprintf-js`, plus their dependents). Upstream has not published compatible
fixes for all of them. They are not runtime dependencies of the extension;
test inputs and glob patterns should come from a trusted checkout. The audit
is not suppressed, and incompatible overrides are not applied merely to make
its report pass.

To inspect current dependency advisories:

```sh
npm audit
```

These changes and tests improve safety; they are not a guarantee that the
extension or its upstream dependencies contain no vulnerabilities.
