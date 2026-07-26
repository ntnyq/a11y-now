import type {
  ColorSchemePreference,
  ColorSchemeService,
  EventBus,
  ResolvedColorScheme,
} from '@a11y-now/types'

/** Attribute stamped on the shadow host with the resolved scheme. */
export const SCHEME_ATTR = 'data-a11y-scheme'

/** Attributes whose `dark` / `light` tokens mark a site's theme choice. */
const MARKER_ATTRIBUTES = [
  'class',
  'data-theme',
  'data-color-mode',
  'data-color-scheme',
]

/** Host attributes observed for theme switches (markers plus inline style). */
const THEME_ATTRIBUTES = [...MARKER_ATTRIBUTES, 'style']

export interface SchemeController extends ColorSchemeService {
  /** Bind (or unbind with `null`) the shadow host once (un)mounted. */
  attach: (host: HTMLElement | null) => void
  destroy: () => void
}

/** Read an unambiguous `dark` / `light` out of a token list like `"mac dark"`. */
const schemeFromTokens = (
  value: string | null | undefined,
): ResolvedColorScheme | null => {
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

const srgbChannel = (value: number): number => {
  const channel = value / 255
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of an `rgb()`/`rgba()` string; null if opaque-less. */
const luminanceOf = (value: string | null | undefined): number | null => {
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

/** Judge the page by its effective background luminance. */
const schemeFromBackground = (
  win: Window,
  doc: Document,
): ResolvedColorScheme | null => {
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
const detectHostScheme = (
  win: Window,
  doc: Document,
): ResolvedColorScheme | null => {
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
 */
export const createSchemeController = (
  doc: Document | null,
  events: EventBus,
  initial: ColorSchemePreference = 'auto',
): SchemeController => {
  const win = doc?.defaultView ?? null
  let preference = initial
  let host: HTMLElement | null = null

  const media =
    win && typeof win.matchMedia === 'function'
      ? win.matchMedia('(prefers-color-scheme: dark)')
      : null

  const resolve = (): ResolvedColorScheme => {
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

  const apply = (): void => {
    host?.setAttribute(SCHEME_ATTR, current)
  }

  const refresh = (): void => {
    const next = resolve()
    if (next === current) {
      return
    }
    current = next
    apply()
    events.emit('scheme:change', { scheme: next })
  }

  media?.addEventListener('change', refresh)

  let observer: MutationObserver | null = null
  const observed = new Set<Element>()
  const observe = (el: Element | null): void => {
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
  if (doc) {
    observe(doc.documentElement)
    observe(doc.body)
  }

  return {
    attach: el => {
      host = el
      if (!el) {
        return
      }
      // `<body>` may not have existed at construction time.
      if (doc) {
        observe(doc.body)
      }
      refresh()
      apply()
    },
    destroy: () => {
      media?.removeEventListener('change', refresh)
      observer?.disconnect()
      observer = null
      observed.clear()
      host = null
    },
    preference: () => preference,
    resolved: () => current,
    set: scheme => {
      preference = scheme
      refresh()
    },
  }
}
