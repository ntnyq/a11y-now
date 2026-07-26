import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: {
    tsgo: false,
  },
  entry: {
    module: 'src/module.ts',
    'runtime/plugin.client': 'src/runtime/plugin.client.ts',
  },
  fixedExtension: false,
  platform: 'node',
})
