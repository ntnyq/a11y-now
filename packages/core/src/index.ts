import type {
  A11yPlugin,
  A11yTheme,
  ConfiguredPlugin,
  StateDefaults,
} from '@a11y-now/types'

export * from '@a11y-now/shared'
export { createDomService } from './dom'
export { createEventBus } from './events'
export { createA11yNow } from './kernel'
export { createShortcutCenter } from './shortcuts'
export {
  createSilentEngine,
  createSpeechService,
  createWebSpeechEngine,
  SPEECH_RATES,
} from './speech'
export {
  createLocalStorageAdapter,
  createMemoryStorageAdapter,
  createScopedState,
} from './store'
export { createThemeService } from './theme'
export {
  DEFAULT_PAGE_TOKENS,
  DEFAULT_TOOLBAR_TOKENS,
  GLOBAL_SKIP_SELECTORS,
  PAGE_TOKEN_PREFIX,
  pageVar,
  TOOLBAR_TOKEN_PREFIX,
  toolbarVar,
} from './tokens'

/** Identity helper: full type inference for plugin definitions. */
export const definePlugin = <
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
>(
  plugin: A11yPlugin<Options, Api, State>,
): A11yPlugin<Options, Api, State> => plugin

/** Identity helper: full type inference for configured plugin factories. */
export const configurePlugin = <
  Options,
  Api,
  State extends StateDefaults = StateDefaults,
>(
  plugin: A11yPlugin<Options, Api, State>,
  options: Options,
): ConfiguredPlugin<Options, Api, State> => ({ options, plugin })

/** Identity helper: full type inference for theme definitions. */
export const defineTheme = (theme: A11yTheme): A11yTheme => theme

export type * from '@a11y-now/types'
