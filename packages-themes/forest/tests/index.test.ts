import { forest } from '@a11y-now/theme-forest'
import { expect, it } from 'vitest'

it('exposes a valid theme definition', () => {
  expect(forest.name).toBe('forest')
  expect(forest.displayName['zh-CN']).toBeTruthy()
  expect(forest.displayName['en-US']).toBeTruthy()
})

it('is pure data (no functions, JSON-safe)', () => {
  expect(JSON.parse(JSON.stringify(forest))).toEqual(forest)
})
