import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it } from 'vitest'
import type { A11yNowInstance } from '@a11y-now/types'

let a11y: A11yNowInstance

const mountWith = (storage = createMemoryStorageAdapter()) => {
  a11y = createA11yNow({ storage }).use(zoom())
  a11y.mount()
  return storage
}

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

const zoomStyle = () =>
  document.head.querySelector('[data-a11y-now="zoom"]')?.textContent ?? ''

it('zooms in and out within bounds via api', () => {
  mountWith()
  const api = a11y.getPlugin('zoom')
  expect(api?.getScale()).toBe(1)

  api?.zoomIn()
  expect(api?.getScale()).toBe(1.1)
  expect(zoomStyle()).toContain('zoom: 1.1')

  api?.zoomIn()
  api?.zoomIn()
  api?.zoomIn() // hits max 1.3
  expect(api?.getScale()).toBe(1.3)

  api?.setScale(1)
  expect(api?.getScale()).toBe(1)
  expect(zoomStyle()).toBe('')
  a11y.unmount()
})

it('responds to Ctrl+Alt+= shortcut', () => {
  mountWith()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: '=' }),
  )
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1.1)
  a11y.unmount()
})

it('persists scale and restores it on remount', () => {
  const storage = mountWith()
  a11y.getPlugin('zoom')?.zoomIn()
  a11y.unmount()

  a11y = createA11yNow({ storage }).use(zoom())
  a11y.mount()
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1.1)
  expect(zoomStyle()).toContain('zoom: 1.1')
  a11y.unmount()
})

it('unmounts without residue', () => {
  const before = document.documentElement.outerHTML
  mountWith()
  a11y.getPlugin('zoom')?.zoomIn()
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
