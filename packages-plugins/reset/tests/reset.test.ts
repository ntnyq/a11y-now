import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { reset } from '@a11y-now/plugin-reset'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('restores every plugin state to defaults', () => {
  const a11y = createA11yNow({ storage: createMemoryStorageAdapter() })
    .use(zoom())
    .use(reset())
  a11y.mount()

  a11y.getPlugin('zoom')?.zoomIn()
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1.1)

  a11y.getPlugin('reset')?.reset()
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1)
  expect(document.head.querySelector('[data-a11y-now="zoom"]')).toBeNull()
  a11y.unmount()
})

it('Ctrl+Alt+C triggers reset and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(zoom()).use(reset())
  a11y.mount()
  a11y.getPlugin('zoom')?.zoomIn()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'c' }),
  )
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
