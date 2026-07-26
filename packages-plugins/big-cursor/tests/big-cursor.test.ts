import { createA11yNow } from '@a11y-now/core'
import { bigCursor } from '@a11y-now/plugin-big-cursor'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('injects a cursor stylesheet when enabled and removes it after', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(bigCursor())
  a11y.mount()

  const api = a11y.getPlugin('big-cursor')
  api?.toggle()
  const style = document.head.querySelector('[data-a11y-now="big-cursor"]')
  expect(style?.textContent).toContain('cursor: url("data:image/svg+xml')
  expect(api?.isEnabled()).toBe(true)

  api?.toggle()
  expect(document.head.querySelector('[data-a11y-now="big-cursor"]')).toBeNull()

  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('Ctrl+Alt+M toggles the cursor', () => {
  const a11y = createA11yNow({ storage: null }).use(bigCursor())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'm' }),
  )
  expect(a11y.getPlugin('big-cursor')?.isEnabled()).toBe(true)
  a11y.unmount()
})
