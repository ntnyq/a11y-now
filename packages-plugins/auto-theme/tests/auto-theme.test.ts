import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { autoTheme } from '@a11y-now/plugin-auto-theme'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'
import { highContrast } from '@a11y-now/theme-high-contrast'
import type { A11yNowOptions } from '@a11y-now/types'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

class FakeMql extends EventTarget {
  matches = false
  readonly media: string
  constructor(media: string) {
    super()
    this.media = media
  }
}

let mqls = new Map<string, FakeMql>()

function mql(query: string): FakeMql {
  let entry = mqls.get(query)
  if (!entry) {
    entry = new FakeMql(query)
    mqls.set(query, entry)
  }
  return entry
}

/**
 * System dark-scheme media query used by auto-theme tests.
 */
const DARK = '(prefers-color-scheme: dark)'
/**
 * System high-contrast media query used by auto-theme tests.
 */
const CONTRAST = '(prefers-contrast: more)'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  mqls = new Map()
  vi.stubGlobal('matchMedia', (query: string) => mql(query))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mountWith(options: Partial<A11yNowOptions> = {}) {
  const a11y = createA11yNow({
    storage: null,
    themes: [defaultTheme, deepBlue, highContrast],
    ...options,
  }).use(autoTheme())
  a11y.mount()
  return a11y
}

it('applies the mapped theme for the current system preference', () => {
  mql(DARK).matches = true
  const a11y = mountWith()
  expect(a11y.themes.current()?.name).toBe('deep-blue')
  a11y.unmount()
})

it('follows media changes, contrast beating dark', () => {
  const a11y = mountWith()
  expect(a11y.themes.current()?.name).toBe('default')

  mql(DARK).matches = true
  mql(DARK).dispatchEvent(new Event('change'))
  expect(a11y.themes.current()?.name).toBe('deep-blue')

  mql(CONTRAST).matches = true
  mql(CONTRAST).dispatchEvent(new Event('change'))
  expect(a11y.themes.current()?.name).toBe('high-contrast')

  mql(CONTRAST).matches = false
  mql(DARK).matches = false
  mql(DARK).dispatchEvent(new Event('change'))
  expect(a11y.themes.current()?.name).toBe('default')
  a11y.unmount()
})

it('yields to a manual theme switch and persists the choice', () => {
  const storage = createMemoryStorageAdapter()
  const a11y = createA11yNow({
    storage,
    themes: [defaultTheme, deepBlue, highContrast],
  }).use(autoTheme())
  a11y.mount()
  expect(a11y.getPlugin('auto-theme')?.isEnabled()).toBe(true)

  a11y.themes.apply('high-contrast')
  expect(a11y.getPlugin('auto-theme')?.isEnabled()).toBe(false)
  // System flips no longer override the manual choice.
  mql(DARK).matches = true
  mql(DARK).dispatchEvent(new Event('change'))
  expect(a11y.themes.current()?.name).toBe('high-contrast')
  a11y.unmount()

  const again = createA11yNow({
    storage,
    themes: [defaultTheme, deepBlue, highContrast],
  }).use(autoTheme())
  again.mount()
  expect(again.getPlugin('auto-theme')?.isEnabled()).toBe(false)
  again.unmount()
})

it('re-engages via toggle and skips unregistered themes', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  mql(DARK).matches = true
  const a11y = createA11yNow({ storage: null, themes: [defaultTheme] }).use(
    autoTheme(),
  )
  a11y.mount()
  // deep-blue is not registered — stays untouched, warns instead.
  expect(a11y.themes.current()).toBeNull()
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('is not registered'),
  )

  const api = a11y.getPlugin('auto-theme')
  api?.toggle()
  expect(api?.isEnabled()).toBe(false)
  api?.toggle()
  expect(api?.isEnabled()).toBe(true)
  a11y.unmount()
  vi.restoreAllMocks()
})

it('unmounts without residue', () => {
  const before = document.documentElement.outerHTML
  mql(DARK).matches = true
  const a11y = mountWith()
  expect(a11y.themes.current()?.name).toBe('deep-blue')
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})

it.each([true, false])(
  'reset restores auto theme independently of registration order (%s)',
  first => {
    mql(DARK).matches = true
    const plugins = first
      ? [autoTheme(), themeSwitcher()]
      : [themeSwitcher(), autoTheme()]
    const a11y = createA11yNow({
      storage: null,
      plugins,
      themes: [defaultTheme, deepBlue, highContrast],
    })
    a11y.mount()
    a11y.getPlugin('theme')?.apply('high-contrast')
    expect(a11y.getPlugin('auto-theme')?.isEnabled()).toBe(false)
    a11y.resetAll()
    expect(a11y.getPlugin('auto-theme')?.isEnabled()).toBe(true)
    expect(a11y.themes.current()?.name).toBe('deep-blue')
    expect(
      document
        .querySelector('a11y-now-host')
        ?.shadowRoot?.querySelector('[data-item-id="auto-theme"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true')
    a11y.destroy()
  },
)
