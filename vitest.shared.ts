import { fileURLToPath } from 'node:url'
import { defineProject as defineVitestProject } from 'vitest/config'

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const PLUGINS = [
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
]
const THEMES = ['default', 'deep-blue', 'chocolate', 'high-contrast', 'forest']
const FRAMEWORKS = ['vue', 'react', 'svelte', 'solid', 'element']

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

export const defineProject = (environment: 'node' | 'happy-dom') =>
  defineVitestProject({
    resolve: {
      alias: workspaceAlias,
    },
    test: {
      environment,
      include: ['tests/**/*.test.ts'],
      watch: false,
    },
  })
