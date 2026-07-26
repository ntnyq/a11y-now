import { highContrast } from '@a11y-now/theme-high-contrast'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(highContrast.name).toBe('high-contrast')
  expect(highContrast.displayName['zh-CN']).toBe('黑底白字')
  expect(highContrast.displayName['en-US']).toBe('High Contrast')
})

it('is pure data (structured-clone safe)', () => {
  expect(structuredClone(highContrast)).toStrictEqual(highContrast)
})
