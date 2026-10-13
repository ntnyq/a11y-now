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
export { createRemoteTTSEngine } from './remote-tts'
export type { RemoteTTSContext, RemoteTTSEngineOptions } from './remote-tts'
export { createSchemeController, SCHEME_ATTR } from './scheme'
export type { SchemeController } from './scheme'
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
  DARK_TOOLBAR_TOKENS,
  DEFAULT_PAGE_TOKENS,
  DEFAULT_TOOLBAR_TOKENS,
  GLOBAL_SKIP_SELECTORS,
  PAGE_TOKEN_PREFIX,
  pageVar,
  TOOLBAR_TOKEN_PREFIX,
  toolbarVar,
} from './tokens'

/**
 * Identity helper: full type inference for plugin definitions.
 *
 * @template Options - Plugin-specific configuration.
 * @template Api - API exposed after plugin setup.
 * @template State - Persisted state shape.
 * @param plugin - Plugin definition to type-check and preserve.
 * @returns The same plugin definition, without cloning.
 */
export function definePlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
>(plugin: A11yPlugin<Options, Api, State>): A11yPlugin<Options, Api, State> {
  return plugin
}

/**
 * Bundle a plugin definition with options while preserving type inference.
 *
 * @template Options - Plugin-specific configuration.
 * @template Api - API exposed after plugin setup.
 * @template State - Persisted state shape.
 * @param plugin - Plugin definition to configure.
 * @param options - Options passed to setup; omitted options remain `undefined`.
 * @returns The definition and options packaged for toolbar registration.
 */
export function configurePlugin<
  Options,
  Api,
  State extends StateDefaults = StateDefaults,
>(
  plugin: A11yPlugin<Options, Api, State>,
  options?: Options,
): ConfiguredPlugin<Options, Api, State> {
  return {
    options: options as Options,
    plugin,
  }
}

/**
 * Identity helper: full type inference for theme definitions.
 *
 * @param theme - Theme definition to type-check and preserve.
 * @returns The same theme definition, without cloning.
 */
export function defineTheme(theme: A11yTheme): A11yTheme {
  return theme
}

export type * from '@a11y-now/types'
