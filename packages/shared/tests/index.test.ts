import {
  clamp,
  formatShortcut,
  interpolate,
  matchShortcut,
  normalizeShortcut,
  resolveLabel,
  round2,
} from '@a11y-now/shared'
import { expect, it } from 'vitest'

it('clamp and round2 behave', () => {
  expect(clamp(5, 0, 3)).toBe(3)
  expect(clamp(-1, 0, 3)).toBe(0)
  expect(round2(1.005)).toBe(1.01)
  expect(round2(1.1 + 0.1)).toBe(1.2)
})

it('shortcut helpers normalize, format and match', () => {
  const def = { alt: true, ctrl: true, key: 'T' }
  expect(normalizeShortcut(def)).toBe('ctrl+alt+t')
  expect(formatShortcut(def)).toBe('Ctrl+Alt+T')
  expect(
    matchShortcut(
      new KeyboardEvent('keydown', { altKey: true, ctrlKey: true, key: 't' }),
      def,
    ),
  ).toBe(true)
  expect(
    matchShortcut(new KeyboardEvent('keydown', { key: 't' }), def),
  ).toBe(false)
})

it('interpolate fills placeholders and leaves unknowns', () => {
  expect(interpolate('{a} + {b} = {c}', { a: 1, b: 2 })).toBe('1 + 2 = {c}')
})

it('resolveLabel handles both forms', () => {
  expect(resolveLabel('x')).toBe('x')
  expect(resolveLabel(() => 'y')).toBe('y')
  expect(resolveLabel(undefined)).toBe('')
})
