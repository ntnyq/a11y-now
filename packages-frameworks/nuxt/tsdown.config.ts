import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    module: 'src/module.ts',
    'runtime/plugin.client': 'src/runtime/plugin.client.ts',
  },
  fixedExtension: false,
  platform: 'node',
})
