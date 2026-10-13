import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { screenReader } from '@a11y-now/plugin-screen-reader'
import { zoom } from '@a11y-now/plugin-zoom'
import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('mutes speech, marks the page and hides visual-aid buttons', () => {
  const speak =
    vi.fn<(text: string, options: { locale: string; rate: number }) => void>()
  const a11y = createA11yNow({
    speechEngine: { available: true, cancel() {}, speak },
    storage: null,
  })
    .use(screenReader())
    .use(zoom())
  a11y.mount()

  const api = a11y.getPlugin('screen-reader')
  api?.toggle()
  expect(api?.isEnabled()).toBe(true)
  expect(
    document.documentElement.classList.contains('a11y-screen-reader'),
  ).toBe(true)

  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const zoomBtn = shadow?.querySelector(
    '[data-item-id="zoom-in"]',
  ) as HTMLButtonElement
  expect(zoomBtn.hidden).toBe(true)

  const callsBefore = speak.mock.calls.length
  a11y.speech.speak('should be muted')
  expect(speak).toHaveBeenCalledTimes(callsBefore)

  api?.toggle()
  expect(zoomBtn.hidden).toBe(false)
  expect(
    document.documentElement.classList.contains('a11y-screen-reader'),
  ).toBe(false)
  a11y.unmount()
})

it('Ctrl+Alt+R toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(screenReader())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'r' }),
  )
  expect(a11y.getPlugin('screen-reader')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('hides visual controls registered after restoring screen-reader mode', () => {
  const storage = createMemoryStorageAdapter()
  storage.set('a11y-now:plugin:screen-reader', '{"enabled":true}')
  const a11y = createA11yNow({ storage }).use(screenReader()).use(zoom())
  a11y.mount()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const button = shadow?.querySelector<HTMLElement>('[data-item-id="zoom-in"]')
  expect(button?.hidden).toBe(true)
  expect(a11y.speech.isMuted()).toBe(true)
  a11y.getPlugin('screen-reader')?.toggle()
  expect(button?.hidden).toBe(false)
  a11y.destroy()
})
