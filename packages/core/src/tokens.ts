import type { PageTokens, ToolbarTokens } from '@a11y-now/types'

/** Toolbar UI token defaults — the toolbar half of `theme-default`. */
export const DEFAULT_TOOLBAR_TOKENS: ToolbarTokens = {
  'btn-size': '56px',
  'color-accent': '#0b5cad',
  'color-bg': '#ffffff',
  'color-border': '#d0d3d6',
  'color-btn-active-bg': '#e8f3ff',
  'color-btn-active-fg': '#0b5cad',
  'color-btn-hover-bg': '#f2f3f5',
  'color-disabled-fg': '#a8abb0',
  'color-fg': '#1f2329',
  'color-focus-ring': '#fcff00',
  'font-size': '14px',
  'font-size-caption': '42px',
  radius: '6px',
  'outline-width': '3px',
  'toolbar-height': '84px',
  transition: '120ms ease-out',
  'z-index': '2147483000',
}

/** Page token defaults, aligned with the audited reference toolbar. */
export const DEFAULT_PAGE_TOKENS: PageTokens = {
  bg: '',
  'cursor-color': '#ffd700',
  fg: '',
  'focus-outline': '3px solid #fcff00',
  link: '',
  'region-outline': '2px solid #ff6c00',
}

export const TOOLBAR_TOKEN_PREFIX = '--a11y-'
export const PAGE_TOKEN_PREFIX = '--a11y-page-'

export const toolbarVar = (key: keyof ToolbarTokens): string =>
  `${TOOLBAR_TOKEN_PREFIX}${key}`

export const pageVar = (key: keyof PageTokens): string =>
  `${PAGE_TOKEN_PREFIX}${key}`

/** Selectors always excluded from page re-coloring. */
export const GLOBAL_SKIP_SELECTORS = [
  '[data-a11y-skip]',
  'audio',
  'canvas',
  'iframe',
  'img',
  'picture',
  'svg',
  'video',
]
