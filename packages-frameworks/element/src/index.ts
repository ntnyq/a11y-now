import { createA11yNow } from '@a11y-now/core'
import type {
  A11yNowInstance,
  A11yNowOptions,
  A11yPluginInput,
  A11yTheme,
} from '@a11y-now/types'

export interface A11yNowElementConfig {
  /**
   * Default plugins used when an element has no per-element override.
   *
   * @default []
   */
  plugins?: A11yPluginInput[]
  /**
   * Default themes used when an element has no per-element override.
   *
   * @default []
   */
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
  public static defaults: A11yNowElementConfig = {}

  public instance: A11yNowInstance | null = null
  /**
   * Per-element overrides, assignable before connection.
   */
  public plugins: A11yPluginInput[] | null = null
  public themes: A11yTheme[] | null = null

  /**
   * Create and mount the toolbar when the element connects, unless already
   * created.
   */
  public connectedCallback(): void {
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

  /**
   * Destroy the toolbar and clear the instance when the element disconnects.
   */
  public disconnectedCallback(): void {
    this.instance?.destroy()
    this.instance = null
  }
}

/**
 * Register `<a11y-now>` (idempotent). Returns the element class.
 *
 * @param defaults - Default plugins and themes used by connected elements.
 * @param tagName - Custom element name, defaulting to `a11y-now`.
 * @returns The A11yNowElement class, even when the tag was already registered.
 * @throws {DOMException} If the registry rejects the name or constructor.
 */
export function defineA11yNowElement(
  defaults: A11yNowElementConfig = {},
  tagName = 'a11y-now',
): typeof A11yNowElement {
  A11yNowElement.defaults = defaults
  if (!customElements.get(tagName)) {
    customElements.define(tagName, A11yNowElement)
  }
  return A11yNowElement
}

export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
