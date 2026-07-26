import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: {
    tsgo: false,
  },
  entry: ['src/index.ts'],
  platform: 'neutral',
})
