import { createA11yNow } from '@a11y-now/core'
import { pin } from '@a11y-now/plugin-pin'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

const pinStyle = () =>
  document.head.querySelector('[data-a11y-now="pin"]')?.textContent ?? ''

it('reserves page space by default and releases it when unpinned', () => {
  const a11y = createA11yNow({ storage: null }).use(pin())
  a11y.mount()
  expect(pinStyle()).toContain('padding-block-start: 84px')

  a11y.getPlugin('pin')?.toggle()
  expect(pinStyle()).toBe('')

  a11y.getPlugin('pin')?.toggle()
  expect(pinStyle()).toContain('84px')
  a11y.unmount()
})

it('Ctrl+Alt+L toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(pin())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'l' }),
  )
  expect(a11y.getPlugin('pin')?.isPinned()).toBe(false)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
