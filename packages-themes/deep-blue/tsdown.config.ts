import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: {
    tsgo: false,
  },
  entry: ['src/index.ts'],
  // Themes stay zero-runtime-dependency: the `defineTheme` identity helper
  // is inlined (tree-shaken out of core) instead of imported at runtime.
  noExternal: [/^@a11y-now\//u],
  platform: 'neutral',
})
