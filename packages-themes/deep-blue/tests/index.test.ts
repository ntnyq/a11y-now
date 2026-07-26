import { deepBlue } from '@a11y-now/theme-deep-blue'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(deepBlue.name).toBe('deep-blue')
  expect(deepBlue.displayName['zh-CN']).toBeTruthy()
  expect(deepBlue.displayName['en-US']).toBeTruthy()
})

it('is pure data (no functions, JSON-safe)', () => {
  expect(JSON.parse(JSON.stringify(deepBlue))).toEqual(deepBlue)
})
