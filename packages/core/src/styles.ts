import { css } from '@a11y-now/shared'
import type { ToolbarTokens } from '@a11y-now/types'
import { SCHEME_ATTR } from './scheme'
import {
  DARK_TOOLBAR_TOKENS,
  DEFAULT_TOOLBAR_TOKENS,
  toolbarVar,
} from './tokens'

const tokenLines = (tokens: Partial<ToolbarTokens>): string =>
  Object.entries(tokens)
    .map(([key, value]) => `${toolbarVar(key as never)}: ${value};`)
    .join('\n  ')

const tokenDefaults = tokenLines(DEFAULT_TOOLBAR_TOKENS)
const darkTokenDefaults = tokenLines(DARK_TOOLBAR_TOKENS)

/**
 * Toolbar base stylesheet. Hard rule: components reference semantic
 * `--a11y-*` tokens only — never literal colors or sizes — so themes can
 * restyle everything by swapping variable values.
 */
export const baseStyles = (): string => css`
  :host {
    ${tokenDefaults}
    all: initial;
    display: block;
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: var(--a11y-z-index);
    font-family: system-ui, sans-serif;
    font-size: var(--a11y-font-size);
  }

  :host([${SCHEME_ATTR}='dark']) {
    ${darkTokenDefaults}
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      --a11y-transition: 0ms;
    }
  }

  * {
    box-sizing: border-box;
  }

  .toolbar {
    display: flex;
    align-items: stretch;
    justify-content: var(--a11y-toolbar-justify);
    gap: 8px;
    padding: 8px 16px;
    min-block-size: var(--a11y-toolbar-height);
    background: var(--a11y-color-bg);
    color: var(--a11y-color-fg);
    border-block-end: 1px solid var(--a11y-color-border);
  }

  .group {
    display: flex;
    gap: 4px;
    align-items: stretch;
  }

  .group + .group {
    margin-inline-start: 12px;
    padding-inline-start: 12px;
    border-inline-start: 1px solid var(--a11y-color-border);
  }

  .btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-inline-size: var(--a11y-btn-size);
    min-block-size: var(--a11y-btn-size);
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--a11y-radius);
    background: transparent;
    color: var(--a11y-color-fg);
    font-size: var(--a11y-font-size);
    font-family: inherit;
    cursor: pointer;
    transition: background-color var(--a11y-transition);
  }

  .btn:hover {
    background: var(--a11y-color-btn-hover-bg);
  }

  .btn[aria-pressed='true'] {
    background: var(--a11y-color-btn-active-bg);
    color: var(--a11y-color-btn-active-fg);
    border-color: var(--a11y-color-accent);
  }

  .btn:disabled {
    color: var(--a11y-color-disabled-fg);
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: var(--a11y-outline-width) solid var(--a11y-color-focus-ring);
    outline-offset: 2px;
  }

  .btn .icon {
    display: block;
    inline-size: 20px;
    block-size: 20px;
  }

  .btn .icon svg {
    inline-size: 100%;
    block-size: 100%;
    fill: currentColor;
  }

  .btn .badge {
    font-size: 12px;
    color: var(--a11y-color-accent);
  }

  .btn[aria-pressed='true'] .badge,
  .btn:disabled .badge {
    color: inherit;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`
