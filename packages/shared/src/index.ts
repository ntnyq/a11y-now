import type { ShortcutDef } from '@a11y-now/types'

/** Tagged template for CSS-in-TS. Exists for editor highlighting only. */
export const css = (
  strings: TemplateStringsArray,
  ...values: Array<number | string>
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
  event.key.toLowerCase() === def.key.toLowerCase()
  && event.ctrlKey === Boolean(def.ctrl)
  && event.altKey === Boolean(def.alt)
  && event.shiftKey === Boolean(def.shift)
  && event.metaKey === Boolean(def.meta)

/** Resolve a `string | (() => string)` label. */
export const resolveLabel = (
  label: string | (() => string) | undefined,
): string => (typeof label === 'function' ? label() : (label ?? ''))

/** Interpolate `{name}` placeholders. */
export const interpolate = (
  template: string,
  params?: Record<string, number | string>,
): string =>
  params
    ? template.replaceAll(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match)
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
  const text = (el.textContent ?? '').replaceAll(/\s+/g, ' ').trim()
  return text || (title ?? '').trim()
}
