import { describe, it, expect, afterEach } from "vitest"
import { mount, teardown, change, check, set, shown } from "./helper.js"

describe("field types", () => {
  afterEach(teardown)

  describe("a single checkbox", () => {
    it("reads its value only while checked", async () => {
      await mount(`
        <form>
          <input type="checkbox" name="ship" value="1">
          <div id="subject" data-if='ship == "1"'></div>
        </form>
      `)
      expect(shown()).toBe(false)
      await check("[name=ship]")
      expect(shown()).toBe(true)
    })

    it("exposes its dom properties", async () => {
      await mount(`
        <form>
          <input type="checkbox" name="ship" value="1" checked>
          <div id="subject" data-if="ship is checked"></div>
        </form>
      `)
      expect(shown()).toBe(true)
    })
  })

  describe("a checkbox preceded by a hidden input, as rails emits", () => {
    const html = (condition) => `
      <form>
        <input type="hidden" name="ship" value="0">
        <input type="checkbox" name="ship" value="1">
        <div id="subject" data-if='${condition}'></div>
      </form>
    `

    it("falls back to the hidden input's value when unchecked", async () => {
      await mount(html('ship == "0"'))
      expect(shown()).toBe(true)
      await check("[name=ship][type=checkbox]")
      expect(shown()).toBe(false)
    })

    it("reads the checkbox's value when checked", async () => {
      await mount(html('ship == "1"'))
      expect(shown()).toBe(false)
      await check("[name=ship][type=checkbox]")
      expect(shown()).toBe(true)
    })

    it("reads dom properties off the checkbox, not the hidden input", async () => {
      await mount(html("ship is checked"))
      expect(shown()).toBe(false)
      await check("[name=ship][type=checkbox]")
      expect(shown()).toBe(true)
    })
  })

  describe("a group of checkboxes", () => {
    const html = (condition) => `
      <form>
        <input type="checkbox" name="tags" value="a">
        <input type="checkbox" name="tags" value="b">
        <div id="subject" data-if='${condition}'></div>
      </form>
    `

    it("collects every checked value", async () => {
      await mount(html('tags == "a,b"'))
      expect(shown()).toBe(false)
      await check("[value=a]")
      expect(shown()).toBe(false)
      await check("[value=b]")
      expect(shown()).toBe(true)
    })

    it("is checked when any member is checked", async () => {
      await mount(html("tags is checked"))
      expect(shown()).toBe(false)
      await check("[value=b]")
      expect(shown()).toBe(true)
    })
  })

  describe("a group of checkboxes preceded by a hidden input", () => {
    const html = (condition) => `
      <form>
        <input type="hidden" name="tags" value="none">
        <input type="checkbox" name="tags" value="a">
        <input type="checkbox" name="tags" value="b">
        <div id="subject" data-if='${condition}'></div>
      </form>
    `

    it("falls back to the hidden input's value when nothing is checked", async () => {
      await mount(html('tags == "none"'))
      expect(shown()).toBe(true)
      await check("[value=a]")
      expect(shown()).toBe(false)
    })

    it("collects every checked value", async () => {
      await mount(html('tags == "a"'))
      expect(shown()).toBe(false)
      await check("[value=a]")
      expect(shown()).toBe(true)
    })

    it("ignores the hidden input when reading dom properties", async () => {
      await mount(html("tags is checked"))
      expect(shown()).toBe(false)
      await check("[value=a]")
      expect(shown()).toBe(true)
    })
  })

  describe("a radio group", () => {
    it("reads the selected radio's value", async () => {
      await mount(`
        <form>
          <input type="radio" name="size" value="small">
          <input type="radio" name="size" value="large">
          <div id="subject" data-if='size == "large"'></div>
        </form>
      `)
      expect(shown()).toBe(false)
      await check("[value=large]")
      expect(shown()).toBe(true)
    })
  })

  describe("a select", () => {
    it("reads the selected option's value", async () => {
      await mount(`
        <form>
          <select name="role">
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
          <div id="subject" data-if='role == "admin"'></div>
        </form>
      `)
      expect(shown()).toBe(false)
      await set("[name=role]", "admin")
      expect(shown()).toBe(true)
    })
  })

  describe("a text input", () => {
    it("reads its value", async () => {
      await mount(`
        <form>
          <input type="text" name="name" value="ada">
          <div id="subject" data-if='name == "ada"'></div>
        </form>
      `)
      expect(shown()).toBe(true)
      await set("[name=name]", "grace")
      expect(shown()).toBe(false)
    })

    it("exposes its dom properties", async () => {
      await mount(`
        <form>
          <input type="text" name="name" disabled>
          <div id="subject" data-if="name is disabled"></div>
        </form>
      `)
      expect(shown()).toBe(true)

      const input = document.querySelector("[name=name]")
      input.disabled = false
      await change(input)
      expect(shown()).toBe(false)
    })
  })
})
