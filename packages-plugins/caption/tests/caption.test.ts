import { createA11yNow } from '@a11y-now/core'
import { caption } from '@a11y-now/plugin-caption'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

it('mirrors spoken text into the caption bar', () => {
  const a11y = createA11yNow({
    speechEngine: { available: true, cancel() {}, speak() {} },
    storage: null,
  }).use(caption())
  a11y.mount()

  a11y.getPlugin('caption')?.toggle()
  const shadow = document.querySelector('a11y-now-host')?.shadowRoot
  const bar = shadow?.querySelector('[data-a11y-caption]') as HTMLElement
  expect(bar).not.toBeNull()
  expect(bar.style.fontSize).toBe('var(--a11y-font-size-caption)')

  a11y.speech.speak('大字幕内容')
  expect(bar.textContent).toBe('大字幕内容')

  a11y.getPlugin('caption')?.toggle()
  expect(shadow?.querySelector('[data-a11y-caption]')).toBeNull()
  a11y.unmount()
})

it('Ctrl+Alt+B toggles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(caption())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'b' }),
  )
  expect(a11y.getPlugin('caption')?.isEnabled()).toBe(true)
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
