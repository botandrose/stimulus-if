import { Application } from "@hotwired/stimulus"
import IfController from "../index.js"

export const errors = []

let application

const tick = () => new Promise(r => setTimeout(r, 0))

export async function mount(html) {
  document.body.innerHTML = html
  await tick() // let stimulus-shorthand expand data-if into a full declaration
  application = Application.start()
  application.handleError = (error, message) => errors.push({ error, message })
  application.register("if", IfController)
  await tick()
}

export function teardown() {
  application?.stop()
  application = undefined
  errors.length = 0
  document.body.innerHTML = ""
}

export async function change(element) {
  element.dispatchEvent(new Event("change", { bubbles: true }))
  await tick()
}

export function shown(selector = "#subject") {
  return !document.querySelector(selector).hidden
}

export async function check(selector) {
  const element = document.querySelector(selector)
  element.checked = true
  await change(element)
}

export async function set(selector, value) {
  const element = document.querySelector(selector)
  element.value = value
  await change(element)
}
