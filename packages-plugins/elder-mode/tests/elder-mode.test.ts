import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { elderMode } from '@a11y-now/plugin-elder-mode'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

function styleText() {
  return (
    document.head.querySelector('[data-a11y-now="elder-mode"]')?.textContent ??
    ''
  )
}

it('applies the elder care styles and page class', () => {
  const a11y = createA11yNow({ storage: null }).use(elderMode())
  a11y.mount()
  const api = a11y.getPlugin('elder-mode')

  api?.toggle()
  expect(document.documentElement.classList.contains('a11y-elder')).toBe(true)
  expect(styleText()).toContain('max(1em, 18px)')
  expect(styleText()).toContain('line-height: 1.6')
  expect(styleText()).toContain('text-decoration: underline')

  api?.toggle()
  expect(document.documentElement.classList.contains('a11y-elder')).toBe(false)
  expect(styleText()).toBe('')
  a11y.unmount()
})

it('honors custom thresholds', () => {
  const a11y = createA11yNow({ storage: null }).use(
    elderMode({ lineHeight: 2, minFontSize: 20 }),
  )
  a11y.mount()
  a11y.getPlugin('elder-mode')?.toggle()
  expect(styleText()).toContain('max(1em, 20px)')
  expect(styleText()).toContain('line-height: 2')
  a11y.unmount()
})

it('responds to Ctrl+Alt+O and persists across remounts', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({ storage }).use(elderMode())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 'o' }),
  )
  expect(a11y.getPlugin('elder-mode')?.isEnabled()).toBe(true)
  a11y.unmount()

  const again = createA11yNow({ storage }).use(elderMode())
  again.mount()
  expect(document.documentElement.classList.contains('a11y-elder')).toBe(true)
  again.unmount()
})

it('unmounts while enabled without residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null }).use(elderMode())
  a11y.mount()
  a11y.getPlugin('elder-mode')?.toggle()
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
