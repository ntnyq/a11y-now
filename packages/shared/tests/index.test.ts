import {
  clamp,
  formatShortcut,
  interpolate,
  matchShortcut,
  normalizeLocale,
  normalizeShortcut,
  resolveLabel,
  round2,
} from '@a11y-now/shared'
import { expect, it } from 'vitest'

it('clamp and round2 behave', () => {
  expect(clamp(5, 0, 3)).toBe(3)
  expect(clamp(-1, 0, 3)).toBe(0)
  expect(round2(1.2345)).toBe(1.23)
  expect(round2(1.1 + 0.1)).toBe(1.2)
})

const event = (init: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    altKey: false,
    ctrlKey: false,
    key: '',
    metaKey: false,
    shiftKey: false,
    ...init,
  }) as KeyboardEvent

it('shortcut helpers normalize, format and match', () => {
  const def = { alt: true, ctrl: true, key: 'T' }
  expect(normalizeShortcut(def)).toBe('ctrl+alt+t')
  expect(formatShortcut(def)).toBe('Ctrl+Alt+T')
  expect(
    matchShortcut(event({ altKey: true, ctrlKey: true, key: 't' }), def),
  ).toBe(true)
  expect(matchShortcut(event({ key: 't' }), def)).toBe(false)
})

it('interpolate fills placeholders and leaves unknowns', () => {
  expect(interpolate('{a} + {b} = {c}', { a: 1, b: 2 })).toBe('1 + 2 = {c}')
})

it('resolveLabel handles both forms', () => {
  expect(resolveLabel('x')).toBe('x')
  expect(resolveLabel(() => 'y')).toBe('y')
  expect(resolveLabel()).toBe('')
})

it('normalizeLocale maps en*/zh* tags and passes custom ones through', () => {
  expect(normalizeLocale('en')).toBe('en-US')
  expect(normalizeLocale('EN-gb')).toBe('en-US')
  expect(normalizeLocale('zh')).toBe('zh-CN')
  expect(normalizeLocale('zh-Hant-TW')).toBe('zh-CN')
  expect(normalizeLocale('fr-FR')).toBe('fr-FR')
  expect(normalizeLocale('')).toBeUndefined()
  expect(normalizeLocale('  ')).toBeUndefined()
  expect(normalizeLocale(null)).toBeUndefined()
  expect(normalizeLocale()).toBeUndefined()
})
