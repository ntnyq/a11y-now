import type { LocaleCode, ShortcutDef } from '@a11y-now/types'

/** Tagged template for CSS-in-TS. Exists for editor highlighting only. */
export const css = (
  strings: TemplateStringsArray,
  ...values: (number | string)[]
): string =>
  strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ''),
    '',
  )

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** Round to 2 decimals to avoid float drift in zoom steps. */
export const round2 = (value: number): number => Math.round(value * 100) / 100

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

export const warn = (message: string): void => {
  // eslint-disable-next-line no-console
  console.warn(`[a11y-now] ${message}`)
}

/**
 * Map a raw BCP 47 tag (`html[lang]`, the `locale` option) onto the built-in
 * message-table locales: any `en*` tag → `en-US`, any `zh*` tag → `zh-CN`.
 * Other tags pass through untouched so custom locales keep working; empty
 * input returns `undefined` so callers can apply their own fallback.
 */
export const normalizeLocale = (
  raw?: string | null,
): LocaleCode | undefined => {
  const tag = raw?.trim().toLowerCase()
  if (!tag) {
    return undefined
  }
  if (tag === 'en' || tag.startsWith('en-')) {
    return 'en-US'
  }
  if (tag === 'zh' || tag.startsWith('zh-')) {
    return 'zh-CN'
  }
  return raw as LocaleCode
}

/**
 * Normalize a shortcut to a stable id, e.g. `ctrl+alt+t`.
 * Used for both registration keys and conflict detection.
 */
export const normalizeShortcut = (def: ShortcutDef): string =>
  [
    def.ctrl ? 'ctrl' : '',
    def.alt ? 'alt' : '',
    def.shift ? 'shift' : '',
    def.meta ? 'meta' : '',
    def.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join('+')

/** Format a shortcut for humans, e.g. `Ctrl+Alt+T`. */
export const formatShortcut = (def: ShortcutDef): string =>
  [
    def.ctrl ? 'Ctrl' : '',
    def.alt ? 'Alt' : '',
    def.shift ? 'Shift' : '',
    def.meta ? 'Meta' : '',
    def.key.length === 1 ? def.key.toUpperCase() : def.key,
  ]
    .filter(Boolean)
    .join('+')

/** Does a keyboard event match a shortcut definition? */
export const matchShortcut = (
  event: KeyboardEvent,
  def: ShortcutDef,
): boolean =>
  event.key.toLowerCase() === def.key.toLowerCase() &&
  event.ctrlKey === Boolean(def.ctrl) &&
  event.altKey === Boolean(def.alt) &&
  event.shiftKey === Boolean(def.shift) &&
  event.metaKey === Boolean(def.meta)

/** Resolve a `string | (() => string)` label. */
export const resolveLabel = (label?: string | (() => string)): string =>
  typeof label === 'function' ? label() : (label ?? '')

/** Interpolate `{name}` placeholders. */
export const interpolate = (
  template: string,
  params?: Record<string, number | string>,
): string =>
  params
    ? template.replaceAll(/\{(?<name>\w+)\}/gu, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    : template

/** Readable text of an element for speech, trimmed and collapsed. */
export const speakableText = (el: Element): string => {
  const aria = el.getAttribute('aria-label')
  if (aria) {
    return aria.trim()
  }
  const alt = el.getAttribute('alt')
  if (alt) {
    return alt.trim()
  }
  const title = el.getAttribute('title')
  // Ruby annotations (e.g. pinyin) would otherwise be read twice.
  let source = el
  if (el.querySelector('rt, rp')) {
    const clone = el.cloneNode(true) as Element
    for (const annotation of clone.querySelectorAll('rt, rp')) {
      annotation.remove()
    }
    source = clone
  }
  const text = (source.textContent ?? '').replaceAll(/\s+/gu, ' ').trim()
  return text || (title ?? '').trim()
}
