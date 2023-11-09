import shorthand from "stimulus-shorthand"
import { Controller } from "@hotwired/stimulus"

shorthand({ controller: "if", value: "condition" })
export default class extends Controller {
  static values = {
    condition: String,
  }

  connect() {
    this.formTarget = this.element.closest("form")
    this.formTarget.addEventListener("change", _ => this.render())
    this.render()
  }

  render(event) {
    this.element.hidden = this.element.disabled = !this.test()
  }

  test() {
    const [_, fieldName, operation, value] = this.conditionValue.match(/^([^ ]+) ([^ ]+) (.+)$/)
    const field = this.getField(fieldName)
    return this.applyOperation(field, operation, value)
  }

  getField(fieldName) {
    return Field.fromName(this.formTarget, fieldName)
  }

  applyOperation(field, op, value) {
    switch(op) {
      case '==': return field.value == JSON.parse(value)
      case 'in': return JSON.parse(value).includes(field.value)
      case 'is': return field.getProperty(value) === true
      case 'not': return field.getProperty(value) !== true
      default: throw `unknown operation ${op}`
    }
  }
}

class Field {
  static fromName(form, name) {
    const namedItemResult = form.elements.namedItem(name)
    const klass = [ 
      Checkbox,
      CheckboxWithHidden,
      Checkboxes,
      CheckboxesWithHidden,
      Default // radios, text, etc
    ].find(c => c.matches(namedItemResult))
    return new klass(namedItemResult)
  }
  
  static allTypes(namedItemResult) {
    if(namedItemResult.constructor === RadioNodeList) {
      return Array.from(namedItemResult).map(e => e.type)
    } else {
      return [namedItemResult.type]
    }
  }

  static uniqTypes(namedItemResult) {
    return Array.from(new Set(this.allTypes(namedItemResult)))
  }

  constructor(namedItemResult) {
    this.namedItemResult = namedItemResult
  }
}

class Checkbox extends Field {
  static matches(namedItemResult) {
    return this.allTypes(namedItemResult) == ["checkbox"].toString() // array equality in js in insane
  }

  get value() {
    const element = this.namedItemResult
    return element.checked ? element.value : null
  }

  getProperty(prop) {
    return this.namedItemResult[prop]
  }
}

class CheckboxWithHidden extends Field {
  static matches(namedItemResult) {
    return this.allTypes(namedItemResult) == ["hidden", "checkbox"].toString()
  }

  get value() {
    const hidden = this.namedItemResult[0]
    const checkbox = this.namedItemResult[1]
    return checkbox.checked ? checkbox.value : hidden.value
  }

  getProperty(prop) {
    return this.namedItemResult[1][prop]
  }
}

class Checkboxes extends Field {
  static matches(namedItemResult) {
    return this.allTypes(namedItemResult).length > 1 && this.uniqTypes(namedItemResult) == ["checkbox"].toString()
  }

  get value() {
    return Array.from(this.namedItemResult).filter(e => e.checked).map(e.value)
  }
}

class CheckboxesWithHidden extends Field {
  static matches(namedItemResult) {
    return this.allTypes(namedItemResult).length > 2 && this.uniqTypes(namedItemResult) == ["hidden", "checkbox"].toString()
  }

  get value() {
    const checkedValues = Array.from(this.namedItemResult).filter(e => e.checked).map(e.value)
    if(checkedValues.length > 0) {
      return checkedValues
    } else {
      return this.namedItemResult[0].value
    }
  }
}

class Default extends Field {
  static matches(namedItemResult) {
    return true
  }

  get value() {
    return this.namedItemResult.value
  }

  getProperty(prop) {
    return this.namedItemResult[prop]
  }
}

