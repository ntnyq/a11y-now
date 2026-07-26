import { createA11yNow } from '@a11y-now/core'
import { help } from '@a11y-now/plugin-help'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('opens a dialog listing registered shortcuts, Escape closes it', () => {
  const a11y = createA11yNow({ storage: null }).use(zoom()).use(help())
  a11y.mount()

  const api = a11y.getPlugin('help')
  api?.open()
  expect(api?.isOpen()).toBe(true)

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const dialog = shadow?.querySelector('[role="dialog"]') as HTMLElement
  expect(dialog).not.toBeNull()
  expect(dialog.textContent).toContain('Ctrl+Alt+=')

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(api?.isOpen()).toBe(false)
  a11y.unmount()
})

it('Ctrl+Alt+? opens and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(help())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '?' }),
  )
  expect(a11y.getPlugin('help')?.isOpen()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
