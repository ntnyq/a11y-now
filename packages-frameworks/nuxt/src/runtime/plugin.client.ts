import {
  createA11yNow,
  readingPreset,
  screenReaderPreset,
  wasExited,
} from 'a11y-now'
import type { A11yNowInstance, A11yNowOptions } from 'a11y-now'
import { A11Y_NOW_NUXT_DEFAULTS } from '../options'
import type { A11yNowNuxtOptions } from '../options'

interface NuxtAppLike {
  $config?: { public?: { a11yNow?: A11yNowNuxtOptions } }
}

const presetOptions = (options: A11yNowNuxtOptions): A11yNowOptions => {
  const base: A11yNowOptions = {}
  if (options.locale) {
    base.locale = options.locale
  }
  if (options.storagePrefix) {
    base.storagePrefix = options.storagePrefix
  }
  const preset = options.preset ?? 'full'
  if (preset === 'reading') {
    const resolved = readingPreset()
    return { ...base, plugins: resolved.plugins, themes: resolved.themes }
  }
  if (preset === 'screen-reader') {
    const resolved = screenReaderPreset()
    return { ...base, plugins: resolved.plugins, themes: resolved.themes }
  }
  // The batteries-included entry defaults to the full preset.
  return base
}

/**
 * Client plugin registered by the module. Plain-function form needs no
 * `#app` import; Nuxt normalizes it and picks up the returned `provide`,
 * so `useNuxtApp().$a11yNow` is available even when auto-mount is off.
 */
const a11yNowPlugin = (
  nuxtApp: NuxtAppLike,
): { provide: { a11yNow: A11yNowInstance } } => {
  const options: A11yNowNuxtOptions = {
    ...A11Y_NOW_NUXT_DEFAULTS,
    ...nuxtApp.$config?.public?.a11yNow,
  }
  const instance = createA11yNow(presetOptions(options))
  const exited =
    (options.respectExit ?? true) && wasExited(options.storagePrefix)
  if (
    (options.autoMount ?? true) &&
    !exited &&
    typeof document !== 'undefined' &&
    !document.querySelector('a11y-now-host')
  ) {
    instance.mount()
  }
  return { provide: { a11yNow: instance } }
}

export default a11yNowPlugin
