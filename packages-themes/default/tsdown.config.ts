import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  // Themes stay zero-runtime-dependency: the `defineTheme` identity helper
  // is inlined (tree-shaken out of core) instead of imported at runtime.
  deps: {
    alwaysBundle: [/^@a11y-now\//u],
  },
  dts: true,
  entry: ['src/index.ts'],
  platform: 'neutral',
})
