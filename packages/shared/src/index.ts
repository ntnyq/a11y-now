import type { LocaleCode, ShortcutDef } from '@a11y-now/types'

/**
 * Tagged template for CSS-in-TS. Exists for editor highlighting only.
 *
 * @param strings - Literal segments supplied by the tagged template.
 * @param values - Interpolated numbers and strings, inserted without escaping.
 * @returns The concatenated CSS text.
 */
export function css(
  strings: TemplateStringsArray,
  ...values: (number | string)[]
): string {
  return strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ''),
    '',
  )
}

/**
 * Clamp a number to an inclusive range.
 *
 * @param value - Number to constrain.
 * @param min - Inclusive lower bound.
 * @param max - Inclusive upper bound; must be at least `min`.
 * @returns The number constrained to the supplied bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round to 2 decimals to avoid float drift in zoom steps.
 *
 * @param value - Number to round.
 * @returns The number rounded to two decimal places.
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Check whether both browser window and document globals exist.
 *
 * @returns `true` when both globals are available.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Log a warning with the a11y-now package prefix.
 *
 * @param message - Warning text to write to the console.
 */
export function warn(message: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[a11y-now] ${message}`)
}

/**
 * Map a raw BCP 47 tag (`html[lang]`, the `locale` option) onto the built-in
 * message-table locales: any `en*` tag → `en-US`, any `zh*` tag → `zh-CN`.
 * Other tags pass through untouched so custom locales keep working; empty
 * input returns `undefined` so callers can apply their own fallback.
 *
 * @param raw - Optional locale tag; blank input allows the caller to choose a
 *   fallback.
 * @returns A built-in locale, the original custom tag, or `undefined` for blank
 *   input.
 */
export function normalizeLocale(raw?: string | null): LocaleCode | undefined {
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
 *
 * @param def - Key and modifier combination to normalize.
 * @returns A lowercase combination with modifiers in a stable order.
 */
export function normalizeShortcut(def: ShortcutDef): string {
  return [
    def.ctrl ? 'ctrl' : '',
    def.alt ? 'alt' : '',
    def.shift ? 'shift' : '',
    def.meta ? 'meta' : '',
    def.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join('+')
}

/**
 * Format a shortcut for humans, e.g. `Ctrl+Alt+T`.
 *
 * @param def - Key and modifier combination to display.
 * @returns A human-readable shortcut such as `Ctrl+Alt+T`.
 */
export function formatShortcut(def: ShortcutDef): string {
  return [
    def.ctrl ? 'Ctrl' : '',
    def.alt ? 'Alt' : '',
    def.shift ? 'Shift' : '',
    def.meta ? 'Meta' : '',
    def.key.length === 1 ? def.key.toUpperCase() : def.key,
  ]
    .filter(Boolean)
    .join('+')
}

/**
 * Does a keyboard event match a shortcut definition?
 *
 * @param event - Keyboard event to inspect.
 * @param def - Required key and exact modifier state.
 * @returns `true` when the key and every modifier match.
 */
export function matchShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  return (
    event.key.toLowerCase() === def.key.toLowerCase() &&
    event.ctrlKey === Boolean(def.ctrl) &&
    event.altKey === Boolean(def.alt) &&
    event.shiftKey === Boolean(def.shift) &&
    event.metaKey === Boolean(def.meta)
  )
}

/**
 * Resolve a `string | (() => string)` label.
 *
 * @param label - Literal label or callback evaluated on demand.
 * @returns The resolved label, or an empty string when omitted.
 */
export function resolveLabel(label?: string | (() => string)): string {
  return typeof label === 'function' ? label() : (label ?? '')
}

/**
 * Interpolate `{name}` placeholders.
 *
 * @param template - Message containing `{name}` placeholders.
 * @param params - Optional replacement values keyed by placeholder name.
 * @returns The interpolated message; unknown placeholders remain unchanged.
 */
export function interpolate(
  template: string,
  params?: Record<string, number | string>,
): string {
  return params
    ? template.replaceAll(/\{(?<name>\w+)\}/gu, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    : template
}

/**
 * Readable text of an element for speech, trimmed and collapsed.
 *
 * @param el - Element whose accessible text should be read.
 * @returns Trimmed aria-label or alt text, then text without ruby annotations,
 *   then title.
 */
export function speakableText(el: Element): string {
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
