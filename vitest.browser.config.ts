import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceAlias } from './vitest.shared'

/**
 * Real-browser e2e project (playwright/chromium), opt-in via
 * `pnpm test:browser` — kept out of the default `pnpm test` run so the
 * unit suite never requires a chromium download.
 */
export default defineConfig({
  resolve: {
    alias: workspaceAlias,
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      screenshotFailures: false,
    },
    include: ['tests/browser/**/*.test.ts'],
    name: 'browser',
    watch: false,
  },
})
