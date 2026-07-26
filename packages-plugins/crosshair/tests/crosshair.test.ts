import { createA11yNow } from '@a11y-now/core'
import { crosshair } from '@a11y-now/plugin-crosshair'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('adds two crosshair lines inside the shadow root when enabled', () => {
  const a11y = createA11yNow({ storage: null }).use(crosshair())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot

  const api = a11y.getPlugin('crosshair')
  api?.toggle()
  const lines = [...(shadow?.querySelectorAll('div') ?? [])].filter(
    el => el.style.pointerEvents === 'none',
  )
  expect(lines.length).toBe(2)

  api?.toggle()
  const after = [...(shadow?.querySelectorAll('div') ?? [])].filter(
    el => el.style.pointerEvents === 'none',
  )
  expect(after.length).toBe(0)
  a11y.unmount()
})

it('Ctrl+Alt+N toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(crosshair())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'n' }),
  )
  expect(a11y.getPlugin('crosshair')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
