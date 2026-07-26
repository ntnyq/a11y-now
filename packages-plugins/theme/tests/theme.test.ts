import { createA11yNow, createMemoryStorageAdapter } from '@a11y-now/core'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
})

const themes = [defaultTheme, deepBlue]

it('cycles registered themes and applies CSS variables', () => {
  const a11y = createA11yNow({ storage: null, themes }).use(themeSwitcher())
  a11y.mount()
  const api = a11y.getPlugin('theme')

  const next = api?.cycle()
  expect(next?.name).toBe('default')
  expect(api?.cycle()?.name).toBe('deep-blue')

  const host = document.querySelector('a11y-now-host') as HTMLElement
  expect(host.style.getPropertyValue('--a11y-color-bg')).toBe('rgb(0, 51, 92)')
  expect(
    document.documentElement.style.getPropertyValue('--a11y-page-bg'),
  ).toBe('rgb(0, 51, 92)')
  expect(document.documentElement.dataset['a11yTheme']).toBe('deep-blue')
  a11y.unmount()
})

it('persists the chosen theme and restores on remount', () => {
  const storage = createMemoryStorageAdapter()
  const first = createA11yNow({ storage, themes }).use(themeSwitcher())
  first.mount()
  first.getPlugin('theme')?.apply('deep-blue')
  first.unmount()

  const second = createA11yNow({ storage, themes }).use(themeSwitcher())
  second.mount()
  expect(second.getPlugin('theme')?.current()?.name).toBe('deep-blue')
  second.unmount()
})

it('Ctrl+Alt+T shortcut cycles and unmount leaves no residue', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow({ storage: null, themes }).use(themeSwitcher())
  a11y.mount()
  window.dispatchEvent(
    new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 't' }),
  )
  expect(a11y.getPlugin('theme')?.current()?.name).toBe('default')
  a11y.unmount()
  expect(document.documentElement.outerHTML).toBe(before)
})
