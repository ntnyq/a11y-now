import { highContrast } from '@a11y-now/theme-high-contrast'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(highContrast.name).toBe('high-contrast')
  expect(highContrast.displayName['zh-CN']).toBeTruthy()
  expect(highContrast.displayName['en-US']).toBeTruthy()
})

it('is pure data (no functions, JSON-safe)', () => {
  expect(JSON.parse(JSON.stringify(highContrast))).toEqual(highContrast)
})
