import type { LocaleCode } from '@a11y-now/types'

export type A11yNowPresetName = 'full' | 'reading' | 'screen-reader'

/**
 * Module options. All values are serializable — they travel through
 * `runtimeConfig.public` to the client plugin. For non-serializable
 * customization (own plugin lists, custom engines), skip the module and
 * write a Nuxt client plugin against `@a11y-now/vue` or `a11y-now`.
 */
export interface A11yNowNuxtOptions {
  /**
   * Mount automatically on the client, defaults to true.
   *
   * @default true
   */
  autoMount?: boolean
  /**
   * Initial locale, defaults to the document language.
   *
   * @default The normalized document language, falling back to 'zh-CN'.
   */
  locale?: LocaleCode
  /**
   * Built-in preset to mount, defaults to `full`.
   *
   * @default 'full'
   */
  preset?: A11yNowPresetName
  /**
   * Honor a previous toolbar exit (`wasExited`), defaults to true.
   *
   * @default true
   */
  respectExit?: boolean
  /**
   * Storage key prefix, defaults to `a11y-now`.
   *
   * @default 'a11y-now'
   */
  storagePrefix?: string
}

/**
 * Serializable defaults merged into Nuxt toolbar runtime configuration.
 */
export const A11Y_NOW_NUXT_DEFAULTS = {
  /**
   * Mount the toolbar automatically in the client plugin.
   */
  autoMount: true,
  /**
   * Include the full set of built-in plugins and themes.
   */
  preset: 'full',
  /**
   * Keep the toolbar hidden after a persisted user exit.
   */
  respectExit: true,
} as const satisfies A11yNowNuxtOptions
