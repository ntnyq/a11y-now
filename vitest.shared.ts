import { fileURLToPath } from 'node:url'
import { defineProject as defineVitestProject } from 'vitest/config'

function r(path: string) {
  return fileURLToPath(new URL(path, import.meta.url))
}

/**
 * Plugin workspace names used for test aliases and project selection.
 */
export const PLUGINS = [
  'region-nav',
  'speech',
  'screen-reader',
  'theme',
  'zoom',
  'big-cursor',
  'crosshair',
  'caption',
  'reset',
  'pin',
  'help',
  'exit',
  'pinyin',
  'zh-convert',
  'elder-mode',
  'auto-theme',
  'reading-mask',
  'pause-motion',
  'spacing',
]
/**
 * Theme workspace names resolved to source modules during tests.
 */
const THEMES = ['default', 'deep-blue', 'chocolate', 'high-contrast', 'forest']
/**
 * Framework adapter workspace names resolved to source modules during tests.
 */
const FRAMEWORKS = ['vue', 'react', 'svelte', 'solid', 'element', 'next']

/**
 * Resolve workspace packages to their sources so tests never require a build.
 */
export const workspaceAlias: Record<string, string> = {
  '@a11y-now/types': r('./packages/types/src/index.ts'),
  '@a11y-now/shared': r('./packages/shared/src/index.ts'),
  '@a11y-now/core': r('./packages/core/src/index.ts'),
  'a11y-now/presets/full': r('./packages/a11y-now/src/presets/full.ts'),
  'a11y-now/presets/reading': r('./packages/a11y-now/src/presets/reading.ts'),
  'a11y-now/presets/screen-reader': r(
    './packages/a11y-now/src/presets/screen-reader.ts',
  ),
  'a11y-now': r('./packages/a11y-now/src/index.ts'),
  ...Object.fromEntries(
    PLUGINS.map(name => [
      `@a11y-now/plugin-${name}`,
      r(`./packages-plugins/${name}/src/index.ts`),
    ]),
  ),
  ...Object.fromEntries(
    THEMES.map(name => [
      `@a11y-now/theme-${name}`,
      r(`./packages-themes/${name}/src/index.ts`),
    ]),
  ),
  ...Object.fromEntries(
    FRAMEWORKS.map(name => [
      `@a11y-now/${name}`,
      r(`./packages-frameworks/${name}/src/index.ts`),
    ]),
  ),
}

/**
 * Create a shared Vitest project configuration for a workspace package.
 *
 * @param environment - Runtime environment used by this package's tests.
 * @returns Vitest configuration with workspace source aliases and shared test
 *   setup.
 */
export function defineProject(environment: 'node' | 'happy-dom') {
  return defineVitestProject({
    resolve: {
      alias: workspaceAlias,
    },
    test: {
      environment,
      include: ['tests/**/*.test.ts'],
      setupFiles: [r('./vitest.setup.ts')],
    },
  })
}
