import type {
  ColorSchemePreference,
  ColorSchemeService,
  EventBus,
  ResolvedColorScheme,
} from '@a11y-now/types'

/**
 * Attribute stamped on the shadow host with the resolved scheme.
 */
export const SCHEME_ATTR = 'data-a11y-scheme'

/**
 * Attributes whose `dark` / `light` tokens mark a site's theme choice.
 */
const MARKER_ATTRIBUTES = [
  'class',
  'data-theme',
  'data-color-mode',
  'data-color-scheme',
]

/**
 * Host attributes observed for theme switches (markers plus inline style).
 */
const THEME_ATTRIBUTES = [...MARKER_ATTRIBUTES, 'style']

export interface SchemeController extends ColorSchemeService {
  /**
   * Bind (or unbind with `null`) the shadow host once (un)mounted.
   *
   * @param host - Toolbar shadow host, or `null` to detach it.
   */
  attach: (host: HTMLElement | null) => void
  /**
   * Stop page and media observers and release the toolbar host.
   */
  destroy: () => void
}

/**
 * Read an unambiguous `dark` / `light` out of a token list like `"mac dark"`.
 */
function schemeFromTokens(
  value: string | null | undefined,
): ResolvedColorScheme | null {
  if (!value) {
    return null
  }
  const tokens = value.toLowerCase().split(/[\s,]+/u)
  const dark = tokens.includes('dark')
  const light = tokens.includes('light')
  if (dark === light) {
    return null
  }
  return dark ? 'dark' : 'light'
}

function srgbChannel(value: number): number {
  const channel = value / 255
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

/**
 * WCAG relative luminance of an `rgb()`/`rgba()` string; null if opaque-less.
 */
function luminanceOf(value: string | null | undefined): number | null {
  const parts = /rgba?\((?<channels>[^)]*)\)/u
    .exec(value ?? '')
    ?.groups?.['channels']?.split(/[\s,/]+/u)
    .filter(part => part !== '')
    .map(Number)
  if (!parts || parts.length < 3 || parts.some(part => Number.isNaN(part))) {
    return null
  }
  if ((parts[3] ?? 1) < 0.5) {
    // Effectively see-through — no verdict from this layer.
    return null
  }
  return (
    0.2126 * srgbChannel(parts[0] ?? 0) +
    0.7152 * srgbChannel(parts[1] ?? 0) +
    0.0722 * srgbChannel(parts[2] ?? 0)
  )
}

/**
 * Judge the page by its effective background luminance.
 */
function schemeFromBackground(
  win: Window,
  doc: Document,
): ResolvedColorScheme | null {
  for (const el of [doc.body, doc.documentElement]) {
    const luminance = el
      ? luminanceOf(win.getComputedStyle(el).backgroundColor)
      : null
    if (luminance !== null) {
      return luminance < 0.4 ? 'dark' : 'light'
    }
  }
  return null
}

/**
 * What the host page itself says (declared intent first, looks second):
 * an explicitly resolved `color-scheme`, then `dark`/`light` markers in
 * `class` / `data-theme` / `data-color-mode` / `data-color-scheme`, then
 * the effective page background luminance.
 */
function detectHostScheme(
  win: Window,
  doc: Document,
): ResolvedColorScheme | null {
  const roots = [doc.documentElement, doc.body]
  for (const el of roots) {
    const declared = el
      ? schemeFromTokens(win.getComputedStyle(el).colorScheme)
      : null
    if (declared) {
      return declared
    }
  }
  for (const el of roots) {
    for (const attr of MARKER_ATTRIBUTES) {
      const marked = el ? schemeFromTokens(el.getAttribute(attr)) : null
      if (marked) {
        return marked
      }
    }
  }
  return schemeFromBackground(win, doc)
}

/**
 * Resolves the toolbar chrome color scheme and keeps it live: `auto`
 * follows the host page (see `detectHostScheme`) with a
 * `prefers-color-scheme` fallback, re-evaluating on `<html>`/`<body>`
 * attribute mutations and media-query flips. The resolved value is
 * stamped on the shadow host as `data-a11y-scheme` so the base stylesheet
 * can swap token defaults; theme inline tokens still win over both.
 *
 * @param doc - Host document, or `null` when no DOM is available.
 * @param events - Bus receiving resolved scheme changes.
 * @param initial - Initial preference, defaulting to `auto`.
 * @param observeImmediately - Start observing now, or defer until a host is attached.
 * @returns A live scheme controller; call `destroy()` to stop its observers.
 */
export function createSchemeController(
  doc: Document | null,
  events: EventBus,
  initial: ColorSchemePreference = 'auto',
  observeImmediately = true,
): SchemeController {
  const win = doc?.defaultView ?? null
  let preference = initial
  let host: HTMLElement | null = null

  const media =
    win && typeof win.matchMedia === 'function'
      ? win.matchMedia('(prefers-color-scheme: dark)')
      : null

  function resolve(): ResolvedColorScheme {
    if (preference !== 'auto') {
      return preference
    }
    const detected = win && doc ? detectHostScheme(win, doc) : null
    if (detected) {
      return detected
    }
    return media?.matches ? 'dark' : 'light'
  }

  let current = resolve()

  function apply(): void {
    host?.setAttribute(SCHEME_ATTR, current)
  }

  function refresh(): void {
    const next = resolve()
    if (next === current) {
      return
    }
    current = next
    apply()
    events.emit('scheme:change', { scheme: next })
  }

  let observing = false

  let observer: MutationObserver | null = null
  const observed = new Set<Element>()
  function observe(el: Element | null): void {
    if (!el || observed.has(el) || typeof MutationObserver !== 'function') {
      return
    }
    observer ??= new MutationObserver(refresh)
    observer.observe(el, {
      attributeFilter: THEME_ATTRIBUTES,
      attributes: true,
    })
    observed.add(el)
  }
  function start(): void {
    if (!observing) {
      observing = true
      media?.addEventListener('change', refresh)
    }
    if (doc) {
      observe(doc.documentElement)
      observe(doc.body)
    }
  }

  function stop(): void {
    if (observing) {
      media?.removeEventListener('change', refresh)
    }
    observing = false
    observer?.disconnect()
    observer = null
    observed.clear()
  }

  if (observeImmediately) {
    start()
  }

  return {
    attach(el) {
      host = el
      if (!el) {
        stop()
        return
      }
      start()
      refresh()
      apply()
    },
    destroy() {
      stop()
      host = null
    },
    preference: () => preference,
    resolved: () => current,
    set(scheme) {
      preference = scheme
      refresh()
    },
  }
}
