# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`stimulus-if` is a single-file, unbundled ES module npm package: one Stimulus controller that shows/hides an element based on the state of a form field. All code lives in `index.js`. There is no build step and no bundler config.

## Commands

- `npm install` — install dependencies
- `npm test` — run the suite once (vitest)
- `npm run test:watch` — watch mode
- `npm run coverage` — run with coverage; thresholds are enforced at 100%
- `npx vitest run tests/fields.test.js` — run a single file
- `npx vitest run -t "a radio group"` — run tests matching a name

## Architecture

**Shorthand registration.** The module calls `shorthand({ controller: "if", value: "condition" })` from `stimulus-shorthand` at import time, before the class declaration. That installs a `ValueListObserver` which rewrites `data-if="..."` into `data-controller="if" data-if-condition-value="..."` as elements enter the DOM. So the terse `data-if` attribute is not parsed by this controller — it never sees it. Anything about attribute expansion belongs in `stimulus-shorthand`, not here.

**Condition DSL.** `Condition` parses the value string with `/^([^ ]+) ([^ ]+) (.+)$/` — exactly three parts: field name, operation, value. The field name and operation may not contain spaces; the value may. A field name containing a `.` is `formName.fieldName` and resolves the form via `document.forms[formName]`; otherwise the controller uses `this.element.closest("form")`.

**Operations** (`applyOperation`) — an unknown operation throws:
- `==` / `!=` / `in` — the value is `JSON.parse`d, so string literals need quotes inside the attribute (`data-if='kind == "book"'`). The equality comparisons are intentionally loose, since `field.value` is always a string.
- `is` / `not` — the value is a DOM property name read off the field element (`checked`, `disabled`, …), compared strictly against `true`.

**Field dispatch.** `Field.fromName` calls `form.elements.namedItem(name)`, which returns either a single element or a `RadioNodeList`, then picks the **first** class in the ordered list whose static `matches` returns true. Two consequences:
- Order is significant. `Default` matches everything and must stay last; new subclasses go before it, most specific first.
- `matches` compares element-type arrays by string coercion (`this.allTypes(x) == ["checkbox"].toString()`). That is deliberate — see the comment on `Checkbox.matches`. Follow the same idiom in new subclasses rather than introducing a deep-equality helper.

The subclasses exist to cope with Rails' `check_box` helper, which emits a hidden input immediately before the checkbox so unchecked boxes still submit a value. `CheckboxWithHidden` therefore reads the hidden input's value when unchecked, and indexes past the hidden input for `getProperty`.

The group classes return an **array** from `value`, so `==` works by JS array-to-string coercion (`["a","b"] == "a,b"`). `in` routes through `includedIn`, which branches on `Array.isArray` — a group matches when *any* checked value appears in the list, since a bare `list.includes(arrayValue)` would compare by reference and never match. `getProperty` on a group is a `some`, i.e. "any member has this property". `CheckboxesWithHidden` filters to `type === "checkbox"` so the leading hidden input can't answer for the group; `Checkboxes` has no hidden input and deliberately omits that filter (an unreachable branch would break the coverage threshold).

**Rendering.** `render()` sets `hidden` **and** `disabled` together. The `disabled` half is load-bearing: it keeps concealed inputs out of the form submission. Keep both when changing visibility logic. The controller re-renders on every `change` event on the resolved form (not `input`), plus once on `connect`.

## Testing

- **Framework:** Vitest with the happy-dom environment; tests live in `tests/*.test.js`.
- **Style:** outside-in only. Tests mount real HTML, start a real Stimulus `Application`, and assert on observable DOM state. Nothing in `index.js` is exported besides the controller, and it should stay that way — drive the `Field` subclasses through markup, not by reaching inside.
- `tests/helper.js` owns the mount/teardown dance. `mount()` sets `innerHTML`, waits a tick for `stimulus-shorthand` to expand `data-if`, *then* starts the application — the order matters, since the observer must see the attribute before Stimulus connects. It also swaps in a recording `application.handleError`, which is the only way to observe throws from `connect()`; the `errors` array it fills is how the unknown-operation case is asserted.
- **Coverage:** 100% enforced on lines, functions, branches, and statements. Adding an unreachable branch will fail the build.
- Coverage alone doesn't prove much here. When changing `applyOperation` or a `Field` subclass, confirm the suite actually fails with the change reverted.

## Releasing

Commit message convention is `release vX.Y.Z.` — lowercase, trailing period — in its own commit, separate from the changes being released. Historical release commits bumped `package.json` alone, because the lockfile had drifted and was left behind; it now tracks the real version, so a bump should carry `package-lock.json` with it.
