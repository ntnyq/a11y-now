import { chocolate } from '@a11y-now/theme-chocolate'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(chocolate.name).toBe('chocolate')
  expect(chocolate.displayName['zh-CN']).toBeTruthy()
  expect(chocolate.displayName['en-US']).toBeTruthy()
})

it('is pure data (no functions, JSON-safe)', () => {
  expect(JSON.parse(JSON.stringify(chocolate))).toEqual(chocolate)
})
