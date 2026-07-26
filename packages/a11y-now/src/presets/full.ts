import { bigCursor } from '@a11y-now/plugin-big-cursor'
import { caption } from '@a11y-now/plugin-caption'
import { crosshair } from '@a11y-now/plugin-crosshair'
import { exit } from '@a11y-now/plugin-exit'
import { help } from '@a11y-now/plugin-help'
import { pin } from '@a11y-now/plugin-pin'
import { regionNav } from '@a11y-now/plugin-region-nav'
import { reset } from '@a11y-now/plugin-reset'
import { screenReader } from '@a11y-now/plugin-screen-reader'
import { speech } from '@a11y-now/plugin-speech'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { zoom } from '@a11y-now/plugin-zoom'
import { chocolate } from '@a11y-now/theme-chocolate'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'
import { forest } from '@a11y-now/theme-forest'
import { highContrast } from '@a11y-now/theme-high-contrast'
import type { A11yPluginInput, A11yTheme } from '@a11y-now/types'

export interface Preset {
  plugins: A11yPluginInput[]
  themes: A11yTheme[]
}

/** Every official plugin and theme — the default for the aggregate entry. */
export const fullPreset = (): Preset => ({
  plugins: [
    regionNav(),
    screenReader(),
    speech(),
    themeSwitcher(),
    zoom(),
    bigCursor(),
    crosshair(),
    caption(),
    reset(),
    pin(),
    help(),
    exit(),
  ],
  themes: [defaultTheme, deepBlue, chocolate, highContrast, forest],
})
