import { autoTheme } from '@a11y-now/plugin-auto-theme'
import { elderMode } from '@a11y-now/plugin-elder-mode'
import { pinyinAnnotation } from '@a11y-now/plugin-pinyin'
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
    ],
    themes: preset.themes,
  }).mount()
}
