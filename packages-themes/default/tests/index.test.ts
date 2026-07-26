import { defaultTheme } from '@a11y-now/theme-default'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(defaultTheme.name).toBe('default')
  expect(defaultTheme.displayName['zh-CN']).toBe('默认')
  expect(defaultTheme.displayName['en-US']).toBe('Default')
})

it('is pure data (structured-clone safe)', () => {
  expect(structuredClone(defaultTheme)).toStrictEqual(defaultTheme)
})
