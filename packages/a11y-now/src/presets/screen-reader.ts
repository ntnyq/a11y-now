import { exit } from '@a11y-now/plugin-exit'
import { help } from '@a11y-now/plugin-help'
import { regionNav } from '@a11y-now/plugin-region-nav'
import { screenReader } from '@a11y-now/plugin-screen-reader'
import { defaultTheme } from '@a11y-now/theme-default'
import type { Preset } from './full'

/**
 * Screen-reader preset: region navigation and semantics only.
 *
 * @returns Fresh plugin configurations and themes for screen-reader navigation.
 */
export function screenReaderPreset(): Preset {
  return {
    plugins: [regionNav(), screenReader(), help(), exit()],
    themes: [defaultTheme],
  }
}
