# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`stimulus-if` is a single-file, unbundled ES module npm package: one Stimulus controller that shows/hides an element based on the state of a form field. All code lives in `index.js`. There is no build step, no bundler config, and no test suite (`npm test` is the npm-init stub that exits 1). Changes are verified by hand in a consuming app.

## Architecture

**Shorthand registration.** The module calls `shorthand({ controller: "if", value: "condition" })` from `stimulus-shorthand` at import time, before the class declaration. That installs a `ValueListObserver` which rewrites `data-if="..."` into `data-controller="if" data-if-condition-value="..."` as elements enter the DOM. So the terse `data-if` attribute is not parsed by this controller — it never sees it. Anything about attribute expansion belongs in `stimulus-shorthand`, not here.

**Condition DSL.** `Condition` parses the value string with `/^([^ ]+) ([^ ]+) (.+)$/` — exactly three parts: field name, operation, value. The field name and operation may not contain spaces; the value may. A field name containing a `.` is `formName.fieldName` and resolves the form via `document.forms[formName]`; otherwise the controller uses `this.element.closest("form")`.

**Operations** (`applyOperation`) — an unknown operation throws:
- `==` / `in` — the value is `JSON.parse`d, so string literals need quotes inside the attribute (`data-if='kind == "book"'`).
- `is` / `not` — the value is a DOM property name read off the field element (`checked`, `disabled`, …), compared strictly against `true`.

**Field dispatch.** `Field.fromName` calls `form.elements.namedItem(name)`, which returns either a single element or a `RadioNodeList`, then picks the **first** class in the ordered list whose static `matches` returns true. Two consequences:
- Order is significant. `Default` matches everything and must stay last; new subclasses go before it, most specific first.
- `matches` compares element-type arrays by string coercion (`this.allTypes(x) == ["checkbox"].toString()`). That is deliberate — see the comment on `Checkbox.matches`. Follow the same idiom in new subclasses rather than introducing a deep-equality helper.

The subclasses exist to cope with Rails' `check_box` helper, which emits a hidden input immediately before the checkbox so unchecked boxes still submit a value. `CheckboxWithHidden` therefore reads the hidden input's value when unchecked, and indexes past the hidden input for `getProperty`.

Note: `Checkboxes` and `CheckboxesWithHidden` are unfinished — their `value` getters call `.map(e.value)` where `e` is undefined (should be `.map(e => e.value)`), and neither implements `getProperty`, so `is`/`not` fails on them. Fix them if you touch multi-checkbox behavior; don't assume they work.

**Rendering.** `render()` sets `hidden` **and** `disabled` together. The `disabled` half is load-bearing: it keeps concealed inputs out of the form submission. Keep both when changing visibility logic. The controller re-renders on every `change` event on the resolved form (not `input`), plus once on `connect`.

## Releasing

Version lives only in `package.json`; historical release commits touch that file alone (`package-lock.json` is stale at 0.1.0 and has been left that way). Commit message convention is `release vX.Y.Z.` — lowercase, trailing period — in its own commit, separate from the changes being released.
