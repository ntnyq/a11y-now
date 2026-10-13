'use client'
import type { A11yNowOptions, LocaleCode } from '@a11y-now/types'
import {
  createA11yNow,
  readingPreset,
  screenReaderPreset,
  wasExited,
} from 'a11y-now'
import { useEffect } from 'react'

export type A11yNowPresetName = 'full' | 'reading' | 'screen-reader'

export interface A11yNowProps {
  /**
   * Initial locale, defaults to the document language.
   *
   * @default The normalized document language, falling back to 'zh-CN'.
   */
  locale?: LocaleCode
  /**
   * Full `createA11yNow` options; overrides `preset`/`locale`. Not
   * serializable — usable only when rendered from a client component.
   */
  options?: A11yNowOptions
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

function presetOptions(
  preset: A11yNowPresetName,
  locale?: LocaleCode,
  storagePrefix?: string,
): A11yNowOptions {
  const base: A11yNowOptions = {}
  if (locale) {
    base.locale = locale
  }
  if (storagePrefix) {
    base.storagePrefix = storagePrefix
  }
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
 * Drop-in toolbar for Next.js (App Router friendly). Everything except
 * `options` is serializable, so a server layout can render it directly:
 *
 * ```tsx
 * // app/layout.tsx
 * import { A11yNow } from '@a11y-now/next'
 *
 * <body>
 *   {children}
 *   <A11yNow />
 * </body>
 * ```
 *
 * Need programmatic access (`useA11yNow`)? Wrap your tree with the
 * re-exported `A11yNowProvider` from a client component instead.
 *
 * @param props - Next.js toolbar configuration.
 * @param props.locale - Initial locale when full options are omitted.
 * @param props.options - Full toolbar options, taking precedence over
 *   preset-derived options.
 * @param props.preset - Built-in preset, defaulting to `full`.
 * @param props.respectExit - Whether a stored exit prevents mounting; defaults
 *   to `true`.
 * @param props.storagePrefix - Storage namespace for exit checks and
 *   preset-derived options.
 * @returns `null`; the toolbar is mounted through a client effect.
 */
export function A11yNow({
  locale,
  options,
  preset = 'full',
  respectExit = true,
  storagePrefix,
}: A11yNowProps): null {
  useEffect(() => {
    if (respectExit && wasExited(storagePrefix)) {
      return
    }
    const instance = createA11yNow(
      options ?? presetOptions(preset, locale, storagePrefix),
    )
    instance.mount()
    return () => {
      instance.destroy()
    }
  }, [locale, options, preset, respectExit, storagePrefix])
  return null
}

export { A11yNowProvider, useA11yNow, useA11yNowEvent } from '@a11y-now/react'
export type { A11yNowProviderProps } from '@a11y-now/react'
export type { A11yNowInstance, A11yNowOptions } from '@a11y-now/types'
