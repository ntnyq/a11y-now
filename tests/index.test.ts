/**
 * Cross-package integration: aggregate entry + themes + plugins together.
 * Per-package behavior lives in each package's own tests/ folder.
 */
import { autoTheme } from '@a11y-now/plugin-auto-theme'
import { elderMode } from '@a11y-now/plugin-elder-mode'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'
import { zhConvert } from '@a11y-now/plugin-zh-convert'
import { createA11yNow, fullPreset } from 'a11y-now'
import { beforeEach, expect, it } from 'vitest'

beforeEach(() => {
  document.querySelector('a11y-now-host')?.remove()
  document.body.innerHTML = '<main><p>集成测试</p></main>'
  localStorage.clear()
  Element.prototype.getBoundingClientRect = () =>
    ({ height: 10, width: 10 }) as DOMRect
})

it('full toolbar lifecycle: mount, interact across plugins, exit cleanly', () => {
  const before = document.documentElement.outerHTML
  const a11y = createA11yNow()
  a11y.mount()

  // theme × zoom × pin interact without conflicts
  a11y.getPlugin('theme')?.apply('high-contrast')
  a11y.getPlugin('zoom')?.zoomIn()
  a11y.getPlugin('pin')?.toggle()

  expect(document.documentElement.dataset['a11yTheme']).toBe('high-contrast')
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1.1)

  // reset restores every plugin at once
  a11y.getPlugin('reset')?.reset()
  expect(a11y.getPlugin('zoom')?.getScale()).toBe(1)
  expect(a11y.getPlugin('pin')?.isPinned()).toBe(true)

  // exit leaves the page byte-identical
  a11y.getPlugin('exit')?.exit()
  expect(document.documentElement.outerHTML).toBe(before)
})

it('shortcuts from all plugins coexist without conflicts', () => {
  const a11y = createA11yNow({ storage: null })
  expect(() => a11y.mount()).not.toThrow()
  expect(a11y.shortcuts.list().length).toBeGreaterThan(12)
  a11y.unmount()
})

it('every official plugin ships en-US and zh-CN messages in lockstep', () => {
  const plugins = [
    ...fullPreset().plugins,
    pinyinAnnotation(),
    zhConvert(),
    elderMode(),
    autoTheme(),
  ]
  expect(plugins).toHaveLength(16)
  for (const input of plugins) {
    const plugin = 'plugin' in input ? input.plugin : input
    const en = Object.keys(plugin.messages?.['en-US'] ?? {}).toSorted()
    const zh = Object.keys(plugin.messages?.['zh-CN'] ?? {}).toSorted()
    expect(en.length, `${plugin.name} has messages`).toBeGreaterThan(0)
    expect(en, `${plugin.name} en/zh keys`).toStrictEqual(zh)
  }
})
