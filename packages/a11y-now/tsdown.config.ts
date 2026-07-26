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
    // The iife format appends `.iife.js`, yielding dist/a11y-now.iife.js.
    entry: { 'a11y-now': 'src/iife.ts' },
    format: 'iife',
    globalName: 'A11yNow',
    minify: true,
    noExternal: [/./u],
    platform: 'browser',
  },
])
