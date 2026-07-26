import { deepBlue } from '@a11y-now/theme-deep-blue'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(deepBlue.name).toBe('deep-blue')
  expect(deepBlue.displayName['zh-CN']).toBe('深蓝白')
  expect(deepBlue.displayName['en-US']).toBe('Deep Blue')
})

it('is pure data (structured-clone safe)', () => {
  expect(structuredClone(deepBlue)).toStrictEqual(deepBlue)
})
