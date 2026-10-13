import { defineConfig } from 'vitest/config'
import { PLUGINS, workspaceAlias } from './vitest.shared'

/**
 * Per-package 90% line-coverage gates for the kernel and every plugin.
 */
const coverageThresholds = Object.fromEntries([
  ['packages/core/src/**', { lines: 90 }],
  ...PLUGINS.map(name => [`packages-plugins/${name}/src/**`, { lines: 90 }]),
])

export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    coverage: {
      include: [
        'packages/*/src/**',
        'packages-plugins/*/src/**',
        'packages-themes/*/src/**',
        'packages-frameworks/*/src/**',
      ],
      provider: 'v8',
      thresholds: coverageThresholds,
    },
    projects: [
      'packages/*',
      'packages-plugins/*',
      'packages-themes/*',
      'packages-frameworks/*',
      {
        resolve: {
          alias: workspaceAlias,
        },
        test: {
          environment: 'happy-dom',
          // Top level only — tests/browser/ belongs to the opt-in
          // vitest.browser.config.ts project.
          include: ['tests/*.test.ts'],
          name: 'integration',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
    watch: false,
  },
})
