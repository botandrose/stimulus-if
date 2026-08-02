import { describe, it, expect, afterEach } from "vitest"
import { mount, teardown, errors, set, check, shown } from "./helper.js"

const withSelect = (condition) => `
  <form>
    <select name="role">
      <option value="">none</option>
      <option value="admin">admin</option>
      <option value="owner">owner</option>
    </select>
    <div id="subject" data-if='${condition}'></div>
  </form>
`

describe("operations", () => {
  afterEach(teardown)

  describe("==", () => {
    it("matches an equal value", async () => {
      await mount(withSelect('role == "admin"'))
      expect(shown()).toBe(false)
      await set("[name=role]", "admin")
      expect(shown()).toBe(true)
    })

    it("compares loosely, since field values are always strings", async () => {
      await mount(`
        <form>
          <input type="text" name="count" value="0">
          <div id="subject" data-if="count == 0"></div>
        </form>
      `)
      expect(shown()).toBe(true)
      await set("[name=count]", "3")
      expect(shown()).toBe(false)
    })

    it("accepts values containing spaces", async () => {
      await mount(`
        <form>
          <input type="text" name="title" value="war and peace">
          <div id="subject" data-if='title == "war and peace"'></div>
        </form>
      `)
      expect(shown()).toBe(true)
    })
  })

  describe("!=", () => {
    it("matches anything but the given value", async () => {
      await mount(withSelect('role != "admin"'))
      expect(shown()).toBe(true)
      await set("[name=role]", "admin")
      expect(shown()).toBe(false)
    })
  })

  describe("in", () => {
    it("matches any value in the list", async () => {
      await mount(withSelect('role in ["admin","owner"]'))
      expect(shown()).toBe(false)
      await set("[name=role]", "owner")
      expect(shown()).toBe(true)
      await set("[name=role]", "admin")
      expect(shown()).toBe(true)
    })

    it("matches when any checked value in a group is in the list", async () => {
      await mount(`
        <form>
          <input type="checkbox" name="tags" value="a">
          <input type="checkbox" name="tags" value="b">
          <div id="subject" data-if='tags in ["b","c"]'></div>
        </form>
      `)
      expect(shown()).toBe(false)
      await check("[value=a]")
      expect(shown()).toBe(false)
      await check("[value=b]")
      expect(shown()).toBe(true)
    })
  })

  describe("is", () => {
    it("reads a dom property off the field", async () => {
      await mount(`
        <form>
          <input type="checkbox" name="ship" value="1">
          <div id="subject" data-if="ship is checked"></div>
        </form>
      `)
      expect(shown()).toBe(false)
      await check("[name=ship]")
      expect(shown()).toBe(true)
    })
  })

  describe("not", () => {
    it("refutes a dom property on the field", async () => {
      await mount(`
        <form>
          <input type="checkbox" name="ship" value="1">
          <div id="subject" data-if="ship not checked"></div>
        </form>
      `)
      expect(shown()).toBe(true)
      await check("[name=ship]")
      expect(shown()).toBe(false)
    })
  })

  it("raises on an unknown operation", async () => {
    await mount(`
      <form>
        <input type="text" name="role">
        <div id="subject" data-if="role ~= 1"></div>
      </form>
    `)
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toBe("unknown operation ~=")
  })
})
