import { describe, it, expect, afterEach } from "vitest"
import { mount, teardown, change, check, shown } from "./helper.js"

describe("rendering", () => {
  afterEach(teardown)

  it("hides the element on connect when the condition is false", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1">
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    expect(shown()).toBe(false)
  })

  it("shows the element on connect when the condition is true", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1" checked>
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    expect(shown()).toBe(true)
  })

  it("disables the element alongside hiding it, so concealed fields do not submit", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1">
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    const subject = document.querySelector("#subject")
    expect(subject.hidden).toBe(true)
    expect(subject.disabled).toBe(true)

    await check("[name=ship]")
    expect(subject.hidden).toBe(false)
    expect(subject.disabled).toBe(false)
  })

  it("re-evaluates on every change event in the form", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1">
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    const checkbox = document.querySelector("[name=ship]")
    expect(shown()).toBe(false)

    checkbox.checked = true
    await change(checkbox)
    expect(shown()).toBe(true)

    checkbox.checked = false
    await change(checkbox)
    expect(shown()).toBe(false)
  })

  it("re-evaluates when an unrelated field in the same form changes", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1">
        <input type="text" name="unrelated">
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    document.querySelector("[name=ship]").checked = true
    await change(document.querySelector("[name=unrelated]"))
    expect(shown()).toBe(true)
  })

  it("expands the data-if shorthand into a full stimulus declaration", async () => {
    await mount(`
      <form>
        <input type="checkbox" name="ship" value="1">
        <div id="subject" data-if="ship is checked"></div>
      </form>
    `)
    const subject = document.querySelector("#subject")
    expect(subject.hasAttribute("data-if")).toBe(false)
    expect(subject.getAttribute("data-controller")).toContain("if")
    expect(subject.getAttribute("data-if-condition-value")).toBe("ship is checked")
  })
})
