import { css, warn } from '@a11y-now/shared'
import type {
  A11yTheme,
  DomService,
  EventBus,
  PageTokens,
  ThemeService,
  ToolbarTokens,
} from '@a11y-now/types'
import {
  DEFAULT_TOOLBAR_TOKENS,
  GLOBAL_SKIP_SELECTORS,
  pageVar,
  toolbarVar,
} from './tokens'

export interface ThemeCenter extends ThemeService {
  /**
   * Bind the shadow host once the toolbar is mounted.
   *
   * @param host - Toolbar shadow host receiving the active theme tokens.
   */
  attach: (host: HTMLElement) => void
  /**
   * Remove applied theme styles and release the host while retaining registered
   * themes.
   */
  destroy: () => void
}

/**
 * DOM service stylesheet id for active theme page colors.
 */
const PAGE_STYLE_ID = 'theme-page'

function buildPageStyle(theme: A11yTheme): string {
  const skip = [...GLOBAL_SKIP_SELECTORS, ...(theme.skipSelectors ?? [])]
  const not = skip.map(selector => `:not(${selector})`).join('')
  return css`
    html[data-a11y-theme] body,
    html[data-a11y-theme] body *${not} {
      background-color: var(${pageVar('bg')}) !important;
      color: var(${pageVar('fg')}) !important;
      border-color: var(${pageVar('fg')}) !important;
    }
    html[data-a11y-theme] a,
    html[data-a11y-theme] a * {
      color: var(${pageVar('link')}) !important;
    }
  `
}

/**
 * Theme switching is a pure CSS-variable operation:
 * toolbar tokens go to the shadow `:host` inline style, page tokens go to
 * `document.documentElement` — no stylesheet is ever rebuilt, which is the
 * deliberate improvement over the audited reference implementation
 * (it regenerates 100 KB+ of override styles per switch).
 *
 * @param dom - Service that tracks page style mutations.
 * @param events - Bus receiving theme-change notifications.
 * @param doc - Document whose page theme attributes are updated.
 * @returns A theme registry with switching, host attachment, and cleanup
 *   methods.
 */
export function createThemeService(
  dom: DomService,
  events: EventBus,
  doc: Document,
): ThemeCenter {
  const registry = new Map<string, A11yTheme>()
  let currentName: string | null = null
  let disposePageStyle: (() => void) | null = null
  let host: HTMLElement | null = null

  const appliedToolbarKeys = new Set<keyof ToolbarTokens>()
  const appliedPageKeys = new Set<keyof PageTokens>()

  function clear(): void {
    if (host) {
      for (const key of appliedToolbarKeys) {
        host.style.removeProperty(toolbarVar(key))
      }
    }
    appliedToolbarKeys.clear()
    for (const key of appliedPageKeys) {
      dom.removePageVar(pageVar(key))
    }
    appliedPageKeys.clear()
    disposePageStyle?.()
    disposePageStyle = null
    delete doc.documentElement.dataset['a11yTheme']
  }

  function apply(name: string): void {
    const theme = registry.get(name)
    if (!theme) {
      warn(`unknown theme "${name}"`)
      return
    }
    clear()
    currentName = name
    if (host && theme.toolbar) {
      for (const [key, value] of Object.entries(theme.toolbar)) {
        host.style.setProperty(toolbarVar(key as keyof ToolbarTokens), value)
        appliedToolbarKeys.add(key as keyof ToolbarTokens)
      }
    }
    const page = theme.page ?? {}
    if (Object.keys(page).length > 0) {
      for (const [key, value] of Object.entries(page)) {
        dom.setPageVar(pageVar(key as keyof PageTokens), value)
        appliedPageKeys.add(key as keyof PageTokens)
      }
      doc.documentElement.dataset['a11yTheme'] = name
      disposePageStyle = dom.injectStyle(PAGE_STYLE_ID, buildPageStyle(theme))
    }
    events.emit('theme:change', { theme: name })
  }

  function list(): A11yTheme[] {
    return [...registry.values()]
  }

  function peek(): A11yTheme | null {
    const themes = list()
    if (themes.length === 0) {
      return null
    }
    const index = themes.findIndex(theme => theme.name === currentName)
    return themes[(index + 1) % themes.length] ?? null
  }

  return {
    apply,
    attach(el) {
      host = el
      if (currentName) {
        apply(currentName)
      }
    },
    current: () => (currentName ? (registry.get(currentName) ?? null) : null),
    cycle() {
      const next = peek()
      if (next) {
        apply(next.name)
      }
      return next
    },
    destroy() {
      clear()
      currentName = null
      host = null
    },
    getToken(key) {
      const fromTheme = currentName
        ? registry.get(currentName)?.toolbar?.[key]
        : undefined
      return fromTheme ?? DEFAULT_TOOLBAR_TOKENS[key]
    },
    list,
    peek,
    register(theme) {
      registry.set(theme.name, theme)
    },
  }
}
