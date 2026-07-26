import { defineConfig } from 'vitest/config'
import { workspaceAlias } from './vitest.shared'

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
          include: ['tests/**/*.test.ts'],
          name: 'integration',
        },
      },
    ],
    watch: false,
  },
})
