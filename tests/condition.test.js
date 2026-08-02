import { describe, it, expect, afterEach } from "vitest"
import { mount, teardown, check, set, shown } from "./helper.js"

describe("condition", () => {
  afterEach(teardown)

  it("resolves the field against the nearest ancestor form", async () => {
    await mount(`
      <form>
        <input type="text" name="role" value="admin">
      </form>
      <form>
        <input type="text" name="role" value="member">
        <div id="subject" data-if='role == "member"'></div>
      </form>
    `)
    expect(shown()).toBe(true)
  })

  it("resolves the field against a named form when the field name is qualified", async () => {
    await mount(`
      <form name="order">
        <select name="role">
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
      </form>
      <div id="subject" data-if='order.role == "admin"'></div>
    `)
    expect(shown()).toBe(false)
    await set("[name=role]", "admin")
    expect(shown()).toBe(true)
  })

  it("tracks changes in the named form even when the element sits outside it", async () => {
    await mount(`
      <form name="order">
        <input type="checkbox" name="gift" value="1">
      </form>
      <section>
        <div id="subject" data-if="order.gift is checked"></div>
      </section>
    `)
    expect(shown()).toBe(false)
    await check("[name=gift]")
    expect(shown()).toBe(true)
  })
})
