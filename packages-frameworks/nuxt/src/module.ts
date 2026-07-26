import { fileURLToPath } from 'node:url'
import { A11Y_NOW_NUXT_DEFAULTS } from './options'
import type { A11yNowNuxtOptions } from './options'

interface NuxtPluginEntry {
  mode?: 'all' | 'client' | 'server'
  src: string
}

/**
 * Minimal structural view of the Nuxt instance. Typing it here keeps
 * `@nuxt/kit` (and nuxt itself) out of the dependency tree — plain-function
 * modules are first-class citizens of `installModule`.
 */
export interface NuxtLike {
  options: {
    [key: string]: unknown
    plugins?: (NuxtPluginEntry | string)[]
    runtimeConfig: { public: Record<string, unknown> }
  }
}

/**
 * Nuxt module.
 *
 * ```ts
 * // nuxt.config.ts
 * export default defineNuxtConfig({
 *   modules: ['@a11y-now/nuxt'],
 *   a11yNow: { preset: 'full' },
 * })
 * ```
 *
 * Merges `a11yNow` config-key options with inline module options, exposes
 * the result via `runtimeConfig.public.a11yNow` and registers the client
 * plugin that mounts the toolbar (and provides `$a11yNow`).
 */
/** Absolute path of the built runtime plugin next to this module file. */
const runtimePluginPath = (): string => {
  // Kept out of the literal `new URL('...', import.meta.url)` shape so
  // bundlers don't rewrite it into an asset reference.
  const base = import.meta.url
  const url = new URL('runtime/plugin.client.js', base)
  const path = url.protocol === 'file:' ? fileURLToPath(url) : url.pathname
  // Nuxt expects posix-style paths; fileURLToPath yields backslashes on Windows.
  return path.replaceAll('\\', '/')
}

const a11yNowModule = Object.assign(
  (inlineOptions: A11yNowNuxtOptions | undefined, nuxt: NuxtLike): void => {
    const configOptions = (nuxt.options['a11yNow'] ?? {}) as A11yNowNuxtOptions
    nuxt.options.runtimeConfig.public['a11yNow'] = {
      ...A11Y_NOW_NUXT_DEFAULTS,
      ...configOptions,
      ...inlineOptions,
    }
    nuxt.options.plugins ??= []
    nuxt.options.plugins.push({
      mode: 'client',
      src: runtimePluginPath(),
    })
  },
  { meta: { configKey: 'a11yNow', name: '@a11y-now/nuxt' } },
)

export default a11yNowModule
export { A11Y_NOW_NUXT_DEFAULTS } from './options'
export type { A11yNowNuxtOptions, A11yNowPresetName } from './options'
