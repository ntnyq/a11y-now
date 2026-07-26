import { autoTheme } from '@a11y-now/plugin-auto-theme'
import { elderMode } from '@a11y-now/plugin-elder-mode'
import { pauseMotion } from '@a11y-now/plugin-pause-motion'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'
import { readingMask } from '@a11y-now/plugin-reading-mask'
import { textSpacing } from '@a11y-now/plugin-spacing'
import { zhConvert } from '@a11y-now/plugin-zh-convert'
import { createA11yNow, fullPreset, wasExited } from 'a11y-now'

if (!wasExited()) {
  const preset = fullPreset()
  createA11yNow({
    plugins: [
      ...preset.plugins,
      // Optional add-on packages, exercised here for manual QA.
      pinyinAnnotation(),
      zhConvert(),
      elderMode(),
      autoTheme(),
      readingMask(),
      pauseMotion(),
      textSpacing(),
    ],
    themes: preset.themes,
  }).mount()
}
