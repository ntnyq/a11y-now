import { forest } from '@a11y-now/theme-forest'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(forest.name).toBe('forest')
  expect(forest.displayName['zh-CN']).toBe('森林绿')
  expect(forest.displayName['en-US']).toBe('Forest')
})

it('is pure data (structured-clone safe)', () => {
  expect(structuredClone(forest)).toStrictEqual(forest)
})
