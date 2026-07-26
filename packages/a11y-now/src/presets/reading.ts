/* eslint-disable import/max-dependencies -- presets aggregate by design */
import { bigCursor } from '@a11y-now/plugin-big-cursor'
import { caption } from '@a11y-now/plugin-caption'
import { crosshair } from '@a11y-now/plugin-crosshair'
import { exit } from '@a11y-now/plugin-exit'
import { help } from '@a11y-now/plugin-help'
import { reset } from '@a11y-now/plugin-reset'
import { speech } from '@a11y-now/plugin-speech'
import { themeSwitcher } from '@a11y-now/plugin-theme'
import { zoom } from '@a11y-now/plugin-zoom'
import { chocolate } from '@a11y-now/theme-chocolate'
import { deepBlue } from '@a11y-now/theme-deep-blue'
import { defaultTheme } from '@a11y-now/theme-default'
import { highContrast } from '@a11y-now/theme-high-contrast'
import type { Preset } from './full'

/** Low-vision reading preset: visual aids without region navigation. */
export const readingPreset = (): Preset => ({
  plugins: [
    speech(),
    themeSwitcher(),
    zoom(),
    bigCursor(),
    crosshair(),
    caption(),
    reset(),
    help(),
    exit(),
  ],
  themes: [defaultTheme, deepBlue, chocolate, highContrast],
})
