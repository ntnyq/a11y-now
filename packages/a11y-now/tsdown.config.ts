import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    clean: true,
    dts: { tsgo: false },
    entry: [
      'src/index.ts',
      'src/presets/full.ts',
      'src/presets/reading.ts',
      'src/presets/screen-reader.ts',
    ],
    platform: 'neutral',
  },
  {
    clean: false,
    dts: false,
    entry: { 'a11y-now.iife': 'src/iife.ts' },
    format: 'iife',
    globalName: 'A11yNow',
    minify: true,
    noExternal: [/./u],
    platform: 'browser',
  },
])
