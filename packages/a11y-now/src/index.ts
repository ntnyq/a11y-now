/**
 * a11y-now — batteries-included entry.
 *
 * One line to get the full toolbar:
 *
 * ```ts
 * import { createA11yNow } from 'a11y-now'
 * createA11yNow().mount()
 * ```
 *
 * For à-la-carte composition, depend on `@a11y-now/core` and pick plugin
 * and theme packages individually.
 */
import { createA11yNow as createKernel } from '@a11y-now/core'
import type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
import { fullPreset } from './presets/full'

export * from '@a11y-now/core'
export { bigCursor } from '@a11y-now/plugin-big-cursor'
export { caption } from '@a11y-now/plugin-caption'
export { crosshair } from '@a11y-now/plugin-crosshair'
export { exit } from '@a11y-now/plugin-exit'
export { help } from '@a11y-now/plugin-help'
export { pin } from '@a11y-now/plugin-pin'
export { regionNav, REGION_TYPES } from '@a11y-now/plugin-region-nav'
export { reset } from '@a11y-now/plugin-reset'
export { screenReader } from '@a11y-now/plugin-screen-reader'
export { speech } from '@a11y-now/plugin-speech'
export { themeSwitcher } from '@a11y-now/plugin-theme'
export { zoom } from '@a11y-now/plugin-zoom'
export { chocolate } from '@a11y-now/theme-chocolate'
export { deepBlue } from '@a11y-now/theme-deep-blue'
export { defaultTheme } from '@a11y-now/theme-default'
export { forest } from '@a11y-now/theme-forest'
export { highContrast } from '@a11y-now/theme-high-contrast'
export { fullPreset } from './presets/full'
export { readingPreset } from './presets/reading'
export { screenReaderPreset } from './presets/screen-reader'

/**
 * Create a toolbar instance. Defaults to the full preset when neither
 * plugins nor themes are supplied.
 *
 * @param options - Toolbar configuration with the full preset as the fallback.
 * @returns An instance for registering plugins, mounting, and controlling the
 *   toolbar.
 */
export function createA11yNow(options: A11yNowOptions = {}): A11yNowInstance {
  if (options.plugins || options.themes) {
    return createKernel(options)
  }
  const preset = fullPreset()
  return createKernel({
    ...options,
    plugins: preset.plugins,
    themes: preset.themes,
  })
}

/**
 * Did the user exit the toolbar in a previous visit? Integrators can honor
 * this before auto-mounting.
 *
 * @param storagePrefix - Storage namespace, defaulting to `a11y-now`.
 * @returns `true` when stored exit state is disabled; `false` for missing or
 *   unreadable state.
 */
export function wasExited(storagePrefix = 'a11y-now'): boolean {
  try {
    const raw = localStorage.getItem(`${storagePrefix}:plugin:exit`)
    if (!raw) {
      return false
    }
    return Boolean((JSON.parse(raw) as { disabled?: boolean }).disabled)
  } catch {
    return false
  }
}
