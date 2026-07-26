import { createA11yNow, fullPreset, readingPreset, screenReaderPreset, wasExited } from 'a11y-now'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>内容</p></main>'
  localStorage.clear()
  Element.prototype.getBoundingClientRect = () =>
    ({ height: 10, width: 10 }) as DOMRect
})

it('one-liner mounts the full preset with all official plugins', () => {
  const a11y = createA11yNow({ storage: null })
  a11y.mount()

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  expect(shadow?.querySelector('[data-item-id="theme"]')).not.toBeNull()
  expect(shadow?.querySelector('[data-item-id="zoom-in"]')).not.toBeNull()
  expect(shadow?.querySelector('[data-item-id="region-content"]')).not.toBeNull()
  expect(shadow?.querySelector('[data-item-id="exit"]')).not.toBeNull()
  expect(a11y.themes.list().length).toBe(5)
  a11y.unmount()
})

it('presets expose the documented plugin sets', () => {
  expect(fullPreset().plugins.length).toBe(12)
  expect(fullPreset().themes.length).toBe(5)
  expect(readingPreset().plugins.length).toBe(9)
  expect(screenReaderPreset().plugins.length).toBe(4)
})

it('wasExited reflects the exit plugin persistence', () => {
  expect(wasExited()).toBe(false)
  const a11y = createA11yNow()
  a11y.mount()
  a11y.getPlugin('exit')?.exit()
  expect(wasExited()).toBe(true)
})

it('full preset mounts and unmounts without residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null })
  a11y.mount()
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
