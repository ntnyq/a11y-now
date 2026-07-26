import type {
  A11yMessages,
  DomService,
  EventBus,
  I18nService,
  LocaleCode,
  ScopedState,
  ShortcutService,
  SpeechEngine,
  SpeechService,
  StateDefaults,
  StorageAdapter,
  ToolbarUI,
} from './core'

/**
 * Toolbar UI design tokens. Written to the shadow `:host` as
 * `--a11y-<key>` custom properties.
 */
export interface ToolbarTokens {
  'btn-size': string
  'color-accent': string
  'color-bg': string
  'color-border': string
  'color-btn-active-bg': string
  'color-btn-active-fg': string
  'color-btn-hover-bg': string
  'color-disabled-fg': string
  'color-fg': string
  'color-focus-ring': string
  'font-size': string
  'font-size-caption': string
  radius: string
  'outline-width': string
  'toolbar-height': string
  transition: string
  'z-index': string
}

/**
 * Page re-coloring tokens. Written to `document.documentElement` as
 * `--a11y-page-<key>` custom properties while a theme is active.
 */
export interface PageTokens {
  bg: string
  'cursor-color': string
  fg: string
  'focus-outline': string
  link: string
  'region-outline': string
}

/** A theme is pure data: token values plus metadata. */
export interface A11yTheme {
  displayName: Partial<Record<LocaleCode, string>>
  name: string
  /** Page re-coloring tokens. Omit (or `{}`) to leave the page untouched. */
  page?: Partial<PageTokens>
  /** Selectors excluded from page re-coloring, merged into the global list. */
  skipSelectors?: string[]
  /** Toolbar UI token overrides. */
  toolbar?: Partial<ToolbarTokens>
}

export interface ThemeService {
  apply: (name: string) => void
  current: () => A11yTheme | null
  /** Apply the next registered theme (wraps around). Returns it. */
  cycle: () => A11yTheme | null
  getToken: <K extends keyof ToolbarTokens>(key: K) => string
  list: () => A11yTheme[]
  /** The theme `cycle()` would switch to. */
  peek: () => A11yTheme | null
  register: (theme: A11yTheme) => void
}

/**
 * Plugin Api registry. Extend it from plugin packages:
 *
 * ```ts
 * declare module '@a11y-now/types' {
 *   interface A11yPluginRegistry {
 *     zoom: ZoomApi
 *   }
 * }
 * ```
 */
// eslint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
export interface A11yPluginRegistry {}

/** Everything a plugin can touch. Passed to `setup`. */
export interface PluginContext<
  Options = void,
  State extends StateDefaults = StateDefaults,
> {
  dom: DomService
  events: EventBus
  i18n: I18nService
  options: Options
  shortcuts: ShortcutService
  speech: SpeechService
  state: ScopedState<State>
  storage: StorageAdapter | null
  theme: ThemeService
  ui: ToolbarUI
}

export interface PluginSetupResult<Api = unknown> {
  api?: Api
  /** Revert every side effect of this plugin. Called on unmount. */
  dispose: () => void
}

export interface A11yPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  /** Names of plugins that must be registered before this one. */
  dependsOn?: string[]
  /** Extra message tables merged into the kernel i18n. */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  name: string
  setup: (ctx: PluginContext<Options, State>) => PluginSetupResult<Api>
  /** Persisted state defaults. */
  state?: State
}

/** A plugin bundled with its options, as produced by plugin factories. */
export interface ConfiguredPlugin<
  Options = void,
  Api = unknown,
  State extends StateDefaults = StateDefaults,
> {
  options: Options
  plugin: A11yPlugin<Options, Api, State>
}

/* eslint-disable typescript/no-explicit-any -- heterogeneous plugin lists */
export type A11yPluginInput =
  | A11yPlugin<any, any, any>
  | ConfiguredPlugin<any, any, any>
/* eslint-enable typescript/no-explicit-any */

export interface A11yNowOptions {
  /** Initial locale, defaults to the document language or `zh-CN`. */
  locale?: LocaleCode
  /** Extra message tables merged over the built-ins. */
  messages?: Partial<Record<LocaleCode, A11yMessages>>
  plugins?: A11yPluginInput[]
  /** Custom speech backend. Defaults to the Web Speech API engine. */
  speechEngine?: SpeechEngine
  /** Persistence backend. `null` disables persistence. */
  storage?: StorageAdapter | null
  /** Storage key prefix, defaults to `a11y-now`. */
  storagePrefix?: string
  themes?: A11yTheme[]
}

export interface A11yNowInstance {
  destroy: () => void
  readonly events: EventBus
  getPlugin: <K extends keyof A11yPluginRegistry>(
    name: K,
  ) => A11yPluginRegistry[K] | undefined
  readonly i18n: I18nService
  readonly mounted: boolean
  mount: (target?: Element) => void
  /** Reset all plugin state to defaults. */
  resetAll: () => void
  readonly shortcuts: ShortcutService
  readonly speech: SpeechService
  readonly themes: ThemeService
  unmount: () => void
  use: (plugin: A11yPluginInput) => A11yNowInstance
  useTheme: (theme: A11yTheme) => A11yNowInstance
}
