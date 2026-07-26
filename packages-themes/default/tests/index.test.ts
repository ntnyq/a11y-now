import { defaultTheme } from '@a11y-now/theme-default'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(defaultTheme.name).toBe('default')
  expect(defaultTheme.displayName['zh-CN']).toBeTruthy()
  expect(defaultTheme.displayName['en-US']).toBeTruthy()
})

it('is pure data (no functions, JSON-safe)', () => {
  expect(JSON.parse(JSON.stringify(defaultTheme))).toEqual(defaultTheme)
})
