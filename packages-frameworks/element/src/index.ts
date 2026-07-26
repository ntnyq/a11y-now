import { createA11yNow } from '@a11y-now/core'
import type {
  A11yNowInstance,
  A11yNowOptions,
  A11yPluginInput,
  A11yTheme,
} from '@a11y-now/types'

export interface A11yNowElementConfig {
  plugins?: A11yPluginInput[]
  themes?: A11yTheme[]
}

/**
 * `<a11y-now>` custom element. The element itself is invisible; connecting
 * it mounts the toolbar, disconnecting unmounts it.
 *
 * ```html
 * <a11y-now lang="zh-CN"></a11y-now>
 * <script type="module">
 *   import { defineA11yNowElement } from '@a11y-now/element'
 *   defineA11yNowElement({ plugins: [...], themes: [...] })
 * </script>
 * ```
 *
 * The aggregate `a11y-now` package pre-wires this with the full preset.
 */
export class A11yNowElement extends HTMLElement {
  static defaults: A11yNowElementConfig = {}

  instance: A11yNowInstance | null = null
  /** Per-element overrides, assignable before connection. */
  plugins: A11yPluginInput[] | null = null
  themes: A11yTheme[] | null = null

  connectedCallback(): void {
    if (this.instance) {
      return
    }
    const options: A11yNowOptions = {
      plugins: this.plugins ?? A11yNowElement.defaults.plugins ?? [],
      themes: this.themes ?? A11yNowElement.defaults.themes ?? [],
    }
    const locale = this.getAttribute('lang')
    if (locale) {
      options.locale = locale
    }
    if (this.hasAttribute('no-storage')) {
      options.storage = null
    }
    this.instance = createA11yNow(options)
    this.instance.mount()
  }

  disconnectedCallback(): void {
    this.instance?.destroy()
    this.instance = null
  }
}

/** Register `<a11y-now>` (idempotent). Returns the element class. */
export const defineA11yNowElement = (
  defaults: A11yNowElementConfig = {},
  tagName = 'a11y-now',
): typeof A11yNowElement => {
  A11yNowElement.defaults = defaults
  if (!customElements.get(tagName)) {
    customElements.define(tagName, A11yNowElement)
  }
  return A11yNowElement
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
