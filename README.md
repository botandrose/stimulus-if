# Stimulus If

Stimulus controller for declarative dynamic form flows: show an element only while a condition on a form field holds.

## Install

```sh
npm install stimulus-if
```

Register it under the identifier `if`:

```js
import { Application } from "@hotwired/stimulus"
import IfController from "stimulus-if"

const application = Application.start()
application.register("if", IfController)
```

## Usage

Put a condition on any element inside a form:

```html
<form>
  <input type="checkbox" name="shipping" value="1">

  <div data-if="shipping is checked">
    <input type="text" name="address">
  </div>
</form>
```

The `<div>` and its inputs appear when the checkbox is checked, and are hidden and disabled otherwise — so concealed fields are left out of the submission. The condition is re-evaluated on every `change` event in the form.

`data-if` is shorthand (via [stimulus-shorthand](https://github.com/botandrose/stimulus-shorthand)) for the full Stimulus declaration:

```html
<div data-controller="if" data-if-condition-value="shipping is checked">
```

## Conditions

A condition is three space-separated parts: `<field> <operation> <value>`. The field name and operation cannot contain spaces; the value can.

| Operation | Meaning | Example |
| --- | --- | --- |
| `==` | field value equals the value | `data-if='role == "admin"'` |
| `!=` | field value does not equal the value | `data-if='role != "admin"'` |
| `in` | field value is in the list | `data-if='role in ["admin","owner"]'` |
| `is` | DOM property on the field is `true` | `data-if="shipping is checked"` |
| `not` | DOM property on the field is not `true` | `data-if="shipping not checked"` |

Values for `==` and `in` are parsed as JSON, so strings need quotes — which is why these examples wrap the attribute in single quotes.

Values for `is` and `not` are property names read off the field element, such as `checked`, `disabled`, or `readOnly`.

### Fields in another form

By default the field is looked up in the nearest ancestor `<form>`. Prefix the field name with a form name to look it up elsewhere:

```html
<form name="order">
  <select name="role">…</select>
</form>

<div data-if='order.role == "admin"'>…</div>
```

### Supported fields

Text inputs, selects, radio groups, single checkboxes, and checkbox groups are all supported, including the hidden-input-plus-checkbox pairs that Rails' `check_box` helper emits — an unchecked box falls back to the hidden input's value rather than reading as empty.

For a group of checkboxes sharing one name, `is`/`not` ask whether *any* box in the group is checked, `in` matches when *any* checked box is in the list, and the group's value is its checked values joined by commas:

```html
<input type="checkbox" name="tags" value="a">
<input type="checkbox" name="tags" value="b">

<div data-if="tags is checked">…</div>
<div data-if='tags in ["b","c"]'>…</div>
<div data-if='tags == "a,b"'>…</div>
```

## Development

```sh
npm install
npm test
```

## License

ISC
