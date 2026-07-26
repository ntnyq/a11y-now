import type { A11yPlugin, A11yTheme } from '@a11y-now/types'
import { expect, it } from 'vitest'

it('type contracts are usable at compile time', () => {
  const plugin: A11yPlugin<{ step: number }, { value: () => number }> = {
    name: 'probe',
    setup: ctx => ({
      api: { value: () => ctx.options.step },
      dispose: () => {},
    }),
  }
  const theme: A11yTheme = {
    displayName: { 'zh-CN': '测试' },
    name: 'test',
    page: { bg: '#000' },
  }
  expect(plugin.name).toBe('probe')
  expect(theme.page?.bg).toBe('#000')
})
