import { chocolate } from '@a11y-now/theme-chocolate'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(chocolate.name).toBe('chocolate')
  expect(chocolate.displayName['zh-CN']).toBe('巧克力色')
  expect(chocolate.displayName['en-US']).toBe('Chocolate')
})

it('is pure data (structured-clone safe)', () => {
  expect(structuredClone(chocolate)).toStrictEqual(chocolate)
})
