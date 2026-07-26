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
  /** Initial locale, defaults to the document language. */
  locale?: LocaleCode
  /**
   * Full `createA11yNow` options; overrides `preset`/`locale`. Not
   * serializable — usable only when rendered from a client component.
   */
  options?: A11yNowOptions
  /** Built-in preset to mount, defaults to `full`. */
  preset?: A11yNowPresetName
  /** Honor a previous toolbar exit (`wasExited`), defaults to true. */
  respectExit?: boolean
  /** Storage key prefix, defaults to `a11y-now`. */
  storagePrefix?: string
}

const presetOptions = (
  preset: A11yNowPresetName,
  locale?: LocaleCode,
  storagePrefix?: string,
): A11yNowOptions => {
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
 */
export const A11yNow = ({
  locale,
  options,
  preset = 'full',
  respectExit = true,
  storagePrefix,
}: A11yNowProps): null => {
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
